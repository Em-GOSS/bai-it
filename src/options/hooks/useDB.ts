import { useState, useEffect } from "react";
import { openDB } from "../../shared/db.ts";

export function useDB() {
  const [db, setDb] = useState<IDBDatabase | null>(null);

  useEffect(() => {
    openDB().then(setDb).catch((err) => {
      console.error("[掰it] Failed to open IndexedDB:", err);
    });
  }, []);

  return db;
}
