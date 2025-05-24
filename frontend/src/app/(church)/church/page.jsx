"use client";

import { useAuth } from "@/hooks/auth";

const Dashboard = () => {
  const { user } = useAuth({ middleware: "auth" });

  if (user?.profile?.system_role_id !== 2) {
    return <div className="py-12 text-center">Unauthorized</div>;
  }

  return (
    <div className="py-12 lg:ml-75 mx-3">
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
          <div className="p-6 bg-white border-b border-gray-200">
            <h2 className="text-lg font-semibold">Church Owner Dashboard</h2>
            <p>Welcome, {user.profile.first_name}!</p>
            <p>Manage your churches and subscriptions from here.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
