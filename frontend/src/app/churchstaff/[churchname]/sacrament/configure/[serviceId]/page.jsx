"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Plus, 
  Type, 
  AlignLeft, 
  Mail, 
  Phone, 
  Calendar, 
  Hash, 
  CheckSquare, 
  Circle, 
  List, 
  FileText,
  Settings,
  Trash2,
  Move,
  RotateCcw,
  X
} from "lucide-react";
import { Button } from "@/components/Button.jsx";
import { useAuth } from "@/hooks/auth.jsx";
import axios from "@/lib/axios";

// Form element types
const FORM_ELEMENTS = [
  { 
    id: 'heading', 
    type: 'heading', 
    label: 'Title/Heading', 
    icon: Type,
    defaultProps: {
      text: 'Form Title',
      size: 'h2',
      align: 'left',
      color: '#000000',
      width: 400,
      height: 40
    }
  },
  { 
    id: 'paragraph', 
    type: 'paragraph', 
    label: 'Text Block', 
    icon: AlignLeft,
    defaultProps: {
      text: 'Add your text here...',
      align: 'left',
      color: '#000000',
      width: 400,
      height: 60
    }
  },
  { 
    id: 'text', 
    type: 'text', 
    label: 'Text Input', 
    icon: Mail,
    defaultProps: {
      label: 'Text Field',
      placeholder: 'Enter text...',
      required: false,
      width: 300,
      height: 40
    }
  },
  { 
    id: 'textarea', 
    type: 'textarea', 
    label: 'Text Area', 
    icon: FileText,
    defaultProps: {
      label: 'Text Area',
      placeholder: 'Enter your message...',
      required: false,
      width: 300,
      height: 80,
      rows: 3
    }
  },
  { 
    id: 'email', 
    type: 'email', 
    label: 'Email', 
    icon: Hash,
    defaultProps: {
      label: 'Email Address',
      placeholder: 'Enter email...',
      required: false,
      width: 300,
      height: 40
    }
  },
  { 
    id: 'phone', 
    type: 'tel', 
    label: 'Phone', 
    icon: Phone,
    defaultProps: {
      label: 'Phone Number',
      placeholder: 'Enter phone...',
      required: false,
      width: 300,
      height: 40
    }
  },
  { 
    id: 'date', 
    type: 'date', 
    label: 'Date', 
    icon: Calendar,
    defaultProps: {
      label: 'Date',
      required: false,
      width: 300,
      height: 40
    }
  },
  { 
    id: 'number', 
    type: 'number', 
    label: 'Number', 
    icon: Hash,
    defaultProps: {
      label: 'Number',
      placeholder: 'Enter number...',
      required: false,
      width: 300,
      height: 40
    }
  },
  { 
    id: 'select', 
    type: 'select', 
    label: 'Dropdown', 
    icon: List,
    defaultProps: {
      label: 'Dropdown',
      required: false,
      width: 300,
      height: 40,
      options: ['Option 1', 'Option 2', 'Option 3']
    }
  },
  { 
    id: 'checkbox', 
    type: 'checkbox', 
    label: 'Checkbox', 
    icon: CheckSquare,
    defaultProps: {
      label: 'Checkbox Option',
      required: false,
      width: 200,
      height: 30
    }
  },
  { 
    id: 'radio', 
    type: 'radio', 
    label: 'Radio Button', 
    icon: Circle,
    defaultProps: {
      label: 'Radio Group',
      required: false,
      width: 200,
      height: 80,
      options: ['Option 1', 'Option 2']
    }
  }
];

