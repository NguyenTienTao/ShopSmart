import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import {
    FaStar,
    FaUserCircle,
    FaTrashAlt,
    FaCamera,
    FaTimes,
} from "react-icons/fa"; // Thêm icon thùng rác
import { toast } from "react-hot-toast";
import { formatDate } from "../../helpers/formatters";
import Loading from "../Loading";

const ReviewSection = ({ productId }) => {
    const { user } = useSelector((state) => state.auth);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    // State cho Form
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");

    // State quản lý ảnh upload
    const [selectedFiles, setSelectedFiles] = useState([]); // File gốc để upload
    const [previewImages, setPreviewImages] = useState([]); // URL blob để xem trước

    const [submitting, setSubmitting] = useState(false);

    // Kiểm tra review của user
    const [userReview, setUserReview] = useState(null);

    // 1. Fetch danh sách review
    const fetchReviews = async () => {
        try {
            const { data, error } = await supabase
                .from("reviews")
                .select(`*, profiles (name, avatar_url)`)
                .eq("product_id", productId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setReviews(data);

            if (user) {
                const myReview = data.find((r) => r.user_id === user.id);
                if (myReview) {
                    setUserReview(myReview);
                    // Tự động điền lại nội dung cũ vào form để sửa
                    setRating(myReview.rating);
                    setComment(myReview.comment);
                } else {
                    setUserReview(null);
                    setRating(0);
                    setComment("");
                }
            }
        } catch (error) {
            console.error("Lỗi tải đánh giá:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();

        // 1. Tạo kênh lắng nghe
        const channel = supabase
            .channel(`realtime-reviews-${productId}`) // Đặt tên kênh unique theo product
            .on(
                "postgres_changes",
                {
                    event: "*", // Nghe tất cả: INSERT (thêm), UPDATE (sửa), DELETE (xóa)
                    schema: "public",
                    table: "reviews",
                    filter: `product_id=eq.${productId}`, // Quan trọng: Chỉ nghe của sản phẩm NÀY thôi
                },
                (payload) => {
                    console.log("🔔 Có thay đổi review:", payload);
                    // Khi có biến động -> Gọi lại hàm lấy danh sách để cập nhật giao diện
                    fetchReviews();
                }
            )
            .subscribe();

        // 2. Dọn dẹp khi thoát trang (Unmount)
        return () => {
            supabase.removeChannel(channel);
        };
    }, [productId, user]);

    // 2. Xử lý chọn ảnh
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + selectedFiles.length > 5) {
            toast.error("Chỉ được đăng tối đa 5 ảnh!");
            return;
        }

        // Tạo preview
        const newPreviews = files.map((file) => URL.createObjectURL(file));
        setSelectedFiles([...selectedFiles, ...files]);
        setPreviewImages([...previewImages, ...newPreviews]);
    };

    // 3. Xóa ảnh đã chọn (trước khi gửi)
    const removeImage = (index) => {
        const newFiles = [...selectedFiles];
        const newPreviews = [...previewImages];

        newFiles.splice(index, 1);
        newPreviews.splice(index, 1);

        setSelectedFiles(newFiles);
        setPreviewImages(newPreviews);
    };

    // 4. Upload ảnh lên Supabase
    const uploadImages = async () => {
        const uploadedUrls = [];

        for (const file of selectedFiles) {
            const fileExt = file.name.split(".").pop();
            const fileName = `reviews/${Date.now()}_${Math.random()}.${fileExt}`;

            const { error } = await supabase.storage
                .from("images") // Dùng chung bucket images
                .upload(fileName, file);

            if (error) {
                console.error("Lỗi upload:", error);
                continue;
            }

            const { data } = supabase.storage
                .from("images")
                .getPublicUrl(fileName);
            uploadedUrls.push(data.publicUrl);
        }
        return uploadedUrls;
    };

    // 5. Xử lý Gửi (Thêm/Sửa)
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!comment.trim()) {
            toast.error("Vui lòng nhập nội dung");
            return;
        }

        setSubmitting(true);
        try {
            let imageUrls = [];
            if (selectedFiles.length > 0) {
                imageUrls = await uploadImages();
            }

            if (userReview && selectedFiles.length === 0) {
                imageUrls = userReview.images || [];
            }

            const payload = {
                user_id: user.id,
                product_id: productId,
                rating: rating,
                comment: comment.trim(),
                images: imageUrls,
            };

            if (userReview) {
                await supabase
                    .from("reviews")
                    .update(payload)
                    .eq("id", userReview.id);
                toast.success("Cập nhật thành công!");
            } else {
                await supabase.from("reviews").insert([payload]);
                toast.success("Gửi đánh giá thành công!");
            }

            setComment("");
            setRating(0);
            setSelectedFiles([]);
            setPreviewImages([]);

            fetchReviews();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    // 6. Xử lý Xóa (MỚI THÊM)
    const handleDelete = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa đánh giá này không?"))
            return;

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from("reviews")
                .delete()
                .eq("id", userReview.id);

            if (error) throw error;

            toast.success("Đã xóa đánh giá");

            // Reset form về trạng thái ban đầu
            setUserReview(null);
            setRating(0);
            setComment("");

            fetchReviews(); // Tải lại list để mất dòng comment đó
        } catch (error) {
            toast.error("Lỗi xóa: " + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const renderStarsInput = () => (
        <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-2xl transition-colors bg-transparent p-0 ${
                        star <= rating ? "text-yellow-400" : "text-gray-300"
                    }`}
                >
                    <FaStar />
                </button>
            ))}
        </div>
    );

    if (loading) return <Loading />;

    return (
        <div className="animate-fade-in">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
                Đánh giá khách hàng ({reviews.length})
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LIST REVIEWS */}
                <div className="lg:col-span-2 space-y-6">
                    {reviews.length === 0 ? (
                        <div className="text-gray-500 italic">
                            Chưa có đánh giá nào.
                        </div>
                    ) : (
                        reviews.map((review) => (
                            <div
                                key={review.id}
                                className="border-b border-gray-100 pb-6 last:border-0 relative group"
                            >
                                <div className="flex items-start gap-4">
                                    <img
                                        src={
                                            review.profiles?.avatar_url ||
                                            "https://placehold.co/50?text=U"
                                        }
                                        alt={review.profiles?.name}
                                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                    />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className="font-bold text-gray-800">
                                                {review.profiles?.name ||
                                                    "Người dùng"}
                                                {/* Đánh dấu đâu là review của mình */}
                                                {user &&
                                                    user.id ===
                                                        review.user_id && (
                                                        <span className="ml-2 text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">
                                                            Bạn
                                                        </span>
                                                    )}
                                            </h4>
                                            <span className="text-xs text-gray-400">
                                                {formatDate(review.created_at)}
                                            </span>
                                        </div>

                                        <div className="flex text-yellow-400 text-sm mb-2">
                                            {[...Array(5)].map((_, i) => (
                                                <span key={i}>
                                                    {i < review.rating
                                                        ? "★"
                                                        : "☆"}
                                                </span>
                                            ))}
                                        </div>

                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            {review.comment}
                                        </p>

                                        {/* --- HIỂN THỊ ẢNH REVIEW --- */}
                                        {review.images &&
                                            Array.isArray(review.images) &&
                                            review.images.length > 0 && (
                                                <div className="flex gap-2 mt-2">
                                                    {review.images.map(
                                                        (img, idx) => (
                                                            <a
                                                                key={idx}
                                                                href={img}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                            >
                                                                {" "}
                                                                {/* Click để xem to */}
                                                                <img
                                                                    src={img}
                                                                    alt="review-img"
                                                                    className="w-16 h-16 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition cursor-pointer"
                                                                />
                                                            </a>
                                                        )
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* FORM VIẾT / SỬA / XÓA */}
                <div className="lg:col-span-1">
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 sticky top-24">
                        <h4 className="font-bold text-gray-900 mb-4">
                            {userReview
                                ? "Đánh giá của bạn"
                                : "Viết đánh giá mới"}
                        </h4>

                        {user ? (
                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label className="block text-sm text-gray-600 mb-1">
                                        Đánh giá sao:
                                    </label>
                                    {renderStarsInput()}
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm text-gray-600 mb-1">
                                        Nội dung:
                                    </label>
                                    <textarea
                                        className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-200 text-sm bg-white"
                                        rows="4"
                                        placeholder="Sản phẩm thế nào..."
                                        style={{ resize: "none" }}
                                        value={comment}
                                        onChange={(e) =>
                                            setComment(e.target.value)
                                        }
                                        required
                                    ></textarea>
                                </div>

                                {/* --- KHU VỰC CHỌN ẢNH --- */}
                                <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <label
                                            htmlFor="review-images"
                                            className="cursor-pointer flex items-center gap-2 text-sm text-primary-600 font-medium hover:underline"
                                        >
                                            <FaCamera /> Thêm ảnh
                                        </label>
                                        <span className="text-xs text-gray-400">
                                            (Tối đa 5 ảnh)
                                        </span>
                                        <input
                                            id="review-images"
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </div>

                                    {/* Preview ảnh đã chọn */}
                                    {previewImages.length > 0 && (
                                        <div className="flex gap-2 flex-wrap">
                                            {previewImages.map((src, idx) => (
                                                <div
                                                    key={idx}
                                                    className="relative w-14 h-14"
                                                >
                                                    <img
                                                        src={src}
                                                        className="w-full h-full object-cover rounded-md border border-gray-300"
                                                        alt="preview"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeImage(idx)
                                                        }
                                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                                                    >
                                                        <FaTimes className="flex-shrink-0" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 bg-primary-600 text-white font-bold py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                                    >
                                        {submitting
                                            ? "Đang xử lý..."
                                            : userReview
                                            ? "Cập nhật"
                                            : "Gửi đánh giá"}
                                    </button>

                                    {/* NÚT XÓA CHỈ HIỆN KHI ĐÃ CÓ REVIEW */}
                                    {userReview && (
                                        <button
                                            type="button"
                                            onClick={handleDelete}
                                            disabled={submitting}
                                            className="px-4 bg-white border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition"
                                            title="Xóa đánh giá này"
                                        >
                                            <FaTrashAlt />
                                        </button>
                                    )}
                                </div>
                            </form>
                        ) : (
                            <div className="text-center py-6">
                                <FaUserCircle className="text-4xl text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 text-sm mb-4">
                                    Vui lòng đăng nhập để viết đánh giá.
                                </p>
                                <Link
                                    to="/login"
                                    className="inline-block px-6 py-2 border border-primary-600 text-primary-600 font-medium rounded-full hover:bg-primary-50 transition"
                                >
                                    Đăng nhập ngay
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewSection;
