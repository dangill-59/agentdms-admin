import React from 'react';
import type { Annotation } from './AnnotationCanvas';

interface DocumentThumbnailPaneProps {
  isVisible: boolean;
  thumbnailUrl: string;
  previewUrl: string;
  fileName: string;
  annotations: Annotation[];
  onPageSelect?: (pageNumber: number) => void;
  currentPage?: number;
}

const DocumentThumbnailPane: React.FC<DocumentThumbnailPaneProps> = ({
  isVisible,
  thumbnailUrl,
  previewUrl,
  fileName,
  annotations,
  onPageSelect,
  currentPage = 1
}) => {
  if (!isVisible) return null;

  const hasAnnotations = annotations.length > 0;

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-700 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-sm font-medium">Pages</h3>
          {hasAnnotations && (
            <div className="flex items-center text-xs text-yellow-400">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        <div className="space-y-2">
          {/* Single page for now - this can be extended for multi-page documents */}
          <div 
            className={`relative bg-gray-800 p-2 rounded border cursor-pointer transition-all ${
              currentPage === 1 
                ? 'border-blue-500 bg-gray-700' 
                : 'border-gray-600 hover:border-gray-500'
            }`}
            onClick={() => onPageSelect?.(1)}
          >
            <div className="relative">
              <img
                src={thumbnailUrl || previewUrl}
                alt="Page 1"
                className="w-full h-auto rounded"
                onError={(e) => {
                  // Fallback to preview URL if thumbnail fails
                  const target = e.target as HTMLImageElement;
                  if (target.src !== previewUrl) {
                    target.src = previewUrl;
                  }
                }}
              />
              
              {/* Annotation indicators */}
              {hasAnnotations && (
                <div className="absolute top-1 right-1 flex flex-wrap gap-1">
                  {/* Show different colored dots for different annotation types */}
                  {annotations.some(a => a.type === 'pen') && (
                    <div 
                      className="w-2 h-2 rounded-full bg-red-500"
                      title="Drawing annotations"
                    />
                  )}
                  {annotations.some(a => a.type === 'text') && (
                    <div 
                      className="w-2 h-2 rounded-full bg-blue-500"
                      title="Text annotations"
                    />
                  )}
                  {annotations.some(a => a.type === 'highlight') && (
                    <div 
                      className="w-2 h-2 rounded-full bg-yellow-500"
                      title="Highlight annotations"
                    />
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <p className="text-gray-300 text-xs">Page 1</p>
              {hasAnnotations && (
                <div className="text-xs text-gray-400">
                  {annotations.length}
                </div>
              )}
            </div>
          </div>

          {/* Placeholder for additional pages */}
          <div className="text-center py-4 text-gray-500 text-xs">
            <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>Multi-page support coming soon</p>
          </div>
        </div>

        {/* Document Info */}
        <div className="mt-6 pt-4 border-t border-gray-700">
          <h4 className="text-white text-xs font-medium mb-2">Document Info</h4>
          <div className="space-y-1 text-xs text-gray-400">
            <p className="truncate" title={fileName}>{fileName}</p>
            {annotations.length > 0 && (
              <p>{annotations.length} annotation{annotations.length !== 1 ? 's' : ''}</p>
            )}
          </div>
        </div>

        {/* Annotation Summary */}
        {hasAnnotations && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h4 className="text-white text-xs font-medium mb-2">Annotations</h4>
            <div className="space-y-1 text-xs">
              {annotations.map((annotation, index) => (
                <div key={annotation.id} className="flex items-center space-x-2 p-1 rounded bg-gray-800">
                  <div className={`w-2 h-2 rounded-full ${
                    annotation.type === 'pen' ? 'bg-red-500' :
                    annotation.type === 'text' ? 'bg-blue-500' :
                    'bg-yellow-500'
                  }`} />
                  <span className="text-gray-300 flex-1 truncate">
                    {annotation.type === 'text' && annotation.data.text 
                      ? annotation.data.text 
                      : `${annotation.type} annotation ${index + 1}`
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentThumbnailPane;