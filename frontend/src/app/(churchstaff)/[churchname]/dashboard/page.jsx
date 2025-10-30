"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/auth.jsx";
import axios from "@/lib/axios";
import dynamic from "next/dynamic";
import {
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

// Dynamically import recharts components to avoid server-side module resolution issues
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

const COLORS = {
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#6366f1",
  purple: "#8b5cf6",
};

const Dashboard = () => {
  const { churchname } = useParams();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        let churchId = null;
        
        if (user?.profile?.system_role?.role_name === "ChurchStaff") {
          churchId = user?.church?.ChurchID;
        } else if (user?.profile?.system_role?.role_name === "ChurchOwner") {
          const currentChurch = user?.churches?.find(
            (church) => church.ChurchName.toLowerCase().replace(/\s+/g, "-") === churchname
          );
          churchId = currentChurch?.ChurchID;
        }

        const response = await axios.get("/api/dashboard/analytics", {
          params: { church_id: churchId },
        });
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
  }, [user, churchname]);

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

  const { financial, appointments, members, recent_transactions } = analytics;

  // Prepare data for charts
  const appointmentStatusData = Object.keys(appointments.by_status || {}).map((key) => ({
    name: key,
    value: appointments.by_status[key],
  }));

  const memberStatusData = Object.keys(members.by_status || {}).map((key) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: members.by_status[key],
  }));

  const statusColors = {
    Pending: COLORS.warning,
    Confirmed: COLORS.success,
    Completed: COLORS.info,
    Cancelled: COLORS.danger,
    pending: COLORS.warning,
    approved: COLORS.success,
    rejected: COLORS.danger,
  };

  return (
    <div className="lg:p-6 w-full min-h-screen pt-20">
      <div className="w-full">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="p-6 bg-white border-b border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-1">Overview of your church management metrics</p>
          </div>
          <div className="p-6">
            {/* Financial Overview */}
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Financial Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Collection</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">₱{financial.total_collection.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-4">All-time revenue</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">This Month</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">₱{financial.current_month_collection.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-4">Current month revenue</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">Total Refunded</h3>
                    <XCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <p className="text-2xl font-bold text-red-600">₱{financial.total_refunded.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend (Last 6 Months)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={financial.revenue_per_month}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke={COLORS.primary} strokeWidth={2} name="Revenue (₱)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recent_transactions.map((transaction) => (
                          <tr key={transaction.id}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.receipt_code}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{transaction.user_name}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{transaction.service_name}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">₱{transaction.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{transaction.payment_method}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{new Date(transaction.transaction_date).toLocaleDateString()}</td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              {transaction.is_refunded ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Refunded</span>
                              ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Completed</span>
                              )}
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
              </div>
            </div>

            {/* Appointments Overview */}
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Appointments Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">{appointments.total}</p>
                      <p className="text-xs text-gray-500 mt-2">{appointments.cancelled} cancelled</p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-full"><Calendar className="h-6 w-6 text-purple-600" /></div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">Appointment Status</h3>
                    <AlertCircle className="h-5 w-5 text-blue-500" />
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={appointmentStatusData} cx="50%" cy="50%" labelLine={false} outerRadius={70} dataKey="value">
                        {appointmentStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={statusColors[entry.name] || COLORS.info} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointments Trend (Last 6 Months)</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={appointments.per_month}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill={COLORS.purple} name="Appointments" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Members Overview */}
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Members Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Members</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">{members.total}</p>
                    </div>
                    <div className="bg-indigo-100 p-3 rounded-full"><Users className="h-6 w-6 text-indigo-600" /></div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">Pending Member Applications</h3>
                    <Clock className="h-5 w-5 text-yellow-500" />
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">{members.pending}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">Approved Members</h3>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">{members.approved}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Member Application Status</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={memberStatusData} cx="50%" cy="50%" labelLine={false} outerRadius={85} dataKey="value">
                        {memberStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={statusColors[entry.name.toLowerCase()] || COLORS.info} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Member Applications (Last 6 Months)</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={members.per_month}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill={COLORS.success} name="Applications" />
                    </BarChart>
                  </ResponsiveContainer>
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
