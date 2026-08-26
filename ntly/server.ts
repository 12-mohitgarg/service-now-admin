import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import admin from "firebase-admin";
import type { Request, Response, NextFunction } from "express";
import { sendEmail } from "./server/mailer";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HMR_PORT = Number(process.env.VITE_HMR_PORT || 24678);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

function getFirebaseAdminCredential() {
  try {
    const saPath = path.join(process.cwd(), "service-account.json");
    if (fs.existsSync(saPath)) {
      return admin.credential.cert(saPath);
    }
  } catch (err) {
    // Ignore fallback
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
  }

  const projectId = cleanEnvValue(process.env.FIREBASE_PROJECT_ID) || "intermitra-backup";
  const clientEmail = cleanEnvValue(process.env.FIREBASE_CLIENT_EMAIL);
  const privateKey = getFirebasePrivateKey();

  if (clientEmail && privateKey) {
    return admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    });
  }

  return admin.credential.applicationDefault();
}

function getFirebasePrivateKey() {
  if (process.env.FIREBASE_PRIVATE_KEY_BASE64) {
    return Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64, "base64").toString("utf8");
  }

  return process.env.FIREBASE_PRIVATE_KEY
    ?.trim()
    .replace(/,$/, "")
    .replace(/^['"]|['"]$/g, "")
    .replace(/,$/, "")
    .replace(/\\\\n/g, "\n")
    .replace(/\\n/g, "\n");
}

function getFirebaseProjectId() {
  return cleanEnvValue(process.env.FIREBASE_PROJECT_ID) || "intermitra-backup";
}

function cleanEnvValue(value?: string) {
  return value
    ?.trim()
    .replace(/,$/, "")
    .replace(/^['"]|['"]$/g, "")
    .replace(/,$/, "")
    .trim();
}

function normalizeLoginIdentifier(value: unknown) {
  return String(value || "").trim();
}

function uniqueIdentifierValues(value: string) {
  return Array.from(new Set([
    value,
    value.toUpperCase(),
    value.toLowerCase(),
  ].filter(Boolean)));
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: getFirebaseAdminCredential(),
    projectId: getFirebaseProjectId(),
  });
}

const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      return res.status(401).json({ error: "Missing admin authorization token" });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    const email = decodedToken.email || "";

    if (email === "admin@internmitra.com") {
      return next();
    }

    const adminDoc = await admin.firestore().collection("admins").doc(decodedToken.uid).get();
    const adminData = adminDoc.exists ? adminDoc.data() : null;
    const isAllowedAdmin =
      adminData?.isActive === true &&
      ["admin", "super_admin"].includes(String(adminData?.role || ""));

    if (!isAllowedAdmin) {
      return res.status(403).json({ error: "Only admins can update user passwords" });
    }

    next();
  } catch (error: any) {
    console.error("Admin authorization error:", error);
    res.status(401).json({
      error: "Unable to verify admin session",
      details: error?.message || "Unknown authorization error",
    });
  }
};

const requireDashboardOperator = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      return res.status(401).json({ error: "Missing authorization token" });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    const email = String(decodedToken.email || "").toLowerCase();

    if (email === "admin@internmitra.com" || email === "gargmohit8306@gmail.com") {
      return next();
    }

    const adminDoc = await admin.firestore().collection("admins").doc(decodedToken.uid).get();
    const adminData = adminDoc.exists ? adminDoc.data() : null;
    const isAllowedOperator =
      adminData?.isActive === true &&
      ["admin", "super_admin", "sub_user"].includes(String(adminData?.role || ""));

    if (!isAllowedOperator) {
      return res.status(403).json({ error: "Only dashboard operators can perform this action" });
    }

    next();
  } catch (error: any) {
    console.error("Dashboard operator authorization error:", error);
    res.status(401).json({
      error: "Unable to verify dashboard operator session",
      details: error?.message || "Unknown authorization error",
    });
  }
};

async function getDecodedToken(req: Request) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    throw Object.assign(new Error("Missing authorization token"), { statusCode: 401 });
  }

  return admin.auth().verifyIdToken(token);
}

async function isEmitraUser(uid: string) {
  const emitraDoc = await admin.firestore().collection("emitras").doc(uid).get();
  return emitraDoc.exists && emitraDoc.data()?.isActive === true;
}

function maskKey(value?: string) {
  if (!value) return "";
  if (value.length <= 8) return "••••";
  return `${value.slice(0, 8)}••••${value.slice(-4)}`;
}

function makeCollegeEmail(collegeId: string, collegeName: string) {
  const base = String(collegeName || collegeId || "college")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 34) || "college";
  const suffix = String(collegeId || "").toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 8);
  return `college-${base}${suffix ? `-${suffix}` : ""}@internmitra.com`;
}

function makePassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let password = "IM";
  for (let i = 0; i < 10; i += 1) {
    password += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return password;
}

