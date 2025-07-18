"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import axios from "@/lib/axios";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import {
  Church,
  Upload,
  ArrowLeft,
  FileText,
  CheckCircle,
  AlertCircle,
  MapPin,
  RefreshCcw,
  Crosshair,
} from "lucide-react";
import Button from "@/components/Button";
import Label from "@/components/Label";
import InputError from "@/components/InputError";
import DataLoading from "@/components/DataLoading";
import Alert from "@/components/Alert";

// Simple error boundary component for handling image loading errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Image error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const ChurchEditPage = () => {
  const router = useRouter();
  const params = useParams();
  const churchId = params.churchId;

  // States
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageErrorMessage, setImageErrorMessage] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [imageLoadAttempts, setImageLoadAttempts] = useState(0);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [currentTab, setCurrentTab] = useState("info"); // 'info' or 'documents'
  const [church, setChurch] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [canEdit, setCanEdit] = useState(false);
  const [geoLocationStatus, setGeoLocationStatus] = useState({
    loading: false,
    error: null,
  });
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    ChurchName: "",
    Description: "",
    ParishDetails: "",
    Latitude: "",
    Longitude: "",
    ProfilePicture: null,
    SEC: null,
    BIR: null,
    BarangayPermit: null,
    AuthorizationLetter: null,
    RepresentativeID: null,
  });

  // File previews
  const [previews, setPreviews] = useState({
    ProfilePicture: null,
    SEC: null,
    BIR: null,
    BarangayPermit: null,
    AuthorizationLetter: null,
    RepresentativeID: null,
  });

  // File status
  const [fileStatus, setFileStatus] = useState({
    SEC: { exists: false, url: null, name: null, id: null },
    BIR: { exists: false, url: null, name: null, id: null },
    BarangayPermit: { exists: false, url: null, name: null, id: null },
    AuthorizationLetter: { exists: false, url: null, name: null, id: null },
    RepresentativeID: { exists: false, url: null, name: null, id: null },
  });

  // Fix Leaflet marker icon issue
  useEffect(() => {
    // only execute this on the client
    if (typeof window !== "undefined") {
      // Fix the Leaflet icon issue
      delete L.Icon.Default.prototype._getIconUrl;

      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
      });
    }
  }, []);

  // Dynamic import for Leaflet CSS
  useEffect(() => {
    import("leaflet/dist/leaflet.css")
      .then(() => setIsLeafletLoaded(true))
      .catch((err) => console.error("Failed to load Leaflet CSS:", err));
  }, []);

  // Fetch church data
  useEffect(() => {
    const fetchChurchData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`/api/churches/${churchId}`);
        console.log(response.data);
        setChurch(response.data.church);

        // Check if church can be edited (is rejected)
        setCanEdit(response.data.church.ChurchStatus === "Rejected");

        // Set form data
        setFormData({
          ChurchName: response.data.church.ChurchName || "",
          Description: response.data.church.Description || "",
          ParishDetails: response.data.church.ParishDetails || "",
          Latitude: response.data.church.Latitude || "",
          Longitude: response.data.church.Longitude || "",
          ProfilePicture: null,
          SEC: null,
          BIR: null,
          BarangayPermit: null,
          AuthorizationLetter: null,
          RepresentativeID: null,
        });

        // Set profile picture preview if it exists
        if (response.data.church.ProfilePicturePath) {
          setIsImageLoading(true);
          setImageError(false);
          setImageErrorMessage("");
          setImageLoadAttempts(0);
          // Create a URL with a timestamp and nonce to prevent caching
          const timestamp = new Date().getTime();
          const nonce = Math.random().toString(36).substring(2, 15);

          // Get the backend URL from environment variable
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";

          // Construct the full URL with the backend URL
          const imageUrl = `${backendUrl}/api/churches/${churchId}/profile-picture?v=${timestamp}&nonce=${nonce}`;
          setProfileImageUrl(imageUrl);
          console.log("Profile picture path found, URL:", imageUrl);
          console.log(
            "Profile picture path:",
            response.data.church.ProfilePicturePath
          );
        } else {
          setIsImageLoading(false);
          setImageError(true);
          setImageErrorMessage("No profile picture available for this church");
          setProfileImageUrl("");
          console.log("No profile picture path found in church data");
        }

        // Fetch documents
        const docsResponse = await axios.get(
          `/api/churches/${churchId}/documents`
        );
        setDocuments(docsResponse.data.documents || []);

        // Process documents from the API response
        const newFileStatus = { ...fileStatus };

        // Handle direct documents from church object if they exist
        if (
          response.data.church.documents &&
          response.data.church.documents.length > 0
        ) {
          response.data.church.documents.forEach((doc) => {
            const docMapping = {
              "SEC Registration": "SEC",
              "BIR Certificate": "BIR",
              "Barangay Permit": "BarangayPermit",
              "Authorization Letter": "AuthorizationLetter",
              "Representative Government ID": "RepresentativeID",
            };

            const docType = docMapping[doc.DocumentType] || doc.DocumentType;

            if (docType in newFileStatus) {
              newFileStatus[docType] = {
                exists: true,
                url: `/api/documents/${doc.DocumentID}`,
                name: doc.DocumentPath
                  ? doc.DocumentPath.split("/").pop()
                  : "Document",
                id: doc.DocumentID,
              };
            }
          });
        } else {
          // Fallback to documents from the documents endpoint
          docsResponse.data.documents.forEach((doc) => {
            const docMapping = {
              "SEC Registration": "SEC",
              "BIR Certificate": "BIR",
              "Barangay Permit": "BarangayPermit",
              "Authorization Letter": "AuthorizationLetter",
              "Representative Government ID": "RepresentativeID",
            };

            const docType = docMapping[doc.DocumentType] || doc.DocumentType;

            if (docType in newFileStatus) {
              newFileStatus[docType] = {
                exists: true,
                url: `/api/documents/${doc.DocumentID}`,
                name: doc.DocumentPath
                  ? doc.DocumentPath.split("/").pop()
                  : "Document",
                id: doc.DocumentID,
              };
            }
          });
        }

        setFileStatus(newFileStatus);
        console.log("Updated file status:", newFileStatus);
      } catch (err) {
        console.error("Error fetching church data:", err);
        setError(
          err.response?.data?.error ||
            "Failed to load church data. Please try again."
        );
        if (err.response?.status === 401) {
          router.push("/login");
        } else if (err.response?.status === 403) {
          setError("You don't have permission to edit this church.");
        } else if (err.response?.status === 404) {
          setError("Church not found.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (churchId) {
      fetchChurchData();
    }
  }, [churchId, router]);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle file change
  const handleFileChange = (e) => {
    const { name, files } = e.target;

    if (!files || !files[0]) {
      return;
    }

    const file = files[0];

    // Different validation for profile picture vs documents
    if (name === "ProfilePicture") {
      const maxSizeBytes = 2 * 1024 * 1024; // 2MB for profile pictures
      const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];

      console.log(
        "Profile picture file selected:",
        file.name,
        file.type,
        file.size + " bytes"
      );

      // Validate profile picture
      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          [name]: [`Invalid file type. Allowed: JPG, PNG`],
        }));
        return;
      }

      if (file.size > maxSizeBytes) {
        setErrors((prev) => ({
          ...prev,
          [name]: [`File too large. Maximum: 2MB`],
        }));
        return;
      }
    } else {
      // For regular documents
      const maxSizeBytes = 5 * 1024 * 1024; // 5MB for documents
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/pdf",
      ];

      // Validate file
      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          [name]: [`Invalid file type. Allowed: JPG, PNG, PDF`],
        }));
        return;
      }

      if (file.size > maxSizeBytes) {
        setErrors((prev) => ({
          ...prev,
          [name]: [`File too large. Maximum: 5MB`],
        }));
        return;
      }
    }

    // Set file in form data
    setFormData((prev) => ({
      ...prev,
      [name]: file,
    }));

    // Clear errors
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews((prev) => ({
          ...prev,
          [name]: e.target.result,
        }));
        // Reset loading state when a new file is selected for preview
        if (name === "ProfilePicture") {
          setIsImageLoading(false);
          setImageError(false); // Clear any previous error when a new file is selected
        }
      };
      reader.readAsDataURL(file);
    } else {
      // For PDFs, just set a placeholder
      setPreviews((prev) => ({
        ...prev,
        [name]: "pdf",
      }));
    }
  };

  // Handle location selection on map
  const handleLocationSelect = (lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      Latitude: lat,
      Longitude: lng,
    }));

    if (errors.location) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.location;
        return newErrors;
      });
    }
  };

  // Get current location using browser's Geolocation API
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoLocationStatus({
        loading: false,
        error: "Geolocation is not supported by your browser",
      });
      return;
    }

    setGeoLocationStatus({
      loading: true,
      error: null,
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        handleLocationSelect(latitude, longitude);
        setGeoLocationStatus({
          loading: false,
          error: null,
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMessage = "Failed to get your location";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission was denied";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }

        setGeoLocationStatus({
          loading: false,
          error: errorMessage,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Map component with location selection
  const LocationPicker = ({ onLocationSelect, initialPosition }) => {
    const [position, setPosition] = useState(
      initialPosition || [13.7565, 121.0583]
    ); // Default to Philippines

    // Component to recenter map when position changes
    const MapUpdater = ({ position }) => {
      const map = useMap();

      useEffect(() => {
        if (position) {
          map.setView(position, 15);
        }
      }, [map, position]);

      return null;
    };

    const LocationMarker = () => {
      const map = useMapEvents({
        click(e) {
          const { lat, lng } = e.latlng;
          setPosition([lat, lng]);
          onLocationSelect(lat, lng);
        },
      });

      return position ? <Marker position={position} /> : null;
    };

    useEffect(() => {
      if (initialPosition) {
        setPosition(initialPosition);
      }
    }, [initialPosition]);

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Button
            onClick={() => getCurrentLocation()}
            variant="outline"
            type="button"
            className="flex items-center text-sm"
            disabled={geoLocationStatus.loading}
          >
            {geoLocationStatus.loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Detecting location...
              </>
            ) : (
              <>
                <Crosshair className="h-4 w-4 mr-2" />
                Use My Current Location
              </>
            )}
          </Button>
        </div>

        {geoLocationStatus.error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded text-sm">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-red-700">{geoLocationStatus.error}</p>
            </div>
          </div>
        )}

        <div className="h-[400px] w-full rounded-lg overflow-hidden border border-gray-300">
          <MapContainer
            center={position}
            zoom={13}
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker />
            <MapUpdater position={position} />
          </MapContainer>
        </div>
      </div>
    );
  };

  // Validate form
  const validateForm = () => {
    const formErrors = {};

    if (!formData.ChurchName) {
      formErrors.ChurchName = ["Church name is required"];
    }

    if (!formData.Latitude || !formData.Longitude) {
      formErrors.location = ["Please select a location on the map"];
    }

    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const data = new FormData();

      // Append text fields
      data.append("ChurchName", formData.ChurchName);
      data.append("Description", formData.Description);
      data.append("ParishDetails", formData.ParishDetails);
      data.append("Latitude", formData.Latitude);
      data.append("Longitude", formData.Longitude);

      // Append profile picture if selected
      if (formData.ProfilePicture) {
        data.append("ProfilePicture", formData.ProfilePicture);
        console.log(
          "Uploading new profile picture",
          formData.ProfilePicture.name,
          formData.ProfilePicture.type,
          formData.ProfilePicture.size + " bytes"
        );
      } else {
        console.log(
          "No new profile picture selected, keeping existing one if any"
        );
      }

      // Append files if selected
      if (formData.SEC) {
        data.append("SEC", formData.SEC);
      }

      if (formData.BIR) {
        data.append("BIR", formData.BIR);
      }

      if (formData.BarangayPermit) {
        data.append("BarangayPermit", formData.BarangayPermit);
      }

      if (formData.AuthorizationLetter) {
        data.append("AuthorizationLetter", formData.AuthorizationLetter);
      }

      if (formData.RepresentativeID) {
        data.append("RepresentativeID", formData.RepresentativeID);
      }

      // If church was rejected, set status back to pending
      if (church.ChurchStatus === "Rejected") {
        data.append("ChurchStatus", "Pending");
      }

      // Submit the form
      await axios.post(`/api/churches/${churchId}/update`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Show success message
      setAlertMessage("Church updated successfully. Awaiting admin approval.");
      setAlertType("success");

      // Log success for debugging
      console.log("Church update successful");

      // Redirect after delay
      setTimeout(() => {
        router.push("/church");
      }, 2000);
    } catch (err) {
      console.error("Error updating church:", err);

      if (err.response?.status === 422) {
        // Validation errors
        const responseErrors = err.response.data.errors;
        setErrors(responseErrors);
      } else if (err.response?.status === 403) {
        setError("You don't have permission to edit this church.");
      } else {
        setError(
          err.response?.data?.error ||
            "Failed to update church. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="lg:p-6 w-full pt-20">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-6 bg-white border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="mb-4">
                    <Link
                      href="/church"
                      className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Churches
                    </Link>
                  </div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    Edit Church Information
                  </h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Update your church details and required documents
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {/* Tabs */}
              <div className="mb-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    className="border-blue-500 text-blue-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
                  >
                    Basic Information
                  </button>
                  <button
                    className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
                  >
                    Documents
                  </button>
                </nav>
              </div>
              
              {/* Loading Content */}
              <div className="py-12">
                <DataLoading message="Loading church information..." />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !church) {
    return (
      <div className="lg:p-6 w-full pt-20">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-6 bg-white border-b border-gray-200">
              <h1 className="text-2xl font-semibold text-gray-900">
                Edit Church Information
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Error loading church details
              </p>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center justify-center py-12">
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md max-w-md w-full">
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

  // Success state
  if (success) {
    return (
      <div className="lg:p-6 w-full pt-20">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-6 bg-white border-b border-gray-200">
              <h1 className="text-2xl font-semibold text-gray-900">
                Update Status
              </h1>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Update Successful!
                </h2>
                <p className="text-gray-600 mb-6">
                  Your church information has been updated and is awaiting admin
                  approval. You will be redirected shortly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:p-6 w-full pt-20">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="p-6 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-4">
                  <Link
                    href="/church"
                    className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Churches
                  </Link>
                </div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Edit Church Information
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Update your church details and required documents
                </p>
              </div>
            </div>
            
            {!canEdit && church && church.ChurchStatus !== "Rejected" && (
              <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      You can only edit documents when your church application
                      is rejected. Basic information can be updated anytime.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="p-6">

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setCurrentTab("info")}
                className={`${
                  currentTab === "info"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Basic Information
              </button>
              <button
                onClick={() => setCurrentTab("documents")}
                className={`${
                  currentTab === "documents"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Documents
              </button>
            </nav>
          </div>

          {/* Error display */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Alert display */}
          {alertMessage && (
            <div className="mb-6">
              <Alert
                type={alertType}
                message={alertMessage}
                onClose={() => setAlertMessage("")}
                autoClose={true}
                autoCloseDelay={5000}
              />
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Basic Information Tab */}
            {currentTab === "info" && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Basic Information
                </h2>

                <div className="space-y-6">
                  {/* Profile Picture Section */}
                  <div>
                    <Label htmlFor="ProfilePicture">
                      Church Profile Picture
                    </Label>
                    <div className="mt-2 flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6">
                      {/* Current Profile Picture */}
                      <div className="flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 w-40 h-40 flex items-center justify-center">
                        {previews.ProfilePicture ? (
                          <img
                            src={previews.ProfilePicture}
                            alt="Profile Picture Preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="relative w-full h-full">
                            {!imageError ? (
                              <>
                                {profileImageUrl && (
                                  <ErrorBoundary
                                    fallback={
                                      <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50">
                                        <AlertCircle className="h-10 w-10 text-amber-500 mb-2" />
                                        <span className="text-xs text-amber-600 text-center px-2">
                                          Image load error
                                        </span>
                                      </div>
                                    }
                                  >
                                    <img
                                      src={profileImageUrl}
                                      alt="Church Profile"
                                      className="h-full w-full object-cover"
                                      referrerPolicy="origin"
                                      onLoad={() => {
                                        console.log(
                                          "Profile picture loaded successfully"
                                        );
                                        setIsImageLoading(false);
                                        setImageError(false);
                                        setImageErrorMessage("");
                                      }}
                                      onError={(e) => {
                                        console.log(
                                          "Profile picture failed to load, attempt:",
                                          imageLoadAttempts + 1
                                        );
                                        // Automatically retry once with a new URL to bypass cache
                                        if (imageLoadAttempts < 1) {
                                          setImageLoadAttempts(
                                            (prev) => prev + 1
                                          );
                                          const retryTimestamp =
                                            new Date().getTime();
                                          const retryNonce = Math.random()
                                            .toString(36)
                                            .substring(2, 15);

                                          // Get the backend URL from environment variable
                                          const backendUrl =
                                            process.env
                                              .NEXT_PUBLIC_BACKEND_URL || "";

                                          // Construct the full retry URL
                                          const retryUrl = `${backendUrl}/api/churches/${churchId}/profile-picture?v=${retryTimestamp}&nonce=${retryNonce}&retry=true`;
                                          console.log(
                                            "Retrying with URL:",
                                            retryUrl
                                          );
                                          setProfileImageUrl(retryUrl);
                                        } else {
                                          setImageError(true);
                                          setImageErrorMessage(
                                            "Unable to load the profile image"
                                          );
                                          setIsImageLoading(false);
                                        }
                                      }}
                                      key={profileImageUrl} // Force re-render when URL changes
                                    />
                                  </ErrorBoundary>
                                )}
                              </>
                            ) : (
                              <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50">
                                <Church className="h-12 w-12 text-gray-400 mb-2" />
                                <span className="text-xs text-gray-500 text-center px-2">
                                  {imageErrorMessage ||
                                    "No profile image available"}
                                </span>
                              </div>
                            )}
                            {isImageLoading && (
                              <div className="absolute inset-0 bg-gray-100 bg-opacity-70 flex flex-col items-center justify-center z-10">
                                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                                <span className="text-xs text-gray-600">
                                  {imageLoadAttempts > 0
                                    ? "Retrying image load..."
                                    : "Loading image..."}
                                </span>
                                {imageLoadAttempts > 0 && (
                                  <span className="text-xs text-gray-500 mt-1">
                                    Attempt {imageLoadAttempts + 1}/2
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Upload Input */}
                      <div className="w-full">
                        <input
                          type="file"
                          id="ProfilePicture"
                          name="ProfilePicture"
                          accept="image/jpeg,image/png,image/jpg"
                          onChange={handleFileChange}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          JPG or PNG image up to 2MB
                        </p>
                        {imageError && !previews.ProfilePicture && (
                          <div className="mt-1 p-3 bg-amber-50 border-l-2 border-amber-500 rounded">
                            <div className="flex items-start">
                              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-amber-700">
                                  {imageErrorMessage ||
                                    "Current profile picture could not be loaded. Please upload a new one or try reloading."}
                                </p>
                                <div className="mt-2 flex space-x-3">
                                  <button
                                    type="button"
                                    className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 hover:text-indigo-800 rounded-md flex items-center"
                                    onClick={() => {
                                      // Try to refresh the image with a new cache-busting parameter
                                      setIsImageLoading(true);
                                      setImageError(false);
                                      setImageErrorMessage("");
                                      setImageLoadAttempts(0);
                                      const refreshTimestamp =
                                        new Date().getTime();
                                      const refreshNonce = Math.random()
                                        .toString(36)
                                        .substring(2, 15);

                                      // Get the backend URL from environment variable
                                      const backendUrl =
                                        process.env.NEXT_PUBLIC_BACKEND_URL ||
                                        "";

                                      // Construct the full refresh URL
                                      const refreshUrl = `${backendUrl}/api/churches/${churchId}/profile-picture?v=${refreshTimestamp}&nonce=${refreshNonce}&force=true`;
                                      console.log(
                                        "Refreshing with URL:",
                                        refreshUrl
                                      );
                                      setProfileImageUrl(refreshUrl);
                                    }}
                                  >
                                    <RefreshCcw className="h-3 w-3 mr-1" />
                                    Reload image
                                  </button>
                                  <label
                                    htmlFor="ProfilePicture"
                                    className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 hover:text-indigo-800 rounded-md cursor-pointer flex items-center"
                                  >
                                    <Upload className="h-3 w-3 mr-1" />
                                    Upload new image
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        <InputError
                          messages={errors.ProfilePicture}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="ChurchName">
                      Church Name <span className="text-red-500">*</span>
                    </Label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Church className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="ChurchName"
                        name="ChurchName"
                        value={formData.ChurchName}
                        onChange={handleInputChange}
                        className="block w-full pl-10 pr-3 py-2 sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="St. Mary's Catholic Church"
                      />
                    </div>
                    <InputError messages={errors.ChurchName} className="mt-2" />
                  </div>

                  <div>
                    <Label htmlFor="Description">Description</Label>
                    <div className="mt-1">
                      <textarea
                        id="Description"
                        name="Description"
                        rows={4}
                        value={formData.Description}
                        onChange={handleInputChange}
                        className="block w-full sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Provide a description of your church, including its mission, history, and community..."
                      />
                    </div>
                    <InputError
                      messages={errors.Description}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="ParishDetails">Parish Details</Label>
                    <div className="mt-1">
                      <textarea
                        id="ParishDetails"
                        name="ParishDetails"
                        rows={4}
                        value={formData.ParishDetails}
                        onChange={handleInputChange}
                        className="block w-full sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Provide details about the parish, service schedules, priests, and other relevant information..."
                      />
                    </div>
                    <InputError
                      messages={errors.ParishDetails}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>
                      Church Location <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-sm text-gray-500 mb-4">
                      Click on the map to set your church's location or use the
                      "Use My Current Location" button.
                    </p>

                    {isLeafletLoaded ? (
                      <LocationPicker
                        onLocationSelect={handleLocationSelect}
                        initialPosition={
                          formData.Latitude && formData.Longitude
                            ? [
                                parseFloat(formData.Latitude),
                                parseFloat(formData.Longitude),
                              ]
                            : null
                        }
                      />
                    ) : (
                      <div className="h-[400px] w-full flex items-center justify-center bg-gray-100 rounded-lg">
                        <p>Loading map...</p>
                      </div>
                    )}
                    <InputError messages={errors.location} className="mt-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="Latitude">Latitude</Label>
                      <input
                        type="text"
                        id="Latitude"
                        name="Latitude"
                        value={formData.Latitude}
                        readOnly
                        className="mt-1 block w-full sm:text-sm border-gray-300 bg-gray-50 rounded-md"
                      />
                    </div>
                    <div>
                      <Label htmlFor="Longitude">Longitude</Label>
                      <input
                        type="text"
                        id="Longitude"
                        name="Longitude"
                        value={formData.Longitude}
                        readOnly
                        className="mt-1 block w-full sm:text-sm border-gray-300 bg-gray-50 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Documents Tab */}
            {currentTab === "documents" && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Church Documents
                </h2>

                <div className="space-y-6">
                  {/* Document list */}
                  {[
                    "SEC",
                    "BIR",
                    "BarangayPermit",
                    "AuthorizationLetter",
                    "RepresentativeID",
                  ].map((docType) => (
                    <div
                      key={docType}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <Label htmlFor={docType}>
                        {docType.replace(/([A-Z])/g, " $1").trim()}
                        {docType !== "AuthorizationLetter" && (
                          <span className="text-red-500">*</span>
                        )}
                      </Label>

                      {fileStatus[docType]?.exists && (
                        <div className="mt-2 mb-4">
                          <div className="flex items-center p-2 bg-gray-50 rounded border border-gray-200">
                            <div className="p-2 bg-gray-100 rounded mr-4">
                              <FileText className="h-5 w-5 text-gray-500" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {fileStatus[docType].name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Current document
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-1">
                        <input
                          type="file"
                          id={docType}
                          name={docType}
                          accept=".pdf,image/*"
                          onChange={handleFileChange}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          PDF or image up to 5MB
                        </p>

                        {previews[docType] && previews[docType] !== "pdf" && (
                          <div className="mt-2 h-24 w-24 border border-gray-200 rounded overflow-hidden">
                            <img
                              src={previews[docType]}
                              alt="Preview"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}

                        {previews[docType] === "pdf" && (
                          <div className="mt-2 flex items-center">
                            <FileText className="h-5 w-5 text-gray-500 mr-2" />
                            <span className="text-sm text-gray-600">
                              PDF document selected
                            </span>
                          </div>
                        )}
                      </div>
                      <InputError messages={errors[docType]} className="mt-2" />
                    </div>
                  ))}
                </div>

                {church && church.ChurchStatus === "Rejected" && (
                  <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <RefreshCcw className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Resubmission Notice
                        </h3>
                        <p className="mt-2 text-sm text-yellow-700">
                          Your church application was previously rejected.
                          Updating and submitting will resubmit your application
                          for admin approval.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Form Actions */}
            <div className="mt-8 flex justify-end">
              <Button
                onClick={() => router.push("/church")}
                variant="outline"
                type="button"
                className="mr-3"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="ml-3"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 mr-2"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>Save Changes</>
                )}
              </Button>
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChurchEditPage;
