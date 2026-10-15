import { MongoMemoryReplSet } from "mongodb-memory-server-core";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
await mkdir(".local/mongodb", { recursive: true });
const replica = await MongoMemoryReplSet.create({
  binary: { version: "8.2.6" },
  instanceOpts: [
    {
      port: 27018,
      dbPath: resolve(".local/mongodb"),
      ip: "127.0.0.1",
      storageEngine: "wiredTiger",
    },
  ],
  replSet: {
    name: "kai247-local",
    count: 1,
    storageEngine: "wiredTiger",
    ip: "127.0.0.1",
    spawn: { windowsHide: true },
  },
});
console.log(
  "Local MongoDB replica set is running on loopback port 27018. Data persists in ignored .local/mongodb. Atlas is NOT configured.",
);
console.log(
  "MONGODB_URI local configuration: mongodb://127.0.0.1:27018/kai247_local?replicaSet=kai247-local",
);
const stop = async () => {
  await replica.stop({ doCleanup: false, force: false });
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
await new Promise(() => {});
