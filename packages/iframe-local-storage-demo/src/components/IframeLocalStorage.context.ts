import { createContext } from "react";

export const IframeLocalStorageContext = createContext<{
  iframeRef: React.RefObject<HTMLIFrameElement>;
  iframeUrl: string;
  idRef: React.MutableRefObject<number>;
}>({ iframeUrl: "", iframeRef: { current: null }, idRef: { current: 0 } });
