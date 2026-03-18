// Tus credenciales (las que me pasaste arriba)
const SUPABASE_URL = 'https://rdvrqfsoaswdgikaxouz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkdnJxZnNvYXN3ZGdpa2F4b3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MTY4MjMsImV4cCI6MjA4OTE5MjgyM30.NmNe8kNNoV16MOgJZIV5CF5gTkL3z87t-46g-i_PQbw';

// Inicializamos la conexión
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
