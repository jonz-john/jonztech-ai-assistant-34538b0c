import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initAntiInspect } from "./utils/antiInspect";

// Initialize anti-inspect protections in production
if (import.meta.env.PROD) {
  initAntiInspect();
}

createRoot(document.getElementById("root")!).render(<App />);
