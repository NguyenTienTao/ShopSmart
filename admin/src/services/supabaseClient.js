import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        "Supabase URL or Anon Key is not defined in environment variables"
    );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: localStorage,
        autoRefreshToken: true,
        persistSession: true,

        // 👇 THÊM DÒNG NÀY ĐỂ CHỐNG TREO KHI F5
        detectSessionInUrl: false,
    },
});
