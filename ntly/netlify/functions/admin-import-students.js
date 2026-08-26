const { getAdminApp, json, requireAdmin } = require('./utils/firebase-admin');

async function getCollegeAmount(db, collegeName) {
  if (!collegeName) return 1000;
  try {
    const snap = await db.collection("colleges").where("name", "==", collegeName).limit(1).get();
    if (snap.empty) return 1000;
    const price = snap.docs[0].data().price;
    return Number.isFinite(Number(price)) && Number(price) > 0 ? Number(price) : 1000;
  } catch (err) {
    console.error("Error getting college amount:", err);
    return 1000;
  }
}

function normalizeStudent(student) {
  return {
    fullName: String(student.fullName || "").trim(),
    parentName: String(student.parentName || "").trim(),
    contactNumber: String(student.contactNumber || "").replace(/\D/g, "").slice(-10),
    email: String(student.email || "").trim().toLowerCase(),
    gender: String(student.gender || "").trim(),
    college: String(student.college || "").trim(),
    university: String(student.university || "").trim(),
    course: String(student.course || "").trim(),
    semester: String(student.semester || "").trim(),
    universityRoll: String(student.universityRoll || "").trim(),
    universityRollNo: String(student.universityRollNo || "").trim(),
    industrialRegNo: String(student.industrialRegNo || "").trim(),
    academicDetails: String(student.academicDetails || "").trim(),
  };
}

async function findExistingStudent(db, importedRef, student) {
  if (!student.universityRoll) return "Missing Roll Number";

  const checks = await Promise.all([
    db.collection("users").where("universityRoll", "==", student.universityRoll).limit(1).get(),
    student.email ? db.collection("users").where("email", "==", student.email).limit(1).get() : Promise.resolve(null),
    student.contactNumber ? db.collection("users").where("contactNumber", "==", student.contactNumber).limit(1).get() : Promise.resolve(null),
    importedRef.where("universityRoll", "==", student.universityRoll).limit(1).get(),
    student.email ? importedRef.where("email", "==", student.email).limit(1).get() : Promise.resolve(null),
    student.contactNumber ? importedRef.where("contactNumber", "==", student.contactNumber).limit(1).get() : Promise.resolve(null),
  ]);

  if (!checks[0].empty) return "Student already registered with this roll number";
  if (checks[1] && !checks[1].empty) return "Student already registered with this email";
  if (checks[2] && !checks[2].empty) return "Student already registered with this mobile number";
  if (!checks[3].empty) return "Student already exists in imported list";
  if (checks[4] && !checks[4].empty) return "Student already exists in imported list with this email";
  if (checks[5] && !checks[5].empty) return "Student already exists in imported list with this mobile number";
  return "";
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' });
  }

  try {
    const authResult = await requireAdmin(event);
    if (!authResult.allowed) {
      return authResult.response;
    }

    const parsedBody = JSON.parse(event.body || '{}');
    const { students } = parsedBody;

    if (!Array.isArray(students) || students.length === 0) {
      return json(400, { error: "Invalid payload: students list is empty or not an array" });
    }

    const firebaseAdmin = getAdminApp();
    const db = firebaseAdmin.firestore();
    const importedRef = db.collection("importedStudents");
    
    let importedCount = 0;
    const importedStudents = [];
    const skippedStudents = [];
    const seenRolls = new Set();
    const seenEmails = new Set();
    const seenPhones = new Set();
    const CHUNK_SIZE = 400;

    for (let i = 0; i < students.length; i += CHUNK_SIZE) {
      const chunk = students.slice(i, i + CHUNK_SIZE);
      const batch = db.batch();

      for (const rawStudent of chunk) {
        const student = normalizeStudent(rawStudent);

        if (student.universityRoll && seenRolls.has(student.universityRoll)) {
          skippedStudents.push({ ...student, reason: "Duplicate roll number in uploaded file" });
          continue;
        }
        if (student.email && seenEmails.has(student.email)) {
          skippedStudents.push({ ...student, reason: "Duplicate email in uploaded file" });
          continue;
        }
        if (student.contactNumber && seenPhones.has(student.contactNumber)) {
          skippedStudents.push({ ...student, reason: "Duplicate mobile number in uploaded file" });
          continue;
        }
        if (student.universityRoll) seenRolls.add(student.universityRoll);
        if (student.email) seenEmails.add(student.email);
        if (student.contactNumber) seenPhones.add(student.contactNumber);

        const existingReason = await findExistingStudent(db, importedRef, student);
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

    // Serverless friendly WhatsApp message logging inside request cycle
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

      const collegeAmount = await getCollegeAmount(db, student.college);
      const securePaymentLink = `${appUrl}/register?roll=${encodeURIComponent(student.universityRoll)}&ind=${encodeURIComponent(student.industrialRegNo)}`;
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
          // Dynamic import of node-fetch or using standard global fetch if supported
          // Node 18+ has global fetch
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

    return json(200, {
      status: "success",
      importedCount,
      skippedCount: skippedStudents.length,
      importedStudents,
      skippedStudents,
    });
  } catch (error) {
    console.error("Excel Import Serverless Error:", error);
    return json(500, {
      error: "Error occurred during Excel student import",
      details: error?.message || "Unknown error"
    });
  }
};
