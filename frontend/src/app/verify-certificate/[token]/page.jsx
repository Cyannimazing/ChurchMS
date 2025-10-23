"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import axios from "@/lib/axios";
import { CheckCircle2, XCircle, AlertCircle, Calendar, MapPin, User, FileText } from "lucide-react";

const LabelValue = ({ label, value, className = "" }) => (
  <div className={`flex flex-col ${className}`}>
    <span className="text-xs uppercase tracking-wide text-gray-500">{label}</span>
    <span className="text-gray-900">{value}</span>
  </div>
);

const CertificateVerificationPage = () => {
  const { token } = useParams();
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) verifyCertificate();
  }, [token]);

  const verifyCertificate = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/verify-certificate/${token}`);
      setVerification(data);
    } catch (err) {
      console.error('Error verifying certificate:', err);
      if (err.response?.status === 404) setError('Certificate not found or invalid verification token.');
      else if (err.response?.status === 410) setError('Certificate verification is no longer active.');
      else setError('An error occurred while verifying the certificate.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="lg:p-6 w-full min-h-screen pt-20">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 p-8 flex items-center justify-center">
            <div className="flex items-center space-x-3 text-gray-600">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-600"></div>
              <span>Verifying certificate...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !verification?.valid) {
    return (
      <div className="lg:p-6 w-full min-h-screen pt-20">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-gray-900">Certificate Verification</h1>
            </div>
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <XCircle className="h-6 w-6 text-red-600" />
                <span className="text-red-700 font-medium">Certificate Invalid</span>
              </div>
              <p className="text-gray-600 mb-4">{error || verification?.error || 'This certificate could not be verified.'}</p>
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                  <p className="text-sm text-red-800">This certificate may be fraudulent or the verification link may have expired.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const certificate = verification.certificate;
  const typeLabel = certificate.type === 'matrimony' ? 'Marriage' : (certificate.type === 'firstCommunion' ? 'First Communion' : certificate.type);

  return (
    <div className="lg:p-6 w-full min-h-screen pt-20 flex items-center justify-center">
      <div className="max-w-5xl mx-auto w-full">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">Certificate Verification</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Verified</span>
          </div>
          
          {/* Verification Status */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3 text-green-700 bg-green-50 border border-green-200 rounded-md px-4 py-3">
              <CheckCircle2 className="h-5 w-5" />
              <span>Verified on {new Date(certificate.verified_at).toLocaleString()}</span>
            </div>
          </div>

          {/* Certificate Details */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Certificate Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LabelValue label="Certificate Type" value={<span className="capitalize">{typeLabel}</span>} />
              <LabelValue label="Recipient" value={certificate.recipient_name} />
              <LabelValue label="Certificate Date" value={certificate.certificate_date} />
              <LabelValue 
                label="Issued Date" 
                value={
                  certificate.certificate_data?.issueDateDayMonth && certificate.certificate_data?.issueDateYear
                    ? (() => {
                        const dayMonth = certificate.certificate_data.issueDateDayMonth;
                        const year = certificate.certificate_data.issueDateYear;
                        const match = dayMonth.match(/(\d+)\s+day of\s+(\w+)/);
                        if (match) {
                          return `${match[2]} ${match[1]}, ${year}`;
                        }
                        return `${dayMonth}, ${year}`;
                      })()
                    : certificate.created_at 
                      ? new Date(certificate.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                      : 'N/A'
                } 
              />
              <div className="md:col-span-2">
                <LabelValue 
                  label="Church Information" 
                  value={
                    <div className="flex items-start space-x-4">
                      {certificate.church_profile_image && (
                        <img 
                          src={certificate.church_profile_image} 
                          alt={`${certificate.church_name} Logo`}
                          className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-lg">{certificate.church_name}</div>
                        <div className="text-sm text-gray-600">
                          {certificate.church_street && (
                            <>{certificate.church_street}, </>
                          )}
                          {certificate.certificate_data?.church_info?.street && !certificate.church_street && (
                            <>{certificate.certificate_data.church_info.street}, </>
                          )}
                          {certificate.church_city}, {certificate.church_province}
                        </div>
                      </div>
                    </div>
                  } 
                />
              </div>
            </div>
          </div>

          {/* Security Note */}
          <div className="px-6 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                <p className="text-sm text-blue-800">
                  This verification is issued by the church's system. If you suspect fraud, please contact the issuing church.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateVerificationPage;
