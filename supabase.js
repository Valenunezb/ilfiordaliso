// Tus credenciales (las que me pasaste arriba)
const SUPABASE_URL = 'https://rdvrqfsoaswdgikaxouz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (PEGA TU CLAVE LARGA AQUÍ COMPLETA)';

// Inicializamos la conexión
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
