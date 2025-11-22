import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    session: null,
    user: null,
    profile: null,
    role: null, // Lưu quyền (admin/customer)
    loading: true, // Mặc định là đang tải
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        // Action: Khi đăng nhập thành công hoặc check session ok
        setSession: (state, action) => {
            const { session, profile } = action.payload;
            state.session = session;
            state.profile = profile;
            state.user = session?.user || null;
            state.role = profile.role || "anon";
            state.loading = false;
        },
        // Action: Khi đăng xuất
        setLogout: (state) => {
            state.session = null;
            state.profile = null;
            state.user = null;
            state.role = null;
            state.loading = false;
        },
        // Action: Bật trạng thái loading
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        updateProfile: (state, action) => {
            // action.payload chứa { name: 'Mới', avatar_url: '...', ... }
            if (state.profile) {
                state.profile = { ...state.profile, ...action.payload };
            }
        },
    },
});

export const { setSession, setLogout, setLoading, updateProfile } =
    authSlice.actions;
export default authSlice.reducer;
