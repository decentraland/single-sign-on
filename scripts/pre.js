const fs = require("fs");
const path = require("path");

// Create .env

const packageJson = path.resolve(__dirname, "../package.json");

const packageJsonData = JSON.parse(fs.readFileSync(packageJson, "utf8"));

const envData = {
  VITE_BASE_URL: !!process.env.CI
    ? `https://cdn.decentraland.org/${packageJsonData.name}/${packageJsonData.version}`
    : "",
};

const envText = Object.entries(envData)
  .map(([key, value]) => `${key}="${value}"`)
  .join("\n");

const env = path.resolve(__dirname, "../.env");

fs.writeFileSync(env, envText);
