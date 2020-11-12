const util = require("util");
const esbuild = require("esbuild");
const readJson = require("read-package-json");

(async () => {
  try {
    const data = await util.promisify(readJson)("./package.json");
    const deps = Object.keys(data.dependencies ?? {});
    await esbuild.build({
      entryPoints: ["index.js"],
      bundle: true,
      external: deps,
      platform: "node",
      minify: true,
      outfile: "dist/index.js",
    });
  } catch (error) {
    console.warn(error.message);
  }
})();
