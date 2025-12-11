'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState<'input' | 'waiting'>('input');
  const [loading, setLoading] = useState(false);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async () => {
    setMessage('');
    setDeepLink(null);
    setLoading(true);

    try {
      const res = await fetch('/api/start-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone.trim() }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setMessage(data.error || 'Something went wrong.');
        setLoading(false);
        return;
      }

      setMessage('Telegram should open automatically — please share your phone number.');
      setDeepLink(data.deepLink);
      setStep('waiting');
      setLoading(false);

      if (data.deepLink) {
        window.open(data.deepLink, '_blank', 'noopener,noreferrer');
      }
    } catch {
      setMessage('Network error. Please check your connection.');
      setLoading(false);
    }
  };

  // Poll to check if verified
  useEffect(() => {
    if (step === 'waiting') {
      // Start polling after a small delay (give bot time to set status)
      const timer = setTimeout(() => {
        const interval = setInterval(async () => {
          // Clean phone exactly the same way as backend
          let cleaned = phone.trim().replace(/[\s\-\(\)\+]/g, '');

          if (cleaned.startsWith('0') && cleaned.length === 10) {
            cleaned = '+855' + cleaned.slice(1);
          } else if (cleaned.startsWith('855') && cleaned.length === 12) {
            cleaned = '+' + cleaned;
          }

          const res = await fetch('/api/check-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone_number: cleaned }),
          });

          const data = await res.json();

          if (data.status === 'success') {
            clearInterval(interval);
            router.push('/home');
          } else if (data.status === 'failed') {
            clearInterval(interval);
            setMessage('Verification failed. Please try again.');
            setStep('input');
          }
        }, 3000); // check every 3 seconds
      }, 4000); // wait 4 seconds before starting

      return () => clearTimeout(timer);
    }
  }, [step, phone, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-purple-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-10 space-y-8 border border-gray-100">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Welcome 👋
          </h1>
          <p className="text-gray-500">Sign up with your phone number</p>
        </div>

        {step === 'input' ? (
          <>
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="012 345 6789"
                  className="w-full px-4 py-3 text-gray-800 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-lg"
                  autoFocus
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition shadow-md disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Verify with Telegram'}
              </button>
            </div>

            {message && <p className="text-center text-red-500 mt-3">{message}</p>}
          </>
        ) : (
          <div className="text-center space-y-6">
            <div className="bg-green-50 border border-green-200 p-6 rounded-xl shadow-sm">
              <p className="text-green-700 font-medium text-lg">{message}</p>
              <p className="text-gray-600 mt-3">
                Waiting for verification... (you will be redirected automatically)
              </p>
            </div>

            {deepLink && (
              <div className="text-sm text-gray-600">
                If Telegram didn’t open,{' '}
                <a href={deepLink} target="_blank" className="text-indigo-600 underline">
                  tap here
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}