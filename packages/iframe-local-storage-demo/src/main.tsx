import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { IframeLocalStorage } from "iframe-local-storage-react-client";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <IframeLocalStorage iframeUrl="http://localhost:3001">
      <App />
    </IframeLocalStorage>
  </React.StrictMode>
);
