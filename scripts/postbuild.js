const fs = require("fs");
const path = require("path");

const packageJson = path.resolve(__dirname, "../package.json");

fs.cpSync(packageJson, path.resolve(__dirname, "../dist/package.json"));
