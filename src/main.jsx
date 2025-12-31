import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";

import "./index.css";
import "./App.css";

import App from "./App.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import Header from "./components/Header.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <div className="site-container">
      <AuthProvider>
        <HashRouter>
          <Header />
          <App />
        </HashRouter>
      </AuthProvider>
    </div>
  </StrictMode>
);
