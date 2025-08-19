import { useNavigate } from "react-router-dom";

interface TopBarProps {
  currentPage: "viewings" | "assign";
  setCurrentPage: (page: "viewings" | "assign") => void;
}

export default function TopBar({ currentPage, setCurrentPage }: TopBarProps) {
  const navigate = useNavigate();
  const buttonStyle = (active: boolean) => ({
    marginRight: "10px",
    padding: "5px 10px",
    backgroundColor: active ? "#ffffff" : "#4CAF50",
    color: active ? "#4CAF50" : "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  });

  const handleLogout = () => {
    console.log("log out...");
    localStorage.removeItem("isLoggedIn");
    navigate("/");
  };

  return (
    <nav
      style={{
        padding: "10px",
        backgroundColor: "#4CAF50",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {/* Left side buttons */}
      <div>
        <button
          style={buttonStyle(currentPage === "viewings")}
          onClick={() => setCurrentPage("viewings")}
        >
          Viewings
        </button>
        <button
          style={buttonStyle(currentPage === "assign")}
          onClick={() => setCurrentPage("assign")}
        >
          Leads
        </button>
      </div>

      {/* Right side logout button */}
      <div>
        <button style={buttonStyle(false)} onClick={handleLogout}>
          Log Out
        </button>
      </div>
    </nav>
  );
}
