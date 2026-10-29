import fs from "node:fs";
import { migrateState } from "../src/services/migration.js";
const seed = migrateState(
  JSON.parse(fs.readFileSync("src/data/seed.json", "utf8")),
);
for (const path of ["src/data/seed.json", "public/seed.json"])
  fs.writeFileSync(path, JSON.stringify(seed, null, 2) + "\n");
