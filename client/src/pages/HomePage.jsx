import React from "react";
import HeroSection from "../components/home/HeroSection";
import ServiceFeatures from "../components/home/ServiceFeatures";
import NewArrivals from "../components/home/NewArrivals";
import BestSellers from "../components/home/BestSellers";
import Newsletter from "../components/home/NewsLetter";

const HomePage = () => {
    document.title = "Trang Chủ";

    return (
        <div className="bg-gray-50 min-h-screen">
            <HeroSection />
            <ServiceFeatures />
            <NewArrivals />
            <BestSellers />
            <Newsletter />
        </div>
    );
};

export default HomePage;
