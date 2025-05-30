"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "@/lib/axios";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import {
  Church,
  Upload,
  ArrowLeft,
  ArrowRight,
  FileText,
  CheckCircle,
  AlertCircle,
  MapPin,
  Crosshair,
} from "lucide-react";
import Button from "@/components/Button";
import Label from "@/components/Label";
import InputError from "@/components/InputError";
import FileInput from "@/components/Forms/FileInput";

const ChurchRegistrationPage = () => {
  const [step, setStep] = useState(1);
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  const toastRef = useRef(null);
  const router = useRouter();

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

  // Error state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [geoLocationStatus, setGeoLocationStatus] = useState({
    loading: false,
    error: null,
  });

  // Dynamic import for Leaflet CSS
  useEffect(() => {
    import("leaflet/dist/leaflet.css")
      .then(() => setIsLeafletLoaded(true))
      .catch((err) => console.error("Failed to load Leaflet CSS:", err));
  }, []);

  // Step validation
  const validateStep1 = () => {
    const stepErrors = {};
    if (!formData.ChurchName) {
      stepErrors.ChurchName = ["Church name is required"];
    } else if (formData.ChurchName.length > 255) {
      stepErrors.ChurchName = ["Church name must not exceed 255 characters"];
    }

    if (!formData.Description) {
      stepErrors.Description = ["Description is required"];
    } else if (formData.Description.length < 10) {
      stepErrors.Description = ["Description must be at least 10 characters"];
    } else if (formData.Description.length > 1000) {
      stepErrors.Description = ["Description must not exceed 1000 characters"];
    }

    if (!formData.ParishDetails) {
      stepErrors.ParishDetails = ["Parish details are required"];
    } else if (formData.ParishDetails.length < 10) {
      stepErrors.ParishDetails = [
        "Parish details must be at least 10 characters",
      ];
    } else if (formData.ParishDetails.length > 1000) {
      stepErrors.ParishDetails = [
        "Parish details must not exceed 1000 characters",
      ];
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const validateStep2 = () => {
    const stepErrors = {};
    if (!formData.Latitude || !formData.Longitude) {
      stepErrors.location = ["Please select a location on the map"];
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const validateStep3 = () => {
    const stepErrors = {};

    if (!formData.ProfilePicture) {
      stepErrors.ProfilePicture = ["Church profile picture is required"];
    }

    if (!formData.SEC) {
      stepErrors.SEC = ["SEC registration document is required"];
    }

    if (!formData.BIR) {
      stepErrors.BIR = ["BIR registration document is required"];
    }

    if (!formData.BarangayPermit) {
      stepErrors.BarangayPermit = ["Barangay permit is required"];
    }

    if (!formData.RepresentativeID) {
      stepErrors.RepresentativeID = ["Representative ID is required"];
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  // Handle input change
  const handleChange = (e) => {
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
    if (files && files.length > 0) {
      setFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }));

      // Clear errors for this field
      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    } else {
      // File was removed
      setFormData((prev) => ({
        ...prev,
        [name]: null,
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

    // Clear location errors
    if (errors.location) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.location;
        return newErrors;
      });
    }
  };

  // Navigate between steps
  const nextStep = () => {
    let isValid = false;

    switch (step) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      default:
        isValid = true;
    }

    if (isValid) {
      setStep((prev) => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
    window.scrollTo(0, 0);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep3()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Create FormData object for file uploads
      const formDataToSubmit = new FormData();

      // Append all form fields
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== undefined) {
          formDataToSubmit.append(key, formData[key]);
        }
      });

      // Submit the form
      const response = await axios.post("/api/churches", formDataToSubmit, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Handle success
      setSubmitSuccess(true);
      setTimeout(() => {
        router.push("/church");
      }, 2000);
    } catch (error) {
      console.error("Church registration error:", error);

      // Handle validation errors
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      } else if (error.response?.data?.error) {
        setErrors({ general: [error.response.data.error] });
      } else {
        setErrors({
          general: ["An unexpected error occurred. Please try again."],
        });
      }
    } finally {
      setIsSubmitting(false);
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

  // Progress steps
  const steps = [
    { id: 1, name: "Basic Information" },
    { id: 2, name: "Location" },
    { id: 3, name: "Documents" },
  ];

  // Success message
  if (submitSuccess) {
    return (
      <div className="min-h-screen px-4 sm:px-6 lg:ml-75 lg:py-12 mx-3 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white shadow-sm rounded-xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
              <div className="flex flex-col items-center justify-center text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Registration Successful!
                </h2>
                <p className="text-gray-600 mb-6">
                  Your church has been registered and is awaiting admin
                  approval. You will be redirected to your dashboard shortly.
                </p>
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
          <div className="mx-20">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
              <div className="text-center mb-12 w-full">
                <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                  Register Your Church
                </h1>
                <p className="mt-3 text-lg text-gray-500">
                  Complete the form below to register your church in our system.
                </p>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="mb-8 relative">
              <div className="flex items-center justify-between">
                {/* Connector line container */}
                <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200 z-0">
                  {steps.map(
                    (s, i) =>
                      i < steps.length - 1 && (
                        <div
                          key={`line-${s.id}`}
                          className={`absolute top-0 h-0.5 ${
                            step >= s.id + 1 ? "bg-indigo-600" : "bg-gray-200"
                          }`}
                          style={{
                            left: `${(i / (steps.length - 1)) * 100}%`,
                            width: `${100 / (steps.length - 1)}%`,
                          }}
                        />
                      )
                  )}
                </div>

                {/* Step circles */}
                {steps.map((s, i) => (
                  <div key={s.id} className="flex-1 relative z-10">
                    <div
                      className={`
                      w-10 h-10 mx-auto rounded-full flex items-center justify-center
                      ${step >= s.id ? "bg-indigo-600" : "bg-gray-200"}
                    `}
                    >
                      <span
                        className={`text-sm font-medium ${
                          step >= s.id ? "text-white" : "text-gray-500"
                        }`}
                      >
                        {i + 1}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-center font-medium text-gray-500">
                      {s.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* General Error Message */}
            {errors.general && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                  <p className="text-sm text-red-700">{errors.general[0]}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <div>
              <form onSubmit={handleSubmit}>
                {/* Step 1: Basic Information */}
                {step === 1 && (
                  <div className="animate-fade-in">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                      Basic Information
                    </h2>

                    <div className="space-y-6">
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
                            onChange={handleChange}
                            className="block w-full pl-10 pr-3 py-2 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="St. Mary's Catholic Church"
                          />
                        </div>
                        <InputError
                          messages={errors.ChurchName}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="Description">
                          Description <span className="text-red-500">*</span>
                        </Label>
                        <div className="mt-1">
                          <textarea
                            id="Description"
                            name="Description"
                            rows={4}
                            value={formData.Description}
                            onChange={handleChange}
                            className="block w-full sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Provide a description of your church, including its mission, history, and community..."
                          />
                        </div>
                        <InputError
                          messages={errors.Description}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="ParishDetails">
                          Parish Details <span className="text-red-500">*</span>
                        </Label>
                        <div className="mt-1">
                          <textarea
                            id="ParishDetails"
                            name="ParishDetails"
                            rows={4}
                            value={formData.ParishDetails}
                            onChange={handleChange}
                            className="block w-full sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Provide details about the parish, service schedules, priests, and other relevant information..."
                          />
                        </div>
                        <InputError
                          messages={errors.ParishDetails}
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                      <Button
                        onClick={nextStep}
                        variant="primary"
                        type="button"
                        className="flex items-center"
                      >
                        Next Step
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2: Location */}
                {step === 2 && (
                  <div className="animate-fade-in">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                      Church Location
                    </h2>

                    <div className="space-y-6">
                      <div>
                        <Label>
                          Select Location on Map{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <p className="text-sm text-gray-500 mb-4">
                          Click on the map to set your church's location or use
                          the "Use My Current Location" button.
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
                        <InputError
                          messages={errors.location}
                          className="mt-2"
                        />
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

                    <div className="mt-8 flex justify-between">
                      <Button
                        onClick={prevStep}
                        variant="outline"
                        type="button"
                        className="flex items-center"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        onClick={nextStep}
                        variant="primary"
                        type="button"
                        className="flex items-center"
                      >
                        Next Step
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Documents */}
                {step === 3 && (
                  <div className="animate-fade-in">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                      Church Documents
                    </h2>

                    <div className="space-y-6">
                      <FileInput
                        label="Church Profile Picture"
                        id="ProfilePicture"
                        name="ProfilePicture"
                        accept="image/*"
                        maxSize={2048}
                        required
                        filePreview={true}
                        helpText="JPG, PNG or JPEG up to 2MB"
                        onChange={handleFileChange}
                        errors={errors.ProfilePicture || []}
                      />

                      <FileInput
                        label="SEC Registration"
                        id="SEC"
                        name="SEC"
                        accept=".pdf,image/*"
                        maxSize={5120}
                        required
                        helpText="PDF or image up to 5MB"
                        onChange={handleFileChange}
                        errors={errors.SEC || []}
                      />

                      <FileInput
                        label="BIR Certificate"
                        id="BIR"
                        name="BIR"
                        accept=".pdf,image/*"
                        maxSize={5120}
                        required
                        helpText="PDF or image up to 5MB"
                        onChange={handleFileChange}
                        errors={errors.BIR || []}
                      />

                      <FileInput
                        label="Barangay Permit"
                        id="BarangayPermit"
                        name="BarangayPermit"
                        accept=".pdf,image/*"
                        maxSize={5120}
                        required
                        helpText="PDF or image up to 5MB"
                        onChange={handleFileChange}
                        errors={errors.BarangayPermit || []}
                      />

                      <FileInput
                        label="Authorization Letter"
                        id="AuthorizationLetter"
                        name="AuthorizationLetter"
                        accept=".pdf,image/*"
                        maxSize={5120}
                        helpText="PDF or image up to 5MB (optional)"
                        onChange={handleFileChange}
                        errors={errors.AuthorizationLetter || []}
                      />

                      <FileInput
                        label="Representative Government ID"
                        id="RepresentativeID"
                        name="RepresentativeID"
                        accept=".pdf,image/*"
                        maxSize={5120}
                        required
                        helpText="PDF or image up to 5MB"
                        onChange={handleFileChange}
                        errors={errors.RepresentativeID || []}
                      />
                    </div>

                    <div className="mt-8 flex justify-between">
                      <Button
                        onClick={prevStep}
                        variant="outline"
                        type="button"
                        className="flex items-center"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={isSubmitting}
                        className="flex items-center"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="mr-2">Submitting...</span>
                            <svg
                              className="animate-spin h-4 w-4 text-white"
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
                          </>
                        ) : (
                          <>
                            Register Church
                            <Upload className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ChurchRegistrationPage;
