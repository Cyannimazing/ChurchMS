import axios from "@/lib/axios";
import { toast } from "react-hot-toast";

export const useChurchManagement = () => {
  const fetchAllChurches = async ({ setChurches, setIsLoading }) => {
    if (!setChurches || !setIsLoading) {
      console.error("setChurches or setIsLoading is not provided");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get("/api/churches");
      if (response.data && Array.isArray(response.data.churches)) {
        setChurches(response.data.churches);
      } else {
        throw new Error("Invalid response format: churches array not found");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to fetch churches";
      toast.error(errorMessage);
      console.error("Fetch churches error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      setChurches([]); // Reset to empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChurchDocuments = async ({
    churchId,
    setSelectedChurch,
    setDocuments,
    setIsFetchingDocuments,
    reviewedChurches,
    setReviewedChurches,
  }) => {
    if (
      !setSelectedChurch ||
      !setDocuments ||
      !setIsFetchingDocuments ||
      !setReviewedChurches
    ) {
      console.error("Required setters are not provided");
      return;
    }

    setIsFetchingDocuments(true);
    try {
      const response = await axios.get(`/api/churches/${churchId}/documents`);
      if (
        response.data &&
        response.data.church &&
        Array.isArray(response.data.documents)
      ) {
        setSelectedChurch(response.data.church);
        setDocuments(response.data.documents);
        setReviewedChurches(new Set(reviewedChurches).add(churchId));
      } else {
        throw new Error(
          "Invalid response format: church or documents not found"
        );
      }
    } catch (error) {
      const errorData = error.response?.data || {};
      const errorMessage = errorData.message
        ? `${errorData.error}: ${errorData.message} (${errorData.file}:${errorData.line})`
        : errorData.error || error.message || "Failed to fetch documents";
      toast.error(errorMessage);
      console.error("Fetch documents error:", {
        churchId,
        status: error.response?.status,
        data: errorData,
      });
      setSelectedChurch(null);
      setDocuments([]);
    } finally {
      setIsFetchingDocuments(false);
    }
  };

  const updateStatus = async ({
    churchId,
    status,
    setChurches,
    selectedChurch,
    setSelectedChurch,
    setIsUpdating,
  }) => {
    if (!setChurches || !setIsUpdating) {
      console.error("Required setters are not provided");
      return;
    }

    setIsUpdating(true);
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
      if (selectedChurch?.ChurchID === churchId && setSelectedChurch) {
        setSelectedChurch({ ...selectedChurch, ChurchStatus: status });
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to update status";
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

  const previewDocument = async ({ documentId }) => {
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

  const downloadDocument = async ({ documentId, documentType }) => {
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

  return {
    fetchAllChurches,
    fetchChurchDocuments,
    updateStatus,
    previewDocument,
    downloadDocument,
  };
};
