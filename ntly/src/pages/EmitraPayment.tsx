import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { CheckCircle2, CreditCard, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../components/AuthContext';
import { db } from '../lib/firebase';
import { Button } from '../components/ui/button';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface StudentProfile {
  uid: string;
  fullName: string;
  email: string;
  contactNumber: string;
  college: string;
  createdByEmitraId?: string | null;
  createdByEmitraName?: string | null;
}

interface College {
  id: string;
  name: string;
  price: number;
}

export default function EmitraPayment() {
  const { studentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [amount, setAmount] = useState(1000);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadStudent();
  }, [studentId, user]);

  const loadStudent = async () => {
    if (!studentId || !user) return;

    setLoading(true);
    try {
      const studentSnap = await getDoc(doc(db, 'users', studentId));
      if (!studentSnap.exists()) {
        alert('Student record not found.');
        navigate('/emitra-dashboard');
        return;
      }

      const studentData = { uid: studentSnap.id, ...studentSnap.data() } as StudentProfile;
      if (studentData.createdByEmitraId !== user.uid) {
        alert('This student is not linked with your Cyber cafe.');
        navigate('/emitra-dashboard');
        return;
      }

      setStudent(studentData);

      const collegesSnapshot = await getDocs(query(
        collection(db, 'colleges'),
        where('name', '==', studentData.college),
        limit(1)
      ));
      const studentCollege = collegesSnapshot.docs[0]?.data() as College | undefined;
      setAmount(studentCollege?.price || 1000);
    } catch (error) {
      console.error('Error loading Emitra payment:', error);
      alert('Unable to load student payment.');
      navigate('/emitra-dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!student || !user) return;

    if (typeof window.Razorpay === 'undefined') {
      alert('Payment gateway is still initializing. Please wait a moment and try again.');
      return;
    }

    setPaying(true);
    try {
      const token = await user.getIdToken();
      const orderResponse = await fetch('/api/payment/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentForUserId: student.uid }),
      });

      const order = await orderResponse.json();
      if (!orderResponse.ok) {
        throw new Error(order?.details || order?.error || 'Could not create payment order');
      }

      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency || 'INR',
        order_id: order.id,
        name: 'INTERNMITRA',
        description: `Cyber cafe student payment - ${student.fullName}`,
        handler: async function (response: any) {
          try {
            if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
              throw new Error('Missing Razorpay verification details');
            }

            const verifyToken = await user.getIdToken();
            const verifyResponse = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${verifyToken}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyResult = await verifyResponse.json();
            if (!verifyResponse.ok || verifyResult.status !== 'success') {
              throw new Error(verifyResult?.message || verifyResult?.details || 'Payment verification failed');
            }

            // Send email in background without blocking the UI
            setSuccess(true);
          } catch (error) {
            console.error('Cyber cafe payment save error:', error);
            alert('Payment received but server verification failed. Please contact admin with payment ID: ' + response.razorpay_payment_id);
            setPaying(false);
          }
        },
        prefill: {
          name: student.fullName,
          email: student.email,
          contact: student.contactNumber
        },
        theme: { color: '#2563eb' },
        modal: {
          ondismiss: function () {
            setPaying(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        alert(`Payment failed: ${response.error.description}`);
        setPaying(false);
      });
      rzp.open();
    } catch (error) {
      console.error('Payment Error:', error);
      alert('Could not initialize payment.');
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500 font-black">Loading payment...</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-slate-950 p-10 rounded-[2rem] shadow-2xl text-center border border-slate-800">
          <div className="w-20 h-20 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-blue-500/10">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="mt-6 text-2xl font-black text-white uppercase">Payment Complete</h2>
          <p className="mt-3 text-sm font-semibold text-slate-400">Student payment has been saved under your Cyber cafe.</p>
          <Button onClick={() => navigate('/emitra-dashboard')} className="mt-8 w-full h-12 bg-white hover:bg-blue-600 hover:text-white text-slate-900 text-xs uppercase tracking-widest font-black rounded-xl">
            Back To Cyber cafe Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="max-w-md w-full bg-white p-8 sm:p-12 rounded-[2rem] shadow-soft border border-slate-150/60">
        <div className="space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <CreditCard size={24} />
            </div>
            <div>
              <span className="text-[9px] text-blue-600 font-black uppercase tracking-[0.25em] block">Cyber cafe Payment</span>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight uppercase leading-none mt-1">Student Fee</h2>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Student</p>
              <p className="mt-1 font-black text-slate-900">{student?.fullName}</p>
              <p className="text-xs font-semibold text-slate-500">{student?.email}</p>
            </div>
            <div className="flex justify-between items-center text-slate-900 font-extrabold">
              <span className="text-slate-800 font-black text-sm uppercase">Registration Fee</span>
              <span className="text-lg text-slate-900 font-black">₹{amount}</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 bg-blue-50 text-blue-600 rounded-full p-1 border border-blue-100"><ShieldCheck size={14} /></div>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              Payment will mark this student paid and return to your Cyber cafe dashboard.
            </p>
          </div>

          <Button onClick={handlePayment} disabled={paying} className="w-full h-12 bg-blue-600 hover:bg-slate-900 text-white text-xs uppercase tracking-widest font-black rounded-xl">
            {paying ? 'Initializing...' : `Pay Fee (₹${amount})`}
          </Button>
          <Button onClick={() => navigate('/emitra-dashboard')} variant="outline" className="w-full h-12 rounded-xl text-xs uppercase tracking-widest font-black">
            Skip And Go Dashboard
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
