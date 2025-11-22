import { supabase } from "../services/supabaseClient.js";

/**
 * Lấy thông tin role người dùng hiện tại
 * @param {string} userId
 * @returns { 'admin' | 'customer' | null }
 */

export const getUserRole = async (userId) => {
    try {
        const { data, error } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", userId)
            .single();

        if (error || !data) return null;

        return data?.role || "customer";
    } catch (error) {
        console.log("Lấy lỗi role:", error);
        return null;
    }
};

/**
 * Lấy full profile người dùng hiện tại
 * @param {string} userId
 * @returns {Object | null}
 */

export const getUserProfile = async (userId) => {
    try {
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();
        if (error || !data) return null;

        return data;
    } catch (error) {
        console.log("Lấy lỗi profile:", error);
        return null;
    }
};
