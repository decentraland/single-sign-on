const fs = require("fs");
const path = require("path");

// Copy package.json to dist

const packageJson = path.resolve(__dirname, "../package.json");
const packageJsonDist = path.resolve(__dirname, "../dist/package.json");

fs.cpSync(packageJson, packageJsonDist);
