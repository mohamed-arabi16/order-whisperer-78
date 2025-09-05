import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

/**
 * The main entry point for the application.
 * This file renders the root `App` component into the DOM.
 */
createRoot(document.getElementById("root")!).render(<App />);
