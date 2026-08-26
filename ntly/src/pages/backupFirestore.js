import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

const FIRESTORE_COLLECTIONS = [
  "admins",
  "attendance",
  "colleges",
  "counters",
  "courseCompletion",
  "courseReports",
  "courses",
  "dailyVideos",
  "degrees",
  "districts",
  "notifications",
  "payments",
  "settings",
  "submissions",
  "universities",
  "users",
  "userVideoProgress"
];

export async function backupFirestore() {
  const backup = {};
  const skipped = [];

  for (const collectionName of FIRESTORE_COLLECTIONS) {
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      backup[collectionName] = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data()
      }));
    } catch (error) {
      skipped.push({
        collection: collectionName,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  if (Object.keys(backup).length === 0) {
    throw new Error("No Firestore collections could be read. Check admin login and Firestore rules.");
  }

  const generatedAt = new Date();
  const payload = {
    metadata: {
      generatedAt: generatedAt.toISOString(),
      database: db.app.options.projectId || "firebase",
      exportedCollections: Object.keys(backup),
      skippedCollections: skipped
    },
    collections: backup
  };

  const blob = new Blob(
    [JSON.stringify(payload, null, 2)],
    { type: "application/json" }
  );

  const fileStamp = generatedAt.toISOString().replace(/[:.]/g, "-");
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = `firestore-backup-${fileStamp}.json`;
  a.click();
  URL.revokeObjectURL(objectUrl);

  return {
    exportedCollections: Object.keys(backup),
    skippedCollections: skipped
  };
}
