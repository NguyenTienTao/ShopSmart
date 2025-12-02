import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Chỉ bật detectSessionInUrl khi URL có chứa dấu hiệu của Auth (Google login, Reset password...)
const isAuthCallback =
    window.location.hash.includes("access_token") ||
    window.location.hash.includes("refresh_token") ||
    window.location.hash.includes("type=recovery") || // Dành cho Reset Password
    window.location.search.includes("code"); // Dành cho PKCE flow

// 3. Khởi tạo Client
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        storage: localStorage,
        autoRefreshToken: true,
        persistSession: true,

        detectSessionInUrl: isAuthCallback,
    },
});
