export interface UserProfile {
  uid: string;
  fullName: string;
  gender: string;
  parentName: string;
  contactNumber: string;
  email: string;
  district: string;
  college: string;
  degree: "UG" | "PG";
  department: string;
  subject: string;
  session: string;
  semester: string;
  universityRoll: string;
  universityRollNo?: string;
  internshipDomain: string;
  internshipMode?: string;
  loginLogs?: {
    id: string;
    userId: string;
    studentName?: string;
    email?: string;
    internshipDomain?: string;
    loginAtIso?: string;
    status?: string;
    userAgent?: string;
    platform?: string;
  }[];
  lastLoginAt?: string;
  createdByEmitraId?: string | null;
  createdByEmitraName?: string | null;
  createdBySubUserId?: string | null;
  createdBySubUserName?: string | null;
  autoVerifiedBySubUser?: boolean;
  isPaid: boolean;
  hasPaid?: boolean;
  paymentStatus?: string;
  paymentVerifiedAt?: string;
  registrationDate: string;
  learningHours: number;
  progress: number;
}

export interface PaymentRecord {
  userId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  amount: number;
  status: string;
  timestamp: string;
}

export interface AssignmentSubmission {
  id?: string;
  userId: string;
  domain: string;
  title: string;
  submissionUrl: string;
  status: "Submitted" | "Graded";
  score?: number;
  feedback?: string;
  submittedAt: string;
}
