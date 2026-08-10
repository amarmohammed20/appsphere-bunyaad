/**
 * Verifies the pnpm supply chain protections have not been weakened.
 *
 * `pnpm approve-builds` silently rewrites the install-script allowlist. That
 * list is the only thing standing between a dependency and arbitrary code
 * execution during install, which is exactly how the postcss.config incident
 * reached a developer machine. Changing it must be a deliberate, reviewed act
 * rather than a side effect of clearing a warning.
 *
 * Unlike the appsphere original, this repo keeps its supply-chain policy in
 * pnpm-workspace.yaml (pnpm v11 reads only auth and registry from .npmrc), so
 * the checks read that file instead.
 *
 * Runs in CI on pull requests and can be run locally with
 * `pnpm run check:supply-chain`.
 *
 * Exit 0 = settings intact. Exit 1 = a protection was weakened or removed.
 */
import { existsSync, readFileSync } from 'node:fs';

/** Packages allowed to run install scripts. Each needs a real binary. */
const EXPECTED_BUILD_ALLOWLIST = [
  '@sentry/cli', // postinstall downloads the binary that uploads source maps
  'sharp', // image processing binary for Next.js image optimisation
  'supabase', // downloads the Supabase CLI binary the db scripts depend on
  'unrs-resolver', // native resolver binary used by eslint
].sort();

/**
 * Minimum age, in minutes, a published version must reach before install.
 * 4320 = 3 days, the agreed value while the dependency set settles; TODO
 * section 7 raises it to 10080 (7 days) later.
 */
const MIN_RELEASE_AGE = 4320;

/**
 * Advisories the audit gate is allowed to skip.
 *
 * `pnpm.auditConfig.ignoreGhsas` silences a finding outright, so an unreviewed
 * addition here turns the audit gate green while the vulnerability is still
 * present. Each entry needs a reason a reviewer can check, and adding one has
 * to be a deliberate edit to this file rather than a quiet package.json change.
 */
const EXPECTED_IGNORED_GHSAS = {};

/**
 * Lifecycle scripts in our own package.json that run during install.
 * `prepare` is expected (husky). `preinstall` is expected only because it is
 * the package-manager guard — anything else there is code running on every
 * install.
 */
const FORBIDDEN_ROOT_INSTALL_SCRIPTS = ['install', 'postinstall', 'prepublish', 'prepublishOnly'];
const EXPECTED_PREINSTALL = 'npx only-allow pnpm';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const workspace = existsSync('pnpm-workspace.yaml')
  ? readFileSync('pnpm-workspace.yaml', 'utf8')
  : '';
const npmrc = existsSync('.npmrc') ? readFileSync('.npmrc', 'utf8') : '';

let failed = false;
const fail = (message) => {
  console.error(`::error::${message}`);
  failed = true;
};

/**
 * Returns every value assigned to a top-level pnpm-workspace.yaml key, in file
 * order. Reading only the first match is unsafe: YAML parsers take the LAST
 * duplicate key, so appending a second `minimumReleaseAge: 0` disables the
 * delay while a first-match check still reports the original value. Collect
 * them all, treat the last as effective, and treat duplicates as suspicious in
 * their own right.
 */
