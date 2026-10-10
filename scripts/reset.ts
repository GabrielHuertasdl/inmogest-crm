import { rmSync } from "node:fs";
import path from "node:path";
const dir = path.join(process.cwd(), "data");
for (const f of ["inmogest.db", "inmogest.db-wal", "inmogest.db-shm"]) rmSync(path.join(dir, f), { force: true });
rmSync(path.join(dir, "uploads"), { recursive: true, force: true });
console.log("data reset");
