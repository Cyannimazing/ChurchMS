"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/auth.jsx";
import axios from "@/lib/axios";
import dynamic from "next/dynamic";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Users,
  Activity,
  CreditCard,
} from "lucide-react";

// Dynamically import recharts components
const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });
const LineChart = dynamic(() => import("recharts").then(m => m.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then(m => m.Line), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then(m => m.CartesianGrid), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false });
const Legend = dynamic(() => import("recharts").then(m => m.Legend), { ssr: false });
const BarChart = dynamic(() => import("recharts").then(m => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then(m => m.Bar), { ssr: false });
const PieChart = dynamic(() => import("recharts").then(m => m.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then(m => m.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then(m => m.Cell), { ssr: false });
const AreaChart = dynamic(() => import("recharts").then(m => m.AreaChart), { ssr: false });
const Area = dynamic(() => import("recharts").then(m => m.Area), { ssr: false });

const COLORS = {
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#6366f1",
  purple: "#8b5cf6",
  teal: "#14b8a6",
  pink: "#ec4899",
};

const Dashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get("/api/admin/dashboard/analytics");
        setAnalytics(response.data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="lg:p-6 w-full min-h-screen pt-20">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="lg:p-6 w-full min-h-screen pt-20">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Unable to load analytics data.</p>
        </div>
      </div>
    );
  }

  const { earnings, churches, subscriptions, payment_methods, recent_transactions, recent_applications } = analytics;

  // Prepare data for charts
  const churchStatusData = Object.keys(churches.by_status || {}).map((key) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: churches.by_status[key],
  }));

  const subscriptionStatusData = Object.keys(subscriptions.by_status || {}).map((key) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: subscriptions.by_status[key],
  }));

  const statusColors = {
    Pending: COLORS.warning,
    Active: COLORS.success,
    Rejected: COLORS.danger,
    Approved: COLORS.success,
    Expired: COLORS.danger,
    pending: COLORS.warning,
    active: COLORS.success,
    rejected: COLORS.danger,
    approved: COLORS.success,
    expired: COLORS.danger,
  };

  return (
    <div className="lg:p-6 w-full min-h-screen pt-20">
      <div className="w-full">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="p-6 bg-white border-b border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-900">Admin Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Platform-wide subscription earnings and church management overview</p>
          </div>
          <div className="p-6">
            {/* SUBSCRIPTION EARNINGS OVERVIEW */}
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Subscription Earnings</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm border border-green-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700">Total Earnings</p>
                      <p className="text-2xl font-bold text-green-900 mt-2">₱{earnings.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="bg-green-200 p-3 rounded-full">
                      <DollarSign className="h-6 w-6 text-green-700" />
                    </div>
                  </div>
                  <p className="text-xs text-green-600 mt-4">All-time revenue</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm border border-blue-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700">Daily Earnings</p>
                      <p className="text-2xl font-bold text-blue-900 mt-2">₱{earnings.daily.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="bg-blue-200 p-3 rounded-full">
                      <Activity className="h-6 w-6 text-blue-700" />
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 mt-4">Today's revenue</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-sm border border-purple-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700">Monthly Earnings</p>
                      <p className="text-2xl font-bold text-purple-900 mt-2">₱{earnings.monthly.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="bg-purple-200 p-3 rounded-full">
                      <Calendar className="h-6 w-6 text-purple-700" />
                    </div>
                  </div>
                  <p className="text-xs text-purple-600 mt-4">This month's revenue</p>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg shadow-sm border border-indigo-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-indigo-700">Yearly Earnings</p>
                      <p className="text-2xl font-bold text-indigo-900 mt-2">₱{earnings.yearly.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="bg-indigo-200 p-3 rounded-full">
                      <TrendingUp className="h-6 w-6 text-indigo-700" />
                    </div>
                  </div>
                  <p className="text-xs text-indigo-600 mt-4">This year's revenue</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings Trend (Last 12 Months)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={earnings.per_month}>
                      <defs>
                        <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={COLORS.success} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="earnings" stroke={COLORS.success} fillOpacity={1} fill="url(#colorEarnings)" name="Earnings (₱)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Earnings (Last 30 Days)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={earnings.per_day}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="earnings" stroke={COLORS.primary} strokeWidth={2} name="Earnings (₱)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods Breakdown</h3>
                  <div className="space-y-4">
                    {payment_methods.length > 0 ? (
                      payment_methods.map((method, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <CreditCard className="h-5 w-5 text-blue-600 mr-3" />
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{method.method || 'Unknown'}</p>
                              <p className="text-xs text-gray-500">{method.count} transactions</p>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-blue-600">₱{method.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">No payment data available</div>
                    )}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Plans Distribution</h3>
                  <div className="space-y-4">
                    {subscriptions.by_plan.length > 0 ? (
                      subscriptions.by_plan.map((plan, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{plan.plan_name}</p>
                            <p className="text-xs text-gray-500">{plan.count} active subscriptions</p>
                          </div>
                          <p className="text-sm font-bold text-purple-600">₱{plan.total_revenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">No active subscriptions yet</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* CHURCH APPLICATIONS OVERVIEW */}
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Church Applications & Management</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Churches</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">{churches.total}</p>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-full"><FileText className="h-6 w-6 text-gray-600" /></div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Applications</p>
                      <p className="text-2xl font-bold text-yellow-600 mt-2">{churches.pending}</p>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded-full"><Clock className="h-6 w-6 text-yellow-600" /></div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Approved Churches</p>
                      <p className="text-2xl font-bold text-green-600 mt-2">{churches.approved}</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full"><CheckCircle className="h-6 w-6 text-green-600" /></div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Rejected Applications</p>
                      <p className="text-2xl font-bold text-red-600 mt-2">{churches.rejected}</p>
                    </div>
                    <div className="bg-red-100 p-3 rounded-full"><XCircle className="h-6 w-6 text-red-600" /></div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Published Churches</p>
                      <p className="text-2xl font-bold text-blue-600 mt-2">{churches.published}</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full"><Users className="h-6 w-6 text-blue-600" /></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Church Status Distribution</h3>
                  {churchStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={churchStatusData} cx="50%" cy="50%" labelLine={true} outerRadius={85} dataKey="value" label={(entry) => entry.name}>
                          {churchStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={statusColors[entry.name] || COLORS.info} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500">No church data available</div>
                  )}
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Church Applications (Last 12 Months)</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={churches.per_month}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill={COLORS.info} name="Applications" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* SUBSCRIPTION MANAGEMENT */}
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Subscription Management</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                      <p className="text-2xl font-bold text-green-600 mt-2">{subscriptions.active}</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full"><CheckCircle className="h-6 w-6 text-green-600" /></div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Expired Subscriptions</p>
                      <p className="text-2xl font-bold text-red-600 mt-2">{subscriptions.expired}</p>
                    </div>
                    <div className="bg-red-100 p-3 rounded-full"><XCircle className="h-6 w-6 text-red-600" /></div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Subscriptions</p>
                      <p className="text-2xl font-bold text-yellow-600 mt-2">{subscriptions.pending}</p>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded-full"><Clock className="h-6 w-6 text-yellow-600" /></div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Status Breakdown</h3>
                {subscriptionStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={subscriptionStatusData} cx="50%" cy="50%" labelLine={true} outerRadius={85} dataKey="value" label={(entry) => entry.name}>
                        {subscriptionStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={statusColors[entry.name] || COLORS.info} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">No subscription data available</div>
                )}
              </div>
            </div>

            {/* RECENT ACTIVITY */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recent_transactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.reference_number}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{transaction.plan_name}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">₱{transaction.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              transaction.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 
                              transaction.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {transaction.payment_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {recent_transactions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">No recent transactions</div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Church Applications</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Church</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recent_applications.map((application) => (
                        <tr key={application.id}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{application.church_name}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{application.owner_name}</td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              application.status === 'Active' || application.status === 'approved' ? 'bg-green-100 text-green-800' :
                              application.status === 'Pending' || application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {application.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {recent_applications.length === 0 && (
                    <div className="text-center py-8 text-gray-500">No recent applications</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
