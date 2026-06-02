import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { STORAGE_KEYS } from "@/storage/keys";

import "./index.css";

const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
if (savedTheme === "light" || savedTheme === "dark") {
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(savedTheme);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