async function getRazorpayConfig() {
  const snap = await admin.firestore().collection("privateSettings").doc("razorpay").get();
  const data = snap.exists ? snap.data() : {};
  const keyId = data?.keyId || process.env.RAZORPAY_KEY_ID || "";
  const keySecret = data?.keySecret || process.env.RAZORPAY_KEY_SECRET || "";

  if (!keyId || !keySecret) {
    throw Object.assign(new Error("Razorpay keys are not configured"), { statusCode: 500 });
  }

  return { keyId, keySecret, source: data?.keyId ? "database" : "environment" };
}

async function getStudentForPayment(decodedToken: admin.auth.DecodedIdToken, paymentForUserId?: string) {
  const targetUserId = paymentForUserId || decodedToken.uid;
  const userSnap = await admin.firestore().collection("users").doc(targetUserId).get();

  if (!userSnap.exists) {
    throw Object.assign(new Error("Student record not found"), { statusCode: 404 });
  }

  const student = { uid: userSnap.id, ...userSnap.data() } as any;
  const isRejected = student.paymentStatus === "rejected" || student.isPaid === false;

  if ((student.isPaid === true || student.hasPaid === true || student.paymentStatus === "success") && !isRejected) {
    throw Object.assign(new Error("Student payment is already verified"), { statusCode: 409 });
  }

  if (targetUserId === decodedToken.uid) {
    return student;
  }

  const canPayForStudent =
    student.createdByEmitraId === decodedToken.uid &&
    (await isEmitraUser(decodedToken.uid));

  if (!canPayForStudent) {
    throw Object.assign(new Error("You are not allowed to pay for this student"), { statusCode: 403 });
  }

  return student;
}

async function getCollegeAmount(collegeName?: string) {
  if (!collegeName) return 1000;

  const snapshot = await admin
    .firestore()
    .collection("colleges")
    .where("name", "==", collegeName)
    .limit(1)
    .get();

  const price = snapshot.docs[0]?.data()?.price;
  return Number.isFinite(Number(price)) && Number(price) > 0 ? Number(price) : 1000;
}

function normalizeImportedStudent(student: any) {
  const normalizeDepartment = (value: any) => {
    const cleaned = String(value || "").replace(/\u00a0/g, " ").trim();
    const match = cleaned.match(/^(B\.A\.|B\.Sc\.|B\.Com\.|M\.A\.|M\.Sc\.|M\.Com\.)/i);
    return match ? match[1] : cleaned;
  };
  const normalizeSubject = (value: any) => {
    const cleaned = String(value || "")
      .replace(/\u00a0/g, " ")
      .replace(/^Major\s*:\s*/i, "")
      .trim();
    const bracketMatch = cleaned.match(/^[A-Z]\.[A-Z][A-Za-z.]*\s*\((.+)\)$/i);
    return bracketMatch ? bracketMatch[1].trim() : cleaned;
  };
  const normalizeSemester = (value: any) => {
    const cleaned = String(value || "").replace(/\u00a0/g, " ").trim();
    const romanMap: Record<string, string> = {
      I: "Semester 1",
      II: "Semester 2",
      III: "Semester 3",
      IV: "Semester 4",
      V: "Semester 5",
      VI: "Semester 6",
      VII: "Semester 7",
      VIII: "Semester 8",
    };
    const upper = cleaned.toUpperCase();
    if (romanMap[upper]) return romanMap[upper];
    if (/^\d+$/.test(cleaned)) return `Semester ${cleaned}`;
    return cleaned;
  };
  const rawDepartment = student.department || student.academicDetails || student.degree;
  const rawSubject = student.subject || student.academicDetails;

  return {
    fullName: String(student.fullName || "").trim(),
    parentName: String(student.parentName || "").trim(),
    contactNumber: String(student.contactNumber || "").replace(/\D/g, "").slice(-10),
    email: String(student.email || "").trim().toLowerCase(),
    gender: String(student.gender || "").trim(),
    district: String(student.district || "").trim(),
    college: String(student.college || "").trim(),
    university: String(student.university || "").trim(),
    degree: String(student.degree || "").trim(),
    department: normalizeDepartment(rawDepartment),
    subject: normalizeSubject(rawSubject),
    session: String(student.session || "").trim(),
    course: String(student.course || "").trim(),
    semester: normalizeSemester(student.semester),
    universityRoll: String(student.universityRoll || "").trim(),
    universityRollNo: String(student.universityRollNo || "").trim(),
    industrialRegNo: String(student.industrialRegNo || "").trim(),
    internshipDomain: String(student.internshipDomain || student.course || "").trim(),
    internshipMode: String(student.internshipMode || "Online").trim(),
    motherName: String(student.motherName || "").trim(),
    dateOfBirth: String(student.dateOfBirth || "").trim(),
    academicDetails: String(student.academicDetails || "").trim(),
  };
}