const readWorkspaceValues = (key) => {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^${escaped}[ \\t]*:[ \\t]*(.*)$`, 'gm');
  const values = [];
  let match;
  while ((match = pattern.exec(workspace)) !== null) {
    values.push(match[1].replace(/#.*$/, '').trim());
  }
  return values;
};

/** Package names listed under `allowBuilds:` with a true value. */
const readAllowBuilds = () => {
  const section = workspace.match(/^allowBuilds:[ \t]*\n((?:[ \t]+.*\n?)*)/m);
  if (!section) return null;

  const names = [];
  for (const line of section[1].split('\n')) {
    const entry = line.match(/^[ \t]+'?([^':\s]+)'?[ \t]*:[ \t]*true\b/);
    if (entry) names.push(entry[1]);
  }
  return names;
};

// ---------------------------------------------------------------------------
// 1. The install-script allowlist itself.
// ---------------------------------------------------------------------------
const allowBuilds = readAllowBuilds();

if (allowBuilds === null) {
  fail(
    'allowBuilds is missing from pnpm-workspace.yaml — every dependency could then run install scripts.',
  );
} else {
  const actual = [...allowBuilds].sort();
  const added = actual.filter((name) => !EXPECTED_BUILD_ALLOWLIST.includes(name));
  const removed = EXPECTED_BUILD_ALLOWLIST.filter((name) => !actual.includes(name));

  if (added.length) {
    fail(`Packages ADDED to the install-script allowlist: ${added.join(', ')}`);
    fail('Those packages would then execute arbitrary code on every install, on every machine.');
    fail('If you ran `pnpm approve-builds` to clear a warning, revert it.');
  }

  if (removed.length) {
    fail(`Packages REMOVED from the install-script allowlist: ${removed.join(', ')}`);
    fail('The build and db scripts need these; removing them will break them.');
  }
}

// The package.json variants of the allowlist would silently take precedence
// or add a second, unreviewed list beside the reviewed one.
if (pkg.pnpm?.onlyBuiltDependencies) {
  fail(
    'pnpm.onlyBuiltDependencies is set in package.json — the reviewed allowlist lives in pnpm-workspace.yaml. Two lists means one is unreviewed.',
  );
}
if (pkg.pnpm?.onlyBuiltDependenciesFile) {
  fail(
    `pnpm.onlyBuiltDependenciesFile points the allowlist at ${pkg.pnpm.onlyBuiltDependenciesFile} — the reviewed list is then ignored.`,
  );
}

// ---------------------------------------------------------------------------
// 1b. Advisories the audit gate has been told to skip.
// ---------------------------------------------------------------------------
// Every id here is a vulnerability the gate no longer reports. Left unchecked,
// silencing a failing audit is a one-line package.json edit, which defeats the
// point of making the gate blocking in the first place.
const expectedGhsas = Object.keys(EXPECTED_IGNORED_GHSAS).sort();
const actualGhsas = [...(pkg.pnpm?.auditConfig?.ignoreGhsas ?? [])].sort();
const addedGhsas = actualGhsas.filter((id) => !expectedGhsas.includes(id));
const removedGhsas = expectedGhsas.filter((id) => !actualGhsas.includes(id));

if (addedGhsas.length) {
  fail(`Advisories ADDED to the audit ignore list: ${addedGhsas.join(', ')}`);
  fail('Each one hides a real finding from the audit gate. Add it to EXPECTED_IGNORED_GHSAS');
  fail('in this file with a reason, in the same PR, so a reviewer sees what is being accepted.');
}

if (removedGhsas.length) {
  fail(`Advisories REMOVED from the audit ignore list: ${removedGhsas.join(', ')}`);
  fail('If one is now genuinely fixable, drop it from EXPECTED_IGNORED_GHSAS here too.');
}

// CVE ids are a second, equivalent way to silence a finding.
if (pkg.pnpm?.auditConfig?.ignoreCves?.length) {
  fail(
    `pnpm.auditConfig.ignoreCves silences ${pkg.pnpm.auditConfig.ignoreCves.join(', ')}. Track accepted advisories by GHSA id only, so there is one reviewed list rather than two.`,
  );
}

// ---------------------------------------------------------------------------
// 2. Blanket bypasses that would make the allowlist meaningless.
// ---------------------------------------------------------------------------
if (pkg.pnpm?.dangerouslyAllowAllBuilds) {
  fail(
    'pnpm.dangerouslyAllowAllBuilds is enabled — this lets EVERY dependency run install scripts.',
  );
}

const allowAllBuilds = readWorkspaceValues('dangerouslyAllowAllBuilds');
if (allowAllBuilds.length && /^true$/i.test(allowAllBuilds[allowAllBuilds.length - 1])) {
  fail(
    'pnpm-workspace.yaml sets dangerouslyAllowAllBuilds: true — this disables install-script blocking entirely.',
  );
}

if (pkg.pnpm?.neverBuiltDependencies) {
  fail(
    'pnpm.neverBuiltDependencies is set — it inverts the allowlist into a denylist, so anything not named runs freely. Use allowBuilds instead.',
  );
}

// Our own lifecycle scripts run on every install too, so they are the same
// class of risk as a dependency's install script.
const rootInstallScripts = FORBIDDEN_ROOT_INSTALL_SCRIPTS.filter((name) => pkg.scripts?.[name]);
if (rootInstallScripts.length) {
  fail(
    `package.json defines install-time lifecycle script(s): ${rootInstallScripts.join(', ')} — these execute on every install. Only \`prepare\` (husky) and the package-manager guard are expected here.`,
  );
}

