const express = require("express");
const router = express.Router();

// 1. Import cái controller xịn xò vừa viết xong
const {
    createProduct,
    updateProduct,
    deleteProduct,
} = require("./productController");

// 2. Định nghĩa các đường dẫn (Endpoint)
// Khi ai đó gọi POST vào đường dẫn này -> Chạy hàm createProduct
router.post("/", createProduct);

// Khi ai đó gọi PUT vào đường dẫn này kèm ID -> Chạy hàm updateProduct
router.put("/:id", updateProduct);

// Khi ai đó gọi DELETE -> Chạy hàm deleteProduct
router.delete("/:id", deleteProduct);

module.exports = router;
