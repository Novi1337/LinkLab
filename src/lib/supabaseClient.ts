import { createClient } from "@supabase/supabase-js";

// Wir nutzen Fallback-Werte, damit der Vercel-Build nicht abstürzt, 
// falls die Variablen beim Bauen noch nicht aktiv sind.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
