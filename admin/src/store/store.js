import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice.js";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        // Sau này thêm uiReducer, productReducer... vào đây
    },
    // Tắt check serializable check nếu Supabase trả về object phức tạp (tùy chọn)
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: false }),
});
