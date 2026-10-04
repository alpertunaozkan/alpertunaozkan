import "server-only";

import { MongoClient, type Db } from "mongodb";
import { collections, ensureIndexes, type Collections } from "./documents";
import { getDatabaseEnv } from "./env";

/*
 * MongoDB Atlas bağlantısı. Süreç başına tek istemci (bağlantı havuzu)
 * kullanılır; geliştirmedeki sıcak yeniden yüklemelerde bağlantı sayısı
 * artmasın diye istemci globalThis üzerinde saklanır.
 */

const globalForMongo = globalThis as typeof globalThis & {
  __mongoClient?: Promise<MongoClient>;
  __mongoIndexes?: Promise<void>;
};

function connect(): Promise<MongoClient> {
  const { MONGODB_URI } = getDatabaseEnv();
  const client = new MongoClient(MONGODB_URI, {
    appName: "alpertunaozkan-web",
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 8_000,
  });
  return client.connect();
}

export async function getDb(): Promise<Db> {
  globalForMongo.__mongoClient ??= connect().catch((error: unknown) => {
    // Bağlantı kurulamazsa bir sonraki istekte yeniden denenir.
    globalForMongo.__mongoClient = undefined;
    throw error;
  });
  const client = await globalForMongo.__mongoClient;
  const db = client.db(getDatabaseEnv().MONGODB_DB);

  globalForMongo.__mongoIndexes ??= ensureIndexes(db).catch((error: unknown) => {
    globalForMongo.__mongoIndexes = undefined;
    throw error;
  });
  await globalForMongo.__mongoIndexes;
  return db;
}

/** Koleksiyonlara tipli erişim. */
export async function getCollections(): Promise<Collections> {
  return collections(await getDb());
}
