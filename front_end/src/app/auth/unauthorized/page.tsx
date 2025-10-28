// app/access-denied/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { Lock, ArrowRight, Home } from "lucide-react";

export default function AccessDeniedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8">
          <Lock className="w-16 h-16 text-gray-400" />
        </div>

        {/* Text Content */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          403
        </h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Access Forbidden
        </h2>
        <p className="text-gray-600 mb-8 text-lg">
          You don't have permission to access this resource.
        </p>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full py-4 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors duration-200 flex items-center justify-center gap-3"
          >
            <Home className="w-5 h-5" />
            Go to Dashboard
            <ArrowRight className="w-5 h-5" />
          </button>
          
          
        </div>

        
      </div>
    </div>
  );
}