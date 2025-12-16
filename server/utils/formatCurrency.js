export const formatCurrency = (usdPrice) => {
    if (!usdPrice && usdPrice !== 0) return "Liên hệ"; // Phòng trường hợp giá null
    const exchangeRate = 26372; // Tỷ giá hiện tại (tham khảo)
    const vndPrice = usdPrice * exchangeRate;

    // Kết quả: "2.530.000 ₫"
    return vndPrice.toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
    });
};