async function findExistingImportStudent(
  db: admin.firestore.Firestore,
  importedRef: admin.firestore.CollectionReference,
  student: ReturnType<typeof normalizeImportedStudent>
) {
  if (!student.universityRoll) return "Missing Roll Number";

  const [
    existingRoll,
    existingImported,
  ] = await Promise.all([
    db.collection("users").where("universityRoll", "==", student.universityRoll).limit(1).get(),
    importedRef.where("universityRoll", "==", student.universityRoll).limit(1).get(),
  ]);

  if (!existingRoll.empty) return "Student already registered with this roll number";
  if (!existingImported.empty) return "Student already exists in imported list";
  return "";
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", environment: process.env.NODE_ENV });
});

app.post("/api/auth/student-login-identifier", async (req, res) => {
  try {
    const identifier = normalizeLoginIdentifier(req.body?.identifier);

    if (!identifier) {
      return res.status(400).json({ error: "Login ID is required" });
    }

    if (identifier.includes("@")) {
      return res.json({ email: identifier.toLowerCase() });
    }

    const db = admin.firestore();
    const usersRef = db.collection("users");
    const phone = identifier.replace(/\D/g, "").slice(-10);
    const lookups: Promise<FirebaseFirestore.QuerySnapshot>[] = [];

    if (phone.length === 10) {
      lookups.push(usersRef.where("contactNumber", "==", phone).limit(1).get());
    }

    for (const value of uniqueIdentifierValues(identifier)) {
      lookups.push(usersRef.where("universityRoll", "==", value).limit(1).get());
      lookups.push(usersRef.where("universityRollNo", "==", value).limit(1).get());
    }

    const snapshots = await Promise.all(lookups);
    const matchedDoc = snapshots.find((snapshot) => !snapshot.empty)?.docs[0];
    const email = String(matchedDoc?.data()?.email || "").trim().toLowerCase();

    if (!matchedDoc || !email) {
      return res.status(404).json({ error: "No student account found for this login ID" });
    }

    res.json({ email });
  } catch (error: any) {
    console.error("Student login identifier lookup error:", error);
    res.status(500).json({
      error: "Unable to verify login ID",
      details: error?.message || "Unknown error",
    });
  }
});

