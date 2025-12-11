export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-white to-green-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center space-y-8 border border-gray-100">
        <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center shadow-inner">
          <svg className="w-14 h-14 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-4xl font-extrabold text-gray-900">Success!</h1>

        <p className="text-gray-600 text-lg">
          Your phone number was verified successfully.
        </p>

        <div className="bg-green-50 border border-green-200 p-6 rounded-xl shadow-sm">
          <p className="text-green-700 font-medium">
            Welcome! You’re all set 🎉
          </p>
        </div>

        <a
          href="https://daraportfolio.vercel.app/"
          className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition shadow-md"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
