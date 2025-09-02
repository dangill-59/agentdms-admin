import React, { useState, useEffect } from 'react';
import type { Project, CustomField } from '../types/api';
import { projectService } from '../services/projects';

interface DocumentUploadFormProps {
  selectedProject: Project | null;
  onFieldValuesChange: (values: Record<string, string>) => void;
  fieldValues: Record<string, string>;
  disabled?: boolean;
}

const DocumentUploadForm: React.FC<DocumentUploadFormProps> = ({
  selectedProject,
  onFieldValuesChange,
  fieldValues,
  disabled = false
}) => {
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const [fieldSuggestions, setFieldSuggestions] = useState<Record<string, string[]>>({});

  // Load custom fields when project changes
  useEffect(() => {
    const fetchCustomFields = async () => {
      if (!selectedProject) {
        setCustomFields([]);
        return;
      }

      try {
        setIsLoadingFields(true);
        const fields = await projectService.getProjectCustomFields(selectedProject.id);
        setCustomFields(fields);
      } catch (error) {
        console.error('Failed to fetch custom fields:', error);
        setCustomFields([]);
      } finally {
        setIsLoadingFields(false);
      }
    };

    fetchCustomFields();
  }, [selectedProject]);

  // Load field suggestions from localStorage
  useEffect(() => {
    const loadFieldSuggestions = () => {
      const suggestions: Record<string, string[]> = {};
      customFields.forEach(field => {
        const storageKey = `fieldSuggestions_${field.projectId}_${field.name}`;
        const savedSuggestions = localStorage.getItem(storageKey);
        if (savedSuggestions) {
          try {
            suggestions[field.name] = JSON.parse(savedSuggestions);
          } catch {
            suggestions[field.name] = [];
          }
        } else {
          suggestions[field.name] = [];
        }
      });
      setFieldSuggestions(suggestions);
    };

    if (customFields.length > 0) {
      loadFieldSuggestions();
    }
  }, [customFields]);

  // Save field value to suggestions
  const saveFieldSuggestion = (fieldName: string, projectId: string, value: string) => {
    if (!value.trim()) return;
    
    const storageKey = `fieldSuggestions_${projectId}_${fieldName}`;
    const existingSuggestions = fieldSuggestions[fieldName] || [];
    
    // Add new value if not already present (case-insensitive)
    const normalizedValue = value.trim();
    const normalizedSuggestions = existingSuggestions.map(s => s.toLowerCase());
    
    if (!normalizedSuggestions.includes(normalizedValue.toLowerCase())) {
      const updatedSuggestions = [normalizedValue, ...existingSuggestions].slice(0, 10); // Keep only 10 most recent
      
      // Update state
      setFieldSuggestions(prev => ({
        ...prev,
        [fieldName]: updatedSuggestions
      }));
      
      // Save to localStorage
      localStorage.setItem(storageKey, JSON.stringify(updatedSuggestions));
    }
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    const newValues = { ...fieldValues, [fieldName]: value };
    
    // Remove empty values
    if (!value) {
      delete newValues[fieldName];
    }
    
    onFieldValuesChange(newValues);
  };

  const handleFieldBlur = (fieldName: string, value: string) => {
    if (selectedProject && value.trim()) {
      saveFieldSuggestion(fieldName, selectedProject.id, value);
    }
  };

  if (!selectedProject) {
    return null;
  }

  if (isLoadingFields) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="inline-flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-blue-700">Loading custom fields...</span>
          </div>
        </div>
      </div>
    );
  }

  if (customFields.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="text-center py-4">
          <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600 text-sm">No custom fields are configured for this project.</p>
          <p className="text-gray-500 text-xs mt-1">Documents will be uploaded with basic metadata only.</p>
        </div>
      </div>
    );
  }

  const requiredFields = customFields.filter(field => field.isRequired);
  const optionalFields = customFields.filter(field => !field.isRequired);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h3 className="text-lg font-medium text-blue-900 mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Document Index Fields
      </h3>
      <p className="text-sm text-blue-700 mb-6">
        Fill in the custom fields to index your documents for easy searching and organization.
      </p>

      <div className="space-y-4">
        {/* Required Fields */}
        {requiredFields.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-red-700 mb-3 flex items-center">
              <span className="text-red-500 mr-1">*</span>
              Required Fields
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requiredFields.map((field) => (
                <div key={field.id}>
                  <label htmlFor={`field-${field.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                    {field.name}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  {renderFieldInput(field, fieldValues[field.name] || '', handleFieldChange, handleFieldBlur, disabled)}
                  {field.description && (
                    <p className="mt-1 text-xs text-gray-500">{field.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Optional Fields */}
        {optionalFields.length > 0 && (
          <div>
            {requiredFields.length > 0 && <div className="border-t border-blue-200 my-4"></div>}
            <h4 className="text-sm font-semibold text-blue-700 mb-3">Optional Fields</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {optionalFields.map((field) => (
                <div key={field.id}>
                  <label htmlFor={`field-${field.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                    {field.name}
                  </label>
                  {renderFieldInput(field, fieldValues[field.name] || '', handleFieldChange, handleFieldBlur, disabled)}
                  {field.description && (
                    <p className="mt-1 text-xs text-gray-500">{field.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  function renderFieldInput(
    field: CustomField,
    value: string,
    onChange: (fieldName: string, value: string) => void,
    onBlur: (fieldName: string, value: string) => void,
    disabled: boolean
  ) {
    const commonProps = {
      id: `field-${field.id}`,
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
        onChange(field.name, e.target.value),
      onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
        onBlur(field.name, e.target.value),
      disabled,
      className: `w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
        disabled ? 'bg-gray-100 text-gray-500' : 'bg-white'
      }`,
      placeholder: field.defaultValue || `Enter ${field.name.toLowerCase()}...`
    };

    switch (field.fieldType) {
      case 'LongText':
        return (
          <textarea
            {...commonProps}
            rows={3}
            className={`${commonProps.className} resize-vertical`}
          />
        );

      case 'Number':
        return (
          <input
            {...commonProps}
            type="number"
            step="any"
          />
        );

      case 'Currency':
        return (
          <input
            {...commonProps}
            type="number"
            step="0.01"
            placeholder={field.defaultValue || `Enter ${field.name.toLowerCase()}...`}
          />
        );

      case 'Date':
        return (
          <input
            {...commonProps}
            type="date"
          />
        );

      case 'Boolean':
        return (
          <select {...commonProps}>
            <option value="">Select...</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );

      case 'UserList':
        if (field.userListOptions) {
          const options = field.userListOptions.split(',').map(opt => opt.trim());
          return (
            <select {...commonProps}>
              <option value="">Select...</option>
              {options.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
          );
        }
        // If no options, use text input like default case
        return (
          <>
            <input
              {...commonProps}
              type="text"
              list={`suggestions-${field.id}`}
            />
            <datalist id={`suggestions-${field.id}`}>
              {(fieldSuggestions[field.name] || []).map((suggestion, index) => (
                <option key={index} value={suggestion} />
              ))}
            </datalist>
          </>
        );

      default: // Text
        return (
          <>
            <input
              {...commonProps}
              type="text"
              list={`suggestions-${field.id}`}
            />
            <datalist id={`suggestions-${field.id}`}>
              {(fieldSuggestions[field.name] || []).map((suggestion, index) => (
                <option key={index} value={suggestion} />
              ))}
            </datalist>
          </>
        );
    }
  }
};

export default DocumentUploadForm;