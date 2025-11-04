import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import "leaflet/dist/leaflet.css";

import { AuthProvider } from "./context/AuthContext"; 
import { TenantProvider } from "./context/TenantContext";

// Fontes
import "@fontsource/inter/200.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <TenantProvider>
        <App />
      </TenantProvider>
    </AuthProvider>
  </React.StrictMode>
);
