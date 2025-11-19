import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    session: null,
    user: null,
    role: null, // Lưu quyền (admin/customer)
    loading: true, // Mặc định là đang tải
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        // Action: Khi đăng nhập thành công hoặc check session ok
        setSession: (state, action) => {
            const { session, role } = action.payload;
            state.session = session;
            state.user = session?.user || null;
            state.role = role || "anon";
            state.loading = false;
        },
        // Action: Khi đăng xuất
        setLogout: (state) => {
            state.session = null;
            state.user = null;
            state.role = null;
            state.loading = false;
        },
        // Action: Bật trạng thái loading
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
    },
});

export const { setSession, setLogout, setLoading } = authSlice.actions;
export default authSlice.reducer;
