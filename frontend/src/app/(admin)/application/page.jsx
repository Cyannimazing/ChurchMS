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

  useEffect(() => {
    const fetchChurches = async () => {
      try {
        await axios.get("/sanctum/csrf-cookie");
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

  const fetchDocuments = async (churchId) => {
    try {
      await axios.get("/sanctum/csrf-cookie");
      const response = await axios.get(`/api/churches/${churchId}/documents`);
      setSelectedChurch(response.data.church);
      setDocuments(response.data.documents);
      setReviewedChurches(new Set(reviewedChurches).add(churchId));
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

  const updateStatus = async (churchId, status) => {
    setIsUpdating(true);
    try {
      await axios.get("/sanctum/csrf-cookie");
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
    }
  };

  const previewDocument = async (documentId) => {
    try {
      await axios.get("/sanctum/csrf-cookie");
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

  const downloadDocument = async (documentId, documentType) => {
    try {
      await axios.get("/sanctum/csrf-cookie");
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
            APPLICATION DASHBOARD
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          {church.ChurchID}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          {church.Owner}
                        </td>
                        <td className="px-6 py-4">
                          {church.Description || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {church.DocumentCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => fetchDocuments(church.ChurchID)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Eye className="h-5 w-5" />
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <h2 className="text-xl font-bold mb-4">
              {selectedChurch.ChurchName}
            </h2>
            <div className="space-y-4">
              <p>
                <strong>Status:</strong> {selectedChurch.ChurchStatus}
              </p>
              <div>
                <strong>Update Status:</strong>
                <select
                  className="ml-2 p-1 border rounded"
                  value={selectedChurch.ChurchStatus}
                  onChange={(e) =>
                    updateStatus(selectedChurch.ChurchID, e.target.value)
                  }
                  disabled={
                    !reviewedChurches.has(selectedChurch.ChurchID) || isUpdating
                  }
                >
                  {reviewedChurches.has(selectedChurch.ChurchID) ? (
                    <>
                      <option value="Pending">Pending</option>
                      <option value="Active">Active</option>
                      <option value="Rejected">Rejected</option>
                    </>
                  ) : (
                    <option value={selectedChurch.ChurchStatus}>
                      {selectedChurch.ChurchStatus}
                    </option>
                  )}
                </select>
                {isUpdating && (
                  <Loader2 className="inline ml-2 h-4 w-4 animate-spin" />
                )}
                {!reviewedChurches.has(selectedChurch.ChurchID) && (
                  <p className="text-sm text-red-500 mt-1">
                    Review documents to enable status update
                  </p>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold">Documents</h3>
                {documents.length === 0 ? (
                  <p>No documents available</p>
                ) : (
                  <ul className="space-y-2">
                    {documents.map((doc) => (
                      <li
                        key={doc.DocumentID}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p>{doc.DocumentType}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(doc.SubmissionDate).toLocaleDateString()}
                          </p>
                          {doc.FileExists === false && (
                            <p className="text-sm text-red-500">
                              File not found
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => previewDocument(doc.DocumentID)}
                            className="text-indigo-600 hover:text-indigo-900"
                            disabled={doc.FileExists === false}
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() =>
                              downloadDocument(doc.DocumentID, doc.DocumentType)
                            }
                            className="text-indigo-600 hover:text-indigo-900"
                            disabled={doc.FileExists === false}
                          >
                            <Download className="h-5 w-5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
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
