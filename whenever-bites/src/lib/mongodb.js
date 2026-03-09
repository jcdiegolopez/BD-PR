import { MongoClient, GridFSBucket } from "mongodb";
import dns from "node:dns";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;
const dnsServers = process.env.MONGODB_DNS_SERVERS;

if (!uri) {
  throw new Error("MONGODB_URI no está definido en .env.local");
}

if (uri.startsWith("mongodb+srv://") && dnsServers) {
  const servers = dnsServers
    .split(",")
    .map((server) => server.trim())
    .filter(Boolean);

  if (servers.length > 0) {
    dns.setServers(servers);
  }
}

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function getDb() {
  const mongoClient = await clientPromise;
  return mongoClient.db(dbName);
}

export async function getMongoClient() {
  return clientPromise;
}

export async function pingDatabase() {
  const db = await getDb();
  await db.command({ ping: 1 });
  return true;
}

export async function getGridFSBucket(bucketName = "archivos") {
  const db = await getDb();
  return new GridFSBucket(db, { bucketName });
}
