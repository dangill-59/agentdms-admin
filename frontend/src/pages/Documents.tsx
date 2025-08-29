import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Document, DocumentSearchFilters, DocumentSearchResult, PaginatedResponse, Project, CustomField } from '../types/api';
import { documentService } from '../services/documents';
import { projectService } from '../services/projects';
import config from '../utils/config';
import Header from '../components/Header';
import DocumentSearchForm from '../components/DocumentSearchForm';
import DocumentSearchResults from '../components/DocumentSearchResults';
import DocumentViewer from '../components/DocumentViewer';

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  jobId?: string;
  error?: string;
}

type ViewMode = 'search' | 'results' | 'viewer' | 'upload';

const Documents: React.FC = () => {
  const [searchParams] = useSearchParams();
  
  // State for different views
  const [viewMode, setViewMode] = useState<ViewMode>('search');
  
  // Search functionality state
  const [searchFilters, setSearchFilters] = useState<DocumentSearchFilters>({
    customFieldFilters: {}
  });
  const [searchResults, setSearchResults] = useState<PaginatedResponse<DocumentSearchResult>>({
    data: [],
    totalCount: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentSearchResult | null>(null);
  
  // Custom fields for current project
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  // Original upload functionality state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [supportedFormats, setSupportedFormats] = useState<string[]>(
    config.get('supportedFileTypes') || []
  );

  // Project selection state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  // File configuration from config service
  const maxFileSize = config.get('maxFileSize');

  const loadSupportedFormats = async () => {
    try {
      const formats = await documentService.getSupportedFormats();
      setSupportedFormats(formats);
    } catch (error) {
      console.error('Failed to load supported formats:', error);
      // Keep default formats
    }
  };

  const loadProjects = useCallback(async () => {
    try {
      setIsLoadingProjects(true);
      const response = await projectService.getProjects(1, 50); // Get first 50 projects
      setProjects(response.data);
      
      // Check for project ID from URL parameter
      const projectIdFromUrl = searchParams.get('projectId');
      
      if (projectIdFromUrl && response.data.some(p => p.id === projectIdFromUrl)) {
        // Set the project from URL parameter if it exists in the list
        setSelectedProjectId(projectIdFromUrl);
        // Also set it in search filters for search functionality
        setSearchFilters(prev => ({ ...prev, projectId: projectIdFromUrl }));
      } else if (response.data.length > 0 && !selectedProjectId) {
        // Auto-select first project if none selected and no URL parameter
        setSelectedProjectId(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      setError('Failed to load projects. Please refresh the page.');
    } finally {
      setIsLoadingProjects(false);
    }
  }, [searchParams, selectedProjectId]);

  // Load custom fields when project changes in search filters
  useEffect(() => {
    const loadCustomFields = async () => {
      if (!searchFilters.projectId) {
        setCustomFields([]);
        return;
      }

      try {
        const fields = await projectService.getProjectCustomFields(searchFilters.projectId);
        setCustomFields(fields);
      } catch (error) {
        console.error('Failed to load custom fields:', error);
        setCustomFields([]);
      }
    };

    loadCustomFields();
  }, [searchFilters.projectId]);

  // Search functionality
  const handleSearch = async () => {
    if (!searchFilters.projectId) {
      setError('Please select a project to search in.');
      return;
    }

    try {
      setIsSearching(true);
      setError('');
      const results = await documentService.searchDocuments(searchFilters, 1, 10);
      setSearchResults(results);
      setCurrentPage(1);
      setViewMode('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search documents');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchFilters({
      customFieldFilters: {}
    });
    setSearchResults({
      data: [],
      totalCount: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0
    });
    setError('');
  };

  const handlePageChange = async (page: number) => {
    try {
      setIsSearching(true);
      const results = await documentService.searchDocuments(searchFilters, page, 10);
      setSearchResults(results);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load page');
    } finally {
      setIsSearching(false);
    }
  };

  const handleDocumentSelect = (document: DocumentSearchResult) => {
    setSelectedDocument(document);
    setViewMode('viewer');
  };

  const handleBackToResults = () => {
    setViewMode('results');
    setSelectedDocument(null);
  };

  const handleUpdateSearch = () => {
    setViewMode('search');
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setError(''); // Clear any errors when switching modes
  };

  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await documentService.getDocuments();
      setDocuments(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pollJobStatus = useCallback(async (jobId: string, fileName: string) => {
    try {
      await documentService.pollJobCompletion(jobId);
      
      setUploadProgress(prev =>
        prev.map(item =>
          item.fileName === fileName
            ? { ...item, status: 'completed', progress: 100 }
            : item
        )
      );
      
      // Refresh documents list
      fetchDocuments();
      
      // Remove from progress after a delay
      setTimeout(() => {
        setUploadProgress(prev => prev.filter(item => item.fileName !== fileName));
      }, 3000);
      
    } catch (error) {
      setUploadProgress(prev =>
        prev.map(item =>
          item.fileName === fileName
            ? { 
                ...item, 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Processing failed' 
              }
            : item
        )
      );
    }
  }, [fetchDocuments]);

  const uploadFile = useCallback(async (file: File) => {
    // Check if projects are still loading
    if (isLoadingProjects) {
      setError('Please wait for projects to load before uploading files.');
      return;
    }
    
    // Check if no projects are available
    if (projects.length === 0) {
      setError('No projects available. Please create a project first.');
      return;
    }
    
    if (!selectedProjectId) {
      setError('Please select a project before uploading files.');
      return;
    }

    // Add to upload progress
    setUploadProgress(prev => [...prev, {
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    }]);

    try {
      // Convert string ID to number for the API
      const projectIdNumber = parseInt(selectedProjectId);
      if (isNaN(projectIdNumber)) {
        throw new Error('Invalid project ID selected');
      }

      // Use the document service for upload with project ID
      const response = await documentService.uploadFile(file, projectIdNumber, (progress) => {
        setUploadProgress(prev => 
          prev.map(item => 
            item.fileName === file.name 
              ? { ...item, progress }
              : item
          )
        );
      });

      setUploadProgress(prev =>
        prev.map(item =>
          item.fileName === file.name
            ? { ...item, status: 'processing', jobId: response.jobId }
            : item
        )
      );
      
      // Start polling for job completion
      if (response.jobId) {
        pollJobStatus(response.jobId, file.name);
      }

    } catch (error) {
      console.error('Upload failed for file:', file.name, error);
      
      let errorMessage = 'Upload failed';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Add specific guidance for connection issues
        if (error.message.includes('connection') || error.message.includes('reset')) {
          errorMessage += ' This may be due to network issues. The upload will automatically retry.';
        } else if (error.message.includes('timeout')) {
          errorMessage += ' Try uploading a smaller file or check your internet connection.';
        } else if (error.message.includes('blocked')) {
          errorMessage += ' Please check your browser settings and network firewall.';
        }
      }
      
      setUploadProgress(prev =>
        prev.map(item =>
          item.fileName === file.name
            ? { ...item, status: 'error', error: errorMessage }
            : item
        )
      );
    }
  }, [pollJobStatus, selectedProjectId, projects.length, isLoadingProjects]);

  const validateFile = useCallback((file: File): string | null => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!config.isSupportedFileType(fileExtension)) {
      return `File type ${fileExtension} is not supported. Supported formats: ${(supportedFormats || []).join(', ')}`;
    }
    if (file.size > maxFileSize) {
      return `File size exceeds the maximum limit of ${config.getFormattedMaxFileSize()}`;
    }
    return null;
  }, [supportedFormats, maxFileSize]);

  const handleFiles = useCallback(async (files: File[]) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
      return;
    }

    // Check connection health before starting uploads
    console.log('Checking connection health before upload...');
    const healthCheck = await documentService.checkUploadHealth();
    if (!healthCheck) {
      console.warn('Health check failed, but proceeding with upload (may retry on failure)');
    }

    // Start uploads
    validFiles.forEach(file => uploadFile(file));
  }, [validateFile, uploadFile]);

  useEffect(() => {
    // Load projects for upload view
    if (viewMode === 'upload') {
      fetchDocuments();
      loadProjects();
    }
    loadSupportedFormats();
  }, [viewMode, fetchDocuments, loadProjects]);

  // Load projects on component mount to handle URL parameters
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

   
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, [handleFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const filteredDocuments = (documents || []).filter(doc =>
    doc.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploading': return 'bg-blue-500';
      case 'processing': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Render navigation tabs
  const renderNavigation = () => (
    <div className="mb-8">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleViewModeChange('search')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              viewMode === 'search' || viewMode === 'results' || viewMode === 'viewer'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Document Search
          </button>
          <button
            onClick={() => handleViewModeChange('upload')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              viewMode === 'upload'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Upload Documents
          </button>
        </nav>
      </div>
    </div>
  );

  if (isLoading && viewMode === 'upload') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <Header />
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <Header />
      
      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {renderNavigation()}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <div className="text-red-800 whitespace-pre-line">{error}</div>
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

        {/* Render different views based on viewMode */}
        {viewMode === 'search' && (
          <DocumentSearchForm
            filters={searchFilters}
            onFiltersChange={setSearchFilters}
            onSearch={handleSearch}
            onClear={handleClearSearch}
            isLoading={isSearching}
          />
        )}

        {viewMode === 'results' && (
          <DocumentSearchResults
            results={searchResults}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onDocumentSelect={handleDocumentSelect}
            onUpdateSearch={handleUpdateSearch}
            isLoading={isSearching}
            customFields={customFields}
          />
        )}

        {viewMode === 'viewer' && selectedDocument && (
          <DocumentViewer
            document={selectedDocument}
            onBack={handleBackToResults}
          />
        )}

        {viewMode === 'upload' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-blue-900">Upload Documents</h1>
              <p className="mt-2 text-gray-600">
                Upload, process, and manage your document files.
              </p>
            </div>

            {/* Project Selection Section */}
            <div className="mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-blue-900 mb-4">Select Target Project</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="project-select" className="block text-sm font-medium text-gray-700 mb-2">
                      Project <span className="text-red-500">*</span>
                    </label>
                    {isLoadingProjects ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-gray-600">Loading projects...</span>
                      </div>
                    ) : (
                      <select
                        id="project-select"
                        value={selectedProjectId || ''}
                        onChange={(e) => setSelectedProjectId(e.target.value || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select a project...</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name} {project.description ? `- ${project.description}` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  
                  {selectedProjectId && (
                    <div className="bg-white border border-blue-200 rounded-md p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Auto-populated Fields</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        The following fields will be automatically populated when you upload documents:
                      </p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li className="flex items-center">
                          <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <strong>Filename:</strong> Original file name
                        </li>
                        <li className="flex items-center">
                          <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <strong>Date Created:</strong> Current date
                        </li>
                        <li className="flex items-center">
                          <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <strong>Date Modified:</strong> Current date
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* File Upload Section */}
            <div className="mb-8">
              <div
                className={`relative border-2 border-dashed p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : selectedProjectId 
                      ? 'border-blue-300 hover:border-blue-500 bg-blue-25'
                      : 'border-gray-300 bg-gray-50 cursor-not-allowed'
                }`}
                onDragEnter={selectedProjectId ? handleDrag : undefined}
                onDragLeave={selectedProjectId ? handleDrag : undefined}
                onDragOver={selectedProjectId ? handleDrag : undefined}
                onDrop={selectedProjectId ? handleDrop : undefined}
              >
                <input
                  type="file"
                  multiple
                  accept={(supportedFormats || []).join(',')}
                  onChange={handleFileInput}
                  disabled={!selectedProjectId}
                  className={`absolute inset-0 w-full h-full opacity-0 ${
                    selectedProjectId ? 'cursor-pointer' : 'cursor-not-allowed'
                  }`}
                />
                
                <div className="space-y-4">
                  <svg className="mx-auto h-12 w-12 text-blue-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  
                  <div>
                    <p className={`text-lg font-medium ${selectedProjectId ? 'text-blue-900' : 'text-gray-500'}`}>
                      {selectedProjectId ? 'Drop files here or click to browse' : 'Select a project first'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Supported formats: {(supportedFormats || []).join(', ')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum file size: {config.getFormattedMaxFileSize()}
                    </p>
                  </div>
                  
                  <button 
                    disabled={!selectedProjectId}
                    className={`px-6 py-3 text-sm font-medium transition-colors shadow-md ${
                      selectedProjectId 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    {selectedProjectId ? 'Select Files' : 'Select Project First'}
                  </button>
                </div>
              </div>
            </div>

            {/* Upload Progress */}
            {uploadProgress.length > 0 && (
              <div className="mb-8 space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Upload Progress</h3>
                {uploadProgress.map((upload, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg shadow border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-gray-900">{upload.fileName}</div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${getStatusColor(upload.status)}`}></span>
                        <span className="text-xs text-gray-500 capitalize">{upload.status}</span>
                      </div>
                    </div>
                    
                    {upload.status === 'uploading' || upload.status === 'processing' ? (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${getStatusColor(upload.status)}`}
                          style={{ width: `${upload.progress}%` }}
                        ></div>
                      </div>
                    ) : upload.status === 'error' ? (
                      <div className="text-red-600 text-sm">{upload.error}</div>
                    ) : (
                      <div className="text-green-600 text-sm flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Processing completed
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50"
                />
                <svg className="w-5 h-5 text-blue-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Documents List */}
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="text-gray-500 text-lg">No documents found</div>
                <p className="text-gray-400 mt-2">
                  Upload your first document to get started.
                </p>
              </div>
            ) : (
              <div className="bg-white shadow overflow-hidden rounded-md">
                <ul className="divide-y divide-gray-200">
                  {filteredDocuments.map((doc) => (
                    <li key={doc.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{doc.fileName}</div>
                            <div className="text-sm text-gray-500">
                              {formatFileSize(doc.fileSize)} • {doc.mimeType}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            View
                          </button>
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            Download
                          </button>
                          <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                            Delete
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Documents;