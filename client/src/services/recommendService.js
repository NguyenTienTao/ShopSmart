import axios from "axios";

const API_URL = "http://localhost:8000"; // URL của FastAPI

export const getRecommendations = async (userId) => {
    const response = await axios.get(`${API_URL}/api/v1/recommend/${userId}`);
    console.log(response);

    return response.data;
};
