import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { DocumentSearchResult } from '../types/api';
import { documentService } from '../services/documents';
import AnnotationCanvas, { type Annotation } from './AnnotationCanvas';
import DocumentThumbnailPane from './DocumentThumbnailPane';

interface FullScreenDocumentViewerProps {
  document: DocumentSearchResult;
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'preview' | 'fullviewer';
}

interface ViewerState {
  zoom: number;
  panX: number;
  panY: number;
  rotation: number;
  mode: 'preview' | 'fullviewer';
}

const FullScreenDocumentViewer: React.FC<FullScreenDocumentViewerProps> = ({
  document: documentData,
  isOpen,
  onClose,
  initialMode = 'preview'
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  const [viewerState, setViewerState] = useState<ViewerState>({
    zoom: 1,
    panX: 0,
    panY: 0,
    rotation: 0,
    mode: initialMode
  });

  const [showThumbnails, setShowThumbnails] = useState(true);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [annotationTool, setAnnotationTool] = useState<'pen' | 'text' | 'highlight'>('pen');

  const viewerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Load annotations from localStorage
  useEffect(() => {
    const savedAnnotations = localStorage.getItem(`annotations_${documentData.id}`);
    if (savedAnnotations) {
      setAnnotations(JSON.parse(savedAnnotations));
    }
  }, [documentData.id]);

  // Save annotations to localStorage
  const saveAnnotations = useCallback((newAnnotations: Annotation[]) => {
    localStorage.setItem(`annotations_${documentData.id}`, JSON.stringify(newAnnotations));
    setAnnotations(newAnnotations);
  }, [documentData.id]);

  const handleAnnotationAdd = useCallback((annotation: Annotation) => {
    const newAnnotations = [...annotations, annotation];
    saveAnnotations(newAnnotations);
  }, [annotations, saveAnnotations]);

  const handleAnnotationUpdate = useCallback((id: string, data: Annotation['data']) => {
    const newAnnotations = annotations.map(ann => 
      ann.id === id ? { ...ann, data } : ann
    );
    saveAnnotations(newAnnotations);
  }, [annotations, saveAnnotations]);

  const clearAnnotations = useCallback(() => {
    saveAnnotations([]);
  }, [saveAnnotations]);

  // Load document preview and thumbnail
  useEffect(() => {
    if (!isOpen) return;

    let previewBlobUrl = '';
    let thumbnailBlobUrl = '';
    
    const loadDocumentData = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        // Load both preview and thumbnail in parallel
        const [previewUrl, thumbnailUrl] = await Promise.all([
          documentService.getDocumentPreview(documentData.id),
          documentService.getDocumentThumbnail(documentData.id).catch(() => '') // Thumbnail is optional
        ]);
        
        previewBlobUrl = previewUrl;
        thumbnailBlobUrl = thumbnailUrl;
        
        setPreviewUrl(previewUrl);
        setThumbnailUrl(thumbnailUrl);
      } catch (err) {
        console.error('Failed to load document data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load document');
      } finally {
        setIsLoading(false);
      }
    };

    loadDocumentData();

    // Cleanup blob URLs on unmount
    return () => {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
      }
      if (thumbnailBlobUrl) {
        URL.revokeObjectURL(thumbnailBlobUrl);
      }
    };
  }, [documentData.id, isOpen]);

  const handleZoomIn = useCallback(() => {
    setViewerState(prev => ({
      ...prev,
      zoom: Math.min(prev.zoom * 1.2, 5)
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setViewerState(prev => ({
      ...prev,
      zoom: Math.max(prev.zoom / 1.2, 0.1)
    }));
  }, []);

  const handleResetZoom = useCallback(() => {
    setViewerState(prev => ({
      ...prev,
      zoom: 1,
      panX: 0,
      panY: 0
    }));
  }, []);

  const handleRotate = useCallback(() => {
    setViewerState(prev => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360
    }));
  }, []);

  const toggleViewerMode = useCallback(() => {
    setViewerState(prev => ({
      ...prev,
      mode: prev.mode === 'preview' ? 'fullviewer' : 'preview'
    }));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
          e.preventDefault();
          handleZoomOut();
          break;
        case '0':
          e.preventDefault();
          handleResetZoom();
          break;
        case 'r':
          e.preventDefault();
          handleRotate();
          break;
        case 't':
          e.preventDefault();
          setShowThumbnails(!showThumbnails);
          break;
        case 'v':
          e.preventDefault();
          toggleViewerMode();
          break;
      }
    };

    window.document.addEventListener('keydown', handleKeyDown);
    return () => window.document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showThumbnails, onClose, handleZoomIn, handleZoomOut, handleResetZoom, handleRotate, toggleViewerMode]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isAnnotating) return;
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startPanX = viewerState.panX;
    const startPanY = viewerState.panY;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      setViewerState(prev => ({
        ...prev,
        panX: startPanX + deltaX,
        panY: startPanY + deltaY
      }));
    };

    const handleMouseUp = () => {
      window.document.removeEventListener('mousemove', handleMouseMove);
      window.document.removeEventListener('mouseup', handleMouseUp);
    };

    window.document.addEventListener('mousemove', handleMouseMove);
    window.document.addEventListener('mouseup', handleMouseUp);
  }, [isAnnotating, viewerState.panX, viewerState.panY]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setViewerState(prev => ({
      ...prev,
      zoom: Math.max(0.1, Math.min(5, prev.zoom * delta))
    }));
  }, []);

  if (!isOpen) return null;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <svg className="mx-auto h-16 w-16 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <p className="text-white mt-4">Loading document...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <svg className="mx-auto h-16 w-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-white mt-4">{error}</p>
            <button 
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Close
            </button>
          </div>
        </div>
      );
    }

    if (viewerState.mode === 'preview') {
      // Simple preview mode - similar to current DocumentViewer but full screen
      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="max-w-4xl max-h-full bg-white rounded-lg shadow-2xl overflow-hidden">
            {documentData.mimeType === 'application/pdf' ? (
              <iframe
                src={previewUrl}
                title={documentData.fileName}
                className="w-full h-96 md:h-[600px] border-0"
              />
            ) : (
              <img
                src={previewUrl}
                alt={documentData.fileName}
                className="w-full h-auto max-h-full object-contain"
              />
            )}
          </div>
        </div>
      );
    }

    // Full viewer mode with advanced controls
    return (
      <div className="flex h-full">
        {/* Thumbnail Pane */}
        <DocumentThumbnailPane
          isVisible={showThumbnails}
          thumbnailUrl={thumbnailUrl}
          previewUrl={previewUrl}
          fileName={documentData.fileName}
          annotations={annotations}
          currentPage={1}
          onPageSelect={(page) => {
            // For single page documents, this is just for show
            console.log('Selected page:', page);
          }}
        />

        {/* Main Viewer Area */}
        <div className="flex-1 flex flex-col">
          {/* Document Display */}
          <div 
            ref={viewerRef}
            className="flex-1 overflow-hidden bg-gray-800 relative cursor-move"
            onMouseDown={handleMouseDown}
            onWheel={handleWheel}
          >
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `translate(${viewerState.panX}px, ${viewerState.panY}px)`
              }}
            >
              <div
                style={{
                  transform: `scale(${viewerState.zoom}) rotate(${viewerState.rotation}deg)`,
                  transformOrigin: 'center',
                  transition: 'transform 0.1s ease-out',
                  position: 'relative'
                }}
              >
                {documentData.mimeType === 'application/pdf' ? (
                  <iframe
                    src={previewUrl}
                    title={documentData.fileName}
                    className="w-[800px] h-[600px] bg-white shadow-lg"
                  />
                ) : (
                  <div className="relative">
                    <img
                      ref={imageRef}
                      src={previewUrl}
                      alt={documentData.fileName}
                      className="max-w-none shadow-lg"
                      style={{ maxHeight: 'none' }}
                    />
                    
                    {/* Annotation Canvas */}
                    {imageRef.current && (
                      <AnnotationCanvas
                        width={imageRef.current.naturalWidth || 800}
                        height={imageRef.current.naturalHeight || 600}
                        tool={annotationTool}
                        isActive={isAnnotating}
                        annotations={annotations}
                        onAnnotationAdd={handleAnnotationAdd}
                        onAnnotationUpdate={handleAnnotationUpdate}
                        zoom={viewerState.zoom}
                        panX={viewerState.panX}
                        panY={viewerState.panY}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95">
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          {/* Left Controls */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 p-2"
              title="Close (Esc)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="text-white">
              <h2 className="text-lg font-medium">{documentData.fileName}</h2>
              <p className="text-sm text-gray-300">
                {(documentData.fileSize / 1024).toFixed(1)} KB • {documentData.mimeType}
              </p>
            </div>
          </div>

          {/* Center Controls */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-gray-800 rounded-lg p-1">
              <button
                onClick={toggleViewerMode}
                className={`px-3 py-2 rounded text-sm font-medium transition-all ${
                  viewerState.mode === 'preview' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
                title="Switch to Preview Mode (V)"
              >
                Preview
              </button>
              <button
                onClick={toggleViewerMode}
                className={`px-3 py-2 rounded text-sm font-medium transition-all ${
                  viewerState.mode === 'fullviewer' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
                title="Switch to Full Viewer Mode (V)"
              >
                Full Viewer
              </button>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2">
            {viewerState.mode === 'fullviewer' && (
              <>
                <button
                  onClick={() => setShowThumbnails(!showThumbnails)}
                  className={`p-2 rounded ${
                    showThumbnails 
                      ? 'bg-blue-600 text-white' 
                      : 'text-white hover:bg-gray-700'
                  }`}
                  title="Toggle Thumbnails (T)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                
                <div className="flex items-center space-x-1 bg-gray-700 rounded">
                  <button
                    onClick={handleZoomOut}
                    className="p-2 text-white hover:bg-gray-600 rounded-l"
                    title="Zoom Out (-)"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="text-white text-sm px-2 min-w-[60px] text-center">
                    {Math.round(viewerState.zoom * 100)}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    className="p-2 text-white hover:bg-gray-600 rounded-r"
                    title="Zoom In (+)"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                <button
                  onClick={handleResetZoom}
                  className="p-2 text-white hover:bg-gray-700 rounded"
                  title="Reset Zoom (0)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>

                <button
                  onClick={handleRotate}
                  className="p-2 text-white hover:bg-gray-700 rounded"
                  title="Rotate (R)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>

                <button
                  onClick={() => setIsAnnotating(!isAnnotating)}
                  className={`p-2 rounded ${
                    isAnnotating 
                      ? 'bg-red-600 text-white' 
                      : 'text-white hover:bg-gray-700'
                  }`}
                  title="Toggle Annotations"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>

                {/* Annotation Tools */}
                {isAnnotating && (
                  <div className="flex items-center space-x-1 bg-gray-700 rounded">
                    <button
                      onClick={() => setAnnotationTool('pen')}
                      className={`p-2 rounded-l ${
                        annotationTool === 'pen' ? 'bg-blue-600 text-white' : 'text-white hover:bg-gray-600'
                      }`}
                      title="Pen Tool"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setAnnotationTool('text')}
                      className={`p-2 ${
                        annotationTool === 'text' ? 'bg-blue-600 text-white' : 'text-white hover:bg-gray-600'
                      }`}
                      title="Text Tool"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setAnnotationTool('highlight')}
                      className={`p-2 ${
                        annotationTool === 'highlight' ? 'bg-blue-600 text-white' : 'text-white hover:bg-gray-600'
                      }`}
                      title="Highlight Tool"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h3a1 1 0 011 1v2h4a1 1 0 011 1v3a1 1 0 01-1 1h-2v9a1 1 0 01-1 1H8a1 1 0 01-1-1V9H5a1 1 0 01-1-1V5a1 1 0 011-1h2z" />
                      </svg>
                    </button>
                    <button
                      onClick={clearAnnotations}
                      className="p-2 text-white hover:bg-red-600 rounded-r"
                      title="Clear All Annotations"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 h-full">
        {renderContent()}
      </div>

      {/* Help Text */}
      <div className="absolute bottom-4 right-4 text-white text-xs bg-black bg-opacity-50 p-2 rounded">
        <div>Esc: Close • V: Toggle Mode • T: Thumbnails</div>
        {viewerState.mode === 'fullviewer' && (
          <div>+/-: Zoom • 0: Reset • R: Rotate • Drag: Pan</div>
        )}
      </div>
    </div>,
    window.document.body
  );
};

export default FullScreenDocumentViewer;