"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/auth.jsx";
import axios from "@/lib/axios";

export default function CertificateConfiguration() {
  const { churchname } = useParams();
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState("marriage");
  const [churchInfo, setChurchInfo] = useState({ name: "", location: "" });
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [sacramentServices, setSacramentServices] = useState([]);
  const [serviceInputFields, setServiceInputFields] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingFields, setLoadingFields] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState({
    groomName: "",
    brideName: "",
    date: "",
    monthYear: "",
    church: "",
    city: "",
    province: "",
    reverendName: "",
    witnesses1: "",
    witnesses2: "",
    // Element ID fields for dropdown selections
    groomNameElementId: "",
    dateElementId: "", 
    monthYearElementId: "",
    witnesses1ElementId: "",
    witnesses2ElementId: "",
    brideNameElementId: "",
    bookNumber: "",
    pageNumber: "",
    lineNumber: "",
    issueDate: "",
    signature: ""
  });
  
  // Load sacrament services when component mounts
  useEffect(() => {
    const loadSacramentServices = async () => {
      if (!churchname) return;
      
      try {
        setLoadingServices(true);
        const response = await axios.get(`/api/sacrament-services/${churchname}`);
        
        if (response.data && response.data.sacraments) {
          setSacramentServices(response.data.sacraments);
        } else {
          console.error('Failed to load sacrament services:', response.data?.error);
        }
      } catch (error) {
        console.error('Error loading sacrament services:', error);
        if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
        }
      } finally {
        setLoadingServices(false);
      }
    };
    
    loadSacramentServices();
  }, [churchname]);
  
  // Load service input fields when a service is selected
  useEffect(() => {
    const loadServiceInputFields = async () => {
      if (!selectedServiceId) {
        setServiceInputFields([]);
        return;
      }
      
      try {
        setLoadingFields(true);
        const response = await axios.get(`/api/sacrament-services/${selectedServiceId}/form-config`);
        
        if (response.data && response.data.form_elements) {
          setServiceInputFields(response.data.form_elements.filter(field => field.elementId));
        } else {
          console.error('Failed to load service input fields:', response.data?.error);
          setServiceInputFields([]);
        }
      } catch (error) {
        console.error('Error loading service input fields:', error);
        if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
        }
        setServiceInputFields([]);
      } finally {
        setLoadingFields(false);
      }
    };
    
    loadServiceInputFields();
  }, [selectedServiceId]);

  useEffect(() => {
    // Get church info from user data
    if (user) {
      let currentChurch;
      if (user?.profile?.system_role?.role_name === "ChurchStaff") {
        currentChurch = user?.church;
      } else if (user?.profile?.system_role?.role_name === "ChurchOwner") {
        currentChurch = user?.churches?.find(
          (church) => church.ChurchName.toLowerCase().replace(/\s+/g, "-") === churchname
        );
      }
      
      if (currentChurch) {
        setChurchInfo({
          name: currentChurch.ChurchName || "",
          location: `${currentChurch.City || ""}, ${currentChurch.Province || ""}`.trim().replace(/^,\s*|,\s*$/g, "")
        });
        
        // Auto-populate the form data with church information
        setFormData(prev => ({
          ...prev,
          church: currentChurch.ChurchName || "",
          city: currentChurch.City || "",
          province: currentChurch.Province || ""
        }));
      }
    }
  }, [user, churchname]);
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Load existing certificate configuration
  useEffect(() => {
    const loadCertificateConfiguration = async () => {
      if (!churchname) return;
      
      try {
        const response = await axios.get(`/api/certificate-configurations/${churchname}/marriage`);
        if (response.data && response.data.configuration) {
          const config = response.data.configuration;
          
          // Load selected service ID
          if (config.sacrament_service_id) {
            setSelectedServiceId(config.sacrament_service_id);
          }
          
          // Load field mappings into form data
          if (config.field_mappings) {
            setFormData(prev => ({
              ...prev,
                groomNameElementId: config.field_mappings.groomNameElementId || '',
                brideNameElementId: config.field_mappings.brideNameElementId || '',
                dateElementId: config.field_mappings.dateElementId || '',
                monthYearElementId: config.field_mappings.monthYearElementId || '',
                witnesses1ElementId: config.field_mappings.witnesses1ElementId || '',
                witnesses2ElementId: config.field_mappings.witnesses2ElementId || '',
            }));
          }
          
          // Load form data values if they exist
          if (config.form_data) {
            const cleanedFormData = Object.keys(config.form_data).reduce((acc, key) => {
              acc[key] = config.form_data[key] ?? '';
              return acc;
            }, {});
            setFormData(prev => ({ ...prev, ...cleanedFormData }));
          }
        }
      } catch (error) {
        console.error('Error loading certificate configuration:', error);
        if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
        }
      }
    };
    
    loadCertificateConfiguration();
  }, [churchname]);

  // Save certificate configuration
  const saveCertificateConfiguration = async () => {
    if (!churchname) return;
    
    try {
      const configData = {
        certificate_type: 'marriage',
        sacrament_service_id: selectedServiceId || null,
        field_mappings: {
          groomNameElementId: formData.groomNameElementId,
          brideNameElementId: formData.brideNameElementId,
          dateElementId: formData.dateElementId,
          monthYearElementId: formData.monthYearElementId,
          witnesses1ElementId: formData.witnesses1ElementId,
          witnesses2ElementId: formData.witnesses2ElementId,
        },
        form_data: {
          groomName: formData.groomName,
          brideName: formData.brideName,
          date: formData.date,
          monthYear: formData.monthYear,
          church: formData.church,
          city: formData.city,
          province: formData.province,
          reverendName: formData.reverendName,
          witnesses1: formData.witnesses1,
          witnesses2: formData.witnesses2,
          bookNumber: formData.bookNumber,
          pageNumber: formData.pageNumber,
          lineNumber: formData.lineNumber,
          issueDate: formData.issueDate,
          signature: formData.signature,
        }
      };
      
      const response = await axios.post(`/api/certificate-configurations/${churchname}`, configData);
      
      if (response.data) {
        alert('Certificate configuration saved successfully!');
      } else {
        alert('Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving certificate configuration:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        alert(`Failed to save configuration: ${error.response.data?.error || 'Unknown error'}`);
      } else {
        alert('An error occurred while saving the configuration.');
      }
    }
  };

  return (
    <div className="lg:p-6 w-full min-h-screen pt-20 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-900">
              Certificate Configuration
            </h1>
            <p className="text-gray-600 mt-1">Configure certificate templates</p>
          </div>

          <div className="p-6">
            {/* Sacrament Service Selector */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Sacrament Service for Field Binding
              </label>
              <div className="max-w-md">
                <select
                  value={selectedServiceId || ""}
                  onChange={(e) => setSelectedServiceId(e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={loadingServices}
                >
                  <option value="">Select a sacrament service...</option>
                  {sacramentServices.map((service) => (
                    <option key={service.ServiceID} value={service.ServiceID}>
                      {service.ServiceName}
                    </option>
                  ))}
                </select>
                {loadingServices && (
                  <p className="text-sm text-gray-500 mt-1">Loading services...</p>
                )}
                {selectedServiceId && loadingFields && (
                  <p className="text-sm text-gray-500 mt-1">Loading service fields...</p>
                )}
                {selectedServiceId && !loadingFields && serviceInputFields.length === 0 && (
                  <p className="text-sm text-yellow-600 mt-1">No input fields with element IDs found for this service.</p>
                )}
              </div>
            </div>

            {/* Template Selector */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Certificate Template
              </label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button
                  onClick={() => setSelectedTemplate("baptism")}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    selectedTemplate === "baptism"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="font-medium">Baptism</span>
                </button>
                <button
                  onClick={() => setSelectedTemplate("confirmation")}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    selectedTemplate === "confirmation"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="font-medium">Confirmation</span>
                </button>
                <button
                  onClick={() => setSelectedTemplate("first-communion")}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    selectedTemplate === "first-communion"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="font-medium">First Communion</span>
                </button>
                <button
                  onClick={() => setSelectedTemplate("marriage")}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    selectedTemplate === "marriage"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="font-medium">Marriage</span>
                </button>
              </div>
            </div>

            {/* Marriage Certificate Template */}
            {selectedTemplate === "marriage" && (
              <>
              <div className="max-w-4xl mx-auto border-4 border-black p-16 bg-white flex flex-col items-center" style={{ fontFamily: 'Georgia, serif' }}>
                <div className="text-center mb-10">
                  <h2 className="text-2xl tracking-widest mb-8" style={{ fontFamily: 'Trajan Pro, Georgia, serif', letterSpacing: '0.15em' }}>CERTIFICATE OF MARRIAGE</h2>
                  <div className="flex justify-center mb-8">
                    <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v8m0 0v12m0-12h8m-8 0H4" />
                    </svg>
                  </div>
                  <p className="text-base mb-3">Parish of</p>
                  <p className="text-center text-lg font-medium mb-2">
                    {churchInfo.name || "[Church Name]"}
                  </p>
                </div>

                <div className="p-8 mb-8 border-t border-b border-gray-300 w-full">
                  <p className="text-center text-base mb-6">✤ This is to Certify ✤</p>
                  
                  <div className="space-y-5 max-w-3xl mx-auto">
                    <div className="flex items-end gap-2">
                      <label className="text-base whitespace-nowrap">That</label>
                      {selectedServiceId && serviceInputFields.length > 0 ? (
                        <select
                          className="flex-1 border-b border-gray-800 bg-transparent py-1 text-base"
                          value={formData.groomNameElementId}
                          onChange={(e) => handleInputChange("groomNameElementId", e.target.value)}
                        >
                          <option value="">Select field...</option>
                          {serviceInputFields.map((field) => (
                            <option key={field.InputFieldID} value={field.elementId}>
                              {field.elementId}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="flex-1 border-b border-gray-800 bg-transparent py-1 text-base"
                          placeholder="Select a service first or enter text directly"
                          value={formData.groomName}
                          onChange={(e) => handleInputChange("groomName", e.target.value)}
                        />
                      )}
                    </div>

                    <div className="flex items-end gap-2">
                      <label className="text-base whitespace-nowrap">and</label>
                      {selectedServiceId && serviceInputFields.length > 0 ? (
                        <select
                          className="flex-1 border-b border-gray-800 bg-transparent py-1 text-base"
                          value={formData.brideNameElementId}
                          onChange={(e) => handleInputChange("brideNameElementId", e.target.value)}
                        >
                          <option value="">Select field...</option>
                          {serviceInputFields.map((field) => (
                            <option key={field.InputFieldID} value={field.elementId}>
                              {field.elementId}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="flex-1 border-b border-gray-800 bg-transparent py-1 text-base"
                          placeholder=""
                          value={formData.brideName}
                          onChange={(e) => handleInputChange("brideName", e.target.value)}
                        />
                      )}
                    </div>

                    <p className="text-center text-base mt-6">were lawfully <span className="font-semibold tracking-wide">MARRIED</span></p>

                    <div className="flex items-end gap-2">
                      <span className="text-base whitespace-nowrap">on the</span>
                      <input
                        type="text"
                        className="w-32 border-b border-gray-800 bg-transparent py-1 text-base"
                        placeholder=""
                        value={formData.date}
                        onChange={(e) => handleInputChange("date", e.target.value)}
                      />
                      <span className="text-base whitespace-nowrap">day of</span>
                      <input
                        type="text"
                        className="flex-1 border-b border-gray-800 bg-transparent py-1 text-base"
                        placeholder=""
                        value={formData.monthYear}
                        onChange={(e) => handleInputChange("monthYear", e.target.value)}
                      />
                    </div>

                    <div className="flex items-end gap-2">
                      <span className="text-base whitespace-nowrap">at</span>
                      <input
                        type="text"
                        className="flex-1 border-b border-gray-800 bg-transparent py-1 text-base text-center"
                        placeholder="CHURCH"
                        value={formData.church}
                        onChange={(e) => handleInputChange("church", e.target.value)}
                      />
                      <input
                        type="text"
                        className="flex-1 border-b border-gray-800 bg-transparent py-1 text-base text-center"
                        placeholder="CITY"
                        value={formData.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                      />
                      <input
                        type="text"
                        className="flex-1 border-b border-gray-800 bg-transparent py-1 text-base text-center"
                        placeholder="PROVINCE"
                        value={formData.province}
                        onChange={(e) => handleInputChange("province", e.target.value)}
                      />
                    </div>

                    <p className="text-center text-base mt-6">According to the Rite of the Roman Catholic Church</p>
                    <p className="text-center text-base">and in conformity with the laws of the Republic of the Philippines</p>

                    <div className="flex items-end gap-2">
                      <label className="text-base whitespace-nowrap">Rev.</label>
                      <input
                        type="text"
                        className="flex-1 border-b border-gray-800 bg-transparent py-1 text-base"
                        placeholder=""
                        value={formData.reverendName}
                        onChange={(e) => handleInputChange("reverendName", e.target.value)}
                      />
                      <span className="text-base whitespace-nowrap ml-2">officiating.</span>
                    </div>

                    <div className="flex items-end gap-2">
                      <label className="text-base whitespace-nowrap">in the presence of</label>
                      {selectedServiceId && serviceInputFields.length > 0 ? (
                        <select
                          className="flex-1 border-b border-gray-800 bg-transparent py-1 text-base"
                          value={formData.witnesses1ElementId}
                          onChange={(e) => handleInputChange("witnesses1ElementId", e.target.value)}
                        >
                          <option value="">Select field...</option>
                          {serviceInputFields.map((field) => (
                            <option key={field.InputFieldID} value={field.elementId}>
                              {field.elementId}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="flex-1 border-b border-gray-800 bg-transparent py-1 text-base"
                          placeholder=""
                          value={formData.witnesses1}
                          onChange={(e) => handleInputChange("witnesses1", e.target.value)}
                        />
                      )}
                    </div>

                    <div className="flex items-end gap-2">
                      {selectedServiceId && serviceInputFields.length > 0 ? (
                        <div className="flex items-end gap-2 flex-1">
                          <label className="text-base whitespace-nowrap">and</label>
                          <select
                            className="flex-1 border-b border-gray-800 bg-transparent py-1 text-base"
                            value={formData.witnesses2ElementId}
                            onChange={(e) => handleInputChange("witnesses2ElementId", e.target.value)}
                          >
                            <option value="">Select field...</option>
                            {serviceInputFields.map((field) => (
                              <option key={field.InputFieldID} value={field.elementId}>
                                {field.elementId}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <>
                          <label className="text-base whitespace-nowrap">and</label>
                          <input
                            type="text"
                            className="flex-1 border-b border-gray-800 bg-transparent py-1 text-base"
                            placeholder=""
                            value={formData.witnesses2}
                            onChange={(e) => handleInputChange("witnesses2", e.target.value)}
                          />
                        </>
                      )}
                      <span className="text-base whitespace-nowrap ml-2">Witnesses.</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 text-base w-full max-w-3xl mx-auto">
                  <p className="text-center">As appears in the Marriage Register of this church.</p>
                  
                  <div className="flex items-end justify-between gap-4">
                    <div className="flex items-end gap-2 flex-1">
                      <label className="text-sm whitespace-nowrap">Book</label>
                      <input
                        type="text"
                        className="flex-1 border-b border-gray-800 py-1 text-base bg-transparent"
                        placeholder=""
                        value={formData.bookNumber}
                        onChange={(e) => handleInputChange("bookNumber", e.target.value)}
                      />
                    </div>
                    <div className="flex items-end gap-2 flex-1">
                      <label className="text-sm whitespace-nowrap">Page</label>
                      <input
                        type="text"
                        className="flex-1 border-b border-gray-800 py-1 text-base bg-transparent"
                        placeholder=""
                        value={formData.pageNumber}
                        onChange={(e) => handleInputChange("pageNumber", e.target.value)}
                      />
                    </div>
                    <div className="flex items-end gap-2 flex-1">
                      <label className="text-sm whitespace-nowrap">Line</label>
                      <input
                        type="text"
                        className="flex-1 border-b border-gray-800 py-1 text-base bg-transparent"
                        placeholder=""
                        value={formData.lineNumber}
                        onChange={(e) => handleInputChange("lineNumber", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 mt-8">
                    <div className="flex items-end gap-2">
                      <label className="text-sm whitespace-nowrap">Date</label>
                      <input
                        type="text"
                        className="flex-1 border-b border-gray-800 py-1 text-base bg-transparent"
                        placeholder=""
                        value={formData.issueDate}
                        onChange={(e) => handleInputChange("issueDate", e.target.value)}
                      />
                    </div>
                    <div className="flex items-end gap-2 justify-end">
                      <label className="text-sm whitespace-nowrap">Pastor Signature</label>
                      <input
                        type="text"
                        className="flex-1 border-b border-gray-800 py-1 text-base bg-transparent"
                        placeholder=""
                        value={formData.signature}
                        onChange={(e) => handleInputChange("signature", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mt-12">
                    <p className="text-xs uppercase tracking-wider" style={{ color: '#6B7280' }}>PARISH SEAL</p>
                  </div>
                </div>
              </div>
              
              {/* Buttons outside certificate layout */}
              <div className="mt-8 flex justify-center gap-4">
                <button 
                  onClick={saveCertificateConfiguration}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Template
                </button>
              </div>
              </>
            )}

            {/* Placeholder for other templates */}
            {selectedTemplate !== "marriage" && (
              <div className="text-center py-12 text-gray-500">
                <p>Template for {selectedTemplate} will be displayed here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
