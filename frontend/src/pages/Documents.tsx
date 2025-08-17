import React, { useEffect, useState, useCallback } from 'react';
import type { Document } from '../types/api';
import { documentService } from '../services/documents';
import config from '../utils/config';
import Header from '../components/Header';

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  jobId?: string;
  error?: string;
}

const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [supportedFormats, setSupportedFormats] = useState<string[]>(
    config.get('supportedFileTypes')
  );

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
    // Add to upload progress
    setUploadProgress(prev => [...prev, {
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    }]);

    try {
      // Use the document service for upload
      const response = await documentService.uploadFile(file, (progress) => {
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
      setUploadProgress(prev =>
        prev.map(item =>
          item.fileName === file.name
            ? { ...item, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
            : item
        )
      );
    }
  }, [pollJobStatus]);

  const validateFile = useCallback((file: File): string | null => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!config.isSupportedFileType(fileExtension)) {
      return `File type ${fileExtension} is not supported. Supported formats: ${supportedFormats.join(', ')}`;
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

    // Start uploads
    validFiles.forEach(file => uploadFile(file));
  }, [validateFile, uploadFile]);

  useEffect(() => {
    fetchDocuments();
    loadSupportedFormats();
  }, [fetchDocuments]);

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

  const filteredDocuments = documents.filter(doc =>
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

  if (isLoading) {
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
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-blue-900">Documents</h1>
            <p className="mt-2 text-gray-600">
              Upload, process, and manage your document files.
            </p>
          </div>

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

          {/* File Upload Section */}
          <div className="mb-8">
            <div
              className={`relative border-2 border-dashed p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-blue-300 hover:border-blue-500 bg-blue-25'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                multiple
                accept={supportedFormats.join(',')}
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              <div className="space-y-4">
                <svg className="mx-auto h-12 w-12 text-blue-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                
                <div>
                  <p className="text-lg font-medium text-blue-900">
                    Drop files here or click to browse
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Supported formats: {supportedFormats.join(', ')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum file size: {config.getFormattedMaxFileSize()}
                  </p>
                </div>
                
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-sm font-medium transition-colors shadow-md">
                  Select Files
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
      </main>
    </div>
  );
};

export default Documents;