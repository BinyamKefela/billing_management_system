"use client";

import { useEffect, useState } from "react";
import { getAuthToken } from "@/app/auth/login/api";
import { toast } from "react-toastify";
import { 
  DollarSign, 
  CreditCard, 
  Calendar, 
  AlertTriangle,
  TrendingUp,
  Users,
  FileText,
  Bell
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

type ReportData = {
  total_spent: number;
  biller_spending: Array<{ bill__biller__name: string; total: number }>;
  monthly_spending: Array<{ month: string; total: number }>;
  outstanding_payments: {
    total_due: number;
    overdue_count: number;
  };
};

export default function DashboardPage() {
  const [reportData, setReportData] = useState<ReportData>({
    total_spent: 0,
    biller_spending: [],
    monthly_spending: [],
    outstanding_payments: { total_due: 0, overdue_count: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
  const BILLER_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  useEffect(() => {
    setIsClient(true);
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [totalSpendingRes, billerSpendingRes, monthlySpendingRes, outstandingRes] = await Promise.all([
        fetch(`${BASE_URL}/total_spending`, {
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Bearer ${getAuthToken()}` 
          },
        }),
        fetch(`${BASE_URL}/spending_by_biller`, {
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Bearer ${getAuthToken()}` 
          },
        }),
        fetch(`${BASE_URL}/monthly_spending`, {
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Bearer ${getAuthToken()}` 
          },
        }),
        fetch(`${BASE_URL}/outstanding_payments`, {
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Bearer ${getAuthToken()}` 
          },
        })
      ]);

      const totalSpending = await totalSpendingRes.json();
      const billerSpending = await billerSpendingRes.json();
      const monthlySpending = await monthlySpendingRes.json();
      const outstanding = await outstandingRes.json();

      setReportData({
        total_spent: totalSpending.total_spent || 0,
        biller_spending: billerSpending || [],
        monthly_spending: monthlySpending || [],
        outstanding_payments: outstanding || { total_due: 0, overdue_count: 0 }
      });

    } catch (error) {
      toast.error("Failed to load dashboard data");
      console.error("Dashboard data error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Format data for charts
  const billerChartData = reportData.biller_spending.map((item, index) => ({
    name: item.bill__biller__name || 'Unknown Biller',
    value: Number(item.total),
    fill: BILLER_COLORS[index % BILLER_COLORS.length]
  }));

  const monthlyChartData = reportData.monthly_spending.map(item => ({
    month: item.month,
    amount: Number(item.total)
  }));

  const spendingDistributionData = [
    { name: 'Paid', value: Number(reportData.total_spent), fill: '#10B981' },
    { name: 'Due', value: Number(reportData.outstanding_payments.total_due), fill: '#EF4444' }
  ].filter(item => item.value > 0);

  const paymentStatusData = [
    { name: 'Overdue', value: reportData.outstanding_payments.overdue_count, fill: '#EF4444' },
    { name: 'Pending', value: Math.max(0, 10 - reportData.outstanding_payments.overdue_count), fill: '#F59E0B' }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Prevent hydration mismatch by not rendering charts until client-side
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-600 mt-2">Welcome to your billing management dashboard</p>
          </div>
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-2">Welcome to your billing management dashboard</p>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Spending Card */}
          <Card className="bg-white rounded-2xl shadow-sm border-0 hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Spending
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(reportData.total_spent)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                All time payments
              </p>
            </CardContent>
          </Card>

          {/* Outstanding Payments Card */}
          <Card className="bg-white rounded-2xl shadow-sm border-0 hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Outstanding Balance
              </CardTitle>
              <CreditCard className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(reportData.outstanding_payments.total_due)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {reportData.outstanding_payments.overdue_count} overdue bills
              </p>
            </CardContent>
          </Card>

          {/* Overdue Bills Card */}
          <Card className="bg-white rounded-2xl shadow-sm border-0 hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Overdue Bills
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {reportData.outstanding_payments.overdue_count}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Require immediate attention
              </p>
            </CardContent>
          </Card>

          {/* Active Billers Card */}
          <Card className="bg-white rounded-2xl shadow-sm border-0 hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Billers
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {reportData.biller_spending.length}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Service providers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Spending Trend */}
          <Card className="bg-white rounded-2xl shadow-sm border-0 col-span-1 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                Monthly Spending Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData}>
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
                      formatter={(value: number) => [`ETB ${value}`, 'Amount']}
                      labelFormatter={(label) => `Month: ${label}`}
                      contentStyle={{ 
                        backgroundColor: '#fff',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="amount" 
                      fill="#4F46E5" 
                      radius={[4, 4, 0, 0]}
                      name="Spending"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Spending by Biller */}
          <Card className="bg-white rounded-2xl shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Spending by Biller
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={billerChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {billerChartData.map((entry, index) => (
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

          {/* Payment Distribution */}
          <Card className="bg-white rounded-2xl shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                Payment Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendingDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {spendingDistributionData.map((entry, index) => (
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

          {/* Bill Status Overview */}
          <Card className="bg-white rounded-2xl shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-600" />
                Bill Status Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paymentStatusData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#6B7280' }}
                      axisLine={{ stroke: '#E5E7EB' }}
                    />
                    <YAxis 
                      tick={{ fill: '#6B7280' }}
                      axisLine={{ stroke: '#E5E7EB' }}
                    />
                    <Tooltip />
                    <Bar 
                      dataKey="value" 
                      radius={[4, 4, 0, 0]}
                      name="Number of Bills"
                    >
                      {paymentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white rounded-2xl shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Average Monthly Spend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {reportData.monthly_spending.length > 0 
                  ? formatCurrency(
                      reportData.monthly_spending.reduce((sum, item) => sum + Number(item.total), 0) / 
                      reportData.monthly_spending.length
                    )
                  : formatCurrency(0)
                }
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Top Biller
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {reportData.biller_spending.length > 0 
                  ? reportData.biller_spending[0].bill__biller__name
                  : 'N/A'
                }
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {reportData.biller_spending.length > 0 
                  ? formatCurrency(reportData.biller_spending[0].total)
                  : ''
                }
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Payment Efficiency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {reportData.total_spent + reportData.outstanding_payments.total_due > 0
                  ? `${Math.round((reportData.total_spent / (reportData.total_spent + reportData.outstanding_payments.total_due)) * 100)}%`
                  : '100%'
                }
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Of total bills paid
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}