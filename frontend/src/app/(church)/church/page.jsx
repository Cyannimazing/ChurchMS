"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "@/lib/axios";
import DataLoading from "@/components/DataLoading";
import toast, { Toaster } from "react-hot-toast"; // Import react-hot-toast
import { Transition } from "@headlessui/react"; // Import Transition from @headlessui/react

const Dashboard = () => {
  const router = useRouter();
  const [churches, setChurches] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    ChurchName: "",
    Latitude: "",
    Longitude: "",
    Description: "",
    ParishDetails: "",
    ProfilePicture: null,
    SEC: null,
    BIR: null,
    BarangayPermit: null,
    AuthorizationLetter: null,
    RepresentativeID: null,
  });
  const [error, setError] = useState(null);
  const [loadingChurch, setLoadingChurch] = useState(false);
  const [isLoadingChurches, setIsLoadingChurches] = useState(false);

  useEffect(() => {
    fetchChurches();
  }, []);

  const fetchChurches = async () => {
    setIsLoadingChurches(true);
    try {
      await axios.get("/sanctum/csrf-cookie");
      const response = await axios.get("/api/churches/owned");
      setChurches(response.data.churches);
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Please log in to view your churches.");
        router.push("/login");
      } else {
        setError(
          err.response?.data?.error ||
            "Failed to fetch churches. Please try again."
        );
      }
    } finally {
      setIsLoadingChurches(false);
    }
  };

  const handleManage = (churchName) => {
    const formattedName = churchName.replace(/\s+/g, "-").toLowerCase();
    router.push(`/${formattedName}/dashboard`);
  };

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file" && files[0]) {
      const maxSizeMB = name === "ProfilePicture" ? 2 : 5;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      const allowedTypes =
        name === "ProfilePicture"
          ? ["image/jpeg", "image/png", "image/jpg"]
          : ["image/jpeg", "image/png", "image/jpg", "application/pdf"];

      if (!allowedTypes.includes(files[0].type)) {
        setError(
          `Invalid file type for ${name
            .replace(/([A-Z])/g, " $1")
            .trim()}. Only ${
            name === "ProfilePicture" ? "JPEG, PNG, JPG" : "JPEG, PNG, JPG, PDF"
          } allowed.`
        );
        return;
      }
      if (files[0].size > maxSizeBytes) {
        setError(
          `${name
            .replace(/([A-Z])/g, " $1")
            .trim()} file size exceeds ${maxSizeMB}MB limit.`
        );
        return;
      }
    }
    if (name === "Latitude" && value !== "") {
      const lat = parseFloat(value);
      if (lat < -90 || lat > 90) {
        setError("Latitude must be between -90 and 90.");
        return;
      }
    }
    if (name === "Longitude" && value !== "") {
      const lon = parseFloat(value);
      if (lon < -180 || lon > 180) {
        setError("Longitude must be between -180 and 180.");
        return;
      }
    }
    setFormData((prev) => ({
      ...prev,
      [name]: type === "file" ? files[0] : value,
    }));
    setError(null);
  };

  const validateStep = () => {
    if (currentStep === 1) {
      if (!formData.ChurchName) return "Church Name is required.";
      if (!formData.Latitude) return "Latitude is required.";
      if (!formData.Longitude) return "Longitude is required.";
      const lat = parseFloat(formData.Latitude);
      const lon = parseFloat(formData.Longitude);
      if (lat < -90 || lat > 90) return "Latitude must be between -90 and 90.";
      if (lon < -180 || lon > 180)
        return "Longitude must be between -180 and 180.";
    }
    return null;
  };

  const handleNext = (e) => {
    e.preventDefault();
    console.log("Next button clicked, current step:", currentStep);
    const stepError = validateStep();
    if (stepError) {
      setError(stepError);
      return;
    }
    setCurrentStep((prev) => prev + 1);
    setError(null);
  };

  const handleBack = (e) => {
    e.preventDefault();
    console.log("Back button clicked, current step:", currentStep);
    setCurrentStep((prev) => prev - 1);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submit button clicked");
    setError(null);
    setLoadingChurch(true);

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== "") {
        data.append(key, value);
      }
    });
    data.append("IsPublic", "false");

    try {
      await axios.get("/sanctum/csrf-cookie");
      const response = await axios.post("/api/churches", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setShowModal(false);
      setFormData({
        ChurchName: "",
        Latitude: "",
        Longitude: "",
        Description: "",
        ParishDetails: "",
        ProfilePicture: null,
        SEC: null,
        BIR: null,
        BarangayPermit: null,
        AuthorizationLetter: null,
        RepresentativeID: null,
      });
      setCurrentStep(1);
      fetchChurches();
      // Replace alert with toast notification
      toast.success("Church created successfully. Awaiting admin approval.", {
        duration: 4000, // Toast disappears after 4 seconds
        position: "top-right", // Position the toast
      });
    } catch (err) {
      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        setError(Object.values(errors).flat().join(", "));
      } else if (err.response?.status === 403) {
        setError(
          err.response.data.error ||
            "You need an active subscription or have reached the maximum number of churches."
        );
      } else {
        setError(
          err.response?.data?.error ||
            "Failed to create church. Please try again."
        );
      }
    } finally {
      setLoadingChurch(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentStep(1);
    setError(null);
    setFormData({
      ChurchName: "",
      Latitude: "",
      Longitude: "",
      Description: "",
      ParishDetails: "",
      ProfilePicture: null,
      SEC: null,
      BIR: null,
      BarangayPermit: null,
      AuthorizationLetter: null,
      RepresentativeID: null,
    });
  };

  return (
    <div className="lg:ml-75 lg:py-12 mx-3 py-20">
      {/* Add Toaster component for toast notifications */}
      <Toaster />
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
          <div className="p-6 bg-white border-b border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => setShowModal(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
                disabled={loadingChurch}
              >
                Create Church
              </button>
            </div>

            {/* Enhanced Error Display with Transition */}
            <Transition
              show={error && !showModal}
              enter="transition-opacity duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="mb-4 p-4 bg-red-100 text-red-700 rounded flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01M12 4a8 8 0 100 16 8 8 0 000-16z"
                  />
                </svg>
                <span>{error}</span>
              </div>
            </Transition>

            {/* Modal with Step-by-Step Form */}
            {showModal && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white shadow-xl rounded-xl p-6 sm:p-8 max-w-md w-full mx-4">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Create Church - Step {currentStep} of 3
                    </h2>
                    <button
                      onClick={closeModal}
                      className="text-gray-500 hover:text-gray-700 font-medium"
                    >
                      ✕ Close
                    </button>
                  </div>

                  {/* Error in Modal with Transition */}
                  <Transition
                    show={error}
                    enter="transition-opacity duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="transition-opacity duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="mb-6 p-4 bg-red-100 text-red-700 rounded flex items-center">
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 9v2m0 4h.01M12 4a8 8 0 100 16 8 8 0 000-16z"
                        />
                      </svg>
                      <span>{error}</span>
                    </div>
                  </Transition>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {currentStep === 1 && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Church Name
                          </label>
                          <input
                            type="text"
                            name="ChurchName"
                            value={formData.ChurchName}
                            onChange={handleInputChange}
                            required
                            maxLength="255"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Latitude
                          </label>
                          <input
                            type="number"
                            name="Latitude"
                            value={formData.Latitude}
                            onChange={handleInputChange}
                            required
                            min="-90"
                            max="90"
                            step="any"
                            placeholder="e.g., -12.345678"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Longitude
                          </label>
                          <input
                            type="number"
                            name="Longitude"
                            value={formData.Longitude}
                            onChange={handleInputChange}
                            required
                            min="-180"
                            max="180"
                            step="any"
                            placeholder="e.g., 123.456789"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                          />
                        </div>
                      </div>
                    )}

                    {currentStep === 2 && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Description (optional)
                          </label>
                          <textarea
                            name="Description"
                            value={formData.Description}
                            onChange={handleInputChange}
                            rows="4"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Parish Details (optional)
                          </label>
                          <textarea
                            name="ParishDetails"
                            value={formData.ParishDetails}
                            onChange={handleInputChange}
                            rows="4"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                          />
                        </div>
                      </div>
                    )}

                    {currentStep === 3 && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Profile Picture (optional, max 2MB)
                          </label>
                          <input
                            type="file"
                            name="ProfilePicture"
                            accept="image/jpeg,image/png,image/jpg"
                            onChange={handleInputChange}
                            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                        </div>
                        {[
                          "SEC",
                          "BIR",
                          "BarangayPermit",
                          "AuthorizationLetter",
                          "RepresentativeID",
                        ].map((doc) => (
                          <div key={doc}>
                            <label className="block text-sm font-medium text-gray-700">
                              {doc.replace(/([A-Z])/g, " $1").trim()} (optional,
                              max 5MB)
                            </label>
                            <input
                              type="file"
                              name={doc}
                              accept="image/jpeg,image/png,image/jpg,application/pdf"
                              onChange={handleInputChange}
                              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between">
                      {currentStep > 1 && (
                        <button
                          type="button"
                          onClick={handleBack}
                          className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                        >
                          Back
                        </button>
                      )}
                      {currentStep < 3 ? (
                        <button
                          type="button"
                          onClick={handleNext}
                          className="ml-auto bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                          Next
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={loadingChurch}
                          className="ml-auto bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
                        >
                          {loadingChurch ? "Submitting..." : "Create Church"}
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Public
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documents
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoadingChurches ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center">
                        <DataLoading message="Loading churches..." />
                      </td>
                    </tr>
                  ) : churches.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-4 text-center text-gray-500"
                      >
                        No churches found. Create one to get started.
                      </td>
                    </tr>
                  ) : (
                    churches.map((church) => (
                      <tr key={church.ChurchID}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {church.ChurchName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {church.ChurchStatus}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {church.IsPublic ? "Yes" : "No"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {church.DocumentCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {church.ChurchStatus === "Active" ? (
                            <button
                              onClick={() => handleManage(church.ChurchName)}
                              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                            >
                              Manage
                            </button>
                          ) : (
                            <span className="text-gray-500">Inactive</span>
                          )}
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
  );
};

export default Dashboard;
