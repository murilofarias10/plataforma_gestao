import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "@fontsource/montserrat/300.css"; // Light
import "@fontsource/montserrat/400.css"; // Regular
import "@fontsource/montserrat/500.css"; // Medium
import "@fontsource/montserrat/600.css"; // Semi-bold
import "@fontsource/montserrat/700.css"; // Bold
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);