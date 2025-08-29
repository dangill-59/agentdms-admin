import React, { useState, useEffect } from 'react';
import type { DocumentSearchResult, DocumentMetadata, DocumentCustomFieldValue, CustomField } from '../types/api';
import { documentService } from '../services/documents';

interface DocumentViewerProps {
  document: DocumentSearchResult;
  onBack: () => void;
  onSave?: (metadata: DocumentMetadata) => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  onBack,
  onSave
}) => {
  const [metadata, setMetadata] = useState<DocumentMetadata | null>(null);
  const [projectFields, setProjectFields] = useState<CustomField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedMetadata, setEditedMetadata] = useState<DocumentMetadata | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        // Fetch both document metadata and project custom fields in parallel
        const [docMetadata, customFields] = await Promise.all([
          documentService.getDocumentMetadata(document.id),
          documentService.getProjectCustomFields(document.projectId)
        ]);
        
        setMetadata(docMetadata);
        setProjectFields(customFields);
        setEditedMetadata(docMetadata);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load document data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [document.id, document.projectId]);

  // Universal document viewer support for all image and document formats
  const isPreviewableDocument = (mimeType: string | null, fileName: string): boolean => {
    if (!mimeType && !fileName) return false;
    
    // Define supported MIME types for universal viewer
    const supportedMimeTypes = [
      // Image formats
      'image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/x-ms-bmp',
      'image/gif', 'image/tiff', 'image/tif', 'image/webp', 'image/svg+xml',
      // PDF documents
      'application/pdf',
      // Text formats that browsers can display
      'text/plain', 'text/html', 'text/css', 'text/javascript', 'text/csv',
      // Additional document formats
      'application/json', 'application/xml', 'text/xml'
    ];
    
    // Check MIME type first
    if (mimeType && supportedMimeTypes.includes(mimeType.toLowerCase())) {
      return true;
    }
    
    // Fallback to file extension if MIME type is not available or recognized
    const fileExtension = fileName.toLowerCase().split('.').pop();
    const supportedExtensions = [
      'jpg', 'jpeg', 'png', 'bmp', 'gif', 'tif', 'tiff', 'webp', 'svg',
      'pdf', 'txt', 'html', 'css', 'js', 'json', 'xml', 'csv'
    ];
    
    return fileExtension ? supportedExtensions.includes(fileExtension) : false;
  };

  // Load preview for all supported document types with authentication
  useEffect(() => {
    let previewBlobUrl = '';
    
    const loadPreview = async () => {
      if (isPreviewableDocument(document.mimeType, document.fileName)) {
        try {
          setIsLoadingPreview(true);
          const url = await documentService.getDocumentPreview(document.id);
          previewBlobUrl = url;
          setPreviewUrl(url);
        } catch (err) {
          console.error('Failed to load document preview:', err);
          // Don't set error state here, just let the fallback handle it
        } finally {
          setIsLoadingPreview(false);
        }
      } else {
        setIsLoadingPreview(false);
      }
    };

    loadPreview();

    // Cleanup blob URL on unmount
    return () => {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
      }
    };
  }, [document.id, document.mimeType, document.fileName]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedMetadata(metadata);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedMetadata(metadata);
  };

  const handleSave = async () => {
    if (!editedMetadata) return;

    try {
      setIsSaving(true);
      setError('');
      const updatedMetadata = await documentService.updateDocumentMetadata(document.id, editedMetadata);
      setMetadata(updatedMetadata);
      setIsEditing(false);
      if (onSave) {
        onSave(updatedMetadata);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save document metadata');
    } finally {
      setIsSaving(false);
    }
  };

  // Legacy metadata change handler - keeping for potential future backward compatibility
  // const handleMetadataChange = (key: keyof DocumentMetadata, value: string) => {
  //   if (!editedMetadata) return;
  //   setEditedMetadata({
  //     ...editedMetadata,
  //     [key]: value
  //   });
  // };

  const handleCustomFieldChange = (fieldId: string, value: string) => {
    if (!editedMetadata || !editedMetadata.customFields) return;
    
    // Find the field to get its name
    const field = editedMetadata.customFields.find(f => f.fieldId === fieldId);
    if (!field) return;
    
    setEditedMetadata({
      ...editedMetadata,
      customFields: editedMetadata.customFields.map(field =>
        field.fieldId === fieldId ? { ...field, value } : field
      ),
      // Also update customFieldValues for backend compatibility
      customFieldValues: {
        ...editedMetadata.customFieldValues,
        [field.fieldName]: value
      }
    });
  };

  const handleDownload = async () => {
    try {
      const blob = await documentService.downloadDocument(document.id);
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.fileName;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download document');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Legacy status badge color function - keeping for potential future use
  // const getStatusBadgeColor = (status: string): string => {
  //   switch (status.toLowerCase()) {
  //     case 'draft':
  //       return 'bg-gray-100 text-gray-800';
  //     case 'pending review':
  //       return 'bg-yellow-100 text-yellow-800';
  //     case 'processed':
  //       return 'bg-green-100 text-green-800';
  //     case 'approved':
  //       return 'bg-blue-100 text-blue-800';
  //     case 'rejected':
  //       return 'bg-red-100 text-red-800';
  //     default:
  //       return 'bg-gray-100 text-gray-800';
  //   }
  // };

  const renderCustomField = (field: DocumentCustomFieldValue, isEditing: boolean) => {
    const fieldValue = field.value || '';

    if (isEditing) {
      switch (field.fieldType) {
        case 'Text':
        case 'Number':
          return (
            <input
              type={field.fieldType === 'Number' ? 'number' : 'text'}
              value={fieldValue}
              onChange={(e) => handleCustomFieldChange(field.fieldId, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required={field.isRequired}
            />
          );

        case 'Date':
          return (
            <input
              type="date"
              value={fieldValue}
              onChange={(e) => handleCustomFieldChange(field.fieldId, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required={field.isRequired}
            />
          );

        case 'Boolean':
          return (
            <select
              value={fieldValue}
              onChange={(e) => handleCustomFieldChange(field.fieldId, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required={field.isRequired}
            >
              <option value="">Select...</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          );

        case 'UserList': {
          const options = field.userListOptions?.split(',') || [];
          return (
            <select
              value={fieldValue}
              onChange={(e) => handleCustomFieldChange(field.fieldId, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required={field.isRequired}
            >
              <option value="">Select...</option>
              {options.map(option => (
                <option key={option} value={option.trim()}>{option.trim()}</option>
              ))}
            </select>
          );
        }

        case 'LongText':
          return (
            <textarea
              value={fieldValue}
              onChange={(e) => handleCustomFieldChange(field.fieldId, e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required={field.isRequired}
            />
          );

        case 'Currency':
          return (
            <input
              type="number"
              step="0.01"
              value={fieldValue}
              onChange={(e) => handleCustomFieldChange(field.fieldId, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required={field.isRequired}
            />
          );

        default:
          return (
            <input
              type="text"
              value={fieldValue}
              onChange={(e) => handleCustomFieldChange(field.fieldId, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required={field.isRequired}
            />
          );
      }
    } else {
      // Display mode
      let displayValue = fieldValue;

      switch (field.fieldType) {
        case 'Date':
          if (fieldValue) {
            displayValue = new Date(fieldValue).toLocaleDateString();
          }
          break;
        case 'Boolean':
          displayValue = fieldValue === 'true' ? 'Yes' : fieldValue === 'false' ? 'No' : '';
          break;
        case 'Currency':
          if (fieldValue) {
            displayValue = `$${parseFloat(fieldValue).toFixed(2)}`;
          }
          break;
      }

      return (
        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
          {displayValue || 'Not specified'}
        </div>
      );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="inline-flex items-center text-gray-600 hover:text-gray-800"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Results
            </button>
            <div className="h-6 border-l border-gray-300"></div>
            <h2 className="text-xl font-semibold text-gray-900">Document Viewer</h2>
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <button
                onClick={handleEdit}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Details
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {isSaving && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <div className="text-red-800">{error}</div>
              <button
                onClick={() => setError('')}
                className="text-red-600 hover:text-red-800 text-sm font-medium mt-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Document Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Document Preview</h3>
            
            {/* File Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{document.fileName}</div>
                  <div className="text-sm text-gray-500">
                    {formatFileSize(document.fileSize)} • {document.mimeType}
                  </div>
                </div>
              </div>
            </div>

            {/* Document Preview */}
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
              {isPreviewableDocument(document.mimeType, document.fileName) ? (
                <div className="relative">
                  {isLoadingPreview ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                      <svg className="mx-auto h-16 w-16 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <div className="mt-4">
                        <p className="text-lg font-medium text-gray-900">Loading Preview...</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Please wait while we load the document preview
                        </p>
                      </div>
                    </div>
                  ) : previewUrl ? (
                    document.mimeType === 'application/pdf' ? (
                      <iframe
                        src={previewUrl}
                        title={document.fileName}
                        className="w-full h-96 border-0"
                        onError={(e) => {
                          console.log('PDF iframe failed to load:', e);
                          const target = e.target as HTMLIFrameElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) {
                            fallback.classList.remove('hidden');
                          }
                        }}
                        onLoad={() => {
                          console.log('PDF loaded successfully in iframe');
                        }}
                      />
                    ) : document.mimeType?.startsWith('text/') || 
                         document.mimeType === 'application/json' || 
                         document.mimeType === 'application/xml' ||
                         document.mimeType === 'text/xml' ? (
                      <iframe
                        src={previewUrl}
                        title={document.fileName}
                        className="w-full h-96 border-0 bg-white"
                        style={{ fontFamily: 'monospace' }}
                        onError={(e) => {
                          console.log('Text document iframe failed to load:', e);
                          const target = e.target as HTMLIFrameElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) {
                            fallback.classList.remove('hidden');
                          }
                        }}
                        onLoad={() => {
                          console.log('Text document loaded successfully in iframe');
                        }}
                      />
                    ) : (
                      <img
                        src={previewUrl}
                        alt={document.fileName}
                        className="w-full h-auto max-h-96 object-contain"
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          console.log('Image failed to load:', e);
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) {
                            fallback.classList.remove('hidden');
                          }
                        }}
                        onLoad={(e) => {
                          // Log successful load for debugging
                          const target = e.target as HTMLImageElement;
                          console.log('Image loaded successfully:', {
                            src: target.src,
                            naturalWidth: target.naturalWidth,
                            naturalHeight: target.naturalHeight
                          });
                        }}
                      />
                    )
                  ) : null}
                  <div className="hidden border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                    <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="mt-4">
                      <p className="text-lg font-medium text-gray-900">Preview Unavailable</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Failed to load document preview
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                  <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="mt-4">
                    <p className="text-lg font-medium text-gray-900">Universal Document Viewer</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Preview not available for this file type
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      File type: {document.mimeType || 'Unknown'} 
                      {document.fileName && ` • ${document.fileName.split('.').pop()?.toUpperCase()}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Use the download button to view this document
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Download Actions */}
            <div className="flex space-x-3">
              <button 
                onClick={handleDownload}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
              <button className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
            </div>
          </div>

          {/* Document Metadata */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Document Details</h3>

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : metadata && editedMetadata ? (
              <div className="space-y-4">
                {/* Always prefer custom fields when available */}
                {metadata.customFields && metadata.customFields.length > 0 ? (
                  metadata.customFields
                    .sort((a, b) => (projectFields.find(f => f.id === a.fieldId)?.order || 0) - (projectFields.find(f => f.id === b.fieldId)?.order || 0))
                    .map((field) => (
                      <div key={field.fieldId}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {field.fieldName}
                          {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {renderCustomField(
                          editedMetadata.customFields?.find(f => f.fieldId === field.fieldId) || field,
                          isEditing
                        )}
                      </div>
                    ))
                ) : (
                  // Fallback to legacy hardcoded fields only if no custom fields exist
                  <div className="text-center py-8 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-yellow-800">
                      <p className="font-medium">No custom fields configured</p>
                      <p className="text-sm mt-1">This project has no custom index fields defined. Please configure custom fields in the project settings to enable document indexing.</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Failed to load document metadata</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;