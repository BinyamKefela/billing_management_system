"use client";

import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LucideLoaderCircle, Eye, EyeOff, LogIn, Shield, Mail, Lock } from "lucide-react";
import z from "zod";
import { getAuthToken, loginUser } from "@/app/auth/login/api";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import Link from "next/link";

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required")
});

type FormFields = z.infer<typeof schema>;

export default function UserForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormFields>({
    resolver: zodResolver(schema)
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (getAuthToken()) {
      router.push('/dashboard');
    }
  }, []);

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    try {
      if (getAuthToken()) {
        console.log("already logged in");
        router.push('/dashboard');
        return;
      }
      
      const response = await loginUser(data.email, data.password);
      
      console.log(response.access + "---------token");
      
      if (response.access) {
        toast.success("Login successful!");
        router.push('/dashboard');
      }
    } catch (err) {
      toast.error("Login failed. Please check your credentials.");
      console.log(err);
    }
  };

  return (
    <div className="min-h-screen scale-90 transform bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white text-center">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Kacha Billing Management System</h1>
            <p className="text-blue-100 opacity-90">Secure Access to Your Account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800 text-center mb-2">Welcome Back</h2>
              <p className="text-gray-600 text-center text-sm mb-6">
                Sign in to manage your account
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Mail className="w-4 h-4" />
                Email Address
              </label>
              <div className="relative">
                <input
                  {...register("email")}
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Lock className="w-4 h-4" />
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pl-11 pr-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                Remember me
              </label>
              <a href="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <LucideLoaderCircle className="w-5 h-5 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>

            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-4 text-gray-500 text-sm">or</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <div className="text-center space-y-3">
              <p className="text-gray-600 text-sm">
                Don't have an account?{" "}
                <div  className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                  <Link href="/">
                    Sign up here
                  </Link>
                </div>
              </p>
              <div className="flex justify-center gap-4 text-sm">
                <div className="text-green-600 hover:text-green-700 font-medium transition-colors">
                  <Link href="/biller_sign_up">
                    Register as Biller
                  </Link>
                </div>
                <span className="text-gray-300">•</span>
                <div  className="text-purple-600 hover:text-purple-700 font-medium transition-colors">
                 <Link href="/">
                  Register as Customer
                 </Link>
                </div>
              </div>
            </div>
          </form>

          
        </div>

        
      </div>
    </div>
  );
}