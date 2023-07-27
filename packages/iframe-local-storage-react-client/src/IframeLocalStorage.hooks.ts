import { useContext } from "react";
import { IframeLocalStorageContext } from "./IframeLocalStorage.context";

export function useIframeLocalStorage() {
  const { iframeRef, iframeUrl, idRef } = useContext(IframeLocalStorageContext);

  // Get the window object of the iframe to which messages will be posted.
  const getIframeWindow = () => {
    const iframeWindow = iframeRef?.current?.contentWindow;

    if (!iframeWindow) {
      throw new Error("iframe not ready");
    }

    return iframeWindow;
  };

  // Get the id for the next message.
  // Automatically bumps it up by one.
  const getMessageId = () => {
    return idRef.current++;
  };

  // Creates a listener that awaits for the response from the iframe.
  const makeResponseListener = <T>(id: number, mapResponse: (event: MessageEvent) => T) => {
    return new Promise<T>((resolve, reject) => {
      const handler = (event: MessageEvent) => {
        console.log("demo: event.data", event.data);

        // Ignore messages from other origins.
        if (event.origin !== iframeUrl) {
          return;
        }

        // Ignore messages with a different id.
        if (event.data?.id !== id) {
          return;
        }

        window.removeEventListener("message", handler);

        if (event.data?.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(mapResponse(event));
        }
      };

      window.addEventListener("message", handler);
    });
  };

  // Sends the message to the iframe.
  const postMessage = (
    iframeWin: Window,
    { id, action, key, value }: { id: number; action: string; key?: string; value?: string }
  ) => {
    iframeWin.postMessage(
      {
        target: "iframe-local-storage-request",
        id,
        action,
        key,
        value,
      },
      iframeUrl
    );
  };

  // Wrapper around postMessage logic that awaits for the response.
  const callAction = <T>(
    mapResponse: (event: MessageEvent) => T,
    postMessageArgs: { action: string; key?: string; value?: string }
  ) => {
    const win = getIframeWindow();
    const id = getMessageId();
    const responseListener = makeResponseListener<T>(id, mapResponse);

    postMessage(win, {
      id,
      ...postMessageArgs,
    });

    return responseListener;
  };

  const set = (key: string, value: string) => callAction(() => {}, { action: "set", key, value });

  const get = (key: string) => callAction<string | null>((event) => event.data.value, { action: "get", key });

  const remove = (key: string) => callAction(() => {}, { action: "remove", key });

  const clear = () => callAction(() => {}, { action: "clear" });

  return {
    set,
    get,
    remove,
    clear,
  };
}
