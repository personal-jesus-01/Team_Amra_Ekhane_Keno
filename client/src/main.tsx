import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Helmet } from "react-helmet";
// Initialize Firebase
import "./lib/firebase";

createRoot(document.getElementById("root")!).render(
  <>
    <Helmet>
      <title>SlideBanai | Modern Presentation Platform</title>
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
    </Helmet>
    <App />
  </>
);
