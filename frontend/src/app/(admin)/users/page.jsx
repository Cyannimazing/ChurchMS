"use client";
import React, { useState, useEffect } from "react";
import { Eye, CheckCircle, XCircle, Ban } from "lucide-react";
import DataLoading from "@/components/DataLoading";
import Alert from "@/components/Alert";
import SearchAndPagination from "@/components/SearchAndPagination";
import { filterAndPaginateData } from "@/utils/tableUtils";
import axios from "@/lib/axios";
import Link from "next/link";
import Button from "@/components/Button";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingUserId, setLoadingUserId] = useState(null);
  const [alert, setAlert] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, userId: null, userName: "", action: "disable" });
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Define search fields
  const searchFields = ['full_name', 'email', 'system_role_name'];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("/api/users_list");
        console.log("Fetched users:", response.data);
        setUsers(response.data);
      } catch (error) {
        const errorMessage =
          error.response?.data?.error || "Failed to fetch users";
        setAlert({
          type: 'error',
          title: 'Error Loading Users',
          message: errorMessage
        });
        console.error("Fetch users error:", {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleDisableClick = (userId, userName) => {
    setConfirmDialog({ isOpen: true, userId, userName, action: "disable" });
  };

  const handleEnableClick = (userId, userName) => {
    setConfirmDialog({ isOpen: true, userId, userName, action: "enable" });
  };

  const confirmAction = async () => {
    const { userId, userName, action } = confirmDialog;
    const isDisabling = action === "disable";
    setIsProcessing(true);
    setLoadingUserId(userId);

    try {
      await axios.put(`/api/users/${userId}/update-active`, {
        is_active: !isDisabling
      });
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_active: !isDisabling } : user
      ));
      setAlert({
        type: 'success',
        title: isDisabling ? 'User Disabled' : 'User Enabled',
        message: `"${userName}" has been ${isDisabling ? 'disabled' : 'enabled'} successfully.`
      });
    } catch (error) {
      const errorMessage = error.response?.data?.error || `Failed to ${action} user`;
      setAlert({
        type: 'error',
        title: `${action.charAt(0).toUpperCase() + action.slice(1)} Failed`,
        message: errorMessage
      });
    } finally {
      setLoadingUserId(null);
      setIsProcessing(false);
      setConfirmDialog({ isOpen: false, userId: null, userName: "", action: "disable" });
    }
  };

  // Handle search query change and reset pagination
  const handleSearchChange = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Get filtered and paginated data
  const { data: paginatedUsers, pagination } = filterAndPaginateData(
    users,
    searchQuery,
    searchFields,
    currentPage,
    itemsPerPage
  );

  return (
    <div className="lg:p-6 w-full h-screen pt-20">
      <div className="w-full mx-auto h-full">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg h-full flex flex-col">
          <div className="p-6 bg-white border-b border-gray-200 flex-1 overflow-auto">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Users</h1>
            
            {alert && (
              <div className="mb-6">
                <Alert
                  type={alert.type}
                  title={alert.title}
                  message={alert.message}
                  onClose={() => setAlert(null)}
                />
              </div>
            )}
            
            <div className="overflow-x-auto">
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">User Management</h3>
                  <p className="mt-1 text-sm text-gray-600">Manage system users and their access permissions</p>
                </div>
                
                <div className="px-6 py-4">
                  <SearchAndPagination
                    searchQuery={searchQuery}
                    onSearchChange={handleSearchChange}
                    currentPage={currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                    totalItems={pagination.totalItems}
                    itemsPerPage={itemsPerPage}
                    placeholder="Search users..."
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody
                      className="bg-white divide-y divide-gray-200"
                      aria-live="polite"
                    >
                      {isLoading ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-8">
                            <DataLoading message="Loading users..." />
                          </td>
                        </tr>
                      ) : paginatedUsers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                            {searchQuery ? 'No users found matching your search.' : 'No users available.'}
                          </td>
                        </tr>
                      ) : (
                        paginatedUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                    <span className="text-xs font-medium text-indigo-600">
                                      {user.full_name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {user.full_name}
                                  </div>
                                  {user.email && (
                                    <div className="text-xs text-gray-500 truncate">
                                      {user.email}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-gray-900">
                                {user.system_role_name}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  user.is_active
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {user.is_active ? (
                                  <>
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Active
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Inactive
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-center items-center space-x-2">
                                <Link href={`/users/${user.id}`}>
                                  <Button variant="outline" className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200 min-h-0 h-auto">
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                </Link>
                                {user.is_active ? (
                                  <Button 
                                    onClick={() => handleDisableClick(user.id, user.full_name)}
                                    variant="outline" 
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border-red-200 min-h-0 h-auto"
                                    disabled={loadingUserId === user.id}
                                  >
                                    <Ban className="h-3 w-3 mr-1" />
                                    {loadingUserId === user.id ? 'Processing...' : 'Disable'}
                                  </Button>
                                ) : (
                                  <Button 
                                    onClick={() => handleEnableClick(user.id, user.full_name)}
                                    variant="outline" 
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border-green-200 min-h-0 h-auto"
                                    disabled={loadingUserId === user.id}
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    {loadingUserId === user.id ? 'Processing...' : 'Enable'}
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, userId: null, userName: "", action: "disable" })}
        onConfirm={confirmAction}
        title={confirmDialog.action === "disable" ? "Disable User" : "Enable User"}
        message={
          confirmDialog.action === "disable"
            ? `Are you sure you want to disable "${confirmDialog.userName}"? They will not be able to log in.`
            : `Are you sure you want to enable "${confirmDialog.userName}"? They will be able to log in again.`
        }
        confirmText="OK"
        cancelText="Cancel"
        type="warning"
        isLoading={isProcessing}
      />
    </div>
  );
}
