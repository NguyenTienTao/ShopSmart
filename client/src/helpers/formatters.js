// src/utils/formatters.js

/**
 * Định dạng số thành tiền tệ Việt Nam (VND)
 * Ví dụ: 100000 -> 100.000 ₫
 * @param {number|string} amount - Số tiền
 * @returns {string} Chuỗi đã định dạng
 */
export const formatCurrency = (amount) => {
    // Nếu không có giá trị hoặc không phải số, trả về 0 đ
    if (amount === undefined || amount === null || isNaN(amount)) {
        return "0 ₫";
    }

    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(amount);
};

/**
 * Định dạng ngày tháng (DD/MM/YYYY)
 * Ví dụ: 2025-11-22T10:00:00 -> 22/11/2025
 * @param {string} dateString
 * @returns {string}
 */
export const formatDate = (dateString) => {
    if (!dateString) return "---";

    return new Date(dateString).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

/**
 * Định dạng ngày giờ chi tiết (DD/MM/YYYY HH:mm)
 * Ví dụ: 22/11/2025 10:30
 * @param {string} dateString
 * @returns {string}
 */
export const formatDateTime = (dateString) => {
    if (!dateString) return "---";

    return new Date(dateString).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};
