import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./store/AuthStore";
import { AppProvider } from "./store/AppStore";
import "./index.css";

// HashRouter keeps deep links working when the PWA is served from any path.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <AuthProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>,
);
