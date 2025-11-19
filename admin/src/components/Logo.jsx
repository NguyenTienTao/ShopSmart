import logo from "../assets/icons/logo.svg";

function Logo() {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img src={logo} alt="Logo" />
            <span style={{ fontSize: "2.2rem", fontWeight: "bold" }}>
                ShopSmart
            </span>
        </div>
    );
}

export default Logo;
