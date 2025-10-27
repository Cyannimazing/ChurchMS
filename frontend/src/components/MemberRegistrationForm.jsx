"use client";

import { useState, useEffect } from "react";
import { Plus, Minus, User, Home, Heart, Users, MessageSquare } from "lucide-react";
import Label from "@/components/Label.jsx";
import Input from "@/components/Input.jsx";

const MemberRegistrationForm = ({ onSubmit, loading, churchId, currentUser }) => {
  const [formData, setFormData] = useState({
    // Parish Registration
    church_id: churchId || "",
    first_name: "",
    middle_initial: "",
    last_name: "",
    email: "",
    contact_number: "",
    street_address: "",
    city: "",
    province: "",
    postal_code: "",
    barangay: "",
    financial_support: "",

    // Head of House
    head_first_name: "",
    head_middle_initial: "",
    head_last_name: "",
    head_date_of_birth: "",
    head_phone_number: "",
    head_email_address: "",
    head_religion: "",
    head_baptism: false,
    head_first_eucharist: false,
    head_confirmation: false,
    head_marital_status: "",
    head_catholic_marriage: false,

    // Spouse
    spouse_first_name: "",
    spouse_middle_initial: "",
    spouse_last_name: "",
    spouse_date_of_birth: "",
    spouse_phone_number: "",
    spouse_email_address: "",
    spouse_religion: "",
    spouse_baptism: false,
    spouse_first_eucharist: false,
    spouse_confirmation: false,
    spouse_marital_status: "",
    spouse_catholic_marriage: false,

    // About Yourself
    talent_to_share: "",
    interested_ministry: "",
    parish_help_needed: "",
    homebound_special_needs: false,
    other_languages: "",
    ethnicity: "",

    // Children
    children: [],
  });

  const [showSpouse, setShowSpouse] = useState(false);

  // Auto-populate Parish Registration fields with current user data
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        first_name: currentUser.profile?.first_name || "",
        middle_initial: currentUser.profile?.middle_name || "",
        last_name: currentUser.profile?.last_name || "",
        email: currentUser.email || "",
        contact_number: currentUser.contact?.contact_number || ""
      }));
    }
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleChildChange = (index, field, value) => {
    const updatedChildren = [...formData.children];
    updatedChildren[index] = {
      ...updatedChildren[index],
      [field]: field.includes("baptism") || field.includes("eucharist") || field.includes("confirmation") ? 
        value : value
    };
    setFormData((prev) => ({
      ...prev,
      children: updatedChildren,
    }));
  };

  const addChild = () => {
    setFormData((prev) => ({
      ...prev,
      children: [
        ...prev.children,
        {
          first_name: "",
          last_name: "",
          date_of_birth: "",
          sex: "",
          religion: "",
          baptism: false,
          first_eucharist: false,
          confirmation: false,
          school: "",
          grade: "",
        },
      ],
    }));
  };

  const removeChild = (index) => {
    setFormData((prev) => ({
      ...prev,
      children: prev.children.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleAutoFill = () => {
    setFormData({
      ...formData,
      // Parish Registration - keep user's personal data, only fill test data for address
      street_address: "123 Rizal Street",
      city: "Manila",
      province: "Metro Manila",
      postal_code: "1000",
      barangay: "Barangay 1",
      financial_support: "Weekly Collection",

      // Head of House
      head_first_name: "Juan",
      head_middle_initial: "D",
      head_last_name: "Dela Cruz",
      head_date_of_birth: "1980-01-15",
      head_phone_number: "+639123456789",
      head_email_address: "juan.delacruz@email.com",
      head_religion: "Roman Catholic",
      head_baptism: true,
      head_first_eucharist: true,
      head_confirmation: true,
      head_marital_status: "Married",
      head_catholic_marriage: true,

      // Spouse
      spouse_first_name: "Maria",
      spouse_middle_initial: "S",
      spouse_last_name: "Dela Cruz",
      spouse_date_of_birth: "1985-03-20",
      spouse_phone_number: "+639987654321",
      spouse_email_address: "maria.delacruz@email.com",
      spouse_religion: "Roman Catholic",
      spouse_baptism: true,
      spouse_first_eucharist: true,
      spouse_confirmation: true,
      spouse_marital_status: "Married",
      spouse_catholic_marriage: true,

      // About Yourself
      talent_to_share: "I can play the guitar and help with music ministry.",
      interested_ministry: "Music Ministry and Youth Group",
      parish_help_needed: "Prayer support for my family",
      homebound_special_needs: false,
      other_languages: "Tagalog, Cebuano",
      ethnicity: "Filipino",

      // Children
      children: [
        {
          first_name: "Miguel",
          last_name: "Dela Cruz",
          date_of_birth: "2010-05-10",
          sex: "M",
          religion: "Roman Catholic",
          baptism: true,
          first_eucharist: false,
          confirmation: false,
          school: "Manila Elementary School",
          grade: "Grade 6",
        },
        {
          first_name: "Sofia",
          last_name: "Dela Cruz",
          date_of_birth: "2015-08-25",
          sex: "F",
          religion: "Roman Catholic",
          baptism: true,
          first_eucharist: false,
          confirmation: false,
          school: "Manila Elementary School",
          grade: "Grade 1",
        }
      ],
    });
    setShowSpouse(true); // Show spouse section since we're filling spouse data
  };

  return (
    <div>
      {/* Auto Fill Button for Testing */}
      <div className="mb-4 text-right">
        <button
          type="button"
          onClick={handleAutoFill}
          className="inline-flex items-center px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
        >
          🧪 Auto Fill (Testing)
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Parish Registration Section */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <Home className="w-5 h-5 text-gray-600 mr-2" />
          <h2 className="text-base font-semibold text-gray-900">Parish Registration</h2>
        </div>
        
        {/* Personal Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center border-b border-gray-200 pb-2">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="first_name" className="mb-1">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="first_name"
                type="text"
                name="first_name"
                value={formData.first_name}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 text-sm cursor-not-allowed"
                required
              />
            </div>

            <div>
              <Label htmlFor="middle_initial" className="mb-1">
                Middle Initial
              </Label>
              <Input
                id="middle_initial"
                type="text"
                name="middle_initial"
                value={formData.middle_initial}
                readOnly
                maxLength="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 text-sm cursor-not-allowed"
                placeholder="M"
              />
            </div>

            <div>
              <Label htmlFor="last_name" className="mb-1">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="last_name"
                type="text"
                name="last_name"
                value={formData.last_name}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 text-sm cursor-not-allowed"
                required
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center border-b border-gray-200 pb-2">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email" className="mb-1">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 text-sm cursor-not-allowed"
                required
              />
            </div>

            <div>
              <Label htmlFor="contact_number" className="mb-1">
                Contact Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contact_number"
                type="tel"
                name="contact_number"
                value={formData.contact_number}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 text-sm cursor-not-allowed"
                required
                placeholder="+639123456789"
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center border-b border-gray-200 pb-2">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            Address Information
          </h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="street_address" className="mb-1">
                Street Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="street_address"
                type="text"
                name="street_address"
                value={formData.street_address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="e.g., 123 Rizal Street"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city" className="mb-1">
                  City/Municipality <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="city"
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="e.g., Manila"
                  required
                />
              </div>

              <div>
                <Label htmlFor="province" className="mb-1">
                  Province <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="province"
                  type="text"
                  name="province"
                  value={formData.province}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="e.g., Metro Manila"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postal_code" className="mb-1">Postal Code</Label>
                <Input
                  id="postal_code"
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="e.g., 1000"
                />
              </div>

              <div>
                <Label htmlFor="barangay" className="mb-1">Barangay</Label>
                <Input
                  id="barangay"
                  type="text"
                  name="barangay"
                  value={formData.barangay}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="e.g., Barangay 1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Financial Support */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center border-b border-gray-200 pb-2">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zM14 6a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h8zM6 10a2 2 0 012-2h4a2 2 0 012 2v2a2 2 0 01-2 2H8a2 2 0 01-2-2v-2z" />
            </svg>
            Financial Support
          </h3>
          <div>
            <Label htmlFor="financial_support" className="mb-1">
              Supporting the Parish Financially <span className="text-red-500">*</span>
            </Label>
            <select
              id="financial_support"
              name="financial_support"
              value={formData.financial_support}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            >
              <option value="">Select Option</option>
              <option value="Weekly Collection">Weekly Collection</option>
              <option value="Monthly Envelope">Monthly Envelope</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="GCash/PayMaya">GCash/PayMaya</option>
            </select>
            <p className="text-xs text-gray-600 mt-2 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Various payment methods are available to support parish activities
            </p>
          </div>
        </div>
      </div>

      {/* Head of House Section */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <User className="w-5 h-5 text-gray-600 mr-2" />
          <h2 className="text-base font-semibold text-gray-900">Head of House</h2>
        </div>
        
        {/* Basic Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center border-b border-gray-200 pb-2">
            <User className="w-4 h-4 mr-2" />
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="head_first_name" className="mb-1">
              First Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="head_first_name"
              type="text"
              name="head_first_name"
              value={formData.head_first_name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Juan"
              required
            />
          </div>

            <div>
              <Label htmlFor="head_middle_initial" className="mb-1">Middle Initial</Label>
              <Input
                id="head_middle_initial"
                type="text"
                name="head_middle_initial"
                value={formData.head_middle_initial}
                onChange={handleInputChange}
                maxLength="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="M"
              />
            </div>

            <div>
              <Label htmlFor="head_last_name" className="mb-1">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="head_last_name"
                type="text"
                name="head_last_name"
                value={formData.head_last_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Dela Cruz"
                required
              />
            </div>

            <div>
              <Label htmlFor="head_date_of_birth" className="mb-1">
                Date of Birth <span className="text-red-500">*</span>
              </Label>
              <Input
                id="head_date_of_birth"
                type="date"
                name="head_date_of_birth"
                value={formData.head_date_of_birth}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
            </div>

            <div>
              <Label htmlFor="head_religion" className="mb-1">
                Religion <span className="text-red-500">*</span>
              </Label>
              <Input
                id="head_religion"
                type="text"
                name="head_religion"
                value={formData.head_religion}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Roman Catholic"
                required
              />
            </div>

            <div>
              <Label htmlFor="head_marital_status" className="mb-1">
                Marital Status <span className="text-red-500">*</span>
              </Label>
              <select
                id="head_marital_status"
                name="head_marital_status"
                value={formData.head_marital_status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                required
              >
                <option value="">Select Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Widowed">Widowed</option>
                <option value="Divorced">Divorced</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center border-b border-gray-200 pb-2">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="head_phone_number" className="mb-1">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="head_phone_number"
                type="tel"
                name="head_phone_number"
                value={formData.head_phone_number}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="+639123456789"
                required
              />
            </div>

            <div>
              <Label htmlFor="head_email_address" className="mb-1">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="head_email_address"
                type="email"
                name="head_email_address"
                value={formData.head_email_address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="juan.delacruz@email.com"
                required
              />
            </div>
          </div>
        </div>

        {/* Religious Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center border-b border-gray-200 pb-2">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            Religious Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sacraments</label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="head_baptism"
                    checked={formData.head_baptism}
                    onChange={handleInputChange}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Baptism
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="head_first_eucharist"
                    checked={formData.head_first_eucharist}
                    onChange={handleInputChange}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  First Eucharist
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="head_confirmation"
                    checked={formData.head_confirmation}
                    onChange={handleInputChange}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Confirmation
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catholic Marriage <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="head_catholic_marriage"
                    value={true}
                    checked={formData.head_catholic_marriage === true}
                    onChange={(e) => setFormData(prev => ({ ...prev, head_catholic_marriage: true }))}
                    className="mr-2"
                  />
                  Yes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="head_catholic_marriage"
                    value={false}
                    checked={formData.head_catholic_marriage === false}
                    onChange={(e) => setFormData(prev => ({ ...prev, head_catholic_marriage: false }))}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowSpouse(!showSpouse)}
            className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
          >
            {showSpouse ? "Hide Spouse Information" : "Add Spouse Information"}
          </button>
        </div>
      </div>

      {/* Spouse Section */}
      {showSpouse && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <Heart className="w-5 h-5 text-gray-600 mr-2" />
            <h2 className="text-base font-semibold text-gray-900">Spouse</h2>
          </div>
          
          {/* Basic Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center border-b border-gray-200 pb-2">
              <User className="w-4 h-4 mr-2" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="spouse_first_name" className="mb-1">First Name</Label>
                <Input
                  id="spouse_first_name"
                  type="text"
                  name="spouse_first_name"
                  value={formData.spouse_first_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Maria"
                />
              </div>

              <div>
                <Label htmlFor="spouse_middle_initial" className="mb-1">Middle Initial</Label>
                <Input
                  id="spouse_middle_initial"
                  type="text"
                  name="spouse_middle_initial"
                  value={formData.spouse_middle_initial}
                  onChange={handleInputChange}
                  maxLength="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="M"
                />
              </div>

              <div>
                <Label htmlFor="spouse_last_name" className="mb-1">Last Name</Label>
                <Input
                  id="spouse_last_name"
                  type="text"
                  name="spouse_last_name"
                  value={formData.spouse_last_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Dela Cruz"
                />
              </div>

              <div>
                <Label htmlFor="spouse_date_of_birth" className="mb-1">Date of Birth</Label>
                <Input
                  id="spouse_date_of_birth"
                  type="date"
                  name="spouse_date_of_birth"
                  value={formData.spouse_date_of_birth}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="spouse_religion" className="mb-1">Religion</Label>
                <Input
                  id="spouse_religion"
                  type="text"
                  name="spouse_religion"
                  value={formData.spouse_religion}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Roman Catholic"
                />
              </div>

              <div>
                <Label htmlFor="spouse_marital_status" className="mb-1">Marital Status</Label>
                <select
                  id="spouse_marital_status"
                  name="spouse_marital_status"
                  value={formData.spouse_marital_status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Select Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Divorced">Divorced</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center border-b border-gray-200 pb-2">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="spouse_phone_number" className="mb-1">Phone Number</Label>
                <Input
                  id="spouse_phone_number"
                  type="tel"
                  name="spouse_phone_number"
                  value={formData.spouse_phone_number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="+639987654321"
                />
              </div>

              <div>
                <Label htmlFor="spouse_email_address" className="mb-1">Email Address</Label>
                <Input
                  id="spouse_email_address"
                  type="email"
                  name="spouse_email_address"
                  value={formData.spouse_email_address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="maria.delacruz@email.com"
                />
              </div>
            </div>
          </div>

          {/* Religious Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center border-b border-gray-200 pb-2">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              Religious Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sacraments</label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="spouse_baptism"
                      checked={formData.spouse_baptism}
                      onChange={handleInputChange}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Baptism
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="spouse_first_eucharist"
                      checked={formData.spouse_first_eucharist}
                      onChange={handleInputChange}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    First Eucharist
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="spouse_confirmation"
                      checked={formData.spouse_confirmation}
                      onChange={handleInputChange}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Confirmation
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catholic Marriage</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="spouse_catholic_marriage"
                      value={true}
                      checked={formData.spouse_catholic_marriage === true}
                      onChange={(e) => setFormData(prev => ({ ...prev, spouse_catholic_marriage: true }))}
                      className="mr-2"
                    />
                    Yes
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="spouse_catholic_marriage"
                      value={false}
                      checked={formData.spouse_catholic_marriage === false}
                      onChange={(e) => setFormData(prev => ({ ...prev, spouse_catholic_marriage: false }))}
                      className="mr-2"
                    />
                    No
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Children Section */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Users className="w-5 h-5 text-gray-600 mr-2" />
            <h2 className="text-base font-semibold text-gray-900">Children living with you</h2>
          </div>
          <button
            type="button"
            onClick={addChild}
            className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Child
          </button>
        </div>

        {formData.children.map((child, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Child {index + 1}</h3>
              <button
                type="button"
                onClick={() => removeChild(index)}
                className="text-red-600 hover:text-red-700 cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>

            {/* Basic Information */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-200 pb-2">
                Basic Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`child_${index}_first_name`} className="mb-1">First Name</Label>
                  <Input
                    id={`child_${index}_first_name`}
                    type="text"
                    value={child.first_name}
                    onChange={(e) => handleChildChange(index, "first_name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Miguel"
                  />
                </div>

                <div>
                  <Label htmlFor={`child_${index}_last_name`} className="mb-1">Last Name</Label>
                  <Input
                    id={`child_${index}_last_name`}
                    type="text"
                    value={child.last_name}
                    onChange={(e) => handleChildChange(index, "last_name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Dela Cruz"
                  />
                </div>

                <div>
                  <Label htmlFor={`child_${index}_date_of_birth`} className="mb-1">Date of Birth</Label>
                  <Input
                    id={`child_${index}_date_of_birth`}
                    type="date"
                    value={child.date_of_birth}
                    onChange={(e) => handleChildChange(index, "date_of_birth", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor={`child_${index}_sex`} className="mb-1">Sex</Label>
                  <select
                    id={`child_${index}_sex`}
                    value={child.sex}
                    onChange={(e) => handleChildChange(index, "sex", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">Select</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor={`child_${index}_religion`} className="mb-1">Religion</Label>
                  <Input
                    id={`child_${index}_religion`}
                    type="text"
                    value={child.religion}
                    onChange={(e) => handleChildChange(index, "religion", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Roman Catholic"
                  />
                </div>
              </div>
            </div>

            {/* Education Information */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-200 pb-2">
                Education Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`child_${index}_school`} className="mb-1">School</Label>
                  <Input
                    id={`child_${index}_school`}
                    type="text"
                    value={child.school}
                    onChange={(e) => handleChildChange(index, "school", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Manila Elementary School"
                  />
                </div>

                <div>
                  <Label htmlFor={`child_${index}_grade`} className="mb-1">Grade</Label>
                  <Input
                    id={`child_${index}_grade`}
                    type="text"
                    value={child.grade}
                    onChange={(e) => handleChildChange(index, "grade", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="e.g., Grade 6"
                  />
                </div>
              </div>
            </div>

            {/* Religious Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b border-gray-200 pb-2">
                Religious Information
              </h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sacraments</label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={child.baptism}
                      onChange={(e) => handleChildChange(index, "baptism", e.target.checked)}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Baptism
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={child.first_eucharist}
                      onChange={(e) => handleChildChange(index, "first_eucharist", e.target.checked)}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    First Eucharist
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={child.confirmation}
                      onChange={(e) => handleChildChange(index, "confirmation", e.target.checked)}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Confirmation
                  </label>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* About Yourself Section */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <MessageSquare className="w-5 h-5 text-gray-600 mr-2" />
          <h2 className="text-base font-semibold text-gray-900">About Yourself</h2>
        </div>
        
        {/* Parish Involvement */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center border-b border-gray-200 pb-2">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            Parish Involvement
          </h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="talent_to_share" className="mb-1">
                Is there a talent you can share with the Parish?
              </Label>
              <textarea
                id="talent_to_share"
                name="talent_to_share"
                value={formData.talent_to_share}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="e.g., I can play the guitar and help with music ministry"
              />
            </div>

            <div>
              <Label htmlFor="interested_ministry" className="mb-1">
                Are you interested in a particular Ministry?
              </Label>
              <textarea
                id="interested_ministry"
                name="interested_ministry"
                value={formData.interested_ministry}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="e.g., Music Ministry and Youth Group"
              />
            </div>

            <div>
              <Label htmlFor="parish_help_needed" className="mb-1">
                Is there any way the parish can help you right now?
              </Label>
              <textarea
                id="parish_help_needed"
                name="parish_help_needed"
                value={formData.parish_help_needed}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="e.g., Prayer support for my family"
              />
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="homebound_special_needs"
                  checked={formData.homebound_special_needs}
                  onChange={handleInputChange}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Are there homebound or special needs family members?
              </label>
            </div>
          </div>
        </div>

        {/* Cultural Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center border-b border-gray-200 pb-2">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
            </svg>
            Cultural Information
          </h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="other_languages" className="mb-1">
                What other languages are spoken in your home?
              </Label>
              <Input
                id="other_languages"
                type="text"
                name="other_languages"
                value={formData.other_languages}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="e.g., Tagalog, Cebuano"
              />
            </div>

            <div>
              <Label htmlFor="ethnicity" className="mb-1">
                Ethnicity (e.g. Tagalog, Cebuano, Ilocano, Bicolano, Chinese-Filipino, etc.)
              </Label>
              <Input
                id="ethnicity"
                type="text"
                name="ethnicity"
                value={formData.ethnicity}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="e.g., Filipino"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 text-center">
        <h3 className="text-base font-medium text-gray-900 mb-4">
          Thank You for completing the form!
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Your application has been submitted successfully and will be reviewed by the church administration.
        </p>
        
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? "Submitting..." : "Submit Application"}
        </button>
      </div>
    </form>
    </div>
  );
};

export default MemberRegistrationForm;