app.post("/api/admin/import-students", requireAdmin, async (req, res) => {
  try {
    const { students } = req.body || {};
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ error: "Invalid payload: students list is empty or not an array" });
    }

    const db = admin.firestore();
    const importedRef = db.collection("importedStudents");
    
    let importedCount = 0;
    const importedStudents: any[] = [];
    const skippedStudents: any[] = [];
    const seenRolls = new Set<string>();
    const CHUNK_SIZE = 400; // Batch limit is 500

    for (let i = 0; i < students.length; i += CHUNK_SIZE) {
      const chunk = students.slice(i, i + CHUNK_SIZE);
      const batch = db.batch();

      for (const rawStudent of chunk) {
        const student = normalizeImportedStudent(rawStudent);

        if (student.universityRoll && seenRolls.has(student.universityRoll)) {
          skippedStudents.push({ ...student, reason: "Duplicate roll number in uploaded file" });
          continue;
        }
        if (student.universityRoll) seenRolls.add(student.universityRoll);

        const existingReason = await findExistingImportStudent(db, importedRef, student);
        if (existingReason) {
          skippedStudents.push({ ...student, reason: existingReason });
          continue;
        }
        
        const docData = {
          ...student,
          importedAt: new Date().toISOString(),
          paymentStatus: "Pending",
          whatsappSent: false,
        };

        const newRef = importedRef.doc();
        batch.set(newRef, docData);
        
        importedCount += 1;
        importedStudents.push(docData);
      }

      await batch.commit();
    }

    // Now, trigger WhatsApp messages asynchronously for imported students who are Pending
    setTimeout(async () => {
      try {
        console.log(`[WhatsApp Notifications] Starting dispatch for ${importedStudents.length} imported students...`);
        const appUrl = process.env.APP_URL || "https://internmitra.com";
        
        for (const student of importedStudents) {
          if (!student.contactNumber || !student.universityRoll) continue;

          // Check if student is already registered & paid
          const registeredUserSnap = await db.collection("users").where("universityRoll", "==", student.universityRoll).limit(1).get();
          if (!registeredUserSnap.empty) {
            const registeredUserData = registeredUserSnap.docs[0].data();
            if (registeredUserData.paymentStatus === "success" || registeredUserData.isPaid === true) {
              continue;
            }
          }

          // Fetch the college amount
          const collegeAmount = await getCollegeAmount(student.college);
          
          // Formulate Secure Payment Link
          const securePaymentLink = `${appUrl}/register?roll=${encodeURIComponent(student.universityRoll)}`;
          
          // Message text
          const messageText = `Dear ${student.fullName}, your registration for the Internship Program from ${student.college || 'your college'} is pending. Please complete your registration and pay a fee of ₹${collegeAmount} using this secure link: ${securePaymentLink}`;

          // Simulate WhatsApp message (print to log)
          console.log(`\n======================================================`);
          console.log(`[WHATSAPP AUTOMATED DISPATCH]`);
          console.log(`To: +91${student.contactNumber}`);
          console.log(`Message: ${messageText}`);
          console.log(`======================================================\n`);

          // Update student status to whatsappSent: true
          const checkImportedRef = await importedRef.where("universityRoll", "==", student.universityRoll).limit(1).get();
          if (!checkImportedRef.empty) {
            await checkImportedRef.docs[0].ref.update({
              whatsappSent: true,
              whatsappSentAt: new Date().toISOString()
            });
          }

          // If a WhatsApp endpoint/service is configured, call it here:
          if (process.env.WHATSAPP_API_URL && process.env.WHATSAPP_API_TOKEN) {
            try {
              await fetch(process.env.WHATSAPP_API_URL, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${process.env.WHATSAPP_API_TOKEN}`
                },
                body: JSON.stringify({
                  phone: student.contactNumber,
                  message: messageText
                })
              });
            } catch (apiErr) {
              console.error(`Failed to send WhatsApp message to ${student.contactNumber} via API:`, apiErr);
            }
          }
        }
      } catch (bgErr) {
        console.error("Error sending background WhatsApp messages:", bgErr);
      }
    }, 1000);

    res.json({
      status: "success",
      importedCount,
      skippedCount: skippedStudents.length,
      importedStudents,
      skippedStudents,
    });
  } catch (error: any) {
    console.error("Excel Import Error:", error);
    res.status(500).json({ error: "Error occurred during Excel student import", details: error?.message || "Unknown error" });
  }
});

app.patch("/api/admin/users/:uid/password", requireDashboardOperator, async (req, res) => {
  try {
    const { uid } = req.params;
    const { password } = req.body;

    if (!uid) {
      return res.status(400).json({ error: "User id is required" });
    }

    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    await admin.auth().updateUser(uid, { password });
    res.json({ status: "success" });
  } catch (error: any) {
    console.error("Password update error:", error);
    res.status(500).json({
      error: "Error updating user password",
      details: error?.message || "Unknown error",
    });
  }
});

app.patch("/api/admin/users/:uid/email", requireDashboardOperator, async (req, res) => {
  try {
    const { uid } = req.params;
    const email = String(req.body?.email || "").trim().toLowerCase();

    if (!uid) {
      return res.status(400).json({ error: "User id is required" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Enter a valid email address" });
    }

    await admin.auth().updateUser(uid, { email, emailVerified: false });
    await admin.firestore().collection("users").doc(uid).set(
      {
        email,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    res.json({ status: "success", email });
  } catch (error: any) {
    console.error("Email update error:", error);
    res.status(500).json({
      error: "Error updating user email",
      details: error?.message || "Unknown error",
    });
  }
});

app.patch("/api/admin/users/:uid/profile", requireDashboardOperator, async (req, res) => {
  try {
    const { uid } = req.params;
    const profileData = req.body;

    if (!uid) {
      return res.status(400).json({ error: "User id is required" });
    }

    const allowedFields = [
      "fullName", "gender", "parentName", "contactNumber", "district", "college", 
      "university", "degree", "department", "subject", "session", "semester", 
      "universityRoll", "universityRollNo", "industrialRegNo", "internshipDomain", 
      "internshipMode"
    ];

    const updateData: Record<string, any> = {};
    for (const key of allowedFields) {
      if (profileData[key] !== undefined) {
        updateData[key] = profileData[key];
      }
    }

    updateData.updatedAt = new Date().toISOString();

    if (updateData.internshipDomain !== undefined) {
      updateData.course = updateData.internshipDomain;
    }

    await admin.firestore().collection("users").doc(uid).set(updateData, { merge: true });

    res.json({ status: "success", profile: updateData });
  } catch (error: any) {
    console.error("Profile update error:", error);
    res.status(500).json({
      error: "Error updating user profile",
      details: error?.message || "Unknown error",
    });
  }
});


app.post("/api/admin/college-users", requireAdmin, async (req, res) => {
  try {
    const collegeId = String(req.body.collegeId || "").trim();
    let collegeName = String(req.body.collegeName || "").trim();
    let districtId = String(req.body.districtId || "").trim();
    const contactPerson = String(req.body.contactPerson || "").trim();
    let email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || makePassword());

    if (!collegeId) {
      return res.status(400).json({ error: "College is required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const collegeDoc = await admin.firestore().collection("colleges").doc(collegeId).get();
    if (!collegeDoc.exists) {
      return res.status(404).json({ error: "College not found" });
    }

    const collegeData = collegeDoc.data() || {};
    collegeName = collegeName || String(collegeData.name || "").trim();
    districtId = districtId || String(collegeData.districtId || "").trim();

    if (!collegeName || !districtId) {
      return res.status(400).json({ error: "College record is missing name or district" });
    }

    const existingForCollege = await admin
      .firestore()
      .collection("collegeUsers")
      .where("collegeId", "==", collegeId)
      .limit(1)
      .get();

    const hasExistingCollegeLogin = !existingForCollege.empty;
    let authUser: admin.auth.UserRecord;
    let created = false;

    if (hasExistingCollegeLogin) {
      email = email || makeCollegeEmail(collegeId, collegeName);
      authUser = await admin.auth().updateUser(existingForCollege.docs[0].id, {
        email,
        password,
        displayName: collegeName,
        disabled: false,
      });
    } else {
      email = email || makeCollegeEmail(collegeId, collegeName);
      try {
        authUser = await admin.auth().getUserByEmail(email);
        const [studentDoc, adminDoc, emitraDoc] = await Promise.all([
          admin.firestore().collection("users").doc(authUser.uid).get(),
          admin.firestore().collection("admins").doc(authUser.uid).get(),
          admin.firestore().collection("emitras").doc(authUser.uid).get(),
        ]);

        if (studentDoc.exists || adminDoc.exists || emitraDoc.exists) {
          return res.status(409).json({ error: "This email already belongs to another account type" });
        }

        await admin.auth().updateUser(authUser.uid, {
          password,
          displayName: collegeName,
          disabled: false,
        });
      } catch (error: any) {
        if (error?.code !== "auth/user-not-found") {
          throw error;
        }

        authUser = await admin.auth().createUser({
          email,
          password,
          displayName: collegeName,
          disabled: false,
        });
        created = true;
      }
    }

    const now = new Date().toISOString();
    const profilePayload = {
      uid: authUser.uid,
      collegeId,
      collegeName,
      districtId,
      contactPerson,
      email,
      isActive: true,
      role: "college",
      updatedAt: now,
    };

    await admin
      .firestore()
      .collection("collegeUsers")
      .doc(authUser.uid)
      .set(hasExistingCollegeLogin ? profilePayload : { ...profilePayload, createdAt: now }, { merge: true });

    res.json({ status: "success", created, uid: authUser.uid, email, password, collegeName });
  } catch (error: any) {
    console.error("College user create/update error:", error);
    res.status(500).json({
      error: "Error saving college login",
      details: error?.message || "Unknown error",
    });
  }
});

app.delete("/api/admin/sub-users/:uid", requireAdmin, async (req, res) => {
  try {
    const uid = String(req.params.uid || "").trim();

    if (!uid) {
      return res.status(400).json({ error: "Sub user id is required" });
    }

    const decodedToken = await getDecodedToken(req);

    if (uid === decodedToken.uid) {
      return res.status(400).json({ error: "You cannot delete your own admin account" });
    }

    const db = admin.firestore();
    const subUserDoc = await db.collection("admins").doc(uid).get();

    if (!subUserDoc.exists || !["sub_user", "district_user"].includes(String(subUserDoc.data()?.role || ""))) {
      return res.status(404).json({ error: "Sub user not found" });
    }

    await Promise.all([
      db.collection("admins").doc(uid).delete(),
      admin.auth().deleteUser(uid).catch((error: any) => {
        if (error?.code !== "auth/user-not-found") {
          throw error;
        }
      }),
    ]);

    res.json({ status: "success" });
  } catch (error: any) {
    console.error("Sub user delete error:", error);
    res.status(500).json({
      error: "Error deleting sub user",
      details: error?.message || "Unknown error",
    });
  }
});

app.get("/api/auth/college-profile", async (req, res) => {
  try {
    const decodedToken = await getDecodedToken(req);
    const db = admin.firestore();
    const directDoc = await db.collection("collegeUsers").doc(decodedToken.uid).get();

    if (directDoc.exists) {
      return res.json({ profile: { uid: directDoc.id, ...directDoc.data() } });
    }

    const email = String(decodedToken.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(404).json({ error: "College profile not found" });
    }

    const byEmail = await db
      .collection("collegeUsers")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (byEmail.empty) {
      return res.status(404).json({ error: "College profile not found" });
    }

    const profileDoc = byEmail.docs[0];
    if (profileDoc.id !== decodedToken.uid) {
      await db.collection("collegeUsers").doc(decodedToken.uid).set(
        { uid: decodedToken.uid, ...profileDoc.data(), updatedAt: new Date().toISOString() },
        { merge: true }
      );
    }

    res.json({ profile: { uid: decodedToken.uid, ...profileDoc.data() } });
  } catch (error: any) {
    console.error("College profile lookup error:", error);
    res.status(error?.statusCode || 500).json({
      error: "Unable to load college profile",
      details: error?.message || "Unknown error",
    });
  }
});

app.get("/api/admin/payment-settings", requireAdmin, async (req, res) => {
  try {
    const settingsSnap = await admin.firestore().collection("privateSettings").doc("razorpay").get();
    const data = settingsSnap.exists ? settingsSnap.data() : {};
    const envKeyId = process.env.RAZORPAY_KEY_ID || "";

    res.json({
      hasDatabaseConfig: Boolean(data?.keyId && data?.keySecret),
      keyId: data?.keyId || envKeyId || "",
      keyIdMasked: maskKey(data?.keyId || envKeyId || ""),
      source: data?.keyId ? "database" : envKeyId ? "environment" : "missing",
      updatedAt: data?.updatedAt || null,
      updatedBy: data?.updatedBy || null,
    });
  } catch (error: any) {
    console.error("Payment settings load error:", error);
    res.status(500).json({ error: "Unable to load payment settings", details: error?.message || "Unknown error" });
  }
});

async function savePaymentSettings(req: Request, res: Response) {
  try {
    const decodedToken = await getDecodedToken(req);
    const { keyId, keySecret } = req.body || {};

    if (typeof keyId !== "string" || !keyId.startsWith("rzp_")) {
      return res.status(400).json({ error: "Enter a valid Razorpay key id" });
    }

    if (typeof keySecret !== "string" || keySecret.trim().length < 10) {
      return res.status(400).json({ error: "Enter a valid Razorpay key secret" });
    }

    const updatedAt = new Date().toISOString();
    await admin.firestore().collection("privateSettings").doc("razorpay").set({
      keyId: keyId.trim(),
      keySecret: keySecret.trim(),
      updatedAt,
      updatedBy: decodedToken.uid,
      updatedByEmail: decodedToken.email || "",
    }, { merge: true });

    res.json({ status: "success", keyIdMasked: maskKey(keyId.trim()), updatedAt, source: "database" });
  } catch (error: any) {
    console.error("Payment settings save error:", error);
    res.status(500).json({ error: "Unable to save payment settings", details: error?.message || "Unknown error" });
  }
}

app.patch("/api/admin/payment-settings", requireAdmin, savePaymentSettings);
app.post("/api/admin/payment-settings", requireAdmin, savePaymentSettings);

app.post("/api/payment/order", async (req, res) => {
  try {
    const decodedToken = await getDecodedToken(req);
    const { paymentForUserId } = req.body || {};
    const student = await getStudentForPayment(decodedToken, paymentForUserId);
    const amount = await getCollegeAmount(student.college);
    const { keyId, keySecret } = await getRazorpayConfig();
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `im_${student.uid.slice(0, 18)}_${Date.now()}`,
      notes: {
        userId: student.uid,
        college: student.college || "",
        createdByEmitraId: student.createdByEmitraId || "",
      },
    });

    await admin.firestore().collection("paymentOrders").doc(order.id).set({
      userId: student.uid,
      createdByEmitraId: student.createdByEmitraId || null,
      createdByEmitraName: student.createdByEmitraName || null,
      amount,
      amountPaise: order.amount,
      currency: order.currency,
      status: "created",
      razorpayOrderId: order.id,
      requestedBy: decodedToken.uid,
      createdAt: new Date().toISOString(),
    });

    res.json({
      id: order.id,
      amount: order.amount,
      amountRupees: amount,
      currency: order.currency,
      key: keyId,
    });
  } catch (error: any) {
    console.error("Razorpay Order Error:", error);
    res.status(error?.statusCode || 500).json({
      error: "Error creating Razorpay order", 
      details: error.description || error.message || "Unknown error" 
    });
  }
});

app.post("/api/payment/verify", async (req, res) => {
  try {
    const decodedToken = await getDecodedToken(req);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ status: "failure", message: "Missing required verification parameters" });
    }

    const { keyId, keySecret } = await getRazorpayConfig();
    const hmac = crypto.createHmac("sha256", keySecret);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({ status: "failure", message: "Invalid signature" });
    }

    const orderSnap = await admin.firestore().collection("paymentOrders").doc(razorpay_order_id).get();
    if (!orderSnap.exists) {
      return res.status(404).json({ status: "failure", message: "Payment order not found" });
    }

    const orderData = orderSnap.data() as any;
    const studentSnap = await admin.firestore().collection("users").doc(orderData.userId).get();
    const studentData = studentSnap.exists ? studentSnap.data() : null;
    const isOwnPayment = orderData.userId === decodedToken.uid;
    const isAllowedEmitraPayment =
      studentData?.createdByEmitraId === decodedToken.uid &&
      (await isEmitraUser(decodedToken.uid));

    if (!isOwnPayment && !isAllowedEmitraPayment) {
      return res.status(403).json({ status: "failure", message: "You are not allowed to verify this payment" });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    let payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (
      payment.order_id === razorpay_order_id &&
      Number(payment.amount) === Number(orderData.amountPaise) &&
      payment.status === "authorized"
    ) {
      payment = await razorpay.payments.capture(
        razorpay_payment_id,
        Number(orderData.amountPaise),
        orderData.currency || payment.currency || "INR"
      );
    }

    if (
      payment.order_id !== razorpay_order_id ||
      Number(payment.amount) !== Number(orderData.amountPaise) ||
      payment.status !== "captured"
    ) {
      return res.status(400).json({ status: "failure", message: "Payment details did not match the order" });
    }

    const verifiedAt = new Date().toISOString();
    const batch = admin.firestore().batch();
    const userRef = admin.firestore().collection("users").doc(orderData.userId);
    const paymentRef = admin.firestore().collection("payments").doc(razorpay_payment_id);
    const orderRef = admin.firestore().collection("paymentOrders").doc(razorpay_order_id);

    batch.update(userRef, {
      isPaid: true,
      hasPaid: true,
      paymentStatus: "success",
      paymentVerifiedAt: verifiedAt,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });
    batch.set(paymentRef, {
      userId: orderData.userId,
      createdByEmitraId: orderData.createdByEmitraId || null,
      createdByEmitraName: orderData.createdByEmitraName || null,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      amount: orderData.amount,
      amountPaise: orderData.amountPaise,
      currency: orderData.currency || "INR",
      status: "success",
      verifiedBy: decodedToken.uid,
      timestamp: verifiedAt,
    }, { merge: true });
    batch.update(orderRef, {
      status: "success",
      razorpayPaymentId: razorpay_payment_id,
      verifiedAt,
      verifiedBy: decodedToken.uid,
    });

    await batch.commit();

    if (studentData?.universityRoll) {
      try {
        const importedSnap = await admin.firestore()
          .collection("importedStudents")
          .where("universityRoll", "==", studentData.universityRoll)
          .limit(1)
          .get();
        if (!importedSnap.empty) {
          await importedSnap.docs[0].ref.update({
            paymentStatus: "success",
            paymentVerifiedAt: verifiedAt,
            razorpayPaymentId: razorpay_payment_id
          });
        }
      } catch (importUpdateErr) {
        console.error("Error updating imported student payment status:", importUpdateErr);
      }
    }

    res.json({ status: "success", userId: orderData.userId, paymentId: razorpay_payment_id, amount: orderData.amount });
  } catch (error: any) {
    console.error("Verification Error:", error);
    res.status(error?.statusCode || 500).json({
      status: "error",
      message: "Internal server error during verification",
      details: error?.message || "Unknown error",
    });
  }
});

async function sendServerPaymentSuccessEmail(userId: string, paymentId?: string) {
  const userRef = admin.firestore().collection("users").doc(userId);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    throw new Error(`Student ${userId} not found for success email`);
  }

  const student = userSnap.data() as any;
  if (!student?.email) {
    throw new Error(`Student ${userId} does not have an email address`);
  }

  if (student.paymentSuccessEmailSentAt) {
    return { skipped: true, reason: "already_sent" };
  }

  const studentName = student.fullName || "Student";
  const internshipDomain = student.internshipDomain || "Internship";

  const result: any = await sendEmail({
    to: student.email,
    subject: "Your InternMitra Internship Acceptance Letter",
    html: `
      <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6">
        <p>Dear ${studentName},</p>
        <p>Greetings from InternMitra!</p>
        <p>Congratulations! You have been successfully enrolled in the ${internshipDomain} Internship Program.</p>
        <p>This email serves as your official Internship Acceptance Letter and confirms your participation in the internship program.</p>
        <p>Further details, including internship access, training schedules, assignments, and guidelines, will be shared on your registered email address.</p>
        <p>We wish you a successful and rewarding internship journey.</p>
        <p>Best Regards,<br/>InternMitra Team</p>
      </div>
    `,
  });

  await userRef.set({
    paymentSuccessEmailSentAt: new Date().toISOString(),
    paymentSuccessEmailProvider: result?.provider || "smtp",
    paymentSuccessEmailId: result?.messageId || null,
    paymentSuccessEmailForPaymentId: paymentId || null,
  }, { merge: true });

  return { sent: true, to: student.email, id: result?.messageId || null };
}

async function markReconciledPaymentSuccess(orderData: any, payment: any, verifiedBy: string) {
  const verifiedAt = new Date().toISOString();
  const userRef = admin.firestore().collection("users").doc(orderData.userId);
  const paymentRef = admin.firestore().collection("payments").doc(payment.id);
  const orderRef = admin.firestore().collection("paymentOrders").doc(orderData.razorpayOrderId);

  const batch = admin.firestore().batch();
  batch.update(userRef, {
    isPaid: true,
    hasPaid: true,
    paymentStatus: "success",
    paymentVerifiedAt: verifiedAt,
    razorpayOrderId: orderData.razorpayOrderId,
    razorpayPaymentId: payment.id,
  });
  batch.set(paymentRef, {
    userId: orderData.userId,
    createdByEmitraId: orderData.createdByEmitraId || null,
    createdByEmitraName: orderData.createdByEmitraName || null,
    razorpayOrderId: orderData.razorpayOrderId,
    razorpayPaymentId: payment.id,
    amount: orderData.amount,
    amountPaise: orderData.amountPaise,
    currency: orderData.currency || payment.currency || "INR",
    status: "success",
    verifiedBy,
    timestamp: verifiedAt,
  }, { merge: true });
  batch.update(orderRef, {
    status: "success",
    razorpayPaymentId: payment.id,
    verifiedAt,
    verifiedBy,
  });

  await batch.commit();

  let emailResult: any = null;
  let emailErrorMessage: string | null = null;
  try {
    emailResult = await sendServerPaymentSuccessEmail(orderData.userId, payment.id);
  } catch (emailError: any) {
    emailErrorMessage = emailError?.message || "Unknown email error";
    console.error("Reconcile success email failed:", emailError);
    await userRef.set({
      paymentSuccessEmailFailedAt: new Date().toISOString(),
      paymentSuccessEmailError: emailErrorMessage,
      paymentSuccessEmailForPaymentId: payment.id,
    }, { merge: true });
  }

  return { emailResult, emailError: emailErrorMessage };
}

async function getSuccessfulPaymentForOrder(razorpay: Razorpay, orderData: any) {
  if (!orderData.razorpayOrderId) {
    throw new Error("Payment order is missing Razorpay order id");
  }

  const payments = await razorpay.orders.fetchPayments(orderData.razorpayOrderId);
  const items = payments?.items || [];

  const captured = items.find((payment: any) =>
    payment.status === "captured" &&
    Number(payment.amount) === Number(orderData.amountPaise)
  );

  if (captured) return captured;

  const authorized = items.find((payment: any) =>
    payment.status === "authorized" &&
    Number(payment.amount) === Number(orderData.amountPaise)
  );

  if (!authorized) return null;

  return razorpay.payments.capture(
    authorized.id,
    Number(orderData.amountPaise),
    orderData.currency || authorized.currency || "INR"
  );
}

app.post("/api/payment/reconcile", requireDashboardOperator, async (req, res) => {
  try {
    const decodedToken = await getDecodedToken(req);
    const { keyId, keySecret } = await getRazorpayConfig();
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const snapshot = await admin
      .firestore()
      .collection("paymentOrders")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    let checked = 0;
    let updated = 0;
    let emailsSent = 0;
    let emailsSkipped = 0;
    let emailsFailed = 0;
    const failures: { orderId: string; message: string }[] = [];

    for (const orderDoc of snapshot.docs) {
      checked += 1;
      const orderData = orderDoc.data();
      const orderStatus = String(orderData.status || "created");

      if (orderStatus === "success") {
        continue;
      }

      try {
        const payment = await getSuccessfulPaymentForOrder(razorpay, orderData);

        if (payment) {
          const result = await markReconciledPaymentSuccess(orderData, payment, decodedToken.uid);
          updated += 1;
          if (result?.emailResult?.sent) emailsSent += 1;
          if (result?.emailResult?.skipped) emailsSkipped += 1;
          if (result?.emailError) emailsFailed += 1;
        }
      } catch (error: any) {
        failures.push({
          orderId: orderData.razorpayOrderId || orderDoc.id,
          message: error?.message || "Unknown reconciliation error",
        });
      }
    }

    res.json({ status: "success", checked, updated, emailsSent, emailsSkipped, emailsFailed, failures });
  } catch (error: any) {
    console.error("Payment reconcile error:", error);
    res.status(error?.statusCode || 500).json({
      status: "error",
      message: error?.message || error?.description || "Unable to reconcile payments",
      details:
        error?.error?.description ||
        error?.error?.reason ||
        error?.description ||
        error?.message ||
        "Unknown reconcile error",
      code: error?.error?.code || error?.code || null,
    });
  }
});

app.post("/api/offer-letter-email", async (req, res) => {
  try {
    const { to, studentName, internshipDomain, fileName, pdfBase64 } = req.body || {};

    if (!to || !pdfBase64) {
      return res.status(400).json({ error: "Student email and PDF attachment are required" });
    }

    console.log(`[Email Request] Queueing offer letter via Gmail SMTP to: ${to}, Name: ${studentName}`);

    sendEmail({
      to,
      subject: "Your InternMitra Internship Acceptance Letter",
      html: `
        <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6">
          <p>Dear ${studentName || "Student"},</p>
          <p>Greetings from InternMitra!</p>
          <p>Congratulations! You have been successfully enrolled in the ${internshipDomain || "Internship"} Internship Program.</p>
          <p>This email serves as your official Internship Acceptance Letter and confirms your participation in the internship program.</p>
          <p>Further details, including internship access, training schedules, assignments, and guidelines, will be shared on your registered email address.</p>
          <p>We wish you a successful and rewarding internship journey.</p>
          <p>Best Regards,<br/>InternMitra Team</p>
        </div>
      `,
      attachments: [
        {
          filename: fileName || "InternMitra_Offer_Letter.pdf",
          content: pdfBase64,
        },
      ],
    })
      .then((result) => {
        console.log(`[Email Request] SMTP send success:`, result.messageId);
      })
      .catch((error) => {
        console.error(`[Email Request] SMTP send failed:`, error);
      });

    res.json({ status: "processing" });
  } catch (error: any) {
    console.error("Offer letter email error:", error);
    res.status(500).json({
      error: "Unable to send offer letter email",
      details: error?.message || "Unknown error",
    });
  }
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { port: HMR_PORT },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
