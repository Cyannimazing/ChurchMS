"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Eye, Calendar, User, Mail, Phone, MapPin, MessageSquare, Users } from "lucide-react";
import { useAuth } from "@/hooks/auth.jsx";
import axios from "@/lib/axios";
import DataLoading from "@/components/DataLoading";
import SearchAndPagination from "@/components/SearchAndPagination";
import { Button } from "@/components/Button.jsx";
import Label from "@/components/Label.jsx";

const MemberApplicationsContent = () => {
  const { churchname } = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [highlightedApplicationId, setHighlightedApplicationId] = useState(null);
  const highlightedRowRef = useRef(null);
  const itemsPerPage = 6;

  // Permission helper function
  const hasPermission = (permissionName) => {
    return user?.profile?.system_role?.role_name === "ChurchOwner" ||
      user?.church_role?.permissions?.some(
        (perm) => perm.PermissionName === permissionName
      );
  };

  const hasAccess = hasPermission("member-application_list");
  const canReviewApplication = hasPermission("member-application_review");

  useEffect(() => {
    fetchApplications();
  }, []);

  // Handle deep-linking from notifications
  useEffect(() => {
    if (!applications.length) return;
    
    const applicationId = searchParams.get('applicationId');
    if (applicationId) {
      const parsedId = parseInt(applicationId, 10);
      setHighlightedApplicationId(parsedId);
      
      // Scroll to highlighted row
      setTimeout(() => {
        if (highlightedRowRef.current) {
          highlightedRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
      
      // Clear highlight after 3 seconds
      const timer = setTimeout(() => {
        setHighlightedApplicationId(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [applications, searchParams]);

  // Filter applications based on search term
  useEffect(() => {
    let filtered = [...applications];
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(application => (
        `${application.first_name} ${application.last_name}`.toLowerCase().includes(searchLower) ||
        application.email?.toLowerCase().includes(searchLower) ||
        application.city?.toLowerCase().includes(searchLower) ||
        application.province?.toLowerCase().includes(searchLower)
      ));
    }
    
    // Sort by created_at descending (newest first)
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    setFilteredApplications(filtered);
    setCurrentPage(1);
  }, [searchTerm, applications]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/member-applications", {
        params: {
          church_id: getCurrentChurchId(),
          status: "pending"
        }
      });
      setApplications(response.data.data);
      setFilteredApplications(response.data.data);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

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

  // Pagination
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentApplications = filteredApplications.slice(startIndex, startIndex + itemsPerPage);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleViewApplication = (application) => {
    setSelectedApplication(application);
    setShowModal(true);
  };

  const handleAction = async (application, action) => {
    setActionLoading(true);
    try {
      const endpoint = action === "approve" 
        ? `/api/church-members/${application.id}/approve`
        : `/api/church-members/${application.id}/reject`;
      
      await axios.post(endpoint, { notes });
      
      // Remove from applications list
      setApplications(prev => prev.filter(app => app.id !== application.id));
      
      setShowModal(false);
      setNotes("");
      setSelectedApplication(null);
    } catch (error) {
      console.error(`Error ${action}ing application:`, error);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const ApplicationModal = () => {
    if (!selectedApplication) return null;

    const app = selectedApplication;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl mx-auto relative"
          style={{
            width: '90vw',
            maxWidth: '90vw',
            maxHeight: '95vh',
            minHeight: '80vh'
          }}
          role="dialog"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="relative bg-gray-100 px-4 py-4 rounded-t-lg">
            <Button
              onClick={() => setShowModal(false)}
              variant="outline"
              className="absolute top-4 right-4 inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Close
            </Button>
            <div className="flex items-center space-x-3 pr-16">
              <div>
                <h2 id="modal-title" className="text-xl font-bold text-gray-800">
                  Member Application Details
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  {app.first_name} {app.last_name} - {app.city}, {app.province}
                </p>
              </div>
            </div>
          </div>

          {/* Modal Content */}
          <div className="px-4 py-4 overflow-y-auto" style={{
            maxHeight: 'calc(95vh - 140px)'
          }}>
            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            {/* Parish Registration Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Parish Registration</h3>
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal & Contact Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 flex items-center border-b border-gray-200 pb-2">
                    <User className="w-4 h-4 mr-2" />
                    Personal & Contact Information
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div><strong className="text-gray-700">Name:</strong> <span className="text-gray-900">{app.first_name} {app.middle_initial && `${app.middle_initial}. `}{app.last_name}</span></div>
                    <div><strong className="text-gray-700">Email:</strong> <span className="text-gray-900">{app.email || app.head_email_address || 'Not provided'}</span></div>
                    <div><strong className="text-gray-700">Phone:</strong> <span className="text-gray-900">{app.contact_number || app.head_phone_number || 'Not provided'}</span></div>
                    <div><strong className="text-gray-700">Financial Support:</strong> 
                      <span className="inline-flex items-center px-2 py-1 ml-2 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                        {app.financial_support}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Address Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 flex items-center border-b border-gray-200 pb-2">
                    <MapPin className="w-4 h-4 mr-2" />
                    Address Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div><strong className="text-gray-700">Street:</strong> <span className="text-gray-900">{app.street_address}</span></div>
                    <div><strong className="text-gray-700">City:</strong> <span className="text-gray-900">{app.city}</span></div>
                    <div><strong className="text-gray-700">Province:</strong> <span className="text-gray-900">{app.province}</span></div>
                    {app.postal_code && <div><strong className="text-gray-700">Postal Code:</strong> <span className="text-gray-900">{app.postal_code}</span></div>}
                    {app.barangay && <div><strong className="text-gray-700">Barangay:</strong> <span className="text-gray-900">{app.barangay}</span></div>}
                  </div>
                </div>
              </div>
            </div>
            </div>

            {/* Head of House */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 border-t pt-6">Head of House</h3>
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 flex items-center border-b border-gray-200 pb-2">
                    <User className="w-4 h-4 mr-2" />
                    Basic Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div><strong className="text-gray-700">Name:</strong> <span className="text-gray-900">{app.head_first_name} {app.head_middle_initial && `${app.head_middle_initial}. `}{app.head_last_name}</span></div>
                    <div><strong className="text-gray-700">Date of Birth:</strong> <span className="text-gray-900">{formatDate(app.head_date_of_birth)}</span></div>
                    <div><strong className="text-gray-700">Religion:</strong> <span className="text-gray-900">{app.head_religion}</span></div>
                  </div>
                </div>
                
                {/* Contact Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 flex items-center border-b border-gray-200 pb-2">
                    <Phone className="w-4 h-4 mr-2" />
                    Contact Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div><strong className="text-gray-700">Phone:</strong> <span className="text-gray-900">{app.head_phone_number}</span></div>
                    <div><strong className="text-gray-700">Email:</strong> <span className="text-gray-900">{app.head_email_address}</span></div>
                  </div>
                </div>
                
                {/* Religious Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 flex items-center border-b border-gray-200 pb-2">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                    Religious Status
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div><strong className="text-gray-700">Marital Status:</strong> 
                      <span className="inline-flex items-center px-2 py-1 ml-2 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                        {app.head_marital_status}
                      </span>
                    </div>
                    <div><strong className="text-gray-700">Catholic Marriage:</strong> 
                      <span className="inline-flex items-center px-2 py-1 ml-2 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                        {app.head_catholic_marriage ? "Yes" : "No"}
                      </span>
                    </div>
                    <div><strong className="text-gray-700">Sacraments:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {[
                          app.head_baptism && "Baptism",
                          app.head_first_eucharist && "First Eucharist",
                          app.head_confirmation && "Confirmation"
                        ].filter(Boolean).map((sacrament, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                            {sacrament}
                          </span>
                        ))}
                        {[
                          app.head_baptism && "Baptism",
                          app.head_first_eucharist && "First Eucharist",
                          app.head_confirmation && "Confirmation"
                        ].filter(Boolean).length === 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                            None
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>

            {/* Spouse Info */}
            {app.spouse_first_name && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 border-t pt-6">Spouse</h3>
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 flex items-center border-b border-gray-200 pb-2">
                      <User className="w-4 h-4 mr-2" />
                      Basic Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div><strong className="text-gray-700">Name:</strong> <span className="text-gray-900">{app.spouse_first_name} {app.spouse_middle_initial && `${app.spouse_middle_initial}. `}{app.spouse_last_name}</span></div>
                      {app.spouse_date_of_birth && <div><strong className="text-gray-700">Date of Birth:</strong> <span className="text-gray-900">{formatDate(app.spouse_date_of_birth)}</span></div>}
                      {app.spouse_religion && <div><strong className="text-gray-700">Religion:</strong> <span className="text-gray-900">{app.spouse_religion}</span></div>}
                    </div>
                  </div>
                  
                  {/* Contact Info */}
                  {(app.spouse_phone_number || app.spouse_email_address) && (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-800 flex items-center border-b border-gray-200 pb-2">
                        <Phone className="w-4 h-4 mr-2" />
                        Contact Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        {app.spouse_phone_number && <div><strong className="text-gray-700">Phone:</strong> <span className="text-gray-900">{app.spouse_phone_number}</span></div>}
                        {app.spouse_email_address && <div><strong className="text-gray-700">Email:</strong> <span className="text-blue-600">{app.spouse_email_address}</span></div>}
                      </div>
                    </div>
                  )}
                  
                  {/* Religious Info */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 flex items-center border-b border-gray-200 pb-2">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      Religious Status
                    </h4>
                    <div className="space-y-2 text-sm">
                      {app.spouse_marital_status && (
                        <div><strong className="text-gray-700">Marital Status:</strong> 
                          <span className="inline-flex items-center px-2 py-1 ml-2 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                            {app.spouse_marital_status}
                          </span>
                        </div>
                      )}
                      {app.spouse_catholic_marriage !== null && (
                        <div><strong className="text-gray-700">Catholic Marriage:</strong> 
                          <span className="inline-flex items-center px-2 py-1 ml-2 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                            {app.spouse_catholic_marriage ? "Yes" : "No"}
                          </span>
                        </div>
                      )}
                      <div><strong className="text-gray-700">Sacraments:</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {[
                            app.spouse_baptism && "Baptism",
                            app.spouse_first_eucharist && "First Eucharist",
                            app.spouse_confirmation && "Confirmation"
                          ].filter(Boolean).map((sacrament, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                              {sacrament}
                            </span>
                          ))}
                          {[
                            app.spouse_baptism && "Baptism",
                            app.spouse_first_eucharist && "First Eucharist",
                            app.spouse_confirmation && "Confirmation"
                          ].filter(Boolean).length === 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                              None
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            )}

            {/* Children */}
            {app.children && app.children.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 border-t pt-6">Children ({app.children.length})</h3>
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                  <div className="space-y-4">
                    {app.children.map((child, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Basic Info */}
                          <div className="space-y-2">
                            <h5 className="font-semibold text-gray-800 border-b border-gray-200 pb-1">Child {index + 1}</h5>
                            <div className="space-y-1 text-sm">
                              <div><strong className="text-gray-700">Name:</strong> <span className="text-gray-900">{child.first_name} {child.last_name}</span></div>
                              <div><strong className="text-gray-700">Date of Birth:</strong> <span className="text-gray-900">{formatDate(child.date_of_birth)}</span></div>
                              <div><strong className="text-gray-700">Sex:</strong> <span className="text-gray-900">{child.sex === 'M' ? 'Male' : 'Female'}</span></div>
                            </div>
                          </div>
                          
                          {/* School Info */}
                          <div className="space-y-2">
                            <h5 className="font-semibold text-gray-800 border-b border-gray-200 pb-1">Education</h5>
                            <div className="space-y-1 text-sm">
                              {child.school && <div><strong className="text-gray-700">School:</strong> <span className="text-gray-900">{child.school}</span></div>}
                              {child.grade && <div><strong className="text-gray-700">Grade:</strong> <span className="text-gray-900">{child.grade}</span></div>}
                              {child.religion && <div><strong className="text-gray-700">Religion:</strong> <span className="text-gray-900">{child.religion}</span></div>}
                            </div>
                          </div>
                          
                          {/* Sacraments */}
                          <div className="space-y-2">
                            <h5 className="font-semibold text-gray-800 border-b border-gray-200 pb-1">Sacraments</h5>
                            <div className="flex flex-wrap gap-1">
                              {[
                                child.baptism && "Baptism",
                                child.first_eucharist && "First Eucharist",
                                child.confirmation && "Confirmation"
                              ].filter(Boolean).map((sacrament, idx) => (
                                <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                  {sacrament}
                                </span>
                              ))}
                              {[
                                child.baptism && "Baptism",
                                child.first_eucharist && "First Eucharist",
                                child.confirmation && "Confirmation"
                              ].filter(Boolean).length === 0 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                  None
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* About Yourself */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 border-t pt-6">About Yourself</h3>
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Ministry & Talents */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 flex items-center border-b border-gray-200 pb-2">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Ministry & Talents
                    </h4>
                    <div className="space-y-3 text-sm">
                      {app.talent_to_share && (
                        <div>
                          <strong className="text-gray-700">Talents to Share:</strong>
                          <p className="mt-1 text-gray-900 bg-gray-50 p-2 rounded-md">{app.talent_to_share}</p>
                        </div>
                      )}
                      {app.interested_ministry && (
                        <div>
                          <strong className="text-gray-700">Ministry Interest:</strong>
                          <p className="mt-1 text-gray-900 bg-gray-50 p-2 rounded-md">{app.interested_ministry}</p>
                        </div>
                      )}
                      {app.parish_help_needed && (
                        <div>
                          <strong className="text-gray-700">Help Needed:</strong>
                          <p className="mt-1 text-gray-900 bg-gray-50 p-2 rounded-md">{app.parish_help_needed}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Personal Details */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 flex items-center border-b border-gray-200 pb-2">
                      <User className="w-4 h-4 mr-2" />
                      Personal Details
                    </h4>
                    <div className="space-y-3 text-sm">
                      {app.other_languages && (
                        <div><strong className="text-gray-700">Other Languages:</strong> 
                          <span className="inline-flex items-center px-2 py-1 ml-2 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                            {app.other_languages}
                          </span>
                        </div>
                      )}
                      {app.ethnicity && (
                        <div><strong className="text-gray-700">Ethnicity:</strong> 
                          <span className="inline-flex items-center px-2 py-1 ml-2 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                            {app.ethnicity}
                          </span>
                        </div>
                      )}
                      {app.homebound_special_needs && (
                        <div className="bg-gray-100 border border-gray-200 p-3 rounded-md">
                          <strong className="text-gray-800">Special Note:</strong>
                          <p className="mt-1 text-gray-700">Has homebound or special needs family members</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="border-t pt-6">
              <Label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900"
                placeholder="Add any notes about this application..."
              />
            </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end items-center px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg space-x-3">
            <Button
              onClick={() => handleAction(app, "reject")}
              variant="outline"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border-red-200 cursor-pointer"
              disabled={actionLoading || !canReviewApplication}
              title={!canReviewApplication ? 'You do not have permission to review applications' : ''}
            >
              <XCircle className="h-4 w-4 mr-2" />
              {actionLoading ? "Processing..." : "Reject"}
            </Button>
            <Button
              onClick={() => handleAction(app, "approve")}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 cursor-pointer"
              disabled={actionLoading || !canReviewApplication}
              title={!canReviewApplication ? 'You do not have permission to review applications' : ''}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {actionLoading ? "Processing..." : "Approve"}
            </Button>
          </div>
        </div>
      </div>
    );
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
                You do not have permission to access the Member Applications page.
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
          <div className="p-6 bg-white border-b border-gray-200 flex-1 overflow-auto">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">
              Member Applications
            </h1>
            
            <div className="mt-6">
              <div className="overflow-x-auto">
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Membership Applications</h3>
                        <p className="mt-1 text-sm text-gray-600">Review and manage pending member applications from users.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-6 py-4 space-y-4">
                    <div className="text-sm text-gray-600">
                      Showing {filteredApplications.length} application{filteredApplications.length !== 1 ? 's' : ''}
                    </div>
                    
                    {/* Search and Pagination */}
                    <SearchAndPagination
                      searchQuery={searchTerm}
                      onSearchChange={handleSearch}
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                      totalItems={filteredApplications.length}
                      itemsPerPage={itemsPerPage}
                      placeholder="Search applications..."
                    />
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Family</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {loading ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-8">
                                <DataLoading message="Loading applications..." />
                              </td>
                            </tr>
                          ) : currentApplications.length > 0 ? (
                            currentApplications.map((application) => (
                              <tr 
                                key={application.id} 
                                ref={application.id === highlightedApplicationId ? highlightedRowRef : null}
                                className={`hover:bg-gray-50 transition-colors duration-300 ${
                                  application.id === highlightedApplicationId
                                    ? "bg-blue-100 animate-pulse"
                                    : ""
                                }`}
                              >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                      <User className="h-5 w-5 text-blue-600" />
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {application.first_name} {application.last_name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {application.city}, {application.province}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  <div className="flex items-center mb-1">
                                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                    {application.email || 'N/A'}
                                  </div>
                                  <div className="flex items-center">
                                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                    {application.contact_number || 'N/A'}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center text-sm text-gray-900">
                                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                  <div>
                                    <div className="font-medium">
                                      {formatDate(application.created_at)}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {application.spouse_first_name && (
                                    <div className="flex items-center mb-1">
                                      <User className="w-3 h-3 mr-1 text-gray-400" />
                                      Spouse: {application.spouse_first_name}
                                    </div>
                                  )}
                                  {application.children && application.children.length > 0 && (
                                    <div className="flex items-center">
                                      <Users className="w-3 h-3 mr-1 text-gray-400" />
                                      {application.children.length} {application.children.length === 1 ? 'child' : 'children'}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex justify-center items-center space-x-2">
                                  <Button
                                    onClick={() => handleViewApplication(application)}
                                    variant="outline"
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200 min-h-0 h-auto cursor-pointer"
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    Review
                                  </Button>
                                </div>
                              </td>
                            </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                <div className="flex flex-col items-center">
                                  <User className="h-12 w-12 text-gray-300 mb-2" />
                                  <p>No applications found.</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && <ApplicationModal />}
    </div>
  );
};

const MemberApplicationsPage = () => {
  return (
    <Suspense fallback={<DataLoading message="Loading applications..." />}>
      <MemberApplicationsContent />
    </Suspense>
  );
};

export default MemberApplicationsPage;
