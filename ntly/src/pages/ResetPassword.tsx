import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { motion } from 'motion/react';
import { Lock, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [codeValid, setCodeValid] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const actionCode = searchParams.get('oobCode');
    if (!actionCode) {
      setError('Invalid reset link. Please request a new password reset.');
      setVerifying(false);
      return;
    }

    verifyPasswordResetCode(auth, actionCode)
      .then(() => {
        setCodeValid(true);
        setVerifying(false);
      })
      .catch((err) => {
        setError('Invalid or expired reset link. Please request a new password reset.');
        setVerifying(false);
      });
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const actionCode = searchParams.get('oobCode');
      await confirmPasswordReset(auth, actionCode!, password);
      setSuccess(true);
    } catch (err: any) {
      setError('Failed to reset password. The link may have expired. Please request a new reset.');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-blue-50/40 via-white to-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-md w-full"
        >
          <div className="bg-white rounded-[2.25rem] shadow-soft p-10 lg:p-12 border border-slate-150/60 flex flex-col items-center relative overflow-hidden">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mb-8 shadow-sm relative z-10 animate-pulse">
              <Lock size={28} />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-2 uppercase relative z-10">Verifying Link</h2>
            <p className="text-slate-400 font-semibold text-xs text-center relative z-10">
              Please wait while we verify your password reset link.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error && !codeValid) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-blue-50/40 via-white to-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="bg-white rounded-[2.25rem] shadow-soft p-10 lg:p-12 border border-slate-150/60 flex flex-col items-center relative overflow-hidden">
            <div className="w-16 h-16 bg-red-50 text-red-600 border border-red-100/55 rounded-2xl flex items-center justify-center mb-8 shadow-md relative z-10">
              <AlertCircle size={28} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-4 uppercase relative z-10">Invalid Link</h2>
            <p className="text-slate-400 font-semibold mb-8 text-xs text-center relative z-10 leading-relaxed">
              {error}
            </p>
            
            <div className="w-full space-y-3 relative z-10">
              <Button 
                onClick={() => navigate('/forgot-password')}
                className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-xl shadow-md uppercase tracking-widest cursor-pointer"
              >
                Request New Link
              </Button>
              <Button 
                onClick={() => navigate('/login')}
                variant="outline"
                className="w-full h-12 border border-slate-200 hover:border-slate-350 text-slate-600 text-xs font-black rounded-xl uppercase tracking-widest cursor-pointer"
              >
                Back to Login
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-blue-50/40 via-white to-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="bg-white rounded-[2.25rem] shadow-soft p-10 lg:p-12 border border-slate-150/60 flex flex-col items-center relative overflow-hidden">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-8 shadow-md relative z-10">
              <CheckCircle2 size={28} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-4 uppercase relative z-10">Password Updated!</h2>
            <p className="text-slate-400 font-semibold mb-8 text-xs text-center relative z-10 leading-relaxed">
              Your password has been successfully reset. You can now login with your new credentials.
            </p>
            
            <div className="w-full relative z-10">
              <Button 
                onClick={() => navigate('/login')}
                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl shadow-md uppercase tracking-widest cursor-pointer"
              >
                Go to Login
              </Button>
            </div>

            <div className="absolute top-0 right-0 w-32 h-32 bg-green-600/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl pointer-events-none" />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-blue-50/40 via-white to-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-[2.25rem] shadow-soft hover:shadow-elegant transition-all duration-300 p-10 sm:p-12 border border-slate-150/60 flex flex-col items-center relative overflow-hidden">
          <div className="w-16 h-16 bg-blue-50 border border-blue-100/50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm hover:rotate-6 transition-transform">
            <Lock size={28} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1 uppercase relative z-10">New Password</h2>
          <p className="text-slate-400 font-semibold mb-8 text-xs relative z-10 text-center">Enter your new password below</p>

          <form onSubmit={handleResetPassword} className="w-full space-y-5 relative z-10">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-tight">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="uppercase tracking-[0.2em] text-[9px] font-black text-slate-400 px-1">New Password</Label>
              <div className="relative">
                <Input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 pl-11 transition-all font-semibold text-sm text-slate-800 shadow-inner"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="uppercase tracking-[0.2em] text-[9px] font-black text-slate-400 px-1">Confirm Password</Label>
              <div className="relative">
                <Input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  className="h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 pl-11 transition-all font-semibold text-sm text-slate-800 shadow-inner"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12 bg-blue-600 hover:bg-blue-500 hover:scale-[1.01] text-white text-xs font-black rounded-xl shadow-md shadow-blue-500/10 uppercase tracking-widest transition-all duration-300 cursor-pointer">
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>

          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl pointer-events-none" />
        </div>
      </motion.div>
    </div>
  );
}
