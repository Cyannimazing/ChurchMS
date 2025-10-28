"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Search, User, Mail, Phone, MapPin, Calendar, Users, Eye, Filter, Download, XCircle, UserX, MessageSquare, Edit } from "lucide-react";
import { useAuth } from "@/hooks/auth.jsx";
import axios from "@/lib/axios";
import DataLoading from "@/components/DataLoading";
import SearchAndPagination from "@/components/SearchAndPagination";
import { Button } from "@/components/Button.jsx";
import Alert from "@/components/Alert";
import ConfirmDialog from "@/components/ConfirmDialog";

const MemberDirectoryPage = () => {
  const { churchname } = useParams();
  const { user } = useAuth();

  // Permission helper
  const hasPermission = (permissionName) => {
    return user?.profile?.system_role?.role_name === "ChurchOwner" ||
      user?.church_role?.permissions?.some(
        (perm) => perm.PermissionName === permissionName
      );
  };

  const hasAccess = hasPermission("member-directory_list");
  const canReview = hasPermission("member-directory_review");
  const canEdit = hasPermission("member-directory_edit");
  const canMarkAsAway = hasPermission("member-directory_markAsAway");
  const canExportPDF = hasPermission("member-directory_exportPDF");

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("approved");
  const [selectedMember, setSelectedMember] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const itemsPerPage = 6;
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [memberToMarkAway, setMemberToMarkAway] = useState(null);
  const [showComingSoonAlert, setShowComingSoonAlert] = useState(false);

  useEffect(() => {
    if (hasAccess) fetchMembers();
  }, [currentPage, statusFilter, hasAccess]);

  // Filter members based on search term
  useEffect(() => {
    let filtered = [...members];
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(member => (
        `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchLower) ||
        member.head_email_address?.toLowerCase().includes(searchLower) ||
        member.city?.toLowerCase().includes(searchLower) ||
        member.province?.toLowerCase().includes(searchLower)
      ));
    }
    
    setFilteredMembers(filtered);
  }, [searchTerm, members]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/church-members", {
        params: {
          church_id: getCurrentChurchId(),
          status: statusFilter,
          page: currentPage
        }
      });
      setMembers(response.data.data);
      setFilteredMembers(response.data.data);
      setTotalPages(response.data.last_page || 1);
    } catch (error) {
      console.error("Error fetching members:", error);
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

  const handleViewMember = (member) => {
    setSelectedMember(member);
    setShowModal(true);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleExportMembers = () => {
    if (filteredMembers.length === 0) {
      alert('No members to export');
      return;
    }

    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      alert('Please allow popups to export the member list');
      return;
    }

    const today = new Date();
    const dateStr = today.toLocaleDateString();
    
    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Church Member Directory</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }
          .header h1 {
            margin: 0;
            color: #2c3e50;
          }
          .header p {
            margin: 5px 0;
            color: #666;
          }
          .member-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 15px;
            margin-top: 20px;
          }
          .member-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            background-color: #f9f9f9;
          }
          .member-name {
            font-weight: bold;
            font-size: 16px;
            color: #2c3e50;
            margin-bottom: 8px;
          }
          .member-info {
            font-size: 14px;
            line-height: 1.4;
            color: #555;
          }
          .member-info div {
            margin-bottom: 4px;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #888;
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Church Member Directory</h1>
          <p>Generated on: ${dateStr}</p>
          <p>Total Members: ${filteredMembers.length}</p>
        </div>
        
        <div class="member-list">
          ${filteredMembers.map(member => `
            <div class="member-card">
              <div class="member-name">${member.first_name} ${member.last_name}</div>
              <div class="member-info">
                <div><strong>Email:</strong> ${member.head_email_address || 'Not provided'}</div>
                <div><strong>Phone:</strong> ${member.head_phone_number || 'Not provided'}</div>
                <div><strong>Address:</strong> ${member.city || ''}, ${member.province || ''}</div>
                ${member.spouse_first_name ? `<div><strong>Spouse:</strong> ${member.spouse_first_name} ${member.spouse_last_name || ''}</div>` : ''}
                ${member.children && member.children.length > 0 ? `<div><strong>Children:</strong> ${member.children.length}</div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="footer">
          <p>Church Member Directory - Confidential Information</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const handleMarkAsAwayClick = (member) => {
    setMemberToMarkAway(member);
    setShowConfirmDialog(true);
  };

  const handleEditClick = () => {
    setShowComingSoonAlert(true);
  };

  const handleMarkAsAway = async () => {
    if (!memberToMarkAway) return;
    
    setIsUpdatingStatus(true);
    try {
      await axios.post(`/api/church-members/${memberToMarkAway.id}/set-away`, {
        notes: `Member marked as away by staff - can now register at another church`
      });
      
      // Update the member in the local state
      const updatedMembers = members.map(m => 
        m.id === memberToMarkAway.id ? { ...m, status: 'away' } : m
      );
      setMembers(updatedMembers);
      setFilteredMembers(updatedMembers.filter(m => 
        statusFilter === 'approved' ? m.status === 'approved' : true
      ));
      
      // Close modal and show success message
      setShowModal(false);
      setSelectedMember(null);
      setShowConfirmDialog(false);
      setMemberToMarkAway(null);
      setSuccessMessage('Member has been marked as "Away" successfully. They can now register at another church.');
      
    } catch (error) {
      console.error('Error marking member as away:', error);
      const errorMessage = error.response?.data?.message || 'Failed to mark member as away';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };


  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">Approved</span>;
      case "pending":
        return <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">Pending</span>;
      case "rejected":
        return <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">Rejected</span>;
      case "away":
        return <span className="px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-800 rounded-full">Away</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">{status}</span>;
    }
  };

  // Pagination for filtered members
  const totalFilteredPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentMembers = filteredMembers.slice(startIndex, startIndex + itemsPerPage);

  const MemberModal = () => {
    if (!selectedMember) return null;

    const member = selectedMember;

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
                  {member.first_name} {member.last_name}
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  {getStatusBadge(member.status)}
                  {member.approved_at && (
                    <span className="ml-2">
                      - Approved on {formatDate(member.approved_at)}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Modal Content */}
          <div className="px-4 py-4 overflow-y-auto" style={{
            maxHeight: 'calc(95vh - 140px)'
          }}>
            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                {/* Parish Registration - View Mode */}
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
                        <div><strong className="text-gray-700">Name:</strong> <span className="text-gray-900">{member.first_name} {member.middle_initial && `${member.middle_initial}. `}{member.last_name}</span></div>
                        <div><strong className="text-gray-700">Email:</strong> <span className="text-gray-900">{member.email || 'Not provided'}</span></div>
                        <div><strong className="text-gray-700">Phone:</strong> <span className="text-gray-900">{member.contact_number || 'Not provided'}</span></div>
                        <div><strong className="text-gray-700">Financial Support:</strong> 
                          <span className="inline-flex items-center px-2 py-1 ml-2 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                            {member.financial_support}
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
                        <div><strong className="text-gray-700">Street:</strong> <span className="text-gray-900">{member.street_address}</span></div>
                        <div><strong className="text-gray-700">City:</strong> <span className="text-gray-900">{member.city}</span></div>
                        <div><strong className="text-gray-700">Province:</strong> <span className="text-gray-900">{member.province}</span></div>
                        {member.postal_code && <div><strong className="text-gray-700">Postal Code:</strong> <span className="text-gray-900">{member.postal_code}</span></div>}
                        {member.barangay && <div><strong className="text-gray-700">Barangay:</strong> <span className="text-gray-900">{member.barangay}</span></div>}
                      </div>
                    </div>
                  </div>
                </div>
                </div>

                {/* Head of House - View Mode */}
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
                        <div><strong className="text-gray-700">Name:</strong> <span className="text-gray-900">{member.head_first_name} {member.head_last_name}</span></div>
                        {member.head_maiden_name && <div><strong className="text-gray-700">Maiden Name:</strong> <span className="text-gray-900">{member.head_maiden_name}</span></div>}
                        <div><strong className="text-gray-700">Date of Birth:</strong> <span className="text-gray-900">{formatDate(member.head_date_of_birth)}</span></div>
                        <div><strong className="text-gray-700">Religion:</strong> <span className="text-gray-900">{member.head_religion}</span></div>
                      </div>
                    </div>
                    
                    {/* Contact Info */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-800 flex items-center border-b border-gray-200 pb-2">
                        <Phone className="w-4 h-4 mr-2" />
                        Contact Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div><strong className="text-gray-700">Phone:</strong> <span className="text-gray-900">{member.head_phone_number}</span></div>
                        <div><strong className="text-gray-700">Email:</strong> <span className="text-gray-900">{member.head_email_address}</span></div>
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
                            {member.head_marital_status}
                          </span>
                        </div>
                        <div><strong className="text-gray-700">Catholic Marriage:</strong> 
                          <span className="inline-flex items-center px-2 py-1 ml-2 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                            {member.head_catholic_marriage ? "Yes" : "No"}
                          </span>
                        </div>
                        <div><strong className="text-gray-700">Sacraments:</strong>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {[
                              member.head_baptism && "Baptism",
                              member.head_first_eucharist && "First Eucharist",
                              member.head_confirmation && "Confirmation"
                            ].filter(Boolean).map((sacrament, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                {sacrament}
                              </span>
                            ))}
                            {[
                              member.head_baptism && "Baptism",
                              member.head_first_eucharist && "First Eucharist",
                              member.head_confirmation && "Confirmation"
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

                {/* Spouse Information - View Mode */}
                {member.spouse_first_name && (
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
                          <div><strong className="text-gray-700">Name:</strong> <span className="text-gray-900">{member.spouse_first_name} {member.spouse_last_name}</span></div>
                          {member.spouse_maiden_name && <div><strong className="text-gray-700">Maiden Name:</strong> <span className="text-gray-900">{member.spouse_maiden_name}</span></div>}
                          {member.spouse_date_of_birth && <div><strong className="text-gray-700">Date of Birth:</strong> <span className="text-gray-900">{formatDate(member.spouse_date_of_birth)}</span></div>}
                          {member.spouse_religion && <div><strong className="text-gray-700">Religion:</strong> <span className="text-gray-900">{member.spouse_religion}</span></div>}
                        </div>
                      </div>
                      
                      {/* Contact Info */}
                      {(member.spouse_phone_number || member.spouse_email_address) && (
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-800 flex items-center border-b border-gray-200 pb-2">
                            <Phone className="w-4 h-4 mr-2" />
                            Contact Information
                          </h4>
                          <div className="space-y-2 text-sm">
                            {member.spouse_phone_number && <div><strong className="text-gray-700">Phone:</strong> <span className="text-gray-900">{member.spouse_phone_number}</span></div>}
                            {member.spouse_email_address && <div><strong className="text-gray-700">Email:</strong> <span className="text-gray-900">{member.spouse_email_address}</span></div>}
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
                          {member.spouse_marital_status && (
                            <div><strong className="text-gray-700">Marital Status:</strong> 
                              <span className="inline-flex items-center px-2 py-1 ml-2 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                {member.spouse_marital_status}
                              </span>
                            </div>
                          )}
                          {member.spouse_catholic_marriage !== null && (
                            <div><strong className="text-gray-700">Catholic Marriage:</strong> 
                              <span className="inline-flex items-center px-2 py-1 ml-2 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                {member.spouse_catholic_marriage ? "Yes" : "No"}
                              </span>
                            </div>
                          )}
                          <div><strong className="text-gray-700">Sacraments:</strong>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {[
                                member.spouse_baptism && "Baptism",
                                member.spouse_first_eucharist && "First Eucharist",
                                member.spouse_confirmation && "Confirmation"
                              ].filter(Boolean).map((sacrament, index) => (
                                <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                  {sacrament}
                                </span>
                              ))}
                              {[
                                member.spouse_baptism && "Baptism",
                                member.spouse_first_eucharist && "First Eucharist",
                                member.spouse_confirmation && "Confirmation"
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

                {/* Children - View Mode */}
                {member.children && member.children.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 border-t pt-6">Children ({member.children.length})</h3>
                    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                      <div className="space-y-4">
                        {member.children.map((child, index) => (
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

                {/* Additional Information - View Mode */}
                {(member.talent_to_share || member.interested_ministry || member.parish_help_needed || 
                  member.other_languages || member.ethnicity || member.homebound_special_needs) && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 border-t pt-6">Additional Information</h3>
                  <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Ministry & Talents */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-800 flex items-center border-b border-gray-200 pb-2">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Ministry & Talents
                        </h4>
                        <div className="space-y-3 text-sm">
                          {member.talent_to_share && (
                            <div>
                              <strong className="text-gray-700">Talents to Share:</strong>
                              <p className="mt-1 text-gray-900 bg-gray-50 p-2 rounded-md">{member.talent_to_share}</p>
                            </div>
                          )}
                          {member.interested_ministry && (
                            <div>
                              <strong className="text-gray-700">Ministry Interest:</strong>
                              <p className="mt-1 text-gray-900 bg-gray-50 p-2 rounded-md">{member.interested_ministry}</p>
                            </div>
                          )}
                          {member.parish_help_needed && (
                            <div>
                              <strong className="text-gray-700">Help Needed:</strong>
                              <p className="mt-1 text-gray-900 bg-gray-50 p-2 rounded-md">{member.parish_help_needed}</p>
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
                          {member.other_languages && (
                            <div><strong className="text-gray-700">Other Languages:</strong> 
                              <span className="inline-flex items-center px-2 py-1 ml-2 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                {member.other_languages}
                              </span>
                            </div>
                          )}
                          {member.ethnicity && (
                            <div><strong className="text-gray-700">Ethnicity:</strong> 
                              <span className="inline-flex items-center px-2 py-1 ml-2 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                {member.ethnicity}
                              </span>
                            </div>
                          )}
                          {member.homebound_special_needs && (
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
                )}

                {/* Admin Notes - View Mode */}
                {member.notes && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 border-t pt-6">Staff Notes</h3>
                  <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                    <p className="text-sm text-gray-900">{member.notes}</p>
                  </div>
                  </div>
                )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end items-center gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            {member.status === 'approved' && (
              <Button
                onClick={() => handleMarkAsAwayClick(member)}
                variant="outline"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 border-orange-200"
                disabled={!canMarkAsAway || isUpdatingStatus}
                title={!canMarkAsAway ? "You don't have permission to mark members as away" : ""}
              >
                <UserX className="h-4 w-4 mr-2" />
                Mark as Away
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };


  // Show unauthorized view if user doesn't have access
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
                You do not have permission to access the Member Directory page.
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
              Member Directory
            </h1>
            
            {/* Success Message */}
            {successMessage && (
              <Alert
                type="success"
                message={successMessage}
                onClose={() => setSuccessMessage('')}
                className="mb-4"
              />
            )}
            
            {/* Coming Soon Alert */}
            {showComingSoonAlert && (
              <Alert
                type="info"
                title="Coming Soon"
                message="Edit functionality is currently under development and will be available soon."
                onClose={() => setShowComingSoonAlert(false)}
                className="mb-4"
              />
            )}
            
            <div className="mt-6">
              <div className="overflow-x-auto">
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Member Directory</h3>
                        <p className="mt-1 text-sm text-gray-600">Directory of approved church members and their contact information.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-6 py-4 space-y-4">
                    {/* Summary and Export */}
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        Showing {filteredMembers.length} approved member{filteredMembers.length !== 1 ? 's' : ''}
                      </div>
                      <Button
                        onClick={handleExportMembers}
                        variant="outline"
                        className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        disabled={!canExportPDF || filteredMembers.length === 0}
                        title={!canExportPDF ? "You don't have permission to export PDF" : ""}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export PDF
                      </Button>
                    </div>
                    
                    {/* Search and Pagination */}
                    <SearchAndPagination
                      searchQuery={searchTerm}
                      onSearchChange={handleSearch}
                      currentPage={currentPage}
                      totalPages={totalFilteredPages}
                      onPageChange={handlePageChange}
                      totalItems={filteredMembers.length}
                      itemsPerPage={itemsPerPage}
                      placeholder="Search members..."
                    />
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
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
                                <DataLoading message="Loading members..." />
                              </td>
                            </tr>
                          ) : currentMembers.length > 0 ? (
                            currentMembers.map((member) => (
                            <tr key={member.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                      <User className="h-5 w-5 text-blue-600" />
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {member.first_name} {member.last_name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {member.city}, {member.province}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  <div className="flex items-center mb-1">
                                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                    {member.email || 'Not provided'}
                                  </div>
                                  <div className="flex items-center">
                                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                    {member.contact_number || 'Not provided'}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {getStatusBadge(member.status)}
                                  {member.approved_at && (
                                    <div className="ml-2 text-xs text-gray-500">
                                      Since {formatDate(member.approved_at)}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {member.head_marital_status === 'Married' && member.spouse_first_name && (
                                    <div className="flex items-center mb-1">
                                      <User className="w-3 h-3 mr-1 text-gray-400" />
                                      Spouse: {member.spouse_first_name}
                                    </div>
                                  )}
                                  {member.children && member.children.length > 0 && (
                                    <div className="flex items-center">
                                      <Users className="w-3 h-3 mr-1 text-gray-400" />
                                      {member.children.length} {member.children.length === 1 ? 'child' : 'children'}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex justify-center items-center space-x-2">
                                  <Button
                                    onClick={() => handleViewMember(member)}
                                    variant="outline"
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200 min-h-0 h-auto"
                                    disabled={!canReview}
                                    title={!canReview ? "You don't have permission to review members" : ""}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </Button>
                                  <Button
                                    onClick={handleEditClick}
                                    variant="outline"
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border-gray-200 min-h-0 h-auto"
                                    disabled={!canEdit}
                                    title={!canEdit ? "You don't have permission to edit members" : ""}
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
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
                                  <p>No members found.</p>
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

      {showModal && <MemberModal />}
      
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => {
          setShowConfirmDialog(false);
          setMemberToMarkAway(null);
        }}
        onConfirm={handleMarkAsAway}
        title="Mark Member as Away"
        message={`Are you sure you want to mark ${memberToMarkAway?.first_name} ${memberToMarkAway?.last_name} as "Away"? This will allow them to register at another church.`}
        confirmText="Yes, Mark as Away"
        cancelText="Cancel"
        type="warning"
        isLoading={isUpdatingStatus}
      />
    </div>
  );
};

export default MemberDirectoryPage;