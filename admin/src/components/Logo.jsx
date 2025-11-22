import logo from "../assets/icons/logo.svg";

function Logo({ collapsed = false }) {
    return (
        <div
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
            }}
        >
            <img src={logo} alt="Logo" />
            {!collapsed && (
                <span style={{ fontSize: "2.6rem", fontWeight: "bold" }}>
                    ShopSmart
                </span>
            )}
        </div>
    );
}

export default Logo;
