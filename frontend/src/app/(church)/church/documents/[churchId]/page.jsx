"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import axios from "@/lib/axios";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Download,
  AlertCircle,
  CheckCircle,
  Edit,
  ExternalLink,
  Loader2,
} from "lucide-react";
import Button from "@/components/Button";

const DocumentsPage = () => {
  const router = useRouter();
  const params = useParams();
  const churchId = params.churchId;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [church, setChurch] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isDocumentLoading, setIsDocumentLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch both church info and documents from a single endpoint
        const response = await axios.get(`/api/churches/${churchId}/documents`);
        // Remove console.log for production
        setChurch(response.data.church);
        
        // Map documents and add FileExists flag if missing
        const mappedDocuments = (response.data.documents || []).map(doc => ({
          ...doc,
          FileExists: doc.FileExists !== undefined ? doc.FileExists : true
        }));
        
        setDocuments(mappedDocuments);
        
        // Log data for debugging
        console.log("Fetched church data:", response.data.church);
        console.log("Fetched documents:", mappedDocuments);
      } catch (err) {
        console.error("Error fetching data:", err);
        if (err.response?.status === 401) {
          setError("Please log in to view documents.");
          router.push("/login");
        } else if (err.response?.status === 403) {
          setError("You don't have permission to view these documents.");
        } else if (err.response?.status === 404) {
          setError("Church or documents not found.");
        } else {
          setError("Failed to load documents. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (churchId) {
      fetchData();
    }
  }, [churchId, router]);

  // Handle document viewing
  const handleDocumentView = async (doc) => {
    setIsDocumentLoading(true);
    try {
      // Check if document exists
      if (doc.FileExists === false) {
        throw new Error("Document file not found");
      }
      
      const response = await axios.get(`/api/documents/${doc.DocumentID}`, {
        responseType: "blob"
      });

      // Check if the response is JSON (error) instead of a document
      if (response.headers["content-type"].includes("application/json")) {
        const text = await response.data.text();
        const json = JSON.parse(text);
        throw new Error(json.error || "Invalid document response");
      }

      // Create a blob from the response and open it in a new tab
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Document view error:", error);
      console.log("Error details:", {
        documentId: doc.DocumentID,
        error: error.message
      });
      // Show error in UI using toast or alert
      alert(error.message || "Failed to preview document");
    } finally {
      setIsDocumentLoading(false);
    }
  };

  // Handle document download
  const handleDocumentDownload = async (doc) => {
    setIsDocumentLoading(true);
    try {
      // Check if document exists
      if (doc.FileExists === false) {
        throw new Error("Document file not found");
      }
      
      const response = await axios.get(`/api/documents/${doc.DocumentID}`, {
        responseType: "blob"
      });

      // Check if the response is JSON (error) instead of a document
      if (response.headers["content-type"].includes("application/json")) {
        const text = await response.data.text();
        const json = JSON.parse(text);
        throw new Error(json.error || "Invalid document response");
      }

      // Create a blob from the response and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const extension = response.headers["content-type"].split("/")[1] || "file";
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${doc.DocumentType}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Document download error:", error);
      console.log("Error details:", {
        documentId: doc.DocumentID,
        error: error.message
      });
      // Show error in UI using toast or alert
      alert(error.message || "Failed to download document");
    } finally {
      setIsDocumentLoading(false);
    }
  };

  // Format document type display
  const formatDocumentType = (type) => {
    return type.replace(/([A-Z])/g, " $1").trim();
  };

  // Get file icon based on document path
  const getFileIcon = (path) => {
    if (!path) return <FileText className="h-5 w-5 text-gray-400" />;

    const extension = path.split(".").pop().toLowerCase();

    if (["jpg", "jpeg", "png", "gif"].includes(extension)) {
      return (
        <img src="/icons/image-icon.svg" alt="Image" className="h-5 w-5" />
      );
    } else if (extension === "pdf") {
      return <img src="/icons/pdf-icon.svg" alt="PDF" className="h-5 w-5" />;
    }

    return <FileText className="h-5 w-5 text-gray-400" />;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen px-4 sm:px-6 lg:ml-75 lg:py-12 mx-3 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white shadow-sm rounded-xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
              <div className="flex flex-col items-center justify-center text-center w-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                <p className="mt-3 text-gray-600">Loading documents...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen px-4 sm:px-6 lg:ml-75 lg:py-12 mx-3 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white shadow-sm rounded-xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
              <div className="flex flex-col items-center justify-center text-center w-full">
                <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded-md max-w-md w-full">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
                <Button onClick={() => router.push("/church")} className="mt-6">
                  Back to Churches
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:ml-75 lg:py-12 mx-3 py-20">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-sm rounded-xl p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
            <div className="w-full">
              <Link
                href="/church"
                className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-900"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Churches
              </Link>

              <div className="mt-4 flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                    Church Documents
                  </h1>
                  <p className="mt-2 text-lg text-gray-500">
                    {church?.ChurchName || "Church Documents"}
                  </p>
                </div>

                {church?.ChurchStatus === "Rejected" && (
                  <Link href={`/church/edit/${churchId}`}>
                    <Button variant="primary" className="flex items-center">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Documents
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="mt-6 mb-8">
            <div
              className={`rounded-md p-4 ${
                church?.ChurchStatus === "Active"
                  ? "bg-green-50"
                  : church?.ChurchStatus === "Pending"
                  ? "bg-yellow-50"
                  : "bg-red-50"
              }`}
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  {church?.ChurchStatus === "Active" ? (
                    <CheckCircle className={`h-5 w-5 text-green-400`} />
                  ) : church?.ChurchStatus === "Pending" ? (
                    <AlertCircle className={`h-5 w-5 text-yellow-400`} />
                  ) : (
                    <AlertCircle className={`h-5 w-5 text-red-400`} />
                  )}
                </div>
                <div className="ml-3">
                  <h3
                    className={`text-sm font-medium ${
                      church?.ChurchStatus === "Active"
                        ? "text-green-800"
                        : church?.ChurchStatus === "Pending"
                        ? "text-yellow-800"
                        : "text-red-800"
                    }`}
                  >
                    Church Status: {church?.ChurchStatus}
                  </h3>
                  <div
                    className={`mt-2 text-sm ${
                      church?.ChurchStatus === "Active"
                        ? "text-green-700"
                        : church?.ChurchStatus === "Pending"
                        ? "text-yellow-700"
                        : "text-red-700"
                    }`}
                  >
                    {church?.ChurchStatus === "Active" ? (
                      <p>Your church is active and approved.</p>
                    ) : church?.ChurchStatus === "Pending" ? (
                      <p>Your church is awaiting admin approval.</p>
                    ) : (
                      <>
                        <p>
                          Your church application was rejected. Please review
                          and edit your documents.
                        </p>
                        <p className="mt-1">
                          Reason: {church?.RejectionReason || "Unspecified"}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Documents List */}
          <div>
            <div className="mb-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Submitted Documents
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                All documents submitted for your church registration.
              </p>
            </div>

            {documents.length === 0 ? (
              <div className="p-6 text-center">
                <FileText className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No documents found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  No documents have been uploaded for this church.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {documents.map((doc, index) => (
                  <li
                    key={doc.DocumentID || index}
                    className="px-4 py-4 sm:px-6 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 rounded-md">
                          {getFileIcon(doc.DocumentPath)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {formatDocumentType(doc.DocumentType)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Submitted:{" "}
                            {new Date(doc.SubmissionDate).toLocaleDateString()}
                          </div>
                          {doc.FileExists === false && (
                            <div className="text-xs text-red-500 mt-1">
                              File not found
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDocumentView(doc)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 disabled:bg-gray-100 disabled:text-gray-400"
                          disabled={isDocumentLoading || doc.FileExists === false}
                          title={doc.FileExists === false ? "Document file not found" : "View document"}
                        >
                          {isDocumentLoading ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                          ) : (
                            <ExternalLink className="h-3.5 w-3.5 mr-1" />
                          )}
                          View
                        </button>

                        <button
                          onClick={() => handleDocumentDownload(doc)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 disabled:bg-gray-100 disabled:text-gray-400"
                          disabled={isDocumentLoading || doc.FileExists === false}
                          title={doc.FileExists === false ? "Document file not found" : "Download document"}
                        >
                          {isDocumentLoading ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5 mr-1" />
                          )}
                          Download
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Footer with help info */}
            <div className="mt-8">
              <div className="text-sm text-gray-600">
                <p>
                  If your church was rejected, you can edit your documents and
                  resubmit for approval.
                </p>
                {church?.ChurchStatus === "Rejected" && (
                  <div className="mt-4">
                    <Link href={`/church/edit/${churchId}`}>
                      <Button variant="outline" className="text-sm">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit and Resubmit
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;
