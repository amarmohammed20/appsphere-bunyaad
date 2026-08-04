import boundaries from 'eslint-plugin-boundaries';

const ROUTING = 'app';
const COMPONENTS = 'feature-component';
const HOOKS = 'feature-hook';
const ACTIONS = 'feature-action';
const HTTP_HANDLERS = 'feature-api';
const SERVER = 'feature-server';
const SUPABASE = 'lib-supabase';

/** Feature code that performs no IO — safe for anything in the same feature. */
const PURE_FEATURE_CODE = ['feature-schema', 'feature-data', 'feature-utils', 'feature-root'];

/** Usable from anywhere, regardless of feature. */
const SHARED = ['lib', 'shared-types', 'shared-ui', 'shared-component', 'shared-hook'];

const EVERY_FEATURE_TYPE = [
  COMPONENTS,
  HOOKS,
  ACTIONS,
  HTTP_HANDLERS,
  SERVER,
  ...PURE_FEATURE_CODE,
];

const NPM_PACKAGES = { origin: ['external', 'core'] };
const SUPABASE_SDK = { origin: ['external'], source: '@supabase/*' };

const elements = [
  { type: ROUTING, pattern: 'src/app' },

  { type: ACTIONS, pattern: 'src/features/*/actions', capture: ['feature'] },
  { type: HTTP_HANDLERS, pattern: 'src/features/*/api', capture: ['feature'] },
  { type: SERVER, pattern: 'src/features/*/server', capture: ['feature'] },
  { type: COMPONENTS, pattern: 'src/features/*/components', capture: ['feature'] },
  { type: HOOKS, pattern: 'src/features/*/hooks', capture: ['feature'] },
  { type: 'feature-schema', pattern: 'src/features/*/schemas', capture: ['feature'] },
  { type: 'feature-data', pattern: 'src/features/*/data', capture: ['feature'] },
  { type: 'feature-utils', pattern: 'src/features/*/utils', capture: ['feature'] },
  // Backstop for loose files at a feature root, and for any folder nobody
  // added above. Must stay last — it matches everything under a feature.
  { type: 'feature-root', pattern: 'src/features/*', capture: ['feature'] },

  { type: 'shared-ui', pattern: 'src/components/ui' },
  { type: 'shared-component', pattern: 'src/components/shared' },
  { type: 'shared-hook', pattern: 'src/hooks' },
  { type: 'shared-types', pattern: 'src/types' },
  { type: SUPABASE, pattern: 'src/lib/supabase' },
  { type: 'lib', pattern: 'src/lib' },
];

// Elements classify folders. proxy.ts is a loose file, so it needs this.
const files = [{ pattern: 'src/proxy.ts', category: 'proxy' }];

const flatten = (types) => [types].flat(2);

const allow = (importer, importable) => ({
  from: { element: { types: { anyOf: flatten(importer) } } },
  allow: { to: { element: { types: { anyOf: flatten(importable) } } } },
});

const allowWithinOwnFeature = (importer, importable) => ({
  from: { element: { types: { anyOf: flatten(importer) } } },
  allow: {
    to: {
      element: {
        types: { anyOf: flatten(importable) },
        captured: { feature: '{{ from.element.captured.feature }}' },
      },
    },
  },
});

const allowModule = (importer, module) => ({
  from: { element: { types: { anyOf: flatten(importer) } } },
  allow: { to: { module } },
});

const allowFile = (category, importable) => ({
  from: { file: { categories: [category] } },
  allow: { to: { element: { types: { anyOf: flatten(importable) } } } },
});

export const boundariesConfig = {
  // Root config files are not part of the architecture and would otherwise
  // fail no-unknown-files.
  files: ['src/**/*.{ts,tsx}'],
  plugins: { boundaries },
  settings: { 'boundaries/elements': elements, 'boundaries/files': files },
  rules: {
    // Without these, a file matching nothing is not checked at all — an agent
    // that invents a folder escapes every policy below, silently.
    'boundaries/no-unknown-files': 'error',
    // `require: element` because the default accepts a target that is unknown
    // to the folder taxonomy as long as some file rule names it.
    'boundaries/no-unknown-dependencies': ['error', { require: 'element' }],

    'boundaries/dependencies': [
      'error',
      {
        // Without this, npm packages are not checked and the Supabase
        // carve-out below silently does nothing.
        checkAllOrigins: true,
        default: 'disallow',
        message:
          '{{ from.element.type }} may not import {{ to.element.type }}. See src/features/README.md.',

        // Later policies win, so denials go last.
        policies: [
          allow(ROUTING, [ROUTING, EVERY_FEATURE_TYPE, SHARED]),

          allowWithinOwnFeature(COMPONENTS, [PURE_FEATURE_CODE, HOOKS, ACTIONS, COMPONENTS]),
          allow(COMPONENTS, SHARED),

          allowWithinOwnFeature(HOOKS, [PURE_FEATURE_CODE, ACTIONS]),
          allow(HOOKS, ['lib', 'shared-types', 'shared-hook']),

          allowWithinOwnFeature([ACTIONS, HTTP_HANDLERS], [SERVER, PURE_FEATURE_CODE]),
          allowWithinOwnFeature(SERVER, [SERVER, PURE_FEATURE_CODE]),
          allow([ACTIONS, HTTP_HANDLERS, SERVER], ['lib', 'shared-types']),

          allowWithinOwnFeature(PURE_FEATURE_CODE, PURE_FEATURE_CODE),
          allow(PURE_FEATURE_CODE, ['lib', 'shared-types']),

          allow(['shared-component', 'shared-ui', 'shared-hook'], SHARED),

          // `lib` deliberately cannot reach `lib-supabase`. The plugin checks
          // direct imports only, so a lib helper importing Supabase would
          // launder it to any component that imports the helper.
          allow('lib', ['lib', 'shared-types']),
          allow(SUPABASE, [SUPABASE, 'lib', 'shared-types']),

          // Only server/ opens a database connection, so actions and HTTP
          // handlers must delegate and one write cannot be written twice.
          // proxy.ts is the exception — it refreshes the auth token.
          allow(SERVER, SUPABASE),
          allowFile('proxy', [SUPABASE, 'lib']),

          { allow: { to: { module: NPM_PACKAGES } } },
          {
            disallow: { to: { module: SUPABASE_SDK } },
            message: 'Import Supabase through lib/supabase, not the SDK directly.',
          },
          allowModule(SUPABASE, SUPABASE_SDK),
        ],
      },
    ],
  },
};
