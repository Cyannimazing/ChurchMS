"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/auth.jsx";
import MemberRegistrationForm from "@/components/MemberRegistrationForm.jsx";
import axios from "@/lib/axios";

const BecomeMemberPage = () => {
  const { churchId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [church, setChurch] = useState(null);
  const [churchLoading, setChurchLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchChurchInfo();
  }, [churchId]);

  const fetchChurchInfo = async () => {
    try {
      setChurchLoading(true);
      const response = await axios.get(`/api/churches/${churchId}/public`);
      setChurch(response.data);
    } catch (error) {
      console.error("Error fetching church info:", error);
      if (error.response?.status === 404) {
        setError("Church not found or not available for registration.");
      } else {
        setError("Unable to load church information. Please try again.");
      }
    } finally {
      setChurchLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError("");
    
    try {
      // Use authenticated endpoint for all users since they must be logged in
      const endpoint = "/api/church-members";
      
      const payload = {
        ...formData,
        church_id: churchId
      };
      
      console.log('Submitting payload:', payload);
      
      await axios.post(endpoint, payload);
      
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting application:", error);
      setError(
        error.response?.data?.message || 
        "There was an error submitting your application. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="lg:p-6 w-full h-screen pt-20">
        <div className="w-full mx-auto h-full">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg h-full">
            <div className="p-6 bg-white border-b border-gray-200">
              <h1 className="text-2xl font-semibold text-gray-900">
                Application Submitted Successfully!
              </h1>
              <p className="text-gray-600 mt-2">
                Thank you for your interest in becoming a member of {church?.ChurchName}.
              </p>
            </div>
            
            <div className="p-6 flex-1 flex items-center justify-center">
              <div className="text-center max-w-lg">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                
                <p className="text-gray-600 mb-8 text-base">
                  Your application has been submitted and will be reviewed by the church staff.
                </p>
                
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 mb-8">
                  <h3 className="font-semibold text-gray-900 mb-4">What happens next?</h3>
                  <ul className="text-sm text-gray-700 space-y-2 text-left">
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      Church staff will review your application
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      You'll receive an app notification about the status
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      If approved, you'll be contacted with next steps
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      Welcome information will be provided upon approval
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    Return to Dashboard
                  </button>
                  
                  <button
                    onClick={() => router.back()}
                    className="w-full px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (churchLoading) {
    return (
      <div className="lg:p-6 w-full h-screen pt-20">
        <div className="w-full mx-auto h-full">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg h-full">
            <div className="p-6 flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Preparing membership form...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:p-6 w-full min-h-screen pt-20">
      <div className="w-full mx-auto">
        
        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="p-6 bg-white border-b border-gray-200">
            <button
              onClick={() => router.back()}
              className="flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Church
            </button>
            
            <h1 className="text-2xl font-semibold text-gray-900">
              Become a Member of {church?.ChurchName}
            </h1>
            <p className="text-gray-600 mt-2">
              Join our parish family by completing the registration form below. 
              All information will be kept confidential and used only for church records and communication.
            </p>
          </div>
          
          <div className="p-6 flex-1 flex flex-col">
            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Registration Form */}
            <MemberRegistrationForm
              onSubmit={handleSubmit}
              loading={loading}
              churchId={churchId}
              currentUser={user}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BecomeMemberPage;
