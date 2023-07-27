import React, { useState } from "react";
import { useIframeLocalStorage } from "./components/IframeLocalStorage.hooks";
import { Button } from "iframe-local-storage-react-client";

function App() {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  const { set, get, remove, clear } = useIframeLocalStorage();

  return (
    <>
      <header>
        <h1>Single Sign On - Demo</h1>
      </header>
      <main>
        <Button />
        <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
          <Input label="key" onChange={(e) => setKey(e.target.value)} />
          <Input label="value" onChange={(e) => setValue(e.target.value)} />
        </div>
        <div style={{ marginTop: ".5rem", display: "flex", gap: ".5rem" }}>
          <button
            onClick={async () => {
              try {
                await set(key, value);
                console.log("set!");
              } catch (e) {
                console.log((e as Error).message);
              }
            }}
          >
            SET
          </button>
          <button
            onClick={async () => {
              try {
                const val = await get(key);
                console.log("get!", val);
              } catch (e) {
                console.log((e as Error).message);
              }
            }}
          >
            GET
          </button>
          <button
            onClick={async () => {
              try {
                await remove(key);
                console.log("remove!");
              } catch (e) {
                console.log((e as Error).message);
              }
            }}
          >
            REMOVE
          </button>
          <button
            onClick={async () => {
              try {
                await clear();
                console.log("clear!");
              } catch (e) {
                console.log((e as Error).message);
              }
            }}
          >
            CLEAR
          </button>
        </div>
      </main>
    </>
  );
}

function Input({ label, onChange }: { label: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label style={{ display: "flex" }}>
      <div style={{ width: 40 }}>{label}</div>
      <input type="text" onChange={onChange} />
    </label>
  );
}

export default App;
