/// Supabase configuration (anon key is safe to embed — RLS-protected).
class OretyConfig {
  static const supabaseUrl = 'https://ljoynnhjndkrouyhnuwc.supabase.co';
  static const supabaseAnonKey =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxqb3lubmhqbmRrcm91eWhudXdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNzE3NTksImV4cCI6MjA5MTY0Nzc1OX0.eqfpjNhw-oeWSwQVBjrEG7yYVCKvzAh0WPqz9jS4LWk';

  /// Convert a mnemonic pseudo to the internal auth email.
  static String pseudoToEmail(String pseudo) =>
      '${pseudo.trim().toLowerCase()}@orety.internal';

  /// App role expected for this build — used to reject wrong-role logins.
  static const expectedRole = 'parent';
}
