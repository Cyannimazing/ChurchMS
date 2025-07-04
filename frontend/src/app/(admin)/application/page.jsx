"use client";

import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { toast, Toaster } from "react-hot-toast";
import { Download, Eye, Loader2 } from "lucide-react";
import DataLoading from "@/components/DataLoading";
import SearchAndPagination from "@/components/SearchAndPagination";
import { filterAndPaginateData } from "@/utils/tableUtils";

const Dashboard = () => {
  const [churches, setChurches] = useState([]);
  const [selectedChurch, setSelectedChurch] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [reviewedChurches, setReviewedChurches] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Define search fields
  const searchFields = ['ChurchName', 'Owner', 'OwnerProfile.FullName'];

  // Handle search query change and reset pagination
  const handleSearchChange = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Filter for pending applications only and order by submission date (first submitted first)
  const pendingChurches = churches
    .filter(church => church.ChurchStatus === "Pending")
    .sort((a, b) => new Date(a.created_at || a.CreatedDate || a.SubmissionDate) - new Date(b.created_at || b.CreatedDate || b.SubmissionDate));

  // Get filtered and paginated data
  const { data: paginatedChurches, pagination } = filterAndPaginateData(
    pendingChurches,
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
        toast.error(errorMessage);
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

  // Fetch documents for a specific church when the eye icon is clicked
  const fetchDocuments = async (churchId) => {
    try {
      const response = await axios.get(`/api/churches/${churchId}/documents`);
      setSelectedChurch(response.data.church);
      setDocuments(response.data.documents);
      // Add the churchId to reviewedChurches set and log for debugging
      setReviewedChurches((prev) => {
        const updated = new Set(prev).add(churchId);
        console.log("Reviewed Churches:", Array.from(updated));
        return updated;
      });
      setIsModalOpen(true);
    } catch (error) {
      const errorData = error.response?.data || {};
      const errorMessage = errorData.message
        ? `${errorData.error}: ${errorData.message} (${errorData.file}:${errorData.line})`
        : errorData.error || "Failed to fetch documents";
      toast.error(errorMessage);
      console.error("Fetch documents error:", {
        churchId,
        status: error.response?.status,
        data: errorData,
      });
    }
  };

  // Update the status of a church (Accept or Reject)
  const updateStatus = async (churchId, status) => {
    setIsUpdating(true);
    console.log("isUpdating set to true");
    try {
      const response = await axios.put(`/api/churches/${churchId}/status`, {
        ChurchStatus: status,
      });
      toast.success(response.data.message);
      setChurches((prev) =>
        prev.map((church) =>
          church.ChurchID === churchId
            ? { ...church, ChurchStatus: status }
            : church
        )
      );
      if (selectedChurch?.ChurchID === churchId) {
        setSelectedChurch({ ...selectedChurch, ChurchStatus: status });
      }
      setIsModalOpen(false);
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Failed to update status";
      toast.error(errorMessage);
      console.error("Update status error:", {
        churchId,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    } finally {
      setIsUpdating(false);
      console.log("isUpdating set to false");
    }
  };

  // Preview a document in a new tab
  const previewDocument = async (documentId) => {
    try {
      const response = await axios.get(`/api/documents/${documentId}`, {
        responseType: "blob",
      });

      if (response.headers["content-type"].includes("application/json")) {
        const text = await response.data.text();
        const json = JSON.parse(text);
        throw new Error(json.error || "Invalid document response");
      }

      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const errorMessage = error.message || "Failed to preview document";
      toast.error(errorMessage);
      console.error("Preview document error:", {
        documentId,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }
  };

  // Download a document
  const downloadDocument = async (documentId, documentType) => {
    try {
      const response = await axios.get(`/api/documents/${documentId}`, {
        responseType: "blob",
      });

      if (response.headers["content-type"].includes("application/json")) {
        const text = await response.data.text();
        const json = JSON.parse(text);
        throw new Error(json.error || "Invalid document response");
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const extension =
        response.headers["content-type"].split("/")[1] || "file";
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${documentType}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const errorMessage = error.message || "Failed to download document";
      toast.error(errorMessage);
      console.error("Download document error:", {
        documentId,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }
  };

  return (
    <div className="p-6 w-full h-screen">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto h-full">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg h-full flex flex-col">
          <div className="p-6 bg-white border-b border-gray-200 flex-1 overflow-auto">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">
              Application Dashboard
            </h1>
            <div className="overflow-x-auto">
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Pending Church Applications</h3>
                  <p className="mt-1 text-sm text-gray-600">Review pending church registration applications (ordered by submission date)</p>
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
                    placeholder="Search pending applications..."
                  />
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 table-fixed">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">
                          Church Details
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                          Owner
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                          Status
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
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
                          <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                            {searchQuery ? 'No pending applications found matching your search.' : 'No pending applications available.'}
                          </td>
                        </tr>
                      ) : (
                        paginatedChurches.map((church) => (
                          <tr key={church.ChurchID} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                  {church.ChurchProfile?.ProfilePictureUrl ? (
                                    <img
                                      src={church.ChurchProfile.ProfilePictureUrl}
                                      alt={`${church.ChurchName} profile`}
                                      className="h-12 w-12 rounded-full object-cover border-2 border-indigo-100"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <div className={`h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center ${church.ChurchProfile?.ProfilePictureUrl ? 'hidden' : ''}`}>
                                    <span className="text-sm font-medium text-indigo-600">
                                      {church.ChurchName.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {church.ChurchName}
                                  </p>
                                  <div className="flex items-center mt-1 space-x-3 flex-wrap">
                                    <span className="text-xs text-gray-400">
                                      {church.DocumentCount} documents
                                    </span>
                                    {church.Location?.Latitude && church.Location?.Longitude && (
                                      <span className="text-xs text-gray-400">
                                        📍 {typeof church.Location.Latitude === 'number' ? church.Location.Latitude.toFixed(8) : church.Location.Latitude}, {typeof church.Location.Longitude === 'number' ? church.Location.Longitude.toFixed(8) : church.Location.Longitude}
                                      </span>
                                    )}
                                    {church.IsPublic && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Public
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">
                                {church.OwnerProfile?.FullName || church.Owner}
                              </div>
                              <div className="text-xs text-gray-500">
                                {church.OwnerProfile?.FullName ? church.Owner : 'Church Owner'}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  church.ChurchStatus === "Active"
                                    ? "bg-green-100 text-green-800"
                                    : church.ChurchStatus === "Rejected"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {church.ChurchStatus === "Active" && (
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                                {church.ChurchStatus === "Rejected" && (
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                )}
                                {church.ChurchStatus === "Pending" && (
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                  </svg>
                                )}
                                {church.ChurchStatus}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-center">
                                <button
                                  onClick={() => fetchDocuments(church.ChurchID)}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                  aria-label={`Review application for ${church.ChurchName}`}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Review
                                </button>
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

      {isModalOpen && selectedChurch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg">
            {/* Modal Header */}
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {selectedChurch.ChurchName}
            </h2>

            {/* Current Status Section */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-1">
                Current Status
              </p>
              <span
                className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                  selectedChurch.ChurchStatus === "Active"
                    ? "bg-green-100 text-green-800"
                    : selectedChurch.ChurchStatus === "Rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {selectedChurch.ChurchStatus}
              </span>
            </div>

            {/* Documents Section */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Documents
              </p>
              {documents.length === 0 ? (
                <p className="text-gray-500 text-sm">No documents available</p>
              ) : (
                <ul className="space-y-3 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {documents.map((doc) => (
                    <li
                      key={doc.DocumentID}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                    >
                      <div>
                        <p className="text-gray-800 text-sm">
                          {doc.DocumentType}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(doc.SubmissionDate).toLocaleDateString()}
                        </p>
                        {doc.FileExists === false && (
                          <p className="text-xs text-red-500">File not found</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => previewDocument(doc.DocumentID)}
                          className="text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                          disabled={doc.FileExists === false}
                          aria-label={`Preview ${doc.DocumentType}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            downloadDocument(doc.DocumentID, doc.DocumentType)
                          }
                          className="text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                          disabled={doc.FileExists === false}
                          aria-label={`Download ${doc.DocumentType}`}
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Update Status Section */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Update Application Status
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    updateStatus(selectedChurch.ChurchID, "Active")
                  }
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  disabled={
                    !reviewedChurches.has(selectedChurch.ChurchID) || isUpdating
                  }
                >
                  Accept Application
                </button>
                <button
                  onClick={() =>
                    updateStatus(selectedChurch.ChurchID, "Rejected")
                  }
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  disabled={
                    !reviewedChurches.has(selectedChurch.ChurchID) || isUpdating
                  }
                >
                  Reject Application
                </button>
              </div>
              {isUpdating && (
                <div className="flex justify-center mt-3">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                </div>
              )}
              {!reviewedChurches.has(selectedChurch.ChurchID) && (
                <p className="text-xs text-red-500 mt-2 text-center">
                  Please review documents before updating status
                </p>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
