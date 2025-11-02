"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Settings, FileText, Save, RotateCcw, ChevronRight } from "lucide-react";
import { Button } from "@/components/Button.jsx";
import Alert from "@/components/Alert";
import axios from "@/lib/axios";
import { useAuth } from "@/hooks/auth.jsx";

const CertificateConfig = () => {
  const { churchname } = useParams();
  const { user } = useAuth();

  // Permission helper
  const hasPermission = (permissionName) => {
    return user?.profile?.system_role?.role_name === "ChurchOwner" ||
      user?.church_role?.permissions?.some(
        (perm) => perm.PermissionName === permissionName
      );
  };

  const hasAccess = hasPermission("certificate-config_list");
  const canFieldMapping = hasPermission("certificate-config_fieldMapping");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [sacramentServices, setSacramentServices] = useState([]);
  const [serviceInputFields, setServiceInputFields] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [isLoadingFields, setIsLoadingFields] = useState(false);

  // State for each certificate type
  const [baptismConfig, setBaptismConfig] = useState({
    templateName: "Baptism Certificate Template",
    enabled: true,
    headerText: "CERTIFICATE OF BAPTISM",
    footerText: "This certifies that the above named person was baptized in this church.",
    fields: {
      childName: { label: "Child Name", field: "" },
      fatherName: { label: "Father's Complete Name", field: "" },
      motherName: { label: "Mother's Full Maiden Name", field: "" },
      birthPlace: { label: "Born in (Location)", field: "" },
      birthDate: { label: "Child Birth Date", field: "" },
      sponsor1: { label: "Sponsor 1", field: "" },
      sponsor2: { label: "Sponsor 2", field: "" },
    },
  });

  const [matrimonyConfig, setMatrimonyConfig] = useState({
    templateName: "Matrimony Certificate Template",
    enabled: true,
    headerText: "CERTIFICATE OF MATRIMONY",
    footerText: "This certifies that the above named persons were joined in holy matrimony.",
    fields: {
      groomName: { label: "Groom's Full Name", field: "" },
      brideName: { label: "Bride's Full Name", field: "" },
      witness1: { label: "Witness 1", field: "" },
      witness2: { label: "Witness 2", field: "" },
    },
  });

  const [confirmationConfig, setConfirmationConfig] = useState({
    templateName: "Confirmation Certificate Template",
    enabled: true,
    headerText: "CERTIFICATE OF CONFIRMATION",
    footerText: "This certifies that the above named person has received the sacrament of confirmation.",
    fields: {
      confirmandName: { label: "Confirmand Name", field: "" },
      fatherName: { label: "Father's Name", field: "" },
      motherName: { label: "Mother's Name", field: "" },
      baptizedDate: { label: "Baptized Date", field: "" },
      baptizedChurch: { label: "Baptized Church", field: "" },
      baptizedLocation: { label: "Baptized Location (Street & City)", field: "" },
      sponsorName: { label: "Sponsor Name", field: "" },
      confirmationName: { label: "Confirmation Name", field: "" },
    },
  });

  const [firstCommunionConfig, setFirstCommunionConfig] = useState({
    templateName: "First Communion Certificate Template",
    enabled: true,
    headerText: "CERTIFICATE OF FIRST HOLY COMMUNION",
    footerText: "This certifies that the above named person has received their first holy communion.",
    fields: {
      childName: { label: "Child Name", field: "" },
      fatherName: { label: "Father Name", field: "" },
      motherName: { label: "Mother Name", field: "" },
      baptizedDate: { label: "Baptized Date", field: "" },
      baptizedChurch: { label: "Baptized Church", field: "" },
      baptizedLocation: { label: "Baptized Location", field: "" },
    },
  });

  const certificates = [
    { id: 'baptism', name: 'Baptism', config: baptismConfig, setConfig: setBaptismConfig },
    { id: 'matrimony', name: 'Matrimony', config: matrimonyConfig, setConfig: setMatrimonyConfig },
    { id: 'confirmation', name: 'Confirmation', config: confirmationConfig, setConfig: setConfirmationConfig },
    { id: 'firstCommunion', name: 'First Communion', config: firstCommunionConfig, setConfig: setFirstCommunionConfig },
  ];

  // Fetch sacrament services on mount
  useEffect(() => {
    const fetchSacramentServices = async () => {
      if (!churchname) return;
      
      setIsLoadingServices(true);
      try {
        const response = await axios.get(`/api/sacrament-services/${churchname}`);
        // The response returns an object with church and sacraments
        setSacramentServices(response.data.sacraments || []);
      } catch (error) {
        console.error('Failed to fetch sacrament services:', error);
        setSacramentServices([]);
      } finally {
        setIsLoadingServices(false);
      }
    };

    fetchSacramentServices();
  }, [churchname]);

  // Fetch input fields when service is selected
  useEffect(() => {
    const fetchInputFields = async () => {
      if (!selectedServiceId) {
        setServiceInputFields([]);
        return;
      }
      
      setIsLoadingFields(true);
      try {
        const response = await axios.get(`/api/sacrament-services/${selectedServiceId}/form-config`);
        // The response returns form_elements array
        // Filter out non-fillable elements (heading, paragraph, container)
        const fillableTypes = ['text', 'textarea', 'email', 'tel', 'phone', 'number', 'date', 'datetime', 'select', 'checkbox', 'radio', 'file', 'url'];
        const fillableFields = (response.data.form_elements || []).filter(
          field => fillableTypes.includes(field.type)
        );
        setServiceInputFields(fillableFields);
      } catch (error) {
        console.error('Failed to fetch input fields:', error);
        setServiceInputFields([]);
      } finally {
        setIsLoadingFields(false);
      }
    };

    fetchInputFields();
  }, [selectedServiceId]);

  // Load config when certificate is selected
  useEffect(() => {
    const loadConfig = async () => {
      if (!selectedCertificate || !churchname) return;
      
      try {
        const response = await axios.get(`/api/certificate-config/${churchname}/${selectedCertificate}`);
        if (response.data.config) {
          const config = response.data.config;
          setSelectedServiceId(config.ServiceID || "");
          
          const selected = certificates.find(cert => cert.id === selectedCertificate);
          if (selected && config.FieldMappings) {
            selected.setConfig({
              ...selected.config,
              enabled: config.IsEnabled,
              fields: config.FieldMappings
            });
          }
        } else {
          setSelectedServiceId("");
        }
      } catch (error) {
        console.error('Failed to load certificate configuration:', error);
        setSelectedServiceId("");
      }
    };
    
    loadConfig();
  }, [selectedCertificate, churchname]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const selected = certificates.find(cert => cert.id === selectedCertificate);
      
      const payload = {
        certificate_type: selectedCertificate,
        service_id: selectedServiceId || null,
        field_mappings: selected?.config.fields || null,
        is_enabled: selected?.config.enabled || true,
      };
      
      await axios.post(`/api/certificate-config/${churchname}`, payload);
      
      setAlertMessage("Certificate configuration saved successfully!");
      setAlertType("success");
    } catch (error) {
      console.error('Save error:', error);
      setAlertMessage(error.response?.data?.error || "Failed to save configuration. Please try again.");
      setAlertType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    const selected = certificates.find(cert => cert.id === selectedCertificate);
    if (selected) {
      const defaults = {
        baptism: {
          templateName: "Baptism Certificate Template",
          enabled: true,
          headerText: "CERTIFICATE OF BAPTISM",
          footerText: "This certifies that the above named person was baptized in this church.",
          fields: {
            childName: { label: "Child Name", field: "" },
            fatherName: { label: "Father's Complete Name", field: "" },
            motherName: { label: "Mother's Full Maiden Name", field: "" },
            birthPlace: { label: "Born in (Location)", field: "" },
            birthDate: { label: "Child Birth Date", field: "" },
            sponsor1: { label: "Sponsor 1", field: "" },
            sponsor2: { label: "Sponsor 2", field: "" },
          },
        },
        matrimony: {
          templateName: "Matrimony Certificate Template",
          enabled: true,
          headerText: "CERTIFICATE OF MATRIMONY",
          footerText: "This certifies that the above named persons were joined in holy matrimony.",
          fields: {
            groomName: { label: "Groom's Full Name", field: "" },
            brideName: { label: "Bride's Full Name", field: "" },
            witness1: { label: "Witness 1", field: "" },
            witness2: { label: "Witness 2", field: "" },
          },
        },
        confirmation: {
          templateName: "Confirmation Certificate Template",
          enabled: true,
          headerText: "CERTIFICATE OF CONFIRMATION",
          footerText: "This certifies that the above named person has received the sacrament of confirmation.",
          fields: {
            confirmandName: { label: "Confirmand Name", field: "" },
            fatherName: { label: "Father's Name", field: "" },
            motherName: { label: "Mother's Name", field: "" },
            baptizedDate: { label: "Baptized Date", field: "" },
            baptizedChurch: { label: "Baptized Church", field: "" },
            baptizedLocation: { label: "Baptized Location (Street & City)", field: "" },
            sponsorName: { label: "Sponsor Name", field: "" },
            confirmationName: { label: "Confirmation Name", field: "" },
          },
        },
        firstCommunion: {
          templateName: "First Communion Certificate Template",
          enabled: true,
          headerText: "CERTIFICATE OF FIRST HOLY COMMUNION",
          footerText: "This certifies that the above named person has received their first holy communion.",
          fields: {
            childName: { label: "Child Name", field: "" },
            fatherName: { label: "Father Name", field: "" },
            motherName: { label: "Mother Name", field: "" },
            baptizedDate: { label: "Baptized Date", field: "" },
            baptizedChurch: { label: "Baptized Church", field: "" },
            baptizedLocation: { label: "Baptized Location", field: "" },
          },
        },
      };
      
      selected.setConfig(defaults[selectedCertificate]);
      setAlertMessage("Configuration reset to defaults!");
      setAlertType("info");
    }
  };

  const selectedCert = certificates.find(cert => cert.id === selectedCertificate);

  if (!hasAccess) {
    return (
      <div className="lg:p-6 w-full h-screen pt-20">
        <div className="w-full h-full">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg h-full flex flex-col">
            <div className="p-6 bg-white border-b border-gray-200">
              <h2 className="text-xl font-semibold text-red-600">Unauthorized</h2>
              <p className="mt-2 text-gray-600">You do not have permission to access the Certificate Configuration page.</p>
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
          <div className="p-6 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
                  <Settings className="mr-3 h-7 w-7 text-blue-600" />
                  Certificate Configuration
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                  {selectedCertificate 
                    ? `Configure ${selectedCert?.name} certificate template`
                    : "Select a certificate type to configure"}
                </p>
              </div>
              {selectedCertificate && (
                <Button
                  onClick={() => setSelectedCertificate(null)}
                  variant="outline"
                  className="flex items-center"
                >
                  ← Back to Selection
                </Button>
              )}
            </div>
          </div>

          <div className="p-6 flex-1 overflow-auto">
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

            {!selectedCertificate ? (
              // Selection View
              <div className="space-y-3">
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    onClick={() => setSelectedCertificate(cert.id)}
                    className="group relative bg-white border border-gray-200 rounded-lg p-5 hover:border-blue-500 hover:shadow-md transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {cert.name} Certificate
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Configure {cert.name.toLowerCase()} certificate settings
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Detail View
              <div className="space-y-6">
                {selectedCertificate === 'matrimony' ? (
                  // Matrimony Template Configuration
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{selectedCert?.name} Certificate</h3>
                            <p className="text-sm text-gray-600">Configure field mappings for certificate generation</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="px-6 py-6 space-y-6">
                          
                          {/* Sacrament Service Selection */}
                          <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Select Sacrament Service
                            </label>
                            <select
                              value={selectedServiceId}
                              onChange={(e) => setSelectedServiceId(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              disabled={!selectedCert?.config.enabled || isLoadingServices}
                            >
                              <option value="">Select a sacrament service</option>
                              {Array.isArray(sacramentServices) && sacramentServices.map((service) => (
                                <option key={service.ServiceID} value={service.ServiceID}>
                                  {service.ServiceName}
                                </option>
                              ))}
                            </select>
                            {isLoadingServices && (
                              <p className="text-xs text-gray-500 mt-2">Loading services...</p>
                            )}
                          </div>

                          {/* Field Mapping Dropdowns */}
                          <div className="space-y-4">
                              {selectedCert?.config.fields && Object.entries(selectedCert.config.fields).map(([key, field]) => (
                              <div key={key}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  {field.label}
                                </label>
                                <select
                                  value={field.field}
                                  onChange={(e) => {
                                    const updatedFields = { ...selectedCert.config.fields };
                                    updatedFields[key] = { ...field, field: e.target.value };
                                    selectedCert.setConfig({ ...selectedCert.config, fields: updatedFields });
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                  disabled={!selectedCert?.config.enabled || isLoadingFields || !canFieldMapping}
                                >
                                  <option value="">Select a field</option>
                                  {Array.isArray(serviceInputFields) && serviceInputFields.map((inputField) => (
                                    <option key={inputField.InputFieldID} value={`${inputField.InputFieldID}-${inputField.elementId || inputField.element_id}`}>
                                      ({inputField.InputFieldID} - {inputField.elementId || inputField.element_id || 'No Element ID'})
                                    </option>
                                  ))}
                                </select>
                                {isLoadingFields && (
                                  <p className="text-xs text-gray-500 mt-1">Loading fields...</p>
                                )}
                              </div>
                            ))}
                          </div>
                      </div>
                  </div>
                ) : selectedCertificate === 'baptism' ? (
                  // Baptism Template Configuration
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{selectedCert?.name} Certificate</h3>
                            <p className="text-sm text-gray-600">Configure field mappings for certificate generation</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="px-6 py-6 space-y-6">
                          
                          {/* Sacrament Service Selection */}
                          <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Select Sacrament Service
                            </label>
                            <select
                              value={selectedServiceId}
                              onChange={(e) => setSelectedServiceId(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              disabled={!selectedCert?.config.enabled || isLoadingServices}
                            >
                              <option value="">Select a sacrament service</option>
                              {Array.isArray(sacramentServices) && sacramentServices.map((service) => (
                                <option key={service.ServiceID} value={service.ServiceID}>
                                  {service.ServiceName}
                                </option>
                              ))}
                            </select>
                            {isLoadingServices && (
                              <p className="text-xs text-gray-500 mt-2">Loading services...</p>
                            )}
                          </div>

                          {/* Field Mapping Dropdowns */}
                          <div className="space-y-4">
                              {selectedCert?.config.fields && Object.entries(selectedCert.config.fields).map(([key, field]) => (
                              <div key={key}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  {field.label}
                                </label>
                                <select
                                  value={field.field}
                                  onChange={(e) => {
                                    const updatedFields = { ...selectedCert.config.fields };
                                    updatedFields[key] = { ...field, field: e.target.value };
                                    selectedCert.setConfig({ ...selectedCert.config, fields: updatedFields });
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                  disabled={!selectedCert?.config.enabled || isLoadingFields || !canFieldMapping}
                                >
                                  <option value="">Select a field</option>
                                  {Array.isArray(serviceInputFields) && serviceInputFields.map((inputField) => (
                                    <option key={inputField.InputFieldID} value={`${inputField.InputFieldID}-${inputField.elementId || inputField.element_id}`}>
                                      {inputField.label} ({inputField.InputFieldID} - {inputField.elementId || inputField.element_id || 'No Element ID'})
                                    </option>
                                  ))}
                                </select>
                                {isLoadingFields && (
                                  <p className="text-xs text-gray-500 mt-1">Loading fields...</p>
                                )}
                              </div>
                            ))}
                          </div>
                      </div>
                  </div>
                ) : selectedCertificate === 'confirmation' ? (
                  // Confirmation Template Configuration
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{selectedCert?.name} Certificate</h3>
                            <p className="text-sm text-gray-600">Configure field mappings for certificate generation</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="px-6 py-6 space-y-6">
                          
                          {/* Sacrament Service Selection */}
                          <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Select Sacrament Service
                            </label>
                            <select
                              value={selectedServiceId}
                              onChange={(e) => setSelectedServiceId(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              disabled={!selectedCert?.config.enabled || isLoadingServices}
                            >
                              <option value="">Select a sacrament service</option>
                              {Array.isArray(sacramentServices) && sacramentServices.map((service) => (
                                <option key={service.ServiceID} value={service.ServiceID}>
                                  {service.ServiceName}
                                </option>
                              ))}
                            </select>
                            {isLoadingServices && (
                              <p className="text-xs text-gray-500 mt-2">Loading services...</p>
                            )}
                          </div>

                          {/* Field Mapping Dropdowns */}
                          <div className="space-y-4">
                              {selectedCert?.config.fields && Object.entries(selectedCert.config.fields).map(([key, field]) => (
                              <div key={key}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  {field.label}
                                </label>
                                <select
                                  value={field.field}
                                  onChange={(e) => {
                                    const updatedFields = { ...selectedCert.config.fields };
                                    updatedFields[key] = { ...field, field: e.target.value };
                                    selectedCert.setConfig({ ...selectedCert.config, fields: updatedFields });
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                  disabled={!selectedCert?.config.enabled || isLoadingFields || !canFieldMapping}
                                >
                                  <option value="">Select a field</option>
                                  {Array.isArray(serviceInputFields) && serviceInputFields.map((inputField) => (
                                    <option key={inputField.InputFieldID} value={`${inputField.InputFieldID}-${inputField.elementId || inputField.element_id}`}>
                                      {inputField.label} ({inputField.InputFieldID} - {inputField.elementId || inputField.element_id || 'No Element ID'})
                                    </option>
                                  ))}
                                </select>
                                {isLoadingFields && (
                                  <p className="text-xs text-gray-500 mt-1">Loading fields...</p>
                                )}
                              </div>
                            ))}
                          </div>
                      </div>
                  </div>
                ) : selectedCertificate === 'firstCommunion' ? (
                  // First Communion Template Configuration
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{selectedCert?.name} Certificate</h3>
                            <p className="text-sm text-gray-600">Configure field mappings for certificate generation</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="px-6 py-6 space-y-6">
                          
                          {/* Sacrament Service Selection */}
                          <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Select Sacrament Service
                            </label>
                            <select
                              value={selectedServiceId}
                              onChange={(e) => setSelectedServiceId(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              disabled={!selectedCert?.config.enabled || isLoadingServices}
                            >
                              <option value="">Select a sacrament service</option>
                              {Array.isArray(sacramentServices) && sacramentServices.map((service) => (
                                <option key={service.ServiceID} value={service.ServiceID}>
                                  {service.ServiceName}
                                </option>
                              ))}
                            </select>
                            {isLoadingServices && (
                              <p className="text-xs text-gray-500 mt-2">Loading services...</p>
                            )}
                          </div>

                          {/* Field Mapping Dropdowns */}
                          <div className="space-y-4">
                              {selectedCert?.config.fields && Object.entries(selectedCert.config.fields).map(([key, field]) => (
                              <div key={key}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  {field.label}
                                </label>
                                <select
                                  value={field.field}
                                  onChange={(e) => {
                                    const updatedFields = { ...selectedCert.config.fields };
                                    updatedFields[key] = { ...field, field: e.target.value };
                                    selectedCert.setConfig({ ...selectedCert.config, fields: updatedFields });
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                  disabled={!selectedCert?.config.enabled || isLoadingFields || !canFieldMapping}
                                >
                                  <option value="">Select a field</option>
                                  {Array.isArray(serviceInputFields) && serviceInputFields.map((inputField) => (
                                    <option key={inputField.InputFieldID} value={`${inputField.InputFieldID}-${inputField.elementId || inputField.element_id}`}>
                                      {inputField.label} ({inputField.InputFieldID} - {inputField.elementId || inputField.element_id || 'No Element ID'})
                                    </option>
                                  ))}
                                </select>
                                {isLoadingFields && (
                                  <p className="text-xs text-gray-500 mt-1">Loading fields...</p>
                                )}
                              </div>
                            ))}
                          </div>
                      </div>
                  </div>
                ) : (
                  // Other certificates (simple view)
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{selectedCert?.name} Certificate</h3>
                          <p className="text-sm text-gray-600">Configure certificate settings and template text</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="px-6 py-6">
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Template Name
                          </label>
                          <input
                            type="text"
                            value={selectedCert?.config.templateName}
                            onChange={(e) => selectedCert?.setConfig({ ...selectedCert.config, templateName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            placeholder="Enter template name"
                            disabled={!selectedCert?.config.enabled}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Header Text
                          </label>
                          <input
                            type="text"
                            value={selectedCert?.config.headerText}
                            onChange={(e) => selectedCert?.setConfig({ ...selectedCert.config, headerText: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            placeholder="Enter header text"
                            disabled={!selectedCert?.config.enabled}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Footer Text
                          </label>
                          <textarea
                            value={selectedCert?.config.footerText}
                            onChange={(e) => selectedCert?.setConfig({ ...selectedCert.config, footerText: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                            placeholder="Enter footer text"
                            disabled={!selectedCert?.config.enabled}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="flex items-center"
                    disabled={isSubmitting}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset to Defaults
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="flex items-center"
                    disabled={isSubmitting || !canFieldMapping}
                    title={!canFieldMapping ? 'You do not have permission to save field mappings' : ''}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateConfig;
