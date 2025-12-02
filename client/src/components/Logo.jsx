import logo from "../assets/icons/logo.svg";

function Logo({
    collapsed = false,
    textColor = "#000",
    fontSize = "2.6rem",
    widthLogoIcon = "32px",
}) {
    return (
        <div
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
            }}
        >
            <img src={logo} alt="Logo" style={{ width: widthLogoIcon }} />
            {!collapsed && (
                <span
                    style={{
                        fontSize: fontSize,
                        fontWeight: "bold",
                        color: textColor,
                    }}
                >
                    ShopSmart
                </span>
            )}
        </div>
    );
}

export default Logo;
