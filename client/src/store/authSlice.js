import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    session: null,
    user: null,
    profile: null, // Lưu tên, sđt, địa chỉ...
    role: null,
    loading: true,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setSession: (state, action) => {
            const { session, profile, role } = action.payload;
            state.session = session;
            state.user = session?.user || null;
            state.profile = profile || null;
            state.role = role || "customer";
            state.loading = false;
        },
        setLogout: (state) => {
            state.session = null;
            state.user = null;
            state.profile = null;
            state.role = null;
            state.loading = false;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        updateProfile: (state, action) => {
            if (state.profile) {
                state.profile = { ...state.profile, ...action.payload };
            }
        },
    },
});

export const { setSession, setLogout, setLoading, updateProfile } =
    authSlice.actions;
export default authSlice.reducer;
