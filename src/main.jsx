import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";
import "./App.css";

import App from "./App.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import Header from "./components/Header.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <div className="site-container">
      <AuthProvider>
        <BrowserRouter>
          <Header />
          <App />
        </BrowserRouter>
      </AuthProvider>
    </div>
  </StrictMode>
);
