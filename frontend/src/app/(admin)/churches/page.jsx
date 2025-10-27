"use client";

import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import {
  Eye,
  Edit,
  MapPin,
  Users,
  Calendar,
  Phone,
  Mail,
  Globe,
  CheckCircle,
  XCircle,
} from "lucide-react";
import DataLoading from "@/components/DataLoading";
import Alert from "@/components/Alert";
import SearchAndPagination from "@/components/SearchAndPagination";
import { filterAndPaginateData } from "@/utils/tableUtils";
import Button from "@/components/Button";

const ActiveChurches = () => {
  const [churches, setChurches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Define search fields
  const searchFields = [
    "ChurchName",
    "Owner",
    "OwnerProfile.FullName",
    "ChurchProfile.Description",
    "ChurchProfile.ParishDetails",
  ];

  // Handle search query change and reset pagination
  const handleSearchChange = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Filter for active churches only and order by church name
  const activeChurches = churches
    .filter((church) => church.ChurchStatus === "Active")
    .sort((a, b) => a.ChurchName.localeCompare(b.ChurchName));

  // Get filtered and paginated data
  const { data: paginatedChurches, pagination } = filterAndPaginateData(
    activeChurches,
    searchQuery,
    searchFields,
    currentPage,
    itemsPerPage
  );

  // Fetch the list of churches on component mount
  useEffect(() => {
    const fetchChurches = async () => {
      try {
        const response = await axios.get("/api/churches");
        setChurches(response.data.churches);
      } catch (error) {
        const errorMessage =
          error.response?.data?.error || "Failed to fetch churches";
        setAlert({
          type: "error",
          title: "Error Loading Churches",
          message: errorMessage,
        });
        console.error("Fetch churches error:", {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchChurches();
  }, []);

  // View church details
  const viewChurchDetails = async (churchId) => {
    // TODO: Implement view church details functionality
    console.log("View church details for church ID:", churchId);
    setAlert({
      type: "info",
      title: "View Church",
      message: "View functionality - Coming soon!",
    });
  };

  // Edit church details
  const editChurchDetails = async (churchId) => {
    // TODO: Implement edit church details functionality
    console.log("Edit church details for church ID:", churchId);
    setAlert({
      type: "info",
      title: "Edit Church",
      message: "Edit functionality - Coming soon!",
    });
  };

  return (
    <div className="lg:p-6 w-full h-screen pt-20">
      <div className="w-full mx-auto h-full">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg h-full flex flex-col">
          <div className="p-6 bg-white border-b border-gray-200 flex-1 overflow-auto">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">
              Active Churches
            </h1>

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
                  <h3 className="text-lg font-medium text-gray-900">
                    Church Directory
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Manage and view all active churches in the system
                  </p>
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
                    placeholder="Search churches by name, owner, location..."
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Church Details
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Owner
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location & Info
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
                            <DataLoading message="Loading churches..." />
                          </td>
                        </tr>
                      ) : paginatedChurches.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-6 py-8 text-center text-gray-500"
                          >
                            {searchQuery
                              ? "No active churches found matching your search."
                              : "No active churches available."}
                          </td>
                        </tr>
                      ) : (
                        paginatedChurches.map((church) => (
                          <tr
                            key={church.ChurchID}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                  {church.ChurchProfile?.ProfilePictureUrl ? (
                                    <img
                                      src={
                                        church.ChurchProfile.ProfilePictureUrl
                                      }
                                      alt={`${church.ChurchName} profile`}
                                      className="h-10 w-10 rounded-full object-cover border-2 border-green-100"
                                      onError={(e) => {
                                        e.target.style.display = "none";
                                        e.target.nextSibling.style.display =
                                          "flex";
                                      }}
                                    />
                                  ) : null}
                                  <div
                                    className={`h-10 w-10 rounded-full bg-green-100 flex items-center justify-center ${
                                      church.ChurchProfile?.ProfilePictureUrl
                                        ? "hidden"
                                        : ""
                                    }`}
                                  >
                                    <span className="text-xs font-medium text-green-600">
                                      {church.ChurchName.charAt(
                                        0
                                      ).toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {church.ChurchName}
                                  </p>
                                  <div className="flex items-center mt-1 space-x-2 flex-wrap">
                                    {church.ChurchProfile?.Location && (
                                      <span className="inline-flex items-center text-xs text-gray-500 truncate">
                                        <MapPin className="h-3 w-3 mr-1" />
                                        {church.ChurchProfile.Location}
                                      </span>
                                    )}
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Active
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-gray-900 truncate">
                                {church.OwnerProfile?.FullName || church.Owner}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {church.OwnerProfile?.FullName
                                  ? church.Owner
                                  : "Church Owner"}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="space-y-1">
                                {church.Location?.Latitude &&
                                  church.Location?.Longitude && (
                                    <div className="text-xs text-gray-600 truncate">
                                      📍{" "}
                                      {typeof church.Location.Latitude ===
                                      "number"
                                        ? church.Location.Latitude.toFixed(4)
                                        : church.Location.Latitude}
                                      ,{" "}
                                      {typeof church.Location.Longitude ===
                                      "number"
                                        ? church.Location.Longitude.toFixed(4)
                                        : church.Location.Longitude}
                                    </div>
                                  )}
                                {church.DocumentCount && (
                                  <div className="text-xs text-gray-600">
                                    📄 {church.DocumentCount} docs
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-center items-center space-x-2">
                                <Button
                                  onClick={() =>
                                    viewChurchDetails(church.ChurchID)
                                  }
                                  variant="outline"
                                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200 min-h-0 h-auto"
                                  aria-label={`View details for ${church.ChurchName}`}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                                <Button
                                  onClick={() =>
                                    editChurchDetails(church.ChurchID)
                                  }
                                  variant="outline"
                                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 min-h-0 h-auto"
                                  aria-label={`Edit details for ${church.ChurchName}`}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
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
    </div>
  );
};

export default ActiveChurches;
