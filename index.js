import { spawn } from "child_process";
import fs from "fs";
import got from "got";
import readJson from "read-package-json";
import semver from "semver";
import { promisify } from "util";

const readJsonAsync = promisify(readJson);

function getOptions() {
  const argv = process.argv;
  const devOnly = argv.includes("-D");
  const allDeps = argv.includes("+D");
  const deps = allDeps ? "all" : devOnly ? "dev" : "";

  const npm = argv.includes("--npm");
  const yarn = argv.includes("--yarn");
  const pnpm = argv.includes("--pnpm");
  const pm = pnpm ? "pnpm" : yarn ? "yarn" : npm ? "npm" : "";

  const dry = argv.includes("--dry-run");

  return { deps, pm, dry };
}

async function getProperTag(name, range) {
  try {
    const { body } = await got(name, {
      prefixUrl: "https://data.jsdelivr.com/v1/package/npm",
      responseType: "json",
    });
    const tags = body.tags ?? {};
    let tag = "";
    const tagIsLessThanOrEqualTo = (v) =>
      tag === "" || semver.lte(tags[tag], v);
    for (const [t, v] of Object.entries(tags)) {
      if (semver.satisfies(v, range) && tagIsLessThanOrEqualTo(v)) {
        tag = t;
      }
    }
    const from = semver.minVersion(range).version;
    const to = tags[tag] ?? from;
    const canUp = from !== to;
    return { name, tag, canUp, from, to };
  } catch {
    return { name, tag: "", canUp: false };
  }
}

function getClient(pm) {
  if (pm === "") {
    if (fs.existsSync("./pnpm-lock.yaml")) return "pnpm";
    else if (fs.existsSync("./yarn.lock")) return "yarn";
    else if (fs.existsSync("./package-lock.json")) return "npm";
    else return "npm";
  } else return pm;
}

function getAddCommand(pm) {
  const client = getClient(pm);
  if (pm === "npm") return [client, "install"];
  else return [client, "add"];
}

function getRemoveCommand(pm) {
  const client = getClient(pm);
  if (pm === "npm") return [client, "uninstall"];
  else return [client, "remove"];
}

function makeCommand(upgrades, opt) {
  const names = [];
  const namesTag = [];
  for (const { name, tag } of upgrades) {
    names.push(name);
    namesTag.push(`${name}@${tag}`);
  }
  const { dev, pm } = opt;
  const first = [...getRemoveCommand(pm), ...(dev ? ["-D"] : []), ...names];
  const second = [...getAddCommand(pm), ...(dev ? ["-D"] : []), ...namesTag];
  return { first, second };
}

function trySpawn(cmds) {
  cmds = cmds.slice();
  const bin = cmds.shift();
  const work = spawn(bin, cmds, { shell: true });
  return new Promise((res, rej) => {
    work.on("close", res);
    work.on("error", rej);
  });
}

async function upgradeAll(deps, opt) {
  console.log("fetching info of", Object.keys(deps));
  const tasks = Object.entries(deps).map(([name, range]) =>
    getProperTag(name, range)
  );
  let upgrades = await Promise.all(tasks);
  upgrades = upgrades.filter((e) => e.canUp);
  if (upgrades.length === 0) {
    console.log("all of them are at the latest version");
    return;
  }
  const { first, second } = makeCommand(upgrades, opt);
  console.log(first.join(" "), "&&", second.join(" "));
  if (!opt.dry) {
    try {
      await trySpawn(first);
      await trySpawn(second);
      console.log("successfully upgraded these packages");
      let w1 = 0;
      let w2 = 0;
      for (const { name, from } of upgrades) {
        w1 = Math.max(name.length, w1);
        w2 = Math.max(from.length, w2);
      }
      for (const { name, from, to } of upgrades) {
        console.log("   ", name.padEnd(w1), from.padEnd(w2), "->", to);
      }
    } catch (err) {
      console.error(err);
    }
  }
}

async function main() {
  const json = await readJsonAsync("./package.json");
  const { deps, pm, dry } = getOptions();
  if (deps === "" || deps === "all") {
    upgradeAll(json.dependencies ?? {}, { dev: false, pm, dry });
  }
  if (deps === "dev" || deps === "all") {
    upgradeAll(json.devDependencies ?? {}, { dev: true, pm, dry });
  }
}

try {
  if (typeof require !== "undefined" && require.main === module) main();
} catch {}
