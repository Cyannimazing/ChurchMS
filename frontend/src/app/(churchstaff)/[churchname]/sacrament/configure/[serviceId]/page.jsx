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
  Square,
  X
} from "lucide-react";
import { Button } from "@/components/Button.jsx";
import Alert from "@/components/Alert.jsx";
import axios from "@/lib/axios";
import { useAuth } from "@/hooks/auth.jsx";

// Form element types with container
const FORM_ELEMENTS = [
  { 
    id: 'container', 
    type: 'container', 
    label: 'Form Container', 
    icon: Square,
    defaultProps: {
      width: 600,
      height: 400,
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
      borderWidth: 2,
      borderRadius: 8,
      padding: 20
    }
  },
  { 
    id: 'heading', 
    type: 'heading', 
    label: 'Title/Heading', 
    icon: Type,
    defaultProps: {
      content: 'Heading Text',
      headingSize: 'h2',
      textAlign: 'left',
      textColor: '#000000',
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
      content: 'Paragraph text content',
      textAlign: 'left',
      textColor: '#000000',
      width: 400,
      height: 80
    }
  },
  { 
    id: 'text', 
    type: 'text', 
    label: 'Text Input', 
    icon: Type,
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
    icon: AlignLeft,
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
    icon: Mail,
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
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Alert state
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  
  // Canvas ref
  const canvasRef = useRef(null);
  
  // Drag state
  const [draggedElement, setDraggedElement] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Load service name and existing form configuration
    const loadServiceData = async () => {
      try {
        setIsLoading(true);
        
        // Load service name from sacraments API (using the correct endpoint structure)
        const sacramentResponse = await axios.get(`/api/sacrament-services/${churchname}`);
        const sacrament = sacramentResponse.data.sacraments?.find(s => s.ServiceID.toString() === serviceId);
        if (sacrament) {
          setServiceName(sacrament.ServiceName || "Sacrament Service");
        }
        
        // Load existing form configuration if any
        try {
          const configResponse = await axios.get(`/api/sacrament-services/${serviceId}/form-config`);
          if (configResponse.data) {
            console.log('Raw backend data:', configResponse.data);
            console.log('Form elements from backend:', configResponse.data.form_elements);
            
            // Transform backend data to frontend format - USE SAVED POSITIONS
            let containerElement = null;
            const formElements = [];
            
            configResponse.data.form_elements?.forEach((element, index) => {
              if (element.type === 'container') {
                // This is the container - use saved position or default
                containerElement = {
                  id: Date.now() + Math.random() + index,
                  type: 'container',
                  label: element.label,
                  x: element.properties?.x || 50,
                  y: element.properties?.y || 50,
                  width: element.properties?.width || 600,
                  height: element.properties?.height || 400,
                  backgroundColor: element.properties?.backgroundColor || '#ffffff',
                  borderColor: element.properties?.borderColor || '#e5e7eb',
                  borderWidth: element.properties?.borderWidth || 2,
                  borderRadius: element.properties?.borderRadius || 8,
                  padding: element.properties?.padding || 20,
                  containerId: null,
                  zIndex: 0
                };
                formElements.push(containerElement);
              } else {
                // This is a form element - use saved position or calculate default
                const elementIndex = formElements.filter(el => el.type !== 'container').length;
                const defaultX = 20 + (elementIndex % 2) * 250; // Two columns inside container
                const defaultY = 20 + Math.floor(elementIndex / 2) * 80; // Stack vertically
                
                formElements.push({
                  id: Date.now() + Math.random() + index,
                  type: element.type,
                  label: element.label,
                  placeholder: element.placeholder,
                  required: element.required,
                  options: element.options || [],
                  // USE SAVED POSITIONS if available, otherwise use defaults
                  x: element.properties?.x !== undefined ? element.properties.x : defaultX,
                  y: element.properties?.y !== undefined ? element.properties.y : defaultY,
                  width: element.properties?.width || (element.type === 'heading' ? 400 : 200),
                  height: element.properties?.height || (element.type === 'heading' ? 40 : element.type === 'paragraph' ? 60 : 35),
                  content: element.properties?.text || (element.type === 'heading' ? 'BAPTISM' : element.type === 'paragraph' ? 'Paragraph text' : ''),
                  headingSize: element.properties?.size || 'h2',
                  textAlign: element.properties?.align || 'center',
                  textColor: element.properties?.color || '#000000',
                  rows: element.properties?.rows || 3,
                  backgroundColor: element.properties?.backgroundColor || '#ffffff',
                  borderColor: element.properties?.borderColor || '#e5e7eb',
                  borderWidth: element.properties?.borderWidth || 1,
                  borderRadius: element.properties?.borderRadius || 4,
                  padding: element.properties?.padding || 10,
                  containerId: element.properties?.containerId || (containerElement?.id || null),
                  zIndex: 1
                });
              }
            });
            
            const elements = formElements;
            
            const reqs = configResponse.data.requirements?.map(req => ({
              id: Date.now() + Math.random(), // Generate unique ID
              description: req.description,
              mandatory: req.is_mandatory
            })) || [];
            
            setFormElements(elements);
            setRequirements(reqs);
          }
        } catch (formError) {
          // Form config might not exist yet, which is fine for new forms
          if (formError.response?.status !== 404) {
            console.error("Failed to load form configuration:", formError);
          }
        }
      } catch (error) {
        console.error("Failed to load service data:", error);
        setAlertMessage('Failed to load service data. Please try again.');
        setAlertType('error');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (serviceId && churchname) {
      loadServiceData();
    }
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

  // Handle element position update  
  const updateElementPosition = (elementId, x, y) => {
    setFormElements(elements =>
      elements.map(el => {
        if (el.id === elementId) {
          // Check if element should be moved into or out of a container
          let newContainerId = el.containerId;
          let newX = x;
          let newY = y;

          // Find if the new position is inside a container
          for (const containerEl of elements) {
            if (containerEl.type === 'container' && containerEl.id !== elementId) {
              const containerLeft = containerEl.x;
              const containerTop = containerEl.y;
              const containerRight = containerEl.x + containerEl.width;
              const containerBottom = containerEl.y + containerEl.height;
              const padding = containerEl.padding || 20;

              // Check if element center point is inside container
              const elementCenterX = x + (el.width / 2);
              const elementCenterY = y + (el.height / 2);
              
              if (elementCenterX >= containerLeft && elementCenterX <= containerRight && 
                  elementCenterY >= containerTop && elementCenterY <= containerBottom) {
                // Element is now inside this container
                newContainerId = containerEl.id;
                // Calculate position relative to container's inner area (accounting for padding)
                let relativeX = x - containerLeft - padding;
                let relativeY = y - containerTop - padding;
                
                // Apply grid snapping inside containers too (5px grid for finer control)
                const gridSize = 5;
                relativeX = Math.round(relativeX / gridSize) * gridSize;
                relativeY = Math.round(relativeY / gridSize) * gridSize;
                
                // Ensure element stays within container bounds
                const maxX = containerEl.width - (padding * 2) - el.width;
                const maxY = containerEl.height - (padding * 2) - el.height;
                relativeX = Math.max(0, Math.min(relativeX, maxX));
                relativeY = Math.max(0, Math.min(relativeY, maxY));
                
                newX = relativeX;
                newY = relativeY;
                break;
              }
            }
          }

          // If no longer inside a container, clear containerId
          if (newContainerId === null && el.containerId !== null) {
            // Moving out of a container - adjust position to global coordinates
            newX = x;
            newY = y;
            // Apply grid snapping for elements outside containers
            const gridSize = 10;
            newX = Math.round(newX / gridSize) * gridSize;
            newY = Math.round(newY / gridSize) * gridSize;
          } else if (newContainerId === null) {
            // Apply grid snapping only for elements outside containers
            const gridSize = 10;
            newX = Math.round(newX / gridSize) * gridSize;
            newY = Math.round(newY / gridSize) * gridSize;
          }

          return { ...el, x: newX, y: newY, containerId: newContainerId };
        }
        return el;
      })
    );
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
    if (isSaving) return; // Prevent multiple saves
    
    try {
      setIsSaving(true);
      
      // Transform data to match backend expectations
      const formConfig = {
        service_id: serviceId,
        form_elements: formElements.map(element => ({
          type: element.type,
          label: element.label || element.content || element.text || '',
          placeholder: element.placeholder || '',
          required: element.required || false,
          options: element.options || [],
          properties: {
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
            text: element.content || element.text || '',
            size: element.headingSize || element.size || '',
            align: element.textAlign || element.align || '',
            color: element.textColor || element.color || '',
            rows: element.rows || null,
            // Container specific properties
            backgroundColor: element.backgroundColor || '',
            borderColor: element.borderColor || '',
            borderWidth: element.borderWidth || null,
            borderRadius: element.borderRadius || null,
            padding: element.padding || null,
            // Container relationship
            containerId: element.containerId || null
          }
        })),
        requirements: requirements.map(req => ({
          description: req.description,
          is_mandatory: req.mandatory
        }))
      };
      
      console.log("Saving form configuration:", formConfig);
      
      // Save form configuration to database
      const response = await axios.post(`/api/sacrament-services/${serviceId}/form-config`, formConfig);
      
      setAlertMessage('Form configuration saved successfully!');
      setAlertType('success');
      
      console.log("Form configuration saved:", response.data);
      
    } catch (error) {
      console.error("Failed to save form configuration:", error);
      
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to save form configuration. Please try again.';
      
      setAlertMessage(errorMessage);
      setAlertType('error');
    } finally {
      setIsSaving(false);
    }
  };

  // Add container
  const addContainer = () => {
    const containerElement = FORM_ELEMENTS.find(el => el.type === 'container');
    const newContainer = {
      id: Date.now(),
      type: 'container',
      x: 50,
      y: 50,
      ...containerElement.defaultProps,
      zIndex: formElements.length + 1
    };
    setFormElements([...formElements, newContainer]);
    setSelectedElement(newContainer.id);
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

  return (
    <div className="fixed inset-0 h-screen flex flex-col bg-gray-100 z-50">
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
          >
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
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
              <h3 className="text-sm font-medium text-gray-900 mb-4">Form Elements NEWEST</h3>
              {console.log('RENDERING ELEMENTS:', FORM_ELEMENTS.map(el => el.label))}
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
                  formElements={formElements}
                  isSelected={selectedElement === element.id}
                  isPreviewMode={isPreviewMode}
                  onClick={handleElementClick}
                  onPositionChange={updateElementPosition}
                  onSizeChange={updateElementSize}
                  onPropertyChange={updateElementProperty}
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
const FormElement = ({ element, formElements, isSelected, isPreviewMode, onClick, onPositionChange, onSizeChange, onPropertyChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [tempContent, setTempContent] = useState(element.content || element.label || '');
  const contentRef = useRef(null);

  // Handle inline content editing
  const handleContentDoubleClick = (e) => {
    if (!isPreviewMode && element.type === 'paragraph') {
      e.stopPropagation();
      setIsEditingContent(true);
      setTempContent(element.content || '');
    }
  };

  const handleContentChange = (e) => {
    // Prevent any content changes for heading elements
    if (element.type === 'heading') {
      e.preventDefault();
      return;
    }
    setTempContent(e.target.value);
  };

  const handleContentSubmit = () => {
    console.log('Submitting content change:', { elementId: element.id, oldContent: element.content, newContent: tempContent });
    
    if (onPropertyChange) {
      if (tempContent.trim() !== '') {
        onPropertyChange(element.id, 'content', tempContent);
      } else {
        // If empty, set to default content
        const defaultContent = element.type === 'heading' ? 'Heading Text' : 'Paragraph text content';
        onPropertyChange(element.id, 'content', defaultContent);
        setTempContent(defaultContent);
      }
    }
    setIsEditingContent(false);
  };

  const handleContentKeyDown = (e) => {
    // Block all keyboard input for heading elements
    if (element.type === 'heading') {
      e.preventDefault();
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleContentSubmit();
    } else if (e.key === 'Escape') {
      setIsEditingContent(false);
      setTempContent(element.content || '');
    }
  };

  const handleContentBlur = () => {
    handleContentSubmit();
  };

  // Focus and select text when editing starts
  useEffect(() => {
    if (isEditingContent && contentRef.current) {
      contentRef.current.focus();
      contentRef.current.select();
    }
  }, [isEditingContent]);

  // Update temp content when element content changes (from properties panel)
  useEffect(() => {
    setTempContent(element.content || element.label || '');
  }, [element.content, element.label]);

  // Clear editing state for headings if it was somehow activated
  useEffect(() => {
    if (element.type === 'heading' && isEditingContent) {
      setIsEditingContent(false);
    }
  }, [element.type, isEditingContent]);

  const handleMouseDown = (e, action = 'drag') => {
    e.stopPropagation();
    
    const containerElement = formElements?.find(el => el.id === element.containerId);
    const isInsideContainer = !!containerElement;
    
    // Calculate absolute position based on container position if inside one
    const absoluteX = isInsideContainer 
      ? (containerElement.x + (containerElement.padding || 20) + element.x)
      : element.x;
    const absoluteY = isInsideContainer 
      ? (containerElement.y + (containerElement.padding || 20) + element.y)
      : element.y;
    
    if (action === 'drag') {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - absoluteX,
        y: e.clientY - absoluteY
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
      case 'container':
        return (
          <div 
            className="w-full h-full border-2 border-dashed relative"
            style={{
              backgroundColor: element.backgroundColor || '#ffffff',
              borderColor: element.borderColor || '#e5e7eb',
              borderWidth: `${element.borderWidth || 2}px`,
              borderRadius: `${element.borderRadius || 8}px`,
              padding: `${element.padding || 20}px`
            }}
          >
            {/* Grid overlay for alignment inside container */}
            {!isPreviewMode && (
              <div 
                className="absolute inset-0 opacity-5 pointer-events-none"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #3b82f6 1px, transparent 1px),
                    linear-gradient(to bottom, #3b82f6 1px, transparent 1px)
                  `,
                  backgroundSize: '5px 5px',
                  margin: `${element.padding || 20}px`
                }}
              />
            )}
          </div>
        );
      
      case 'heading':
        const HeadingTag = element.headingSize || element.size || 'h2';
        
        // Define font sizes for each heading level
        const getHeadingStyles = (headingSize) => {
          const sizes = {
            'h1': { fontSize: '2rem', fontWeight: '700' },      // 32px, bold
            'h2': { fontSize: '1.5rem', fontWeight: '600' },    // 24px, semibold
            'h3': { fontSize: '1.25rem', fontWeight: '600' },   // 20px, semibold
            'h4': { fontSize: '1rem', fontWeight: '500' }       // 16px, medium
          };
          return sizes[headingSize] || sizes['h2'];
        };
        
        const headingStyles = getHeadingStyles(HeadingTag);
        
        return (
          <div className="w-full h-full flex items-center">
            <HeadingTag
              className={`w-full px-2 py-1 rounded select-none`}
              style={{ 
                textAlign: element.textAlign || element.align || 'left',
                color: element.textColor || element.color || '#000000',
                margin: 0,
                lineHeight: '1.2',
                userSelect: 'none',
                pointerEvents: 'none',
                fontSize: headingStyles.fontSize,
                fontWeight: headingStyles.fontWeight
              }}
              contentEditable={false}
              suppressContentEditableWarning={true}
            >
              {element.content || element.text || 'Heading Text'}
            </HeadingTag>
          </div>
        );
      
      case 'paragraph':
        return (
          <div className="w-full h-full">
            {isEditingContent ? (
              <textarea
                ref={contentRef}
                value={tempContent}
                onChange={handleContentChange}
                onKeyDown={handleContentKeyDown}
                onBlur={handleContentBlur}
                className="w-full h-full border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            ) : (
              <p
                className="w-full h-full cursor-pointer hover:bg-gray-50 px-2 py-1 rounded overflow-hidden"
                style={{ 
                  textAlign: element.textAlign || 'left',
                  color: element.textColor || '#000000',
                  margin: 0,
                  lineHeight: '1.4'
                }}
                onDoubleClick={handleContentDoubleClick}
              >
                {element.content || 'Paragraph text content'}
              </p>
            )}
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

  const containerElement = formElements?.find(el => el.id === element.containerId);
  const isInsideContainer = !!containerElement;
  
  // Calculate absolute position based on container position if inside one
  const absoluteX = isInsideContainer 
    ? (containerElement.x + (containerElement.padding || 20) + element.x)
    : element.x;
  const absoluteY = isInsideContainer 
    ? (containerElement.y + (containerElement.padding || 20) + element.y)
    : element.y;

  return (
    <div
      className={`absolute group ${isSelected && !isPreviewMode ? 'ring-2 ring-blue-500' : ''} ${
        isDragging ? 'z-50' : ''
      }`}
      style={{
        left: absoluteX,
        top: absoluteY,
        width: element.width,
        height: element.height,
        zIndex: element.zIndex
      }}
      onClick={(e) => onClick(element.id, e)}
    >
      {/* Element Label */}
      {!isPreviewMode && element.label && !['heading', 'paragraph', 'container'].includes(element.type) && (
        <div className="text-xs font-medium text-gray-700 mb-1">
          {element.label}
          {element.required && <span className="text-red-500 ml-1">*</span>}
        </div>
      )}
      
      {/* Form Element */}
      <div className="relative h-full">
        {renderFormElement()}
        
        {/* Drag Handle - Only in edit mode */}
        {!isPreviewMode && (
          <div
            className="absolute -top-6 -left-1 w-6 h-6 bg-blue-500 rounded cursor-move flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            onMouseDown={(e) => handleMouseDown(e, 'drag')}
            title="Drag to move"
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
              value={element.content || ''}
              onChange={(e) => onUpdate(element.id, 'content', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              rows={3}
              placeholder="Enter your text content..."
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
              value={element.textAlign || 'left'}
              onChange={(e) => onUpdate(element.id, 'textAlign', e.target.value)}
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
              value={element.headingSize || 'h2'}
              onChange={(e) => onUpdate(element.id, 'headingSize', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="h1">H1 - Large</option>
              <option value="h2">H2 - Title</option>
              <option value="h3">H3 - Subtitle</option>
              <option value="h4">H4 - Small</option>
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
              value={element.textColor || '#000000'}
              onChange={(e) => onUpdate(element.id, 'textColor', e.target.value)}
              className="w-full h-10 border border-gray-300 rounded px-1 py-1"
            />
          </div>
        )}

        {/* Container Properties */}
        {element.type === 'container' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Background Color
              </label>
              <input
                type="color"
                value={element.backgroundColor || '#ffffff'}
                onChange={(e) => onUpdate(element.id, 'backgroundColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded px-1 py-1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Border Color
              </label>
              <input
                type="color"
                value={element.borderColor || '#e5e7eb'}
                onChange={(e) => onUpdate(element.id, 'borderColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded px-1 py-1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Border Width
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={element.borderWidth || 2}
                  onChange={(e) => onUpdate(element.id, 'borderWidth', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Border Radius
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={element.borderRadius || 8}
                  onChange={(e) => onUpdate(element.id, 'borderRadius', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Internal Padding
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={element.padding || 20}
                onChange={(e) => onUpdate(element.id, 'padding', parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
          </>
        )}

        {/* Label (for form inputs) */}
        {!['heading', 'paragraph', 'container'].includes(element.type) && (
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

        {/* Required */}
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