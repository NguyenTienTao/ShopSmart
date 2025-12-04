import { FaSpinner } from "react-icons/fa";

const Loading = ({ fullScreen = false }) => {
    return (
        <div
            className={`flex justify-center items-center ${
                fullScreen ? "min-h-screen" : "min-h-[200px] w-full"
            }`}
        >
            <div className="flex flex-col items-center gap-3">
                {/* Icon xoay vòng */}
                <FaSpinner className="animate-spin text-4xl text-primary-600" />

                {/* Dòng chữ (Tùy chọn) */}
                <span className="text-gray-500 text-sm font-medium animate-pulse">
                    Đang tải dữ liệu...
                </span>
            </div>
        </div>
    );
};

export default Loading;
