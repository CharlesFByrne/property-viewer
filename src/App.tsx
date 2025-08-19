import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./Dashboard";
import LoginPage from "./LoginPage";
import EmailPreview from "./EmailPreview";
import ConfirmInvite from "./ConfirmInvite";
import "./login.css";

function App() {
  return (
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
  );
}

export default App;
