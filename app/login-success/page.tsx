import Link from "next/link";

export default function LoginSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-950">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {/* Success icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <svg
            className="h-8 w-8 text-green-600 dark:text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m5 12 4 4L19 6"
            />
          </svg>
        </div>

        <p className="mb-2 text-sm font-medium uppercase tracking-widest text-green-600 dark:text-green-400">
          Authentication complete
        </p>

        <h1 className="mb-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Login Successful
        </h1>

        <p className="mb-8 text-sm leading-6 text-gray-500 dark:text-gray-400">
          You have successfully signed in using Single Sign-On. Your identity
          has been verified.
        </p>

        {/* Demo user details */}
        <div className="mb-8 rounded-xl bg-gray-50 p-4 text-left dark:bg-gray-800">
          <div className="mb-3 flex items-center justify-between gap-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Authentication
            </span>
            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300">
              Verified
            </span>
          </div>

          <div className="mb-3 flex items-center justify-between gap-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Login method
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              SSO
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Session
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Active
            </span>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex w-full items-center justify-center rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          Continue to Dashboard
          <span className="ml-2" aria-hidden="true">
            &rarr;
          </span>
        </Link>

        <p className="mt-6 text-xs text-gray-400">
          This is a demonstration page. Authentication status must be verified
          by your server.
        </p>
      </div>
    </main>
  );
}
