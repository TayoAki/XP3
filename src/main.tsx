import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
// No private API response enters this cache; account snapshots remain session-scoped.
if ("serviceWorker" in navigator && location.pathname.startsWith("/journey/")) {
  void navigator.serviceWorker
    .register("/journey/sw.js", { scope: "/journey/" })
    .catch(() => {
      window.dispatchEvent(new CustomEvent("xp.live.offline-unavailable"));
    });
}
