import React, { useState, useCallback } from 'react';
import { documentService } from '../services/documents';
import type { UploadResponse, ProcessingResult } from '../services/documents';
import Header from '../components/Header';

interface ScanResult {
  fileName: string;
  status: 'scanning' | 'processing' | 'completed' | 'error';
  jobId?: string;
  result?: ProcessingResult;
  error?: string;
  progress: number;
}

const ScannerTest: React.FC = () => {
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const simulateTwainScan = useCallback(async () => {
    setIsScanning(true);
    
    // Create a test file that simulates what a TWAIN scanner might produce
    const canvas = document.createElement('canvas');
    canvas.width = 2550; // Typical 8.5" at 300 DPI
    canvas.height = 3300; // Typical 11" at 300 DPI
    const ctx = canvas.getContext('2d')!;
    
    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some test content that might appear as dark lines if processed incorrectly
    ctx.fillStyle = '#000000';
    ctx.font = '48px Arial';
    ctx.fillText('TWAIN Sample Image', 50, 100);
    ctx.fillText('AgentDMS Test Document', 50, 200);
    
    // Add some geometric patterns that might show the processing issue
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    
    // Draw test pattern
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo(100, 300 + i * 50);
      ctx.lineTo(canvas.width - 100, 300 + i * 50);
      ctx.stroke();
    }
    
    // Add logo-like content
    ctx.fillStyle = '#333333';
    ctx.fillRect(100, 800, 200, 100);
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.fillText('DEMO', 160, 860);
    
    // Convert to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/png');
    });
    
    const fileName = `twain-scan-${Date.now()}.png`;
    const file = new File([blob], fileName, { type: 'image/png' });
    
    // Add to scan results
    const scanResult: ScanResult = {
      fileName,
      status: 'scanning',
      progress: 0
    };
    
    setScanResults(prev => [...prev, scanResult]);
    
    try {
      // Simulate scanning progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setScanResults(prev => 
          prev.map(item => 
            item.fileName === fileName 
              ? { ...item, progress, status: progress === 100 ? 'processing' : 'scanning' }
              : item
          )
        );
      }
      
      // Upload the file
      const response: UploadResponse = await documentService.uploadFile(file, (progress) => {
        setScanResults(prev => 
          prev.map(item => 
            item.fileName === fileName 
              ? { ...item, progress }
              : item
          )
        );
      });
      
      setScanResults(prev =>
        prev.map(item =>
          item.fileName === fileName
            ? { ...item, status: 'processing', jobId: response.jobId }
            : item
        )
      );
      
      // Poll for completion
      const result = await documentService.pollJobCompletion(response.jobId);
      
      setScanResults(prev =>
        prev.map(item =>
          item.fileName === fileName
            ? { ...item, status: 'completed', result, progress: 100 }
            : item
        )
      );
      
    } catch (error) {
      setScanResults(prev =>
        prev.map(item =>
          item.fileName === fileName
            ? { 
                ...item, 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Scan failed' 
              }
            : item
        )
      );
    } finally {
      setIsScanning(false);
    }
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scanning': return 'bg-blue-500';
      case 'processing': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const previewProcessedImage = (result: ProcessingResult) => {
    if (result.processedImage?.convertedPngPath) {
      // Create a URL to preview the processed image
      const previewUrl = `${documentService.getDocumentPreviewUrl('temp')}?path=${encodeURIComponent(result.processedImage.convertedPngPath)}`;
      window.open(previewUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">TWAIN Scanner Test</h1>
            <p className="mt-2 text-gray-600">
              Test TWAIN scanner integration and image processing. This simulates scanning documents 
              and helps identify processing issues like dark lines appearing instead of proper content.
            </p>
          </div>

          {/* Scan Controls */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Scanner Simulation</h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={simulateTwainScan}
                disabled={isScanning}
                className={`px-6 py-3 rounded-md font-medium ${
                  isScanning
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isScanning ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Scanning...
                  </div>
                ) : (
                  'Simulate TWAIN Scan'
                )}
              </button>
              <div className="text-sm text-gray-500">
                Creates a test document with content that may reveal processing issues
              </div>
            </div>
          </div>

          {/* Scan Results */}
          {scanResults.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Scan Results</h2>
              <div className="space-y-4">
                {scanResults.map((scan, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-gray-900">{scan.fileName}</div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${getStatusColor(scan.status)}`}></span>
                        <span className="text-xs text-gray-500 capitalize">{scan.status}</span>
                      </div>
                    </div>
                    
                    {scan.status === 'scanning' || scan.status === 'processing' ? (
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${getStatusColor(scan.status)}`}
                          style={{ width: `${scan.progress}%` }}
                        ></div>
                      </div>
                    ) : null}
                    
                    {scan.status === 'error' ? (
                      <div className="text-red-600 text-sm">{scan.error}</div>
                    ) : scan.status === 'completed' && scan.result ? (
                      <div className="space-y-2">
                        <div className="text-green-600 text-sm flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Processing completed successfully
                        </div>
                        
                        {scan.result.processedImage && (
                          <div className="bg-gray-50 p-3 rounded text-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div><strong>Original Format:</strong> {scan.result.processedImage.originalFormat}</div>
                              <div><strong>File Size:</strong> {(scan.result.processedImage.fileSize / 1024).toFixed(1)} KB</div>
                              <div><strong>Dimensions:</strong> {scan.result.processedImage.width} × {scan.result.processedImage.height}</div>
                              <div><strong>MIME Type:</strong> {scan.result.processedImage.mimeType}</div>
                            </div>
                            
                            {scan.result.processedImage.convertedPngPath && (
                              <button
                                onClick={() => previewProcessedImage(scan.result!)}
                                className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Preview Processed Image
                              </button>
                            )}
                            
                            <div className="mt-2 text-xs text-gray-500">
                              <strong>Processing Time:</strong> {scan.result.processingTime || 'N/A'}
                            </div>
                            
                            {/* Diagnostic Information */}
                            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                              <div className="text-xs text-yellow-800">
                                <strong>TWAIN Processing Notes:</strong><br/>
                                • Check if the processed image shows the expected content or just dark lines<br/>
                                • Compare with direct TWAIN simulator output<br/>
                                • Look for proper text and geometric pattern rendering
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ScannerTest;