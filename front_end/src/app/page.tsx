"use client";

import { useState, useEffect, use } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, UserPlus, Building, Check, User, Phone, Mail, MapPin } from "lucide-react";
import { toast } from "react-toastify";
import Link from "next/link";
import { getAuthToken } from "./auth/login/api";
import { useRouter } from "next/navigation";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  first_name: z.string().min(1, "First name is required"),
  middle_name: z.string().optional(),
  last_name: z.string().min(1, "Last name is required"),
  phone_number: z.string().optional(),
  biller_ids: z.array(z.coerce.number()).min(1, "Please select at least one biller"),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

type Biller = {
  id: number;
  name: string;
  company_name?: string;
  address?: string;
  phone_number?: string;
  email?: string;
};

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [billers, setBillers] = useState<Biller[]>([]);
  const [selectedBillers, setSelectedBillers] = useState<number[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      biller_ids: [],
    },
  });

  const formBillers = watch("biller_ids");
  

  useEffect(() => {
     if(getAuthToken()){
          router.push('/dashboard');
        }
    fetchBillers();
  }, []);

  useEffect(() => {
    setSelectedBillers(formBillers || []);
  }, [formBillers]);

  const fetchBillers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/get_billers`);
      const data = await res.json();
      if (res.status === 200) {
        setBillers(data.data || data.results || []);
      }
    } catch (error) {
      console.error("Failed to fetch billers");
    }
  };

  const handleBillerSelection = (billerId: number) => {
    const currentBillers = formBillers || [];
    let newBillers: number[];

    if (currentBillers.includes(billerId)) {
      newBillers = currentBillers.filter((id) => id !== billerId);
    } else {
      newBillers = [...currentBillers, billerId];
    }

    setValue("biller_ids", newBillers, { shouldValidate: true });
  };

  const onSubmit = async (data: SignUpFormData) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/sign_up`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData = await res.json();

      if (res.status === 201) {
        toast.success("check your email to complete registration!");
        setValue("email", "");
        setValue("password", "");
        setValue("first_name", "");
        setValue("middle_name", "");
        setValue("last_name", "");
        setValue("phone_number", "");
        setValue("biller_ids", []);
      } else {
        toast.error(responseData.error || "Failed to create account");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account as a Customer</h1>
            <p className="text-gray-600">Sign up to manage your bills efficiently</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
           
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4" />
                Email Address *
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="user@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Eye className="w-4 h-4" />
                Password *
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4" />
                  First Name *
                </label>
                <input
                  {...register("first_name")}
                  placeholder="John"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                {errors.first_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.first_name.message}</p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4" />
                  Middle Name
                </label>
                <input
                  {...register("middle_name")}
                  placeholder="M."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4" />
                  Last Name *
                </label>
                <input
                  {...register("last_name")}
                  placeholder="Doe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                {errors.last_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </label>
              <input
                {...register("phone_number")}
                placeholder="+251912345678"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-4">
                <Building className="w-4 h-4" />
                Select Your Billers *
              </label>
              
              {errors.biller_ids && (
                <p className="text-red-500 text-sm mb-3">{errors.biller_ids.message}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto p-2">
                {billers.map((biller) => (
                  <div
                    key={biller.id}
                    onClick={() => handleBillerSelection(biller.id)}
                    className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                      selectedBillers.includes(biller.id)
                        ? "border-green-500 bg-green-50 shadow-md"
                        : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
                    }`}
                  >
                    
                    {selectedBillers.includes(biller.id) && (
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 shadow-lg animate-bounce">
                        <Check className="w-4 h-4" />
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                        selectedBillers.includes(biller.id) 
                          ? "bg-green-100 text-green-600" 
                          : "bg-blue-100 text-blue-600"
                      }`}>
                        <Building className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {biller.company_name || biller.name}
                        </h3>
                        {biller.name !== biller.company_name && biller.company_name && (
                          <p className="text-sm text-gray-600 truncate">{biller.name}</p>
                        )}
                        
                        <div className="mt-2 space-y-1">
                          {biller.phone_number && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Phone className="w-3 h-3" />
                              <span>{biller.phone_number}</span>
                            </div>
                          )}
                          
                          {biller.email && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Mail className="w-3 h-3" />
                              <span className="truncate">{biller.email}</span>
                            </div>
                          )}
                          
                          {biller.address && (
                            <div className="flex items-start gap-1 text-xs text-gray-500">
                              <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-2">{biller.address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {billers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Building className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No billers available at the moment</p>
                </div>
              )}
            </div>

            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Account...
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link href="auth/login" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">sign in</Link>
              
            </p>
          </div>
        </div>

        
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-8 text-white">
          <div className="h-full flex flex-col justify-center">
            <div className="text-center mb-8">
              <Building className="w-16 h-16 mx-auto mb-4 opacity-90" />
              <h2 className="text-3xl font-bold mb-4">Streamline Your Bill Payments</h2>
              <p className="text-blue-100 text-lg">
                Join thousands of customers who manage their bills efficiently with our platform
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-1">Multiple Billers</h3>
                  <p className="text-blue-100">Manage all your service providers in one place</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-1">Real-time Notifications</h3>
                  <p className="text-blue-100">Get alerted about due dates and payments</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-1">Secure Payments</h3>
                  <p className="text-blue-100">Your financial information is always protected</p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-white bg-opacity-10 rounded-xl">
              <p className="text-blue-100 text-sm">
                <strong>Selected Billers:</strong> {selectedBillers.length} biller(s) chosen
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}