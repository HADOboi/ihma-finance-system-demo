import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { SupabaseDataProvider } from "./context/SupabaseContext";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SupabaseDataProvider>
      <App />
    </SupabaseDataProvider>
  </React.StrictMode>,
);
