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
    // This is required when deploying to https://id.decentraland.org (today and zone) due to how release versioning with oddish and the cdn works.
    // This will set the base url to the cdn url for any public assets.
    // In order to create this url, it uses the name and version set by oddish in the package.json when running the ci process.
    const packageJson = path.resolve(__dirname, "package.json");
    const packageJsonContent = fs.readFileSync(packageJson, "utf-8");
    const packageJsonData = JSON.parse(packageJsonContent);

    config.base = `https://cdn.decentraland.org/${packageJsonData.name}/${packageJsonData.version}`;
  }

  return config;
});
