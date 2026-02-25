import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { registerServiceWorker, unregisterServiceWorker } from "./utils/swRegister";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import "./style.css";
import "./styles/animations.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Service worker: only in production; actively unregister in development
if (process.env.NODE_ENV === 'production') {
  registerServiceWorker();
} else {
  unregisterServiceWorker();
}
