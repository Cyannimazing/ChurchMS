"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import axios from "@/lib/axios";
import { CheckCircle, XCircle, AlertCircle, Calendar, MapPin, User, FileText } from "lucide-react";

const CertificateVerificationPage = () => {
  const { token } = useParams();
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      verifyCertificate();
    }
  }, [token]);

  const verifyCertificate = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/verify-certificate/${token}`);
      setVerification(response.data);
    } catch (err) {
      console.error('Error verifying certificate:', err);
      if (err.response?.status === 404) {
        setError('Certificate not found or invalid verification token.');
      } else if (err.response?.status === 410) {
        setError('Certificate verification is no longer active.');
      } else {
        setError('An error occurred while verifying the certificate.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-center text-gray-600">Verifying certificate...</p>
        </div>
      </div>
    );
  }

  if (error || !verification?.valid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-4">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-4">
            Certificate Invalid
          </h1>
          <p className="text-center text-gray-600 mb-6">
            {error || verification?.error || 'This certificate could not be verified.'}
          </p>
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-sm text-red-800">
                This certificate may be fraudulent or the verification link may have expired.
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const certificate = verification.certificate;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Verification Success Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
            Certificate Verified
          </h1>
          <p className="text-center text-gray-600">
            This certificate has been successfully verified as authentic.
          </p>
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800 text-center">
              ✓ Verified on {new Date(certificate.verified_at).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Certificate Details */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">
            Certificate Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Certificate Type */}
            <div className="flex items-start space-x-3">
              <FileText className="h-6 w-6 text-blue-500 mt-1" />
              <div>
                <h3 className="font-medium text-gray-900">Certificate Type</h3>
                <p className="text-gray-600 capitalize">
                  {certificate.type === 'matrimony' ? 'Marriage' : 
                   certificate.type === 'firstCommunion' ? 'First Communion' : 
                   certificate.type}
                </p>
              </div>
            </div>

            {/* Recipient */}
            <div className="flex items-start space-x-3">
              <User className="h-6 w-6 text-green-500 mt-1" />
              <div>
                <h3 className="font-medium text-gray-900">Recipient</h3>
                <p className="text-gray-600">{certificate.recipient_name}</p>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-start space-x-3">
              <Calendar className="h-6 w-6 text-purple-500 mt-1" />
              <div>
                <h3 className="font-medium text-gray-900">Certificate Date</h3>
                <p className="text-gray-600">{certificate.certificate_date}</p>
              </div>
            </div>

            {/* Issued By */}
            <div className="flex items-start space-x-3">
              <User className="h-6 w-6 text-orange-500 mt-1" />
              <div>
                <h3 className="font-medium text-gray-900">Issued By</h3>
                <p className="text-gray-600">{certificate.issued_by}</p>
              </div>
            </div>

            {/* Church Location */}
            <div className="flex items-start space-x-3 md:col-span-2">
              <MapPin className="h-6 w-6 text-red-500 mt-1" />
              <div>
                <h3 className="font-medium text-gray-900">Church</h3>
                <p className="text-gray-600">{certificate.church_name}</p>
                <p className="text-sm text-gray-500">
                  {certificate.church_city}, {certificate.church_province}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Certificate Data */}
        {certificate.certificate_data && Object.keys(certificate.certificate_data).length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-2">
              Additional Certificate Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(certificate.certificate_data).map(([key, value]) => {
                // Skip church_info as it's already displayed above
                if (key === 'church_info' || !value || value === '') return null;
                
                return (
                  <div key={key} className="border rounded-md p-3 bg-gray-50">
                    <h4 className="font-medium text-gray-700 capitalize mb-1">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </h4>
                    <p className="text-gray-600">{value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Security Notice</p>
              <p>
                This certificate verification is provided by the issuing church's digital system. 
                Each QR code is unique and cannot be duplicated. If you suspect this certificate 
                is fraudulent, please contact the issuing church directly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateVerificationPage;