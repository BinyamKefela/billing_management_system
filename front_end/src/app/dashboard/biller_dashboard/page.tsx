"use client";

import { useEffect, useState } from "react";
import { getAuthToken } from "@/app/auth/login/api";
import { toast } from "react-toastify";
import { 
  DollarSign, 
  CreditCard, 
  Users, 
  FileText,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Calendar
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

type BillerReportData = {
  total_revenue: number;
  revenue_by_customer: Array<{
    customer__email: string;
    customer__first_name: string;
    customer__last_name: string;
    total_paid: number;
  }>;
  monthly_revenue: Array<{ month: string; total_revenue: number }>;
  outstanding_invoices: {
    total_outstanding: number;
    overdue_invoices: number;
    pending_invoices: number;
    total_unpaid_invoices: number;
  };
  customer_statistics: {
    total_customers: number;
    active_customers: number;
    inactive_customers: number;
  };
  payment_methods: Array<{
    payment_method: string;
    total_amount: number;
    payment_count: number;
  }>;
};

export default function BillerDashboardPage() {
  const [reportData, setReportData] = useState<BillerReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  useEffect(() => {
    fetchBillerReportData();
  }, []);

  const fetchBillerReportData = async () => {
    setLoading(true);
    try {
      const [
        totalRevenueRes, 
        revenueByCustomerRes, 
        monthlyRevenueRes, 
        outstandingInvoicesRes,
        customerStatsRes,
        paymentMethodsRes
      ] = await Promise.all([
        fetch(`${BASE_URL}/biller/total_revenue`, {
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Bearer ${getAuthToken()}` 
          },
        }),
        fetch(`${BASE_URL}/biller/revenue_by_customer`, {
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Bearer ${getAuthToken()}` 
          },
        }),
        fetch(`${BASE_URL}/biller/monthly_revenue`, {
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Bearer ${getAuthToken()}` 
          },
        }),
        fetch(`${BASE_URL}/biller/outstanding_invoices`, {
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Bearer ${getAuthToken()}` 
          },
        }),
        fetch(`${BASE_URL}/biller/customer_statistics`, {
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Bearer ${getAuthToken()}` 
          },
        }),
        fetch(`${BASE_URL}/biller/payment_methods`, {
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Bearer ${getAuthToken()}` 
          },
        })
      ]);

      const totalRevenue = await totalRevenueRes.json();
      const revenueByCustomer = await revenueByCustomerRes.json();
      const monthlyRevenue = await monthlyRevenueRes.json();
      const outstandingInvoices = await outstandingInvoicesRes.json();
      const customerStats = await customerStatsRes.json();
      const paymentMethods = await paymentMethodsRes.json();

      setReportData({
        total_revenue: totalRevenue.total_revenue || 0,
        revenue_by_customer: Array.isArray(revenueByCustomer) ? revenueByCustomer : [],
        monthly_revenue: Array.isArray(monthlyRevenue) ? monthlyRevenue : [],
        outstanding_invoices: outstandingInvoices || { total_outstanding: 0, overdue_invoices: 0, pending_invoices: 0, total_unpaid_invoices: 0 },
        customer_statistics: customerStats || { total_customers: 0, active_customers: 0, inactive_customers: 0 },
        payment_methods: Array.isArray(paymentMethods) ? paymentMethods : []
      });

    } catch (error) {
      toast.error("Failed to load biller dashboard data");
      console.error("Biller dashboard data error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB'
    }).format(amount);
  };

  const getCustomerDisplayName = (customer: any) => {
    if (customer?.customer__first_name && customer?.customer__last_name) {
      return `${customer.customer__first_name} ${customer.customer__last_name}`;
    }
    return customer?.customer__email || 'Unknown Customer';
  };

  // Safe data formatting with null checks
  const customerRevenueData = reportData?.revenue_by_customer?.slice(0, 6).map((customer, index) => ({
    name: getCustomerDisplayName(customer),
    revenue: Number(customer.total_paid) || 0,
    fill: COLORS[index % COLORS.length]
  })) || [];

  const monthlyRevenueData = reportData?.monthly_revenue?.map(item => ({
    month: item.month,
    revenue: Number(item.total_revenue) || 0
  })) || [];

  const paymentMethodData = reportData?.payment_methods?.map((method, index) => ({
    name: method.payment_method?.replace('_', ' ').toUpperCase() || 'Unknown',
    amount: Number(method.total_amount) || 0,
    count: method.payment_count || 0,
    fill: COLORS[index % COLORS.length]
  })) || [];

  const customerStatusData = [
    { name: 'Active', value: reportData?.customer_statistics?.active_customers || 0, fill: '#10B981' },
    { name: 'Inactive', value: reportData?.customer_statistics?.inactive_customers || 0, fill: '#6B7280' }
  ];

  if (loading || !reportData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Biller Dashboard</h1>
          <p className="text-gray-600 mt-2">Business overview and revenue analytics</p>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Revenue Card */}
          <Card className="bg-white rounded-2xl shadow-sm border-0 hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(reportData.total_revenue)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                All time collected
              </p>
            </CardContent>
          </Card>

          {/* Outstanding Invoices Card */}
          <Card className="bg-white rounded-2xl shadow-sm border-0 hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Outstanding
              </CardTitle>
              <CreditCard className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(reportData.outstanding_invoices.total_outstanding)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {reportData.outstanding_invoices.total_unpaid_invoices} unpaid invoices
              </p>
            </CardContent>
          </Card>

          {/* Total Customers Card */}
          <Card className="bg-white rounded-2xl shadow-sm border-0 hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Customers
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {reportData.customer_statistics.total_customers}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {reportData.customer_statistics.active_customers} active
              </p>
            </CardContent>
          </Card>

          {/* Overdue Invoices Card */}
          <Card className="bg-white rounded-2xl shadow-sm border-0 hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Overdue Invoices
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {reportData.outstanding_invoices.overdue_invoices}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Require immediate attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Revenue Trend */}
          <Card className="bg-white rounded-2xl shadow-sm border-0 col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                Monthly Revenue Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: '#6B7280' }}
                      axisLine={{ stroke: '#E5E7EB' }}
                    />
                    <YAxis 
                      tick={{ fill: '#6B7280' }}
                      axisLine={{ stroke: '#E5E7EB' }}
                      tickFormatter={(value) => `ETB ${value}`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`ETB ${value}`, 'Revenue']}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#4F46E5" 
                      strokeWidth={3}
                      dot={{ fill: '#4F46E5', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#4F46E5' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Customers by Revenue */}
          <Card className="bg-white rounded-2xl shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                Top Customers by Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={customerRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fill: '#6B7280' }}
                      tickFormatter={(value) => `ETB ${value}`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`ETB ${value}`, 'Revenue']}
                    />
                    <Bar 
                      dataKey="revenue" 
                      radius={[4, 4, 0, 0]}
                    >
                      {customerRevenueData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods Distribution */}
          <Card className="bg-white rounded-2xl shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethodData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {paymentMethodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`ETB ${value}`, 'Amount']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Customer Status */}
          <Card className="bg-white rounded-2xl shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Customer Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={customerStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {customerStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white rounded-2xl shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Average Invoice Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {reportData.total_revenue > 0 && reportData.payment_methods.length > 0
                  ? formatCurrency(reportData.total_revenue / reportData.payment_methods.reduce((sum, method) => sum + method.payment_count, 0))
                  : formatCurrency(0)
                }
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Collection Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {reportData.total_revenue + reportData.outstanding_invoices.total_outstanding > 0
                  ? `${Math.round((reportData.total_revenue / (reportData.total_revenue + reportData.outstanding_invoices.total_outstanding)) * 100)}%`
                  : '100%'
                }
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Of total invoices collected
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Most Popular Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {reportData.payment_methods.length > 0 
                  ? reportData.payment_methods[0].payment_method.replace('_', ' ').toUpperCase()
                  : 'N/A'
                }
              </div>
              <p className="text-xs text-gray-500 mt-1">
                By total amount
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}