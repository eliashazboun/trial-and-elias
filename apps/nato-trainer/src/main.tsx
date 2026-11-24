import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import TestingGrounds from "./App";
import "./styles.css";
const root = document.getElementById("root");
if (!root) throw Error("Missing trainer root");
createRoot(root).render(
  <StrictMode>
    <TestingGrounds />
  </StrictMode>,
);
