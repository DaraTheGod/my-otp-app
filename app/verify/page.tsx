'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Verify() {
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleVerify = async () => {
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage(`Success! Your phone ${data.phone} is verified.`);
        setTimeout(() => router.push('/home'), 1500); // small delay to show success
      } else {
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setMessage('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-800">Enter OTP</h1>

        <input
          type="text"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // only numbers
          placeholder="••••••"
          className="w-full px-4 py-3 border text-gray-800 border-gray-300 rounded-xl text-center text-3xl tracking-widest focus:ring-2 focus:ring-indigo-500 transition"
        />

        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 font-semibold rounded-xl shadow-md disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>

        {message && (
          <p
            className={`text-center text-lg ${
              message.includes('Success') ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
}