const FormBuilderPage = () => {
  const { user } = useAuth({ middleware: "auth" });
  const router = useRouter();
  const { churchname, serviceId } = useParams();
  
  // Canvas and form state
  const [formElements, setFormElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [serviceName, setServiceName] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [requirements, setRequirements] = useState([]);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isLoadingForm, setIsLoadingForm] = useState(true);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [alignmentGuides, setAlignmentGuides] = useState({ vertical: [], horizontal: [] });
  
  // Canvas ref
  const canvasRef = useRef(null);
  
  // Drag state
  const [draggedElement, setDraggedElement] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Load service name and existing form configuration
    const loadServiceData = async () => {
      try {
        // Load service name from sacraments API
        const sacramentResponse = await axios.get(`/api/sacrament-services/${churchname}`);
        const sacrament = sacramentResponse.data.sacraments?.find(s => s.ServiceID.toString() === serviceId);
        if (sacrament) {
          setServiceName(sacrament.ServiceName);
        }
        
        // Load existing form configuration if any
        try {
          const configResponse = await axios.get(`/api/sacrament-services/${serviceId}/form-config`);
          if (configResponse.data) {
            // Transform backend data to frontend format
            const elements = configResponse.data.form_elements?.map(element => ({
              id: Date.now() + Math.random(), // Generate unique ID
              type: element.type,
              label: element.label,
              placeholder: element.placeholder,
              required: element.required,
              options: element.options || [],
              x: element.properties?.x || 50,
              y: element.properties?.y || 50,
              width: element.properties?.width || 300,
              height: element.properties?.height || 40,
              text: element.properties?.text || '',
              size: element.properties?.size || 'h2',
              align: element.properties?.align || 'left',
              color: element.properties?.color || '#000000',
              rows: element.properties?.rows || 3,
              zIndex: 1
            })) || [];
            
            const reqs = configResponse.data.requirements?.map(req => ({
              id: Date.now() + Math.random(), // Generate unique ID
              description: req.description,
              mandatory: req.is_mandatory
            })) || [];
            
            setFormElements(elements);
            setRequirements(reqs);
          }
        } catch (configError) {
          // Configuration doesn't exist yet, that's okay
          console.log("No existing configuration found, starting fresh");
        }
      } catch (error) {
        console.error("Failed to load service data:", error);
        setAlertMessage("Failed to load service data. Please try again.");
        setAlertType("error");
      } finally {
        setIsLoadingForm(false);
      }
    };
    
    loadServiceData();
  }, [serviceId, churchname]);

  // Auto-dismiss alert after 5 seconds
  useEffect(() => {
    if (!alertMessage) return;
    const timeout = setTimeout(() => {
      setAlertMessage("");
      setAlertType("");
    }, 5000);
    return () => clearTimeout(timeout);
  }, [alertMessage]);

  // Handle drag start from toolbox
  const handleDragStart = (elementType) => {
    setDraggedElement(elementType);
    setIsDragging(true);
  };

  // Handle drop on canvas
  const handleCanvasDrop = (e) => {
    e.preventDefault();
    if (!draggedElement) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - canvasRect.left;
    const y = e.clientY - canvasRect.top;

    const newElement = {
      id: Date.now(),
      type: draggedElement.type,
      x: Math.max(0, x - 150), // Center the element
      y: Math.max(0, y - 20),
      ...draggedElement.defaultProps,
      zIndex: formElements.length + 1
    };

    setFormElements([...formElements, newElement]);
    setSelectedElement(newElement.id);
    setDraggedElement(null);
    setIsDragging(false);
  };

  // Handle element selection
  const handleElementClick = (elementId, e) => {
    e.stopPropagation();
    setSelectedElement(elementId);
  };

  // Calculate alignment guides and snap positions
  const calculateAlignmentGuides = (draggedElementId, newX, newY) => {
    const draggedElement = formElements.find(el => el.id === draggedElementId);
    if (!draggedElement) return { guides: { vertical: [], horizontal: [] }, snappedX: newX, snappedY: newY };

    const otherElements = formElements.filter(el => el.id !== draggedElementId);
    const snapThreshold = 5; // pixels
    const guides = { vertical: [], horizontal: [] };
    
    let snappedX = newX;
    let snappedY = newY;
    
    // Calculate element bounds for dragged element
    const draggedLeft = newX;
    const draggedRight = newX + draggedElement.width;
    const draggedTop = newY;
    const draggedBottom = newY + draggedElement.height;
    const draggedCenterX = newX + draggedElement.width / 2;
    const draggedCenterY = newY + draggedElement.height / 2;
    
    otherElements.forEach(element => {
      const elementLeft = element.x;
      const elementRight = element.x + element.width;
      const elementTop = element.y;
      const elementBottom = element.y + element.height;
      const elementCenterX = element.x + element.width / 2;
      const elementCenterY = element.y + element.height / 2;
      
      // Vertical alignment checks (X positions)
      // Left edges align
      if (Math.abs(draggedLeft - elementLeft) <= snapThreshold) {
        snappedX = elementLeft;
        guides.vertical.push(elementLeft);
      }
      // Right edges align
      if (Math.abs(draggedRight - elementRight) <= snapThreshold) {
        snappedX = elementRight - draggedElement.width;
        guides.vertical.push(elementRight);
      }
      // Left to right edge align
      if (Math.abs(draggedLeft - elementRight) <= snapThreshold) {
        snappedX = elementRight;
        guides.vertical.push(elementRight);
      }
      // Right to left edge align
      if (Math.abs(draggedRight - elementLeft) <= snapThreshold) {
        snappedX = elementLeft - draggedElement.width;
        guides.vertical.push(elementLeft);
      }
      // Center X align
      if (Math.abs(draggedCenterX - elementCenterX) <= snapThreshold) {
        snappedX = elementCenterX - draggedElement.width / 2;
        guides.vertical.push(elementCenterX);
      }
      
      // Horizontal alignment checks (Y positions)
      // Top edges align
      if (Math.abs(draggedTop - elementTop) <= snapThreshold) {
        snappedY = elementTop;
        guides.horizontal.push(elementTop);
      }
      // Bottom edges align
      if (Math.abs(draggedBottom - elementBottom) <= snapThreshold) {
        snappedY = elementBottom - draggedElement.height;
        guides.horizontal.push(elementBottom);
      }
      // Top to bottom edge align
      if (Math.abs(draggedTop - elementBottom) <= snapThreshold) {
        snappedY = elementBottom;
        guides.horizontal.push(elementBottom);
      }
      // Bottom to top edge align
      if (Math.abs(draggedBottom - elementTop) <= snapThreshold) {
        snappedY = elementTop - draggedElement.height;
        guides.horizontal.push(elementTop);
      }
      // Center Y align
      if (Math.abs(draggedCenterY - elementCenterY) <= snapThreshold) {
        snappedY = elementCenterY - draggedElement.height / 2;
        guides.horizontal.push(elementCenterY);
      }
    });
    
    return { guides, snappedX, snappedY };
  };

  // Handle element position update with snapping
  const updateElementPosition = (elementId, x, y) => {
    const { guides, snappedX, snappedY } = calculateAlignmentGuides(elementId, x, y);
    
    setFormElements(elements =>
      elements.map(el =>
        el.id === elementId ? { ...el, x: snappedX, y: snappedY } : el
      )
    );
    
    setAlignmentGuides(guides);
  };
  
  // Clear alignment guides when not dragging
  const clearAlignmentGuides = () => {
    setAlignmentGuides({ vertical: [], horizontal: [] });
  };

  // Handle element resize
  const updateElementSize = (elementId, width, height) => {
    setFormElements(elements =>
      elements.map(el =>
        el.id === elementId ? { ...el, width, height } : el
      )
    );
  };

  // Handle element property update
  const updateElementProperty = (elementId, property, value) => {
    setFormElements(elements =>
      elements.map(el =>
        el.id === elementId ? { ...el, [property]: value } : el
      )
    );
  };

  // Delete element
  const deleteElement = (elementId) => {
    setFormElements(elements => elements.filter(el => el.id !== elementId));
    setSelectedElement(null);
  };

  // Save form configuration
  const saveFormConfiguration = async () => {
    try {
      setIsSavingConfig(true);
      
      const formConfig = {
        service_id: serviceId,
        form_elements: formElements.map(element => ({
          type: element.type,
          label: element.label || element.text || '',
          placeholder: element.placeholder || '',
          required: element.required || false,
          options: element.options || [],
          properties: {
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
            text: element.text || '',
            size: element.size || '',
            align: element.align || '',
            color: element.color || '',
            rows: element.rows || null
          }
        })),
        requirements: requirements.map(req => ({
          description: req.description,
          is_mandatory: req.mandatory
        }))
      };
      
      console.log("Saving form configuration:", formConfig);
      
      const response = await axios.post(`/api/sacrament-services/${serviceId}/form-config`, formConfig);
      
      if (response.status === 200 || response.status === 201) {
        setAlertMessage("Form configuration saved successfully!");
        setAlertType("success");
      }
    } catch (error) {
      console.error("Failed to save form configuration:", error);
      setAlertMessage(error.response?.data?.message || "Failed to save form configuration. Please try again.");
      setAlertType("error");
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Add requirement
  const addRequirement = () => {
    const newReq = {
      id: Date.now(),
      description: "New requirement",
      mandatory: false
    };
    setRequirements([...requirements, newReq]);
  };

  // Update requirement
  const updateRequirement = (id, property, value) => {
    setRequirements(reqs =>
      reqs.map(req =>
        req.id === id ? { ...req, [property]: value } : req
      )
    );
  };

  // Delete requirement
  const deleteRequirement = (id) => {
    setRequirements(reqs => reqs.filter(req => req.id !== id));
  };

  const selectedElementData = formElements.find(el => el.id === selectedElement);

  // Show loading screen while loading form data
  if (isLoadingForm) {
    return (
      <div className="h-screen flex flex-col bg-gray-100">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => router.push(`/${churchname}/sacrament`)}
              variant="outline"
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sacraments
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Form Builder</h1>
              <p className="text-sm text-gray-600">Configure: {serviceName || 'Loading...'}</p>
            </div>
          </div>
        </div>
        
        {/* Loading Overlay */}
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Form Builder</h2>
            <p className="text-gray-600">Please wait while we load your form configuration...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => router.push(`/${churchname}/sacrament`)}
            variant="outline"
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sacraments
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Form Builder</h1>
            <p className="text-sm text-gray-600">Configure: {serviceName}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            variant="outline"
            className="flex items-center"
          >
            <Eye className="h-4 w-4 mr-2" />
            {isPreviewMode ? "Edit Mode" : "Preview"}
          </Button>
          <Button
            onClick={saveFormConfiguration}
            className="flex items-center"
            disabled={isSavingConfig}
          >
            {isSavingConfig ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Alert Message */}
      {alertMessage && (
        <div className="mx-6 mt-4">
          <div className={`p-4 rounded-md flex justify-between items-center ${
            alertType === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}>
            <p className="text-sm font-medium">{alertMessage}</p>
            <button
              onClick={() => setAlertMessage("")}
              className="inline-flex text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Toolbox - Hidden in preview mode */}
        {!isPreviewMode && (
          <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Form Elements</h3>
              <div className="space-y-2">
                {FORM_ELEMENTS.map((element) => (
                  <div
                    key={element.id}
                    draggable
                    onDragStart={() => handleDragStart(element)}
                    className="flex items-center p-3 border border-gray-200 rounded-lg cursor-move hover:bg-gray-50 hover:border-blue-300 transition-colors"
                  >
                    <element.icon className="h-5 w-5 text-gray-600 mr-3" />
                    <span className="text-sm text-gray-900">{element.label}</span>
                  </div>
                ))}
              </div>

              {/* Requirements Section */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-900">Requirements</h3>
                  <Button
                    onClick={addRequirement}
                    variant="outline"
                    className="p-1 h-auto min-h-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {requirements.map((req) => (
                    <div key={req.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600">Requirement</span>
                        <Button
                          onClick={() => deleteRequirement(req.id)}
                          variant="outline"
                          className="p-1 h-auto min-h-0 text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <textarea
                        value={req.description}
                        onChange={(e) => updateRequirement(req.id, 'description', e.target.value)}
                        className="w-full text-xs border border-gray-300 rounded px-2 py-1 mb-2"
                        rows={2}
                        placeholder="Requirement description..."
                      />
                      <label className="flex items-center text-xs">
                        <input
                          type="checkbox"
                          checked={req.mandatory}
                          onChange={(e) => updateRequirement(req.id, 'mandatory', e.target.checked)}
                          className="mr-2"
                        />
                        Mandatory
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Canvas Area */}
        <div className="flex-1 flex">
          <div className="flex-1 p-6">
            <div
              ref={canvasRef}
              className="relative bg-white rounded-lg shadow-sm border border-gray-200 min-h-full"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleCanvasDrop}
              onClick={() => setSelectedElement(null)}
              style={{ minHeight: '800px' }}
            >
              {/* Canvas Grid (optional) */}
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                    linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px'
                }}
              />
              
              {/* Form Elements */}
              {formElements.map((element) => (
                <FormElement
                  key={element.id}
                  element={element}
                  isSelected={selectedElement === element.id}
                  isPreviewMode={isPreviewMode}
                  onClick={handleElementClick}
                  onPositionChange={updateElementPosition}
                  onSizeChange={updateElementSize}
                />
              ))}

              {/* Empty state */}
              {formElements.length === 0 && !isPreviewMode && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4" />
                    <p className="text-lg font-medium">Start building your form</p>
                    <p className="text-sm">Drag elements from the toolbox to create your custom form</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Properties Panel - Hidden in preview mode */}
          {!isPreviewMode && selectedElementData && (
            <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
              <PropertiesPanel
                element={selectedElementData}
                onUpdate={updateElementProperty}
                onDelete={deleteElement}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Form Element Component
const FormElement = ({ element, isSelected, isPreviewMode, onClick, onPositionChange, onSizeChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const handleMouseDown = (e, action = 'drag') => {
    e.stopPropagation();
    
    if (action === 'drag') {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - element.x,
        y: e.clientY - element.y
      });
    } else if (action === 'resize') {
      setIsResizing(true);
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: element.width,
        height: element.height
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        const newX = Math.max(0, e.clientX - dragStart.x);
        const newY = Math.max(0, e.clientY - dragStart.y);
        onPositionChange(element.id, newX, newY);
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        const newWidth = Math.max(100, resizeStart.width + deltaX);
        const newHeight = Math.max(30, resizeStart.height + deltaY);
        onSizeChange(element.id, newWidth, newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeStart, element.id, onPositionChange, onSizeChange]);

  const renderFormElement = () => {
    const commonProps = {
      style: { width: '100%', height: '100%' },
      className: "border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    };

    switch (element.type) {
      case 'heading':
        const HeadingTag = element.size || 'h2';
        return (
          <HeadingTag
            style={{ 
              width: '100%', 
              height: '100%',
              textAlign: element.align || 'left',
              color: element.color || '#000000',
              margin: 0,
              padding: '8px 0',
              fontSize: element.size === 'h1' ? '2rem' : element.size === 'h2' ? '1.5rem' : element.size === 'h3' ? '1.25rem' : '1rem',
              fontWeight: 'bold',
              lineHeight: '1.2',
              userSelect: 'none',
              pointerEvents: 'none'
            }}
            className="focus:outline-none select-none"
            contentEditable={false}
            suppressContentEditableWarning={true}
          >
            {element.text || 'Form Title'}
          </HeadingTag>
        );
      
      case 'paragraph':
        return (
          <div
            style={{ 
              width: '100%', 
              height: '100%',
              textAlign: element.align || 'left',
              color: element.color || '#000000',
              padding: '8px 0',
              fontSize: '1rem',
              lineHeight: '1.5',
              overflow: 'hidden'
            }}
            className="focus:outline-none"
            contentEditable={!isPreviewMode}
            suppressContentEditableWarning={true}
            onBlur={(e) => {
              if (!isPreviewMode && onClick) {
                const syntheticEvent = {
                  stopPropagation: () => {},
                  target: { value: e.target.textContent }
                };
                onClick(element.id, syntheticEvent);
              }
            }}
          >
            {element.text || 'Add your text here...'}
          </div>
        );
      
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
      case 'date':
        return (
          <input
            type={element.type}
            placeholder={element.placeholder}
            required={element.required}
            {...commonProps}
          />
        );
      
      case 'textarea':
        return (
          <textarea
            placeholder={element.placeholder}
            required={element.required}
            rows={element.rows || 3}
            {...commonProps}
          />
        );
      
      case 'select':
        return (
          <select {...commonProps}>
            <option value="">Select an option...</option>
            {element.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'checkbox':
        return (
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              required={element.required}
              className="mr-2"
            />
            {element.label}
          </label>
        );
      
      case 'radio':
        return (
          <div className="space-y-2">
            {element.options?.map((option, index) => (
              <label key={index} className="flex items-center text-sm">
                <input
                  type="radio"
                  name={`radio_${element.id}`}
                  value={option}
                  required={element.required}
                  className="mr-2"
                />
                {option}
              </label>
            ))}
          </div>
        );
      
      default:
        return <div>Unknown element type</div>;
    }
  };

  // Calculate the total height including label
  const hasLabel = element.label && !['heading', 'paragraph'].includes(element.type);
  const labelHeight = hasLabel ? 20 : 0; // Approximate height of label + margin
  const contentHeight = element.height - labelHeight;

  return (
    <div
      className={`absolute group ${isSelected && !isPreviewMode ? 'ring-2 ring-blue-500' : ''} ${
        isDragging ? 'z-50' : ''
      }`}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        zIndex: element.zIndex
      }}
      onClick={(e) => onClick(element.id, e)}
    >
      {/* Element Label - Only show for form inputs, not text elements */}
      {hasLabel && (
        <div className="text-xs font-medium text-gray-700 mb-1" style={{ height: '16px', lineHeight: '16px' }}>
          {element.label}
          {element.required && <span className="text-red-500 ml-1">*</span>}
        </div>
      )}
      
      {/* Form Element */}
      <div 
        className="relative" 
        style={{ 
          height: hasLabel ? `calc(100% - 20px)` : '100%'
        }}
      >
        {renderFormElement()}
        
        {/* Drag Handle - Only in edit mode */}
        {!isPreviewMode && (
          <div
            className="absolute -top-6 -left-1 w-6 h-6 bg-blue-500 rounded cursor-move flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            onMouseDown={(e) => handleMouseDown(e, 'drag')}
            title="Drag to move"
            style={{ top: hasLabel ? '-26px' : '-24px' }} // Adjust for label
          >
            <Move className="h-3 w-3 text-white" />
          </div>
        )}
        
        {/* Resize Handle - Only in edit mode */}
        {!isPreviewMode && (
          <div
            className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-500 rounded cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
            onMouseDown={(e) => handleMouseDown(e, 'resize')}
            title="Drag to resize"
          />
        )}
      </div>
    </div>
  );
};

// Properties Panel Component
const PropertiesPanel = ({ element, onUpdate, onDelete }) => {
  return (
    <div className="p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Properties</h3>
        <Button
          onClick={() => onDelete(element.id)}
          variant="outline"
          className="text-red-600 hover:text-red-700 p-2 h-auto min-h-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {/* Text Content (for heading and paragraph) */}
        {['heading', 'paragraph'].includes(element.type) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Text Content
            </label>
            <textarea
              value={element.text || ''}
              onChange={(e) => onUpdate(element.id, 'text', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              rows={3}
            />
          </div>
        )}
        
        {/* Text Alignment (for heading and paragraph) */}
        {['heading', 'paragraph'].includes(element.type) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Text Alignment
            </label>
            <select
              value={element.align || 'left'}
              onChange={(e) => onUpdate(element.id, 'align', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
              <option value="justify">Justify</option>
            </select>
          </div>
        )}
        
        {/* Heading Size (for heading only) */}
        {element.type === 'heading' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Heading Size
            </label>
            <select
              value={element.size || 'h2'}
              onChange={(e) => onUpdate(element.id, 'size', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="h1">H1 - Large Title</option>
              <option value="h2">H2 - Title</option>
              <option value="h3">H3 - Subtitle</option>
              <option value="h4">H4 - Small Heading</option>
            </select>
          </div>
        )}
        
        {/* Text Color (for heading and paragraph) */}
        {['heading', 'paragraph'].includes(element.type) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Text Color
            </label>
            <input
              type="color"
              value={element.color || '#000000'}
              onChange={(e) => onUpdate(element.id, 'color', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm h-10"
            />
          </div>
        )}

        {/* Label (for form inputs) */}
        {!['heading', 'paragraph'].includes(element.type) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Label
            </label>
            <input
              type="text"
              value={element.label || ''}
              onChange={(e) => onUpdate(element.id, 'label', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
        )}

        {/* Placeholder (for input types) */}
        {['text', 'email', 'tel', 'number', 'textarea'].includes(element.type) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Placeholder
            </label>
            <input
              type="text"
              value={element.placeholder || ''}
              onChange={(e) => onUpdate(element.id, 'placeholder', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
        )}

        {/* Required (only for form inputs) */}
        {!['heading', 'paragraph'].includes(element.type) && (
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={element.required || false}
                onChange={(e) => onUpdate(element.id, 'required', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Required field</span>
            </label>
          </div>
        )}

        {/* Options (for select and radio) */}
        {['select', 'radio'].includes(element.type) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Options (one per line)
            </label>
            <textarea
              value={element.options?.join('\n') || ''}
              onChange={(e) => onUpdate(element.id, 'options', e.target.value.split('\n').filter(opt => opt.trim()))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              rows={4}
            />
          </div>
        )}

        {/* Rows (for textarea) */}
        {element.type === 'textarea' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rows
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={element.rows || 3}
              onChange={(e) => onUpdate(element.id, 'rows', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
        )}

        {/* Position and Size */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Position & Size</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">X Position</label>
              <input
                type="number"
                value={element.x || 0}
                onChange={(e) => onUpdate(element.id, 'x', parseInt(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Y Position</label>
              <input
                type="number"
                value={element.y || 0}
                onChange={(e) => onUpdate(element.id, 'y', parseInt(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Width</label>
              <input
                type="number"
                min="100"
                value={element.width || 300}
                onChange={(e) => onUpdate(element.id, 'width', parseInt(e.target.value) || 300)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Height</label>
              <input
                type="number"
                min="30"
                value={element.height || 40}
                onChange={(e) => onUpdate(element.id, 'height', parseInt(e.target.value) || 40)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormBuilderPage;
