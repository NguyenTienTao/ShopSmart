import { useEffect } from "react";
import HeroSection from "../components/home/HeroSection";
import ServiceFeatures from "../components/home/ServiceFeatures";
import NewArrivals from "../components/home/NewArrivals";
import BestSellers from "../components/home/BestSellers";
import NewsLetter from "../components/home/NewsLetter";

const HomePage = () => {
    useEffect(() => {
        document.title = "Trang chủ";
    }, []);

    return (
        <div className="bg-gray-50 min-h-screen">
            <HeroSection />
            <ServiceFeatures />
            <NewArrivals />
            <BestSellers />
            <NewsLetter />
        </div>
    );
};

export default HomePage;
