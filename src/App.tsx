import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./Dashboard";
import LoginPage from "./LoginPage";
import EmailPreview from "./EmailPreview";
import ConfirmInvite from "./ConfirmInvite";
import { useState, useEffect } from "react";
import { useConfig } from "./UseConfig";
import { ConfigProvider } from "./ConfigContext";
import "./login.css";

function App() {
  const config = useConfig();
  useEffect(() => {
    fetch("/setup.json")
      .then((res) => res.json())
      .then((config) => {
        console.log("Loaded config:", config);
      });
  }, []);
  if (!config) return <div>Loading config...</div>;

  useEffect(() => {
    fetch("/setup.json")
      .then((res) => res.json())
      .then((config) => {
        console.log("Loaded config:", config);
      });
  }, []);

  return (
    <ConfigProvider config={config}>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <div className="login-wrapper">
                <LoginPage />
              </div>
            }
          />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/email-preview/:leadID/:viewingID"
            element={<EmailPreview />}
          />
          <Route
            path="/confirm-invite/:leadID/:viewingID"
            element={<ConfirmInvite />}
          />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

export default App;
