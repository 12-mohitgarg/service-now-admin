import React, { useEffect, useState } from 'react';
import { auth } from '../../lib/firebase';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { CreditCard, KeyRound, Save, ShieldCheck } from 'lucide-react';

interface PaymentSettingsState {
  hasDatabaseConfig: boolean;
  hasWebhookSecret: boolean;
  keyId: string;
  keyIdMasked: string;
  webhookSecretMasked: string;
  source: 'database' | 'environment' | 'missing';
  updatedAt: string | null;
  updatedBy: string | null;
}

export default function PaymentSettings() {
  const [settings, setSettings] = useState<PaymentSettingsState | null>(null);
  const [keyId, setKeyId] = useState('');
  const [keySecret, setKeySecret] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const getAuthHeader = async () => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error('Admin session expired. Please login again.');
    return { Authorization: `Bearer ${token}` };
  };

  const readJsonResponse = async (response: Response) => {
    const text = await response.text();

    try {
      return text ? JSON.parse(text) : {};
    } catch {
      throw new Error('INVALID_JSON_RESPONSE');
    }
  };

  const requestPaymentSettings = async (init: RequestInit) => {
    const endpoints = [
      '/api/admin/payment-settings',
      '/.netlify/functions/admin-payment-settings',
    ];
    let lastError: unknown = null;

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, init);
        const data = await readJsonResponse(response);
        return { response, data };
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError instanceof Error && lastError.message === 'INVALID_JSON_RESPONSE') {
      throw new Error('Payment settings API returned an invalid response. Redeploy the latest Netlify functions.');
    }

    throw lastError instanceof Error ? lastError : new Error('Unable to reach payment settings API');
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeader();
      const { response, data } = await requestPaymentSettings({ headers });

      if (!response.ok) {
        throw new Error(data?.details || data?.error || 'Unable to load payment settings');
      }

      setSettings(data);
      setKeyId(data.keyId || '');
    } catch (error) {
      console.error('Payment settings load error:', error);
      setMessage(error instanceof Error ? error.message : 'Unable to load payment settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const authHeader = await getAuthHeader();
      const { response, data } = await requestPaymentSettings({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({ keyId, keySecret, webhookSecret }),
      });

      if (!response.ok) {
        throw new Error(data?.details || data?.error || 'Unable to save payment settings');
      }

      setKeySecret('');
      setWebhookSecret('');
      setMessage('Razorpay keys updated successfully.');
      await fetchSettings();
    } catch (error) {
      console.error('Payment settings save error:', error);
      setMessage(error instanceof Error ? error.message : 'Unable to save payment settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="student-card p-6 bg-white/80">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-blue-600">
              <CreditCard size={14} />
              Payment Gateway
            </div>
            <h1 className="mt-2 text-2xl font-black text-slate-950 tracking-tight">Razorpay Settings</h1>
            <p className="mt-2 text-sm font-semibold text-slate-500 max-w-2xl">
              Add or update the active Razorpay key pair used by checkout, server verification, and webhook reconciliation.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-700 flex items-center gap-2">
            <ShieldCheck size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Server Verified</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="student-card p-6 bg-white/80 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
            <Label className="student-label block mb-2">Razorpay Key ID</Label>
            <Input
              value={keyId}
              onChange={(event) => setKeyId(event.target.value)}
              placeholder="rzp_live_xxxxx"
              className="student-input border-slate-200/80 rounded-xl"
            />
          </div>
          <div>
            <Label className="student-label block mb-2">Razorpay Key Secret</Label>
            <Input
              type="password"
              value={keySecret}
              onChange={(event) => setKeySecret(event.target.value)}
              placeholder="Enter new secret to update"
              className="student-input border-slate-200/80 rounded-xl"
            />
          </div>
          <div className="lg:col-span-2">
            <Label className="student-label block mb-2">Razorpay Webhook Secret</Label>
            <Input
              type="password"
              value={webhookSecret}
              onChange={(event) => setWebhookSecret(event.target.value)}
              placeholder="Enter webhook secret from Razorpay"
              className="student-input border-slate-200/80 rounded-xl"
            />
            <p className="mt-2 text-xs font-semibold text-slate-500">
              Use this endpoint in Razorpay webhooks: <span className="font-black text-slate-800">https://internmitra.org/api/payment/webhook</span>
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Current Key</p>
            <p className="mt-1 text-sm font-black text-slate-900">{settings?.keyIdMasked || 'Not configured'}</p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Webhook Secret</p>
            <p className="mt-1 text-sm font-black text-slate-900">{settings?.webhookSecretMasked || 'Not configured'}</p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Source</p>
            <p className="mt-1 text-sm font-black text-slate-900 capitalize">{settings?.source || 'missing'}</p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Updated</p>
            <p className="mt-1 text-sm font-black text-slate-900">
              {settings?.updatedAt ? new Date(settings.updatedAt).toLocaleString() : 'Not saved in DB'}
            </p>
          </div>
        </div>

        {message && (
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm font-bold text-blue-700">
            {message}
          </div>
        )}

        <Button type="submit" disabled={saving || !keyId.trim() || !keySecret.trim()} className="h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs uppercase tracking-widest font-black">
          {saving ? <KeyRound size={16} className="animate-pulse" /> : <Save size={16} />}
          {saving ? 'Saving Keys...' : 'Save Razorpay Keys'}
        </Button>
      </form>
    </div>
  );
}
