import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useConfigContext } from "./ConfigContext";
import "./login.css";

export default function LoginPage() {
  const config = useConfigContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let un = email,
      pw = password;
    let { ENDPOINT } = config;
    const res = await axios.post(`${ENDPOINT}/login`, { un, pw });
    console.log("res", res.data);
    if (res.data.success) {
      setError(null);
      // success - redirect to dashboard
      navigate("/dashboard");
    } else {
      setError(res.data.error);
    }
  };

  const setField = (fieldToSet: string) => {
    if (fieldToSet === "email") {
      setEmail("test@user.com");
    } else if (fieldToSet === "password") {
      setPassword("password");
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit}>
        <h2>Property Viewer Login</h2>

        <div>
          <label onClick={() => setField("email")}>
            Email <span style={{ color: "gray" }}>{'("test@user.com")'}</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label onClick={() => setField("password")}>
            Password <span style={{ color: "gray" }}>{'("password")'}</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p>{error}</p>}

        <button type="submit">Log In</button>
      </form>
    </div>
  );
}
