import { useRef, useState } from "react";

function App() {
  const [id, setId] = useState(1);
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <>
      <header>
        <h1>Single Sign On - Demo</h1>
      </header>
      <main>
        <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
          <Input label="key" onChange={(e) => setKey(e.target.value)} />
          <Input label="value" onChange={(e) => setValue(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: ".5rem", marginTop: ".5rem" }}>
          <button
            onClick={() => {
              const cw = iframeRef.current?.contentWindow;

              if (cw) {
                cw.postMessage({ id, action: "set", key, value }, "*");
              }
            }}
          >
            SET
          </button>
          <button
            onClick={() => {
              const cw = iframeRef.current?.contentWindow;

              if (cw) {
                cw.postMessage({ id, action: "get", key }, "*");
              }

              setId((id) => id + 1);
            }}
          >
            GET
          </button>
        </div>
      </main>
      <iframe style={{ marginTop: "1rem" }} ref={iframeRef} src="http://localhost:3001"></iframe>
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
