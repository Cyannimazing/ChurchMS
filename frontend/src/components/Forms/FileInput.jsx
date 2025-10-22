"use client";

import { useState, useRef } from "react";
import { Upload, AlertCircle, File, X } from "lucide-react";

const FileInput = ({
  label,
  name,
  accept,
  maxSize,
  required = false,
  onChange,
  className = "",
  error = null,
  onValidationError,
  filePreview = true,
  helpText,
  ...props
}) => {
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const inputRef = useRef(null);

  const displayedError = error || validationError;
  
  const clearFile = (e) => {
    e.stopPropagation();
    setFileName("");
    setPreviewUrl(null);
    setValidationError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    // Trigger onChange with null to clear the file in the parent component
    if (onChange) {
      const event = {
        target: {
          name,
          files: [],
          type: "file",
          value: "",
        },
      };
      onChange(event);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setValidationError(null);
    
    if (!file) {
      setFileName("");
      setPreviewUrl(null);
      if (onChange) onChange(e);
      return;
    }
    
    // Validate file size if maxSize is provided (in MB)
    if (maxSize && file.size > maxSize * 1024 * 1024) {
      const error = `File size exceeds ${maxSize}MB limit`;
      setValidationError(error);
      if (onValidationError) onValidationError(error);
      clearFile(e);
      return;
    }
    
    // Validate file type if accept is provided
    if (accept) {
      const acceptedTypes = accept.split(",").map(type => type.trim());
      const fileType = file.type;
      const fileExtension = `.${file.name.split('.').pop().toLowerCase()}`;
      
      // Convert accept types to user-friendly descriptions
      const getFileTypeDescription = (type) => {
        if (type === 'application/pdf' || type === '.pdf') return 'PDF';
        if (type === 'image/jpeg' || type === '.jpg' || type === '.jpeg') return 'JPEG';
        if (type === 'image/png' || type === '.png') return 'PNG';
        if (type === 'image/*') return 'Images';
        return type;
      };
      
      // Create a list of user-friendly descriptions for the error message
      const typeDescriptions = [...new Set(acceptedTypes.map(getFileTypeDescription))];
      
      // Check if file type is accepted
      const isAccepted = acceptedTypes.some(type => {
        // Handle wildcards like image/*
        if (type.endsWith('/*')) {
          const mainType = type.split('/')[0];
          return fileType.startsWith(mainType + '/');
        }
        
        // Handle file extensions (e.g., .pdf, .jpg)
        if (type.startsWith('.')) {
          return fileExtension.toLowerCase() === type.toLowerCase();
        }
        
        // Special handling for PDFs
        if (type === 'application/pdf' && (fileType === 'application/pdf' || fileExtension === '.pdf')) {
          return true;
        }
        
        // Standard MIME type check
        return type === fileType;
      });
      
      if (!isAccepted) {
        const error = `Invalid file type. Accepted file types: ${typeDescriptions.join(", ")}`;
        setValidationError(error);
        if (onValidationError) onValidationError(error);
        clearFile(e);
        return;
      }
    }
    
    setFileName(file.name);
    
    // Create preview for images if filePreview is enabled
    if (filePreview && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
    
    if (onChange) onChange(e);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label 
          htmlFor={name}
          className="block text-sm font-medium text-gray-700"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div 
        className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
          displayedError
            ? "border-red-300 bg-red-50"
            : fileName
            ? "border-green-300 bg-green-50"
            : "border-gray-300 bg-gray-50 hover:bg-gray-100"
        }`}
      >
        <div className="flex items-center justify-center">
          <input
            ref={inputRef}
            type="file"
            id={name}
            name={name}
            onChange={handleFileChange}
            accept={accept}
            className="hidden"
            required={required}
            {...props}
          />
          
          {!fileName ? (
            <label
              htmlFor={name}
              className="cursor-pointer flex flex-col items-center justify-center py-3"
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600 text-center">
                <span className="font-medium text-indigo-600 hover:text-indigo-500">
                  Click to upload
                </span>{" "}
                or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {accept
                  ? `Accepted file types: ${accept.includes('application/pdf') || accept.includes('.pdf') 
                      ? 'PDF, ' : ''}${accept.includes('image/') 
                      ? 'Images (JPEG, PNG, JPG)' : ''}`
                  : "All file types accepted"}
              </p>
              {maxSize && (
                <p className="text-xs text-gray-500">
                  Maximum file size: {maxSize}MB
                </p>
              )}
              {helpText && (
                <p className="text-xs text-gray-500 mt-1">
                  {helpText}
                </p>
              )}
            </label>
          ) : (
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {previewUrl && filePreview ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="h-10 w-10 object-cover rounded"
                  />
                ) : (
                  <File className="h-10 w-10 text-gray-400" />
                )}
                <div className="flex-1 truncate">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {fileName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearFile}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {displayedError && (
        <div className="text-sm text-red-600 flex items-start mt-1">
          <AlertCircle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
          <span>{displayedError}</span>
        </div>
      )}
    </div>
  );
};

export default FileInput;

