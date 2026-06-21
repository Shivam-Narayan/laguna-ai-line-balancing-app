// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import App from "./App.jsx";
import favicon from '../src/assets/Ascendum_logo.svg';

const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
link.type = 'image/svg+xml';
link.rel = 'icon';
link.href = favicon;
document.head.appendChild(link);

createRoot(document.getElementById("root")).render(
  // <StrictMode>
    <App />
  // </StrictMode>
);
