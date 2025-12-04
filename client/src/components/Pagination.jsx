import { FaAngleLeft, FaAngleRight } from "react-icons/fa";

const Pagination = ({
    currentPage,
    totalCount,
    pageSize,
    onPageChange,
    siblingCount = 1, // Số lượng trang hiện bên cạnh trang hiện tại (VD: 1 ... 4 [5] 6 ... 10)
}) => {
    const totalPages = Math.ceil(totalCount / pageSize);

    // Logic tạo dải số trang (Core Algorithm)
    const generatePagination = () => {
        // Nếu tổng số trang ít (dưới 7), hiện hết
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
        const rightSiblingIndex = Math.min(
            currentPage + siblingCount,
            totalPages
        );

        const shouldShowLeftDots = leftSiblingIndex > 2;
        const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

        const firstPageIndex = 1;
        const lastPageIndex = totalPages;

        // TRƯỜNG HỢP 1: Chỉ có chấm bên phải (Đang ở những trang đầu)
        // VD: [1] 2 3 4 5 ... 100
        if (!shouldShowLeftDots && shouldShowRightDots) {
            let leftItemCount = 3 + 2 * siblingCount;
            let leftRange = Array.from(
                { length: leftItemCount },
                (_, i) => i + 1
            );
            return [...leftRange, "...", lastPageIndex];
        }

        // TRƯỜNG HỢP 2: Chỉ có chấm bên trái (Đang ở những trang cuối)
        // VD: 1 ... 96 97 98 99 [100]
        if (shouldShowLeftDots && !shouldShowRightDots) {
            let rightItemCount = 3 + 2 * siblingCount;
            let rightRange = Array.from(
                { length: rightItemCount },
                (_, i) => totalPages - rightItemCount + i + 1
            );
            return [firstPageIndex, "...", ...rightRange];
        }

        // TRƯỜNG HỢP 3: Có chấm cả 2 bên (Đang ở giữa)
        // VD: 1 ... 4 [5] 6 ... 100
        if (shouldShowLeftDots && shouldShowRightDots) {
            let middleRange = Array.from(
                { length: rightSiblingIndex - leftSiblingIndex + 1 },
                (_, i) => leftSiblingIndex + i
            );
            return [
                firstPageIndex,
                "...",
                ...middleRange,
                "...",
                lastPageIndex,
            ];
        }
    };

    const paginationRange = generatePagination();

    // Nếu không có trang nào hoặc chỉ có 1 trang thì ẩn luôn
    if (currentPage === 0 || paginationRange.length < 2) {
        return null;
    }

    const onNext = () => {
        if (currentPage < totalPages) onPageChange(currentPage + 1);
    };

    const onPrevious = () => {
        if (currentPage > 1) onPageChange(currentPage - 1);
    };

    return (
        <div className="flex justify-center items-center gap-2 mt-12 select-none">
            {/* Nút Previous */}
            <button
                onClick={onPrevious}
                disabled={currentPage === 1}
                className={`w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 transition ${
                    currentPage === 1
                        ? "text-gray-300 cursor-not-allowed bg-gray-50"
                        : "text-white hover:bg-gray-100 hover:text-primary-600"
                }`}
            >
                <FaAngleLeft className="flex-shrink-0" />
            </button>

            {/* Render các số trang */}
            {paginationRange.map((pageNumber, index) => {
                // Nếu là dấu ba chấm
                if (pageNumber === "...") {
                    return (
                        <span
                            key={index}
                            className="w-9 h-9 flex items-center justify-center text-gray-400"
                        >
                            &#8230;
                        </span>
                    );
                }

                // Nếu là số trang
                return (
                    <button
                        key={index}
                        onClick={() => onPageChange(pageNumber)}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg font-medium transition text-sm ${
                            pageNumber === currentPage
                                ? "bg-primary-600 text-white shadow-md border border-primary-600"
                                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                        }`}
                    >
                        {pageNumber}
                    </button>
                );
            })}

            {/* Nút Next */}
            <button
                onClick={onNext}
                disabled={currentPage === totalPages}
                className={`w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 transition ${
                    currentPage === totalPages
                        ? "text-gray-300 cursor-not-allowed bg-gray-50"
                        : "text-white hover:bg-gray-100 hover:text-primary-600"
                }`}
            >
                <FaAngleRight className="flex-shrink-0" />
            </button>
        </div>
    );
};

export default Pagination;
