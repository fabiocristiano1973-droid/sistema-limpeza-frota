import { DatabaseSync } from "node:sqlite";
import fs from "fs";
import path from "path";
import { getDataDir } from "@/lib/data-dir";

let instance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (instance) return instance;

  const dir = getDataDir();
  fs.mkdirSync(dir, { recursive: true });
  const dbPath = path.join(dir, "sistema-limpeza-frota.db");

  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  instance = db;
  return db;
}
