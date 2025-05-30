"use client";

import { useState, useEffect } from "react";
import axios from "@/lib/axios";
import { toast, Toaster } from "react-hot-toast";
import { Download, Eye, Loader2 } from "lucide-react";
import DataLoading from "@/components/DataLoading";

const Dashboard = () => {
  const [churches, setChurches] = useState([]);
  const [selectedChurch, setSelectedChurch] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [reviewedChurches, setReviewedChurches] = useState(new Set());

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
    <div className="lg:ml-72 mx-3 py-12">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
          <div className="p-6 bg-white border-b border-gray-200">
            <h1 className="text-2xl font-bold mb-6 text-gray-900">
              Application Dashboard
            </h1>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documents
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                      <td colSpan={7} className="px-6 py-4">
                        <DataLoading message="Loading churches..." />
                      </td>
                    </tr>
                  ) : churches.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center">
                        No churches available.
                      </td>
                    </tr>
                  ) : (
                    churches.map((church) => (
                      <tr key={church.ChurchID}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {church.ChurchID}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {church.ChurchName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              church.ChurchStatus === "Active"
                                ? "bg-green-100 text-green-800"
                                : church.ChurchStatus === "Rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {church.ChurchStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {church.Owner}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {church.Description || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {church.DocumentCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => fetchDocuments(church.ChurchID)}
                            className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                            aria-label={`Review application for ${church.ChurchName}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </button>
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
