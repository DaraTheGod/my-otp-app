'use client';

import { useState } from 'react';

export default function Home() {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState<'input' | 'waiting'>('input');
  const [loading, setLoading] = useState(false);
  const [deepLink, setDeepLink] = useState<string | null>(null); // store the link

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
        setMessage(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      setMessage('Telegram should open automatically with your code!');
      setDeepLink(data.deepLink); // save the link
      setStep('waiting');
      setLoading(false);

      // Open Telegram (works on mobile & desktop)
      if (data.deepLink) {
        // This opens the app on phones and Telegram Desktop/web on computers
        window.open(data.deepLink, '_blank', 'noopener,noreferrer');
      }
    } catch {
      setMessage('Network error. Please check your connection.');
      setLoading(false);
    }
  };

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
                {loading ? 'Sending...' : 'Send OTP via Telegram'}
              </button>
            </div>

            {message && <p className="text-center text-red-500 mt-3">{message}</p>}
          </>
        ) : (
          <div className="text-center space-y-6">
            <div className="bg-green-50 border border-green-200 p-6 rounded-xl shadow-sm">
              <p className="text-green-700 font-medium text-lg">{message}</p>
            </div>

            {deepLink && (
              <div className="text-sm text-gray-600">
                If Telegram didn’t open automatically,{' '}
                <a
                  href={deepLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 font-medium underline hover:text-indigo-800"
                >
                  tap here
                </a>
              </div>
            )}

            <p className="text-gray-600">Enter the 6-digit code you received in Telegram</p>

            <a
              href="/verify"
              className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition shadow-md"
            >
              Go to Verification
            </a>
          </div>
        )}
      </div>
    </div>
  );
}