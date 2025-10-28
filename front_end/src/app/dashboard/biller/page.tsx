"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getAuthToken } from "@/app/auth/login/api";
import { toast } from "react-toastify";
import { EyeIcon, PencilIcon, TrashIcon, Plus, User, Mail, Phone, MapPin, Calendar, Building, Search, Filter, Check, X } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const billerSchema = z.object({
  user: z.string().min(1, "User is required"),
  name: z.string().min(1, "Name is required"),
  company_name: z.string().optional(),
  address: z.string().optional(),
  phone_number: z.string().optional(),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal('')),
});

type BillerFormData = z.infer<typeof billerSchema>;

type Biller = {
  id: number;
  user: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  name: string;
  company_name?: string;
  address?: string;
  phone_number?: string;
  email?: string;
  created_at: string;
};

type UserOption = {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
};

export default function BillersPage() {
  const [billers, setBillers] = useState<Biller[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Biller | null>(null);
  const [modalType, setModalType] = useState<"add" | "edit" | "view" | "delete" | null>(null);
  const [button_clicked, setButtonClicked] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 1000);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/get_users?page_size=100`, {
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${getAuthToken()}` 
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableUsers(data.data || data.results || []);
      } else {
        setAvailableUsers([]);
      }
    } catch (error) {
      setAvailableUsers([]);
    }
  };

  const fetchBillers = async () => {
    setLoading(true);
    try {
      const url = `${BASE_URL}/get_billers?page=${page}&search=${encodeURIComponent(debouncedSearch)}`;
      
      const res = await fetch(url, {
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${getAuthToken()}` 
        },
      });
      const data = await res.json();
      if (res.status === 200) {
        setBillers(data.data || data.results || []);
        setTotalPages(data.total_pages || 1);
      } else {
        toast.error(data.error || "Failed to load billers");
      }
    } catch {
      toast.error("Couldn't fetch billers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchBillers();
    fetchUsers();
  }, [page, debouncedSearch]);

  const { 
    register, 
    handleSubmit, 
    reset, 
    formState: { errors },
    watch
  } = useForm<BillerFormData>({
    resolver: zodResolver(billerSchema) as any,
  });

  const formValues = watch();

  const handleOpen = (type: typeof modalType, biller?: Biller) => {
    setModalType(type);
    setSelected(biller || null);
    
    if (biller) {
      reset({
        user: biller.user.id.toString(),
        name: biller.name,
        company_name: biller.company_name || "",
        address: biller.address || "",
        phone_number: biller.phone_number || "",
        email: biller.email || "",
      });
    } else {
      reset({
        user: "",
        name: "",
        company_name: "",
        address: "",
        phone_number: "",
        email: "",
      });
    }
  };

  const handleClose = () => { 
    setModalType(null); 
    setSelected(null); 
    reset({}); 
  };

  const onSubmit = async (data: BillerFormData) => {
    setButtonClicked(true);
    
    try {
      if (modalType === "add") {
        const res = await fetch(BASE_URL + "/post_biller", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}` 
          },
          body: JSON.stringify(data),
        });
        
        if (res.status === 201) {
          toast.success("Biller created successfully");
          await fetchBillers();
        } else {
          const errorData = await res.json();
          toast.error(errorData.error || "Failed to create biller");
        }
      } else if (modalType === "edit" && selected) {
        const res = await fetch(`${BASE_URL}/update_biller/${selected.id}`, {
          method: "PATCH",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}` 
          },
          body: JSON.stringify(data),
        });
        
        if (res.status === 200) {
          toast.success("Biller updated successfully");
          await fetchBillers();
        } else {
          const errorData = await res.json();
          toast.error(errorData.error || errorData.message || "Failed to update biller");
        }
      }
    } catch (error) {
      toast.error(`Couldn't ${modalType === "add" ? "create" : "update"} biller`);
    } finally { 
      setButtonClicked(false); 
    }
    
    handleClose();
  };

  const handleDelete = async () => {
    if (selected) {
      try {
        const res = await fetch(`${BASE_URL}/delete_biller/${selected.id}`, { 
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });
        
        if (res.status === 200) {
          toast.success("Biller deleted successfully");
        } else {
          toast.error("Failed to delete biller");
        }
      } catch {
        toast.error("Failed to delete biller");
      }
      await fetchBillers();
      handleClose();
    }
  };

  const getPageNumbers = () => {
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, page + 2);
    if (page <= 2) end = Math.min(5, totalPages);
    if (page >= totalPages - 1) start = Math.max(totalPages - 4, 1);
    return Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);
  };

  const getUserDisplayName = (user: Biller['user']) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.email;
  };

  const getBillerInitials = (biller: Biller) => {
    const first = biller.name[0] || '';
    const company = biller.company_name?.[0] || '';
    return (first + company).toUpperCase() || 'B';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Building className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Billers Management</h1>
                <p className="text-gray-600">Manage system billers and their information</p>
              </div>
            </div>
            <button 
              onClick={() => handleOpen("add")}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Add Biller
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Search billers by name, company, or email..." 
                  value={search} 
                  onChange={(e) => { 
                    setPage(1); 
                    setSearch(e.target.value); 
                  }} 
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select 
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="all">All Billers</option>
                    <option value="active">With Company</option>
                    <option value="inactive">Without Company</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-lg">
              Page {page} of {totalPages}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Biller</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Company</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User Account</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
                    {billers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-3 text-gray-500">
                            <Building className="w-12 h-12 opacity-50" />
                            <p className="text-lg">No billers found</p>
                            <p className="text-sm">Get started by creating your first biller</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      billers.map((biller,index) => (
                        <tr key={biller.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(page - 1) * 10 + index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-semibold text-sm">
                                  {getBillerInitials(biller)}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {biller.name}
                                </p>
                                <p className="text-xs text-gray-500">{biller.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              {biller.phone_number && (
                                <div className="flex items-center gap-2 text-sm text-gray-900">
                                  <Phone className="w-4 h-4 text-gray-400" />
                                  {biller.phone_number}
                                </div>
                              )}
                              {biller.address && (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <MapPin className="w-4 h-4 text-gray-400" />
                                  <span className="truncate max-w-xs">{biller.address}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {biller.company_name ? (
                              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium border border-green-200">
                                {biller.company_name}
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium border border-gray-200">
                                No Company
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-900">{getUserDisplayName(biller.user)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {new Date(biller.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpen("view", biller)}
                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                                title="View Biller"
                              >
                                <EyeIcon size={16} />
                              </button>
                              <button
                                onClick={() => handleOpen("edit", biller)}
                                className="p-2 text-gray-400 hover:text-green-600 transition-colors duration-200"
                                title="Edit Biller"
                              >
                                <PencilIcon size={16} />
                              </button>
                              <button
                                onClick={() => handleOpen("delete", biller)}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                                title="Delete Biller"
                              >
                                <TrashIcon size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {billers.length > 0 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {billers.length} billers
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={page === 1}
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
                      >
                        Previous
                      </button>

                      {getPageNumbers().map((p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`px-4 py-2 border rounded-lg transition-all duration-200 ${
                            p === page 
                              ? "bg-blue-600 text-white border-blue-600" 
                              : "border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {p}
                        </button>
                      ))}

                      <button
                        disabled={page === totalPages}
                        onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors duration-200"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {modalType && (
        <div className="fixed inset-0 bg-black/30  flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    modalType === 'add' ? 'bg-blue-100 text-blue-600' :
                    modalType === 'edit' ? 'bg-green-100 text-green-600' :
                    modalType === 'view' ? 'bg-blue-100 text-blue-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    <Building className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {modalType === "add" ? "Create New Biller" :
                     modalType === "edit" ? "Edit Biller" :
                     modalType === "view" ? "Biller Details" : "Delete Biller"}
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              {modalType === "view" && selected && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-2xl">
                        {getBillerInitials(selected)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{selected.name}</h3>
                      <p className="text-gray-600">{selected.email}</p>
                      <div className="flex gap-2 mt-2">
                        {selected.company_name && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium border border-green-200">
                            {selected.company_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Biller Information</label>
                        <div className="mt-2 space-y-2">
                          <p><span className="font-medium">Name:</span> {selected.name}</p>
                          {selected.company_name && (
                            <p><span className="font-medium">Company:</span> {selected.company_name}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Contact Information</label>
                        <div className="mt-2 space-y-2">
                          {selected.phone_number && (
                            <p><span className="font-medium">Phone:</span> {selected.phone_number}</p>
                          )}
                          {selected.email && (
                            <p><span className="font-medium">Email:</span> {selected.email}</p>
                          )}
                          {selected.address && (
                            <p><span className="font-medium">Address:</span> {selected.address}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Account Information</label>
                        <div className="mt-2 space-y-2">
                          <p><span className="font-medium">User Account:</span> {getUserDisplayName(selected.user)}</p>
                          <p><span className="font-medium">Created:</span> {new Date(selected.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => handleOpen("edit", selected)}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
                    >
                      Edit Biller
                    </button>
                    <button
                      onClick={handleClose}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {(modalType === "add" || modalType === "edit") && (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4" />
                        User Account *
                      </label>
                      <select
                        {...register("user")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">Select a user</option>
                        {availableUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.first_name && user.last_name 
                              ? `${user.first_name} ${user.last_name} (${user.email})`
                              : user.email
                            }
                          </option>
                        ))}
                      </select>
                      {errors.user && (
                        <p className="text-red-500 text-sm mt-1">{errors.user.message}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4" />
                        Biller Name *
                      </label>
                      <input
                        {...register("name")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Building className="w-4 h-4" />
                        Company Name
                      </label>
                      <input
                        {...register("company_name")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Phone className="w-4 h-4" />
                        Phone Number
                      </label>
                      <input
                        {...register("phone_number")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4" />
                        Email Address
                      </label>
                      <input
                        {...register("email")}
                        type="email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="w-4 h-4" />
                        Address
                      </label>
                      <textarea
                        {...register("address")}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={button_clicked}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {button_clicked ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {modalType === "add" ? "Creating Biller..." : "Updating Biller..."}
                      </div>
                    ) : (
                      modalType === "add" ? "Create Biller" : "Update Biller"
                    )}
                  </button>
                </form>
              )}

              {modalType === "delete" && selected && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrashIcon className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Biller</h3>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete biller <strong>{selected.name}</strong>?
                    This action cannot be undone and will permanently remove all associated data.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={handleDelete}
                      disabled={button_clicked}
                      className="flex-1 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors duration-200 disabled:opacity-50"
                    >
                      {button_clicked ? "Deleting..." : "Yes, Delete"}
                    </button>
                    <button
                      onClick={handleClose}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}