import { useRef } from "react";
import { IframeLocalStorageContext } from "./IframeLocalStorage.context";

export function IframeLocalStorage({ children, iframeUrl }: { children: React.ReactNode; iframeUrl: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const idRef = useRef(1);

  return (
    <IframeLocalStorageContext.Provider value={{ iframeRef, iframeUrl, idRef }}>
      <iframe ref={iframeRef} src={iframeUrl} />
      {children}
    </IframeLocalStorageContext.Provider>
  );
}
