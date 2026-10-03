import { RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";

import { getRouter } from "./router";
import "./styles.css";

const rootElement = document.getElementById("app");

if (!rootElement) {
  throw new Error("The customer portal app root is missing.");
}

ReactDOM.createRoot(rootElement).render(<RouterProvider router={getRouter()} />);
