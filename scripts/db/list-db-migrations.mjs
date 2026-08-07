import {
  formatErrorMessage,
  linkSupabaseProject,
  listLinkedMigrations,
  loadEnvFile,
} from './supabase-migrations.mjs';

try {
  loadEnvFile();

  const linked = linkSupabaseProject({ logPrefix: 'Linking Supabase project' });

  if (!linked) {
    console.warn(
      'SUPABASE_ACCESS_TOKEN not set. Skipping project link and using the existing local Supabase CLI context.',
    );
  }

  const output = listLinkedMigrations();
  console.warn(output);
} catch (error) {
  console.error(`::error::Failed to list Supabase migrations. ${formatErrorMessage(error)}`);
  process.exit(1);
}
