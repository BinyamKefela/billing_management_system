"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getAuthToken } from "@/app/auth/login/api";
import { toast } from "react-toastify";
import { EyeIcon, TrashIcon, Plus, Search, Filter, Calendar, Mail, AlertTriangle, CheckCircle, XCircle, Clock, MessageSquare, Smartphone, User, FileText } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const notificationSchema = z.object({
  bill: z.string().min(1, "Bill is required"),
  customer: z.string().min(1, "Customer is required"),
  notification_type: z.enum(['overdue', 'upcoming_due', 'payment_confirmation', 'general']),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
  sent_via: z.enum(['email', 'sms', 'whatsapp']),
  status: z.enum(['sent', 'failed']),
  error_message: z.string().optional(),
});

type NotificationFormData = z.infer<typeof notificationSchema>;

type Bill = {
  id: number;
  bill_number: string;
  amount: number;
  due_date: string;
  customer_name: string;
};

type Customer = {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
};

type CustomNotification = {
  id: number;
  bill: Bill;
  customer: Customer;
  notification_type: 'overdue' | 'upcoming_due' | 'payment_confirmation' | 'general';
  subject: string;
  message: string;
  sent_via: 'email' | 'sms' | 'whatsapp';
  status: 'sent' | 'failed';
  sent_at: string;
  error_message?: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<CustomNotification[]>([]);
  const [availableBills, setAvailableBills] = useState<Bill[]>([]);
  const [availableCustomers, setAvailableCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CustomNotification | null>(null);
  const [modalType, setModalType] = useState<"add" | "view" | "delete" | null>(null);
  const [button_clicked, setButtonClicked] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 1000);
    return () => clearTimeout(t);
  }, [search]);

  const fetchBills = async () => {
    try {
      const res = await fetch(`${BASE_URL}/get_bills?page_size=9999`, {
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${getAuthToken()}` 
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableBills(data.data || data.results || []);
      } else {
        setAvailableBills([]);
      }
    } catch (error) {
      setAvailableBills([]);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/get_customers?page_size=9999`, {
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${getAuthToken()}` 
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableCustomers(data.data || data.results || []);
      } else {
        setAvailableCustomers([]);
      }
    } catch (error) {
      setAvailableCustomers([]);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      let url = `${BASE_URL}/get_notifications?page=${page}&search=${encodeURIComponent(debouncedSearch)}`;
      
      if (typeFilter !== "all") {
        url += `&notification_type=${typeFilter}`;
      }
      if (statusFilter !== "all") {
        url += `&status=${statusFilter}`;
      }
      if (channelFilter !== "all") {
        url += `&sent_via=${channelFilter}`;
      }
      
      const res = await fetch(url, {
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${getAuthToken()}` 
        },
      });
      const data = await res.json();
      if (res.status === 200) {
        setNotifications(data.data || []);
        setTotalPages(data.total_pages || 1);
      } else {
        toast.error(data.error || "Failed to load notifications");
      }
    } catch {
      toast.error("Couldn't fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchNotifications();
    fetchBills();
    fetchCustomers();
  }, [page, debouncedSearch, typeFilter, statusFilter, channelFilter]);

  const { 
    register, 
    handleSubmit, 
    reset, 
    formState: { errors },
    watch
  } = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      notification_type: 'general',
      sent_via: 'email',
      status: 'sent',
    }
  });

  const formValues = watch();

  const handleOpen = (type: typeof modalType, notification?: CustomNotification) => {
    setModalType(type);
    setSelected(notification || null);
    
    if (notification) {
      reset({
        bill: notification.bill.id.toString(),
        customer: notification.customer.id.toString(),
        notification_type: notification.notification_type,
        subject: notification.subject,
        message: notification.message,
        sent_via: notification.sent_via,
        status: notification.status,
        error_message: notification.error_message || "",
      });
    } else {
      reset({
        notification_type: 'general',
        sent_via: 'email',
        status: 'sent',
      });
    }
  };

  const handleClose = () => { 
    setModalType(null); 
    setSelected(null); 
    reset({}); 
  };

  const onSubmit = async (data: NotificationFormData) => {
    setButtonClicked(true);
    
    try {
      if (modalType === "add") {
        const res = await fetch(BASE_URL + "/post_notification", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}` 
          },
          body: JSON.stringify({
            ...data,
            bill: parseInt(data.bill),
            customer: parseInt(data.customer),
          }),
        });
        
        if (res.status === 201) {
          toast.success("Notification created successfully");
          await fetchNotifications();
        } else {
          const errorData = await res.json();
          toast.error(errorData.error || "Failed to create notification");
        }
      }
    } catch (error) {
      toast.error(`Couldn't ${modalType === "add" ? "create" : "update"} notification`);
    } finally { 
      setButtonClicked(false); 
    }
    
    handleClose();
  };

  const handleDelete = async () => {
    if (selected) {
      try {
        const res = await fetch(`${BASE_URL}/delete_notification/${selected.id}`, { 
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });
        
        if (res.status === 200) {
          toast.success("Notification deleted successfully");
        } else {
          toast.error("Failed to delete notification");
        }
      } catch {
        toast.error("Failed to delete notification");
      }
      await fetchNotifications();
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

  const getTypeBadge = (type: string) => {
    const styles = {
      overdue: "bg-red-100 text-red-800 border-red-200",
      upcoming_due: "bg-orange-100 text-orange-800 border-orange-200",
      payment_confirmation: "bg-green-100 text-green-800 border-green-200",
      general: "bg-blue-100 text-blue-800 border-blue-200",
    };
    return styles[type as keyof typeof styles] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusBadge = (status: string) => {
    return status === 'sent' 
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-red-100 text-red-800 border-red-200";
  };

  const getChannelBadge = (channel: string) => {
    const styles = {
      email: "bg-purple-100 text-purple-800 border-purple-200",
      sms: "bg-indigo-100 text-indigo-800 border-indigo-200",
      whatsapp: "bg-green-100 text-green-800 border-green-200",
    };
    return styles[channel as keyof typeof styles] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'overdue':
        return <AlertTriangle className="w-4 h-4" />;
      case 'upcoming_due':
        return <Clock className="w-4 h-4" />;
      case 'payment_confirmation':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'sms':
        return <MessageSquare className="w-4 h-4" />;
      case 'whatsapp':
        return <Smartphone className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const formatMessagePreview = (message: string) => {
    return message.length > 100 ? `${message.substring(0, 100)}...` : message;
  };

  const getCustomerDisplayName = (customer: Customer) => {
    if (customer.first_name && customer.last_name) {
      return `${customer.first_name} ${customer.last_name}`;
    }
    return customer.email;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notifications Management</h1>
                <p className="text-gray-600">Manage and track all system notifications</p>
              </div>
            </div>
            
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Search notifications by subject, message, or customer..." 
                  value={search} 
                  onChange={(e) => { 
                    setPage(1); 
                    setSearch(e.target.value); 
                  }} 
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select 
                    value={typeFilter}
                    onChange={(e) => {
                      setPage(1);
                      setTypeFilter(e.target.value);
                    }}
                    className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="all">All Types</option>
                    <option value="overdue">Overdue</option>
                    <option value="upcoming_due">Upcoming Due</option>
                    <option value="payment_confirmation">Payment Confirmation</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <select 
                  value={statusFilter}
                  onChange={(e) => {
                    setPage(1);
                    setStatusFilter(e.target.value);
                  }}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="all">All Status</option>
                  <option value="sent">Sent</option>
                  <option value="failed">Failed</option>
                </select>

                
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
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Notification</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer & Bill</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Channel</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Sent At</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
                    {notifications.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-3 text-gray-500">
                            <Mail className="w-12 h-12 opacity-50" />
                            <p className="text-lg">No notifications found</p>
                            <p className="text-sm">Get started by sending your first notification</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      notifications.map((notification,index) => (
                        <tr key={notification.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(page - 1) * 10 + index + 1}
                          </td>
                          <td className="px-6 py-4">
                            <div className="max-w-xs">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {notification.subject}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatMessagePreview(notification.message)}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-900">
                                  {getCustomerDisplayName(notification.customer)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-500">
                                  Bill #{notification.bill.bill_number}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {getTypeIcon(notification.notification_type)}
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeBadge(notification.notification_type)}`}>
                                {notification.notification_type.replace('_', ' ')}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {getChannelIcon(notification.sent_via)}
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getChannelBadge(notification.sent_via)}`}>
                                {notification.sent_via}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(notification.status)}`}>
                              {notification.status === 'sent' ? (
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Sent
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <XCircle className="w-3 h-3" />
                                  Failed
                                </div>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {new Date(notification.sent_at).toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpen("view", notification)}
                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                                title="View Notification"
                              >
                                <EyeIcon size={16} />
                              </button>
                              <button
                                onClick={() => handleOpen("delete", notification)}
                                className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                                title="Delete Notification"
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

              {notifications.length > 0 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {notifications.length} notifications
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
                    modalType === 'view' ? 'bg-green-100 text-green-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    <Mail className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {modalType === "add" ? "Send New Notification" :
                     modalType === "view" ? "Notification Details" : "Delete Notification"}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Notification Details</label>
                        <div className="mt-2 space-y-2">
                          <p><span className="font-medium">Subject:</span> {selected.subject}</p>
                          <p><span className="font-medium">Type:</span> 
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium border ${getTypeBadge(selected.notification_type)}`}>
                              {selected.notification_type.replace('_', ' ')}
                            </span>
                          </p>
                          <p><span className="font-medium">Channel:</span> 
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium border ${getChannelBadge(selected.sent_via)}`}>
                              {selected.sent_via}
                            </span>
                          </p>
                          <p><span className="font-medium">Status:</span> 
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(selected.status)}`}>
                              {selected.status}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Customer Information</label>
                        <div className="mt-2 space-y-2">
                          <p><span className="font-medium">Name:</span> {getCustomerDisplayName(selected.customer)}</p>
                          <p><span className="font-medium">Email:</span> {selected.customer.email}</p>
                          {selected.customer.phone_number && (
                            <p><span className="font-medium">Phone:</span> {selected.customer.phone_number}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Bill Information</label>
                        <div className="mt-2 space-y-2">
                          <p><span className="font-medium">Bill Number:</span> {selected.bill.bill_number}</p>
                          <p><span className="font-medium">Amount:</span> ${selected.bill.amount}</p>
                          <p><span className="font-medium">Due Date:</span> {new Date(selected.bill.due_date).toLocaleDateString()}</p>
                          <p><span className="font-medium">Customer:</span> {selected.bill.customer_name}</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Timing</label>
                        <div className="mt-2 space-y-2">
                          <p><span className="font-medium">Sent At:</span> {new Date(selected.sent_at).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Message Content</label>
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selected.message}</p>
                    </div>
                  </div>

                  {selected.error_message && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 text-red-600">Error Message</label>
                      <div className="mt-2 p-4 bg-red-50 rounded-lg">
                        <p className="text-sm text-red-700">{selected.error_message}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={handleClose}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {modalType === "add" && (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2">Customer *</label>
                      <select
                        {...register("customer")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">Select Customer</option>
                        {availableCustomers.map((customer) => (
                          <option key={customer.id} value={customer.id}>
                            {getCustomerDisplayName(customer)} ({customer.email})
                          </option>
                        ))}
                      </select>
                      {errors.customer && (
                        <p className="text-red-500 text-sm mt-1">{errors.customer.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2">Bill *</label>
                      <select
                        {...register("bill")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">Select Bill</option>
                        {availableBills.map((bill) => (
                          <option key={bill.id} value={bill.id}>
                            #{bill.bill_number} - ${bill.amount} - {bill.customer_name}
                          </option>
                        ))}
                      </select>
                      {errors.bill && (
                        <p className="text-red-500 text-sm mt-1">{errors.bill.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2">Notification Type *</label>
                      <select
                        {...register("notification_type")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="overdue">Overdue Reminder</option>
                        <option value="upcoming_due">Upcoming Due Date Reminder</option>
                        <option value="payment_confirmation">Payment Confirmation</option>
                        <option value="general">General Notification</option>
                      </select>
                      {errors.notification_type && (
                        <p className="text-red-500 text-sm mt-1">{errors.notification_type.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2">Send Via *</label>
                      <select
                        {...register("sent_via")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="email">Email</option>
                        <option value="sms">SMS</option>
                        <option value="whatsapp">WhatsApp</option>
                      </select>
                      {errors.sent_via && (
                        <p className="text-red-500 text-sm mt-1">{errors.sent_via.message}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-700 mb-2">Subject *</label>
                      <input
                        {...register("subject")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter notification subject..."
                      />
                      {errors.subject && (
                        <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-700 mb-2">Message *</label>
                      <textarea
                        {...register("message")}
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter notification message..."
                      />
                      {errors.message && (
                        <p className="text-red-500 text-sm mt-1">{errors.message.message}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        {...register("status")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="sent">Sent</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-700 mb-2">Error Message (if failed)</label>
                      <textarea
                        {...register("error_message")}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter error message if notification failed..."
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
                        Sending Notification...
                      </div>
                    ) : (
                      "Send Notification"
                    )}
                  </button>
                </form>
              )}

              {modalType === "delete" && selected && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrashIcon className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Notification</h3>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete this notification? 
                    This action cannot be undone and will permanently remove the notification record.
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