import { UserConfigExport, defineConfig } from "vite";
import fs from "fs";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const config: UserConfigExport = {
    server: {
      port: 3001,
    },
  };

  if (command === "build" && !!process.env.CI) {
    const packageJson = path.resolve(__dirname, "package.json");
    const packageJsonContent = fs.readFileSync(packageJson, "utf-8");
    const packageJsonData = JSON.parse(packageJsonContent);

    config.base = `https://cdn.decentraland.org/${packageJsonData.name}/${packageJsonData.version}`;
  }

  return config;
});
