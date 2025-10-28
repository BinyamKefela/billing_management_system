"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getAuthToken } from "@/app/auth/login/api";
import { toast } from "react-toastify";
import { EyeIcon, PencilIcon, TrashIcon, Plus, FileText, Calendar, DollarSign, User, Building, Search, Filter } from "lucide-react";
import Cookies from "js-cookie";
import { usePermissionCheck } from "@/app/auth/permission_checker";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const billSchema = z.object({
  bill_number: z.string().min(1, "Bill number is required"),
  biller: z.coerce.number().min(1, "Biller is required"),
  customer: z.coerce.number().min(1, "Customer is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  due_date: z.string().min(1, "Due date is required"),
  status: z.enum(['pending', 'paid', 'overdue']),
  description: z.string().optional(),
});

type BillFormData = z.infer<typeof billSchema>;

type Bill = {
  id: number;
  bill_number: string;
  biller: number;
  biller_details?: {
    id: number;
    name: string;
    company_name?: string;
  };
  customer: number;
  customer_details?: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  amount: string;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
  description?: string;
  created_at: string;
  updated_at: string;
};

type Biller = {
  id: number;
  name: string;
  company_name?: string;
};

type Customer = {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
};

export default function BillsPage() {

  usePermissionCheck("bms.view_bill");
  const [bills, setBills] = useState<Bill[]>([]);
  const [billers, setBillers] = useState<Biller[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Bill | null>(null);
  const [modalType, setModalType] = useState<"add" | "edit" | "view" | "delete" | null>(null);
  const [button_clicked, setButtonClicked] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 1000);
    return () => clearTimeout(t);
  }, [search]);

  const fetchBills = async () => {
    setLoading(true);
    try {
      let url = `${BASE_URL}/get_bills?page=${page}&search=${encodeURIComponent(debouncedSearch)}`;
      if (statusFilter !== "all") {
        url += `&status=${statusFilter}`;
      }
      
      const res = await fetch(url, {
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${getAuthToken()}` 
        },
      });
      const data = await res.json();
      if (res.status === 200) {
        setBills(data.data || data.results || []);
        setTotalPages(data.total_pages || 1);
      } else {
        toast.error(data.error || "Failed to load bills");
      }
    } catch {
      toast.error("Couldn't fetch bills");
    } finally {
      setLoading(false);
    }
  };

  const fetchBillers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/get_billers`, {
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${getAuthToken()}` 
        },
      });
      const data = await res.json();
      if (res.status === 200) {
        setBillers(data.data || data.results || []);
      }
    } catch {
      console.error("Failed to fetch billers");
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/get_customer_billers?biller__id=${Cookies.get("id")}`, {
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${getAuthToken()}` 
        },
      });
      const data = await res.json();
      if (res.status === 200) {
        setCustomers(data.data || data.results || []);
      }
    } catch {
      console.error("Failed to fetch customers");
    }
  };

  useEffect(() => { 
    fetchBills();
    fetchBillers();
    fetchCustomers();
  }, [page, debouncedSearch, statusFilter]);

  const { 
    register, 
    handleSubmit, 
    reset, 
    formState: { errors },
    watch,
    setValue
  } = useForm<BillFormData>({
    resolver: zodResolver(billSchema) as any,
    defaultValues: {
      status: 'pending',
    }
  });

  const formValues = watch();

  const handleOpen = (type: typeof modalType, bill?: Bill) => {
    setModalType(type);
    setSelected(bill || null);
    
    if (bill) {
      reset({
        bill_number: bill.bill_number,
        biller: bill.biller,
        customer: bill.customer,
        amount: parseFloat(bill.amount),
        due_date: bill.due_date.split('T')[0], // Format for date input
        status: bill.status,
        description: bill.description || "",
      });
    } else {
      reset({
        status: 'pending',
      });
    }
  };

  const handleClose = () => { 
    setModalType(null); 
    setSelected(null); 
    reset({}); 
  };

  const generateBillNumber = () => {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000);
    return `BILL-${timestamp}-${random}`;
  };

  const onSubmit = async (data: BillFormData) => {
    setButtonClicked(true);
    
    try {
      if (modalType === "add") {
        data.biller = Cookies.get("id") ? parseInt(Cookies.get("id") as string, 10) : 0;
        const res = await fetch(BASE_URL + "/post_bill", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Bearer ${getAuthToken()}` 
          },
          body: JSON.stringify(data),
        });
        
        if (res.status === 201) {
          toast.success("Bill created successfully");
        } else {
          const errorData = await res.json();
          toast.error(errorData.error || "Failed to create bill");
        }
      } else if (modalType === "edit" && selected) {
        const res = await fetch(`${BASE_URL}/update_bill/${selected.id}`, {
          method: "PATCH",
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Bearer ${getAuthToken()}` 
          },
          body: JSON.stringify(data),
        });
        
        if (res.status === 200) {
          toast.success("Bill updated successfully");
        } else {
          const errorData = await res.json();
          toast.error(errorData.error || "Failed to update bill");
        }
      }
    } catch {
      toast.error(`Couldn't ${modalType === "add" ? "create" : "update"} bill`);
    } finally { 
      setButtonClicked(false); 
    }
    
    await fetchBills();
    handleClose();
  };

  const handleDelete = async () => {
    if (selected) {
      try {
        const res = await fetch(`${BASE_URL}/delete_bill/${selected.id}`, { 
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });
        
        if (res.status === 200) {
          toast.success("Bill deleted successfully");
        } else {
          toast.error("Failed to delete bill");
        }
      } catch {
        toast.error("Failed to delete bill");
      }
      await fetchBills();
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

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      paid: "bg-green-100 text-green-800 border-green-200",
      overdue: "bg-red-100 text-red-800 border-red-200",
    };
    return `px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`;
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
    }).format(parseFloat(amount));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Bills Management</h1>
                <p className="text-gray-600">Manage and track all customer bills</p>
              </div>
            </div>
            <button 
              onClick={() => {
                handleOpen("add");
                setValue("bill_number", generateBillNumber());
              }}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Create Bill
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
              {/* Search */}
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Search bills by number, customer, or description..." 
                  value={search} 
                  onChange={(e) => { 
                    setPage(1); 
                    setSearch(e.target.value); 
                  }} 
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select 
                  value={statusFilter}
                  onChange={(e) => {
                    setPage(1);
                    setStatusFilter(e.target.value);
                  }}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>

            <div className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-lg">
              Page {page} of {totalPages}
            </div>
          </div>
        </div>

        {/* Bills Table */}
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
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bill #</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Biller</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
                    {bills.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-3 text-gray-500">
                            <FileText className="w-12 h-12 opacity-50" />
                            <p className="text-lg">No bills found</p>
                            <p className="text-sm">Get started by creating your first bill</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      bills.map((bill) => (
                        <tr key={bill.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <span className="font-mono text-sm font-semibold text-gray-900">{bill.bill_number}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {bill.customer?.first_name} {bill.customer?.last_name}
                                </p>
                                <p className="text-xs text-gray-500">{bill.customer?.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-900">
                                {bill.biller_details?.company_name || bill.biller_details?.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-semibold text-gray-900">
                                {formatCurrency(bill.amount)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-900">
                                {new Date(bill.due_date).toLocaleDateString()}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={getStatusBadge(bill.status)}>
                              {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(bill.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpen("view", bill)}
                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                                title="View Bill"
                              >
                                <EyeIcon size={16} />
                              </button>
                              <button
                                onClick={() => handleOpen("edit", bill)}
                                className="p-2 text-gray-400 hover:text-green-600 transition-colors duration-200"
                                title="Edit Bill"
                              >
                                <PencilIcon size={16} />
                              </button>
                              <button
                                onClick={() => handleOpen("delete", bill)}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                                title="Delete Bill"
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

              {bills.length > 0 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {bills.length} of many bills
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
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    modalType === 'add' ? 'bg-blue-100 text-blue-600' :
                    modalType === 'edit' ? 'bg-green-100 text-green-600' :
                    modalType === 'view' ? 'bg-purple-100 text-purple-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {modalType === "add" ? "Create New Bill" :
                     modalType === "edit" ? "Edit Bill" :
                     modalType === "view" ? "Bill Details" : "Delete Bill"}
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  ×
                </button>
              </div>

              {modalType === "view" && selected && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Bill Number</label>
                        <p className="text-lg font-mono font-semibold text-gray-900">{selected.bill_number}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Amount</label>
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(selected.amount)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Status</label>
                        <span className={getStatusBadge(selected.status)}>
                          {selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Customer</label>
                        <p className="text-gray-900">
                          {selected.customer_details?.first_name} {selected.customer_details?.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{selected.customer_details?.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Biller</label>
                        <p className="text-gray-900">
                          {selected.biller_details?.company_name || selected.biller_details?.name}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Due Date</label>
                        <p className="text-gray-900">{new Date(selected.due_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  {selected.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Description</label>
                      <p className="text-gray-900 mt-1 bg-gray-50 p-3 rounded-lg">{selected.description}</p>
                    </div>
                  )}
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => handleOpen("edit", selected)}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
                    >
                      Edit Bill
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

              {/* Add/Edit Modal */}
              {(modalType === "add" || modalType === "edit") && (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Bill Number */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <FileText className="w-4 h-4" />
                        Bill Number *
                      </label>
                      <input
                        {...register("bill_number")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                      {errors.bill_number && (
                        <p className="text-red-500 text-sm mt-1">{errors.bill_number.message}</p>
                      )}
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <DollarSign className="w-4 h-4" />
                        Amount (ETB) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register("amount")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                      {errors.amount && (
                        <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
                      )}
                    </div>

                    

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4" />
                        Customer *
                      </label>
                      <select
                        {...register("customer")}
                        value={formValues.customer || ""}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">Select Customer</option>
                        {customers.map((customer) => (
                          <option key={customer?.user.id} value={customer?.user.id}>
                            {customer?.user?.first_name} {customer?.user?.last_name} ({customer?.user?.email})
                          </option>
                        ))}
                      </select>
                      {errors.customer && (
                        <p className="text-red-500 text-sm mt-1">{errors.customer.message}</p>
                      )}
                    </div>

                    
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="w-4 h-4" />
                        Due Date *
                      </label>
                      <input
                        type="date"
                        {...register("due_date")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                      {errors.due_date && (
                        <p className="text-red-500 text-sm mt-1">{errors.due_date.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        Status *
                      </label>
                      <select
                        {...register("status")}
                        value={formValues.status || ""}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      {...register("description")}
                      rows={4}
                      placeholder="Enter bill description..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={button_clicked}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {button_clicked ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {modalType === "add" ? "Creating Bill..." : "Updating Bill..."}
                      </div>
                    ) : (
                      modalType === "add" ? "Create Bill" : "Update Bill"
                    )}
                  </button>
                </form>
              )}

              {/* Delete Modal */}
              {modalType === "delete" && selected && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrashIcon className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Bill</h3>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete bill <strong>{selected.bill_number}</strong> for {selected.customer_details?.first_name} {selected.customer_details?.last_name}?
                    This action cannot be undone.
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