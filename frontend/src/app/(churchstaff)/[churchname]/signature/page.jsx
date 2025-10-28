"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { User, FileSignature, Trash2, Upload, Search } from "lucide-react";
import { Button } from "@/components/Button.jsx";
import Input from "@/components/Input.jsx";
import Label from "@/components/Label.jsx";
import ConfirmDialog from "@/components/ConfirmDialog.jsx";
import { useAuth } from "@/hooks/auth.jsx";
import { useParams } from "next/navigation";
import axios from "@/lib/axios";

export default function Signature() {
  const { user } = useAuth();
  const { churchname } = useParams();
  const [signatures, setSignatures] = useState([]);
  const [name, setName] = useState("");
  const [signatureImage, setSignatureImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSignatures, setFilteredSignatures] = useState([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [signatureToDelete, setSignatureToDelete] = useState(null);

  // Permission helper function
  const hasPermission = (permissionName) => {
    return user?.profile?.system_role?.role_name === "ChurchOwner" ||
      user?.church_role?.permissions?.some(
        (perm) => perm.PermissionName === permissionName
      );
  };

  const hasAccess = hasPermission("signature_list");
  const canAddSignature = hasPermission("signature_add");
  const canDeleteSignature = hasPermission("signature_delete");

  useEffect(() => {
    fetchSignatures();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = signatures.filter((sig) =>
        sig.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSignatures(filtered);
    } else {
      setFilteredSignatures(signatures);
    }
  }, [searchTerm, signatures]);

  const getCurrentChurchId = () => {
    if (user?.profile?.system_role?.role_name === "ChurchStaff") {
      return user?.church?.ChurchID;
    } else if (user?.profile?.system_role?.role_name === "ChurchOwner") {
      const currentChurch = user?.churches?.find(
        (church) => church.ChurchName.toLowerCase().replace(/\s+/g, "-") === churchname
      );
      return currentChurch?.ChurchID;
    }
    return null;
  };

  const fetchSignatures = async () => {
    try {
      setLoading(true);
      const churchId = getCurrentChurchId();
      if (!churchId) return;

      const response = await axios.get("/api/signatures", {
        params: { church_id: churchId }
      });
      setSignatures(response.data);
    } catch (error) {
      console.error("Error fetching signatures:", error);
      setError("Failed to load signatures");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }
      setError("");
      setSignatureImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a name");
      return;
    }
    if (!signatureImage) {
      setError("Please select a signature image");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const churchId = getCurrentChurchId();
      if (!churchId) {
        setError("Church ID not found");
        setIsSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append("church_id", churchId);
      formData.append("name", name.trim());
      formData.append("signature", signatureImage);

      const response = await axios.post("/api/signatures", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSignatures([response.data, ...signatures]);
      setName("");
      setSignatureImage(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error("Error adding signature:", error);
      setError(error.response?.data?.message || "Failed to add signature");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (signature) => {
    setSignatureToDelete(signature);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (signatureToDelete) {
      try {
        await axios.delete(`/api/signatures/${signatureToDelete.id}`);
        const updatedSignatures = signatures.filter((sig) => sig.id !== signatureToDelete.id);
        setSignatures(updatedSignatures);
        setShowDeleteDialog(false);
        setSignatureToDelete(null);
      } catch (error) {
        console.error("Error deleting signature:", error);
        setError("Failed to delete signature");
      }
    }
  };

  if (!hasAccess) {
    return (
      <div className="lg:p-6 w-full h-screen pt-20">
        <div className="w-full h-full">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg h-full flex flex-col">
            <div className="p-6 bg-white border-b border-gray-200">
              <h2 className="text-xl font-semibold text-red-600">
                Unauthorized
              </h2>
              <p className="mt-2 text-gray-600">
                You do not have permission to access the Signature Management page.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:p-6 w-full h-screen pt-20">
      <div className="w-full h-full">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg h-full flex flex-col">
          <div className="p-6 bg-white border-b border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-900">
              Signature Management
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Add and manage authorized signatures for church documents
            </p>
          </div>
          
          <div className="p-6 flex-1 overflow-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Add Signature Form */}
              <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${!canAddSignature ? 'opacity-60' : ''}`}>
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <FileSignature className="w-5 h-5 mr-2 text-blue-600" />
                    Add New Signature
                  </h3>
                </div>
                <div className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </Label>
                      <Input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                        placeholder="Enter person's name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="signature" className="block text-sm font-medium text-gray-700 mb-1">
                        Signature Image
                      </Label>
                      <div className="flex items-center space-x-2">
                        <label className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                            <Upload className="w-4 h-4 mr-2 text-gray-500" />
                            <span className="text-sm text-gray-700">
                              {signatureImage ? signatureImage.name : 'Choose file'}
                            </span>
                          </div>
                          <input
                            type="file"
                            id="signature"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Max file size: 5MB</p>
                    </div>

                    {previewUrl && (
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                        <p className="text-xs font-medium text-gray-700 mb-2">Preview:</p>
                        <div className="relative w-full h-40 bg-white rounded border border-gray-200">
                          <Image
                            src={previewUrl}
                            alt="Signature preview"
                            fill
                            className="object-contain p-2"
                          />
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isSubmitting || !canAddSignature}
                      variant="primary"
                      className="w-full"
                      title={!canAddSignature ? 'You do not have permission to add signatures' : ''}
                    >
                      <FileSignature className="w-4 h-4 mr-2" />
                      {isSubmitting ? "Adding..." : "Add Signature"}
                    </Button>
                  </form>
                </div>
              </div>

              {/* Signatures List */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    Saved Signatures ({signatures.length})
                  </h3>
                </div>
                <div className="p-6">
                  {/* Search Input */}
                  {signatures.length > 0 && (
                    <div className="mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search signatures..."
                          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                        />
                      </div>
                    </div>
                  )}
                  
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-4 text-sm text-gray-500">Loading signatures...</p>
                    </div>
                  ) : signatures.length === 0 ? (
                    <div className="text-center py-12">
                      <FileSignature className="mx-auto h-12 w-12 text-gray-300" />
                      <p className="mt-4 text-sm text-gray-500">No signatures added yet</p>
                      <p className="mt-1 text-xs text-gray-400">Add a signature to get started</p>
                    </div>
                  ) : filteredSignatures.length === 0 ? (
                    <div className="text-center py-12">
                      <Search className="mx-auto h-12 w-12 text-gray-300" />
                      <p className="mt-4 text-sm text-gray-500">No signatures found</p>
                      <p className="mt-1 text-xs text-gray-400">Try adjusting your search</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {filteredSignatures.map((sig) => (
                        <div key={sig.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                <User className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">{sig.name}</h4>
                                <p className="text-xs text-gray-500">
                                  Added {new Date(sig.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleDeleteClick(sig)}
                              variant="danger"
                              className="px-2 py-1 text-xs flex-shrink-0"
                              disabled={!canDeleteSignature}
                              title={!canDeleteSignature ? 'You do not have permission to delete signatures' : ''}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="relative w-full h-24 bg-white rounded border border-gray-200">
                            <Image
                              src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/signatures/${sig.id}/image`}
                              alt={`${sig.name}'s signature`}
                              fill
                              unoptimized
                              className="object-contain p-2"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Signature"
        message={`Are you sure you want to delete ${signatureToDelete?.name}'s signature? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