if (pkg.scripts?.preinstall && pkg.scripts.preinstall !== EXPECTED_PREINSTALL) {
  fail(
    `preinstall is "${pkg.scripts.preinstall}" — expected "${EXPECTED_PREINSTALL}". Anything else here is code running on every install.`,
  );
}

// ---------------------------------------------------------------------------
// 3. The release-age delay must not be quietly weakened.
// ---------------------------------------------------------------------------
const releaseAges = readWorkspaceValues('minimumReleaseAge');

if (releaseAges.length === 0) {
  fail(
    'minimumReleaseAge is missing from pnpm-workspace.yaml — freshly published (possibly compromised) versions would install immediately.',
  );
} else {
  if (releaseAges.length > 1) {
    fail(
      `minimumReleaseAge is set ${releaseAges.length} times in pnpm-workspace.yaml (${releaseAges.join(', ')}). YAML takes the LAST value, so a duplicate silently overrides the reviewed one. Keep exactly one.`,
    );
  }
  const effective = Number(releaseAges[releaseAges.length - 1]);
  if (!Number.isFinite(effective) || effective < MIN_RELEASE_AGE) {
    fail(
      `minimumReleaseAge is effectively ${releaseAges[releaseAges.length - 1]} minutes; the agreed minimum is ${MIN_RELEASE_AGE} (3 days).`,
    );
  }
}

// An exclude list exempts named packages from the delay, so the delay can read
// as intact while specific packages install the moment they are published.
const releaseAgeExcludes = readWorkspaceValues('minimumReleaseAgeExclude');
if (releaseAgeExcludes.length) {
  fail(
    `minimumReleaseAgeExclude exempts packages from the ${MIN_RELEASE_AGE}-minute delay. Those packages would install the moment they are published.`,
  );
}

// ---------------------------------------------------------------------------
// 3b. The protections this repo adds beyond the original.
// ---------------------------------------------------------------------------
const exotic = readWorkspaceValues('blockExoticSubdeps');
if (exotic.length === 0 || !/^true$/i.test(exotic[exotic.length - 1])) {
  fail(
    'blockExoticSubdeps is not effectively true in pnpm-workspace.yaml — sub-dependencies could then be installed from git URLs or raw tarballs, bypassing the registry.',
  );
}

const saveExact = readWorkspaceValues('saveExact');
if (saveExact.length === 0 || !/^true$/i.test(saveExact[saveExact.length - 1])) {
  fail(
    'saveExact is not effectively true in pnpm-workspace.yaml — new dependencies would be added as ranges, so a later install can silently pick up a different version.',
  );
}

// ---------------------------------------------------------------------------
// 4. A custom registry redirects package fetches to another host.
// ---------------------------------------------------------------------------
// Scoped keys (`@scope:registry=`) are matched directly: escaping a pattern
// for use as a literal key would silently match nothing.
const npmrcRegistryPattern = /^[ \t]*(@[^:\s]+:)?registry[ \t]*=[ \t]*(.*)$/gim;
const registries = [];
let registryMatch;
while ((registryMatch = npmrcRegistryPattern.exec(npmrc)) !== null) {
  registries.push(registryMatch[2].trim());
}

const rogue = registries.filter((value) => value && !/registry\.npmjs\.org/.test(value));
if (rogue.length) {
  fail(`.npmrc points package resolution at a non-npm registry: ${rogue.join(', ')}`);
}

if (failed) {
  console.error(
    '::error::These settings are what stop a compromised npm package running code on our machines.',
  );
  console.error(
    '::error::If a change here is genuinely intended, update the expected values in scripts/security/check-supply-chain-settings.mjs in this same PR so a reviewer sees both halves of the decision.',
  );
  process.exit(1);
}

console.warn(`Allowlist unchanged (${allowBuilds.length}): ${allowBuilds.sort().join(', ')}`);
console.warn(
  `minimumReleaseAge: ${releaseAges[0]} minutes (${Math.round(Number(releaseAges[0]) / 1440)} days), single entry, no exclusions`,
);
console.warn('blockExoticSubdeps and saveExact intact, no blanket build-script bypasses.');
