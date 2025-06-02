import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload, Database } from 'lucide-react';
import { FileUploadStep } from './FileUploadStep';
import { FieldMappingStep } from './FieldMappingStep';
import { ReviewStep } from './ReviewStep';
import { CompletionStep } from './CompletionStep';

const STEPS = [
  { id: 'upload', label: 'Upload File', number: 1 },
  { id: 'mapping', label: 'Map Fields', number: 2 },
  { id: 'review', label: 'Review', number: 3 },
  { id: 'complete', label: 'Complete', number: 4 }
];

export function ImportBatchModal({ isOpen, onClose, onSuccess }) {
  const [currentStep, setCurrentStep] = useState('method');
  const [csvData, setCsvData] = useState({
    batchName: '',
    batchType: 'Company',
    columnHeaders: [],
    preview: [],
    fieldMappings: {},
    totalRecords: 0,
    file: null
  });
  const [isLoading, setIsLoading] = useState(false);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    setCurrentStep('method');
    setCsvData({
      batchName: '',
      batchType: 'Company',
      columnHeaders: [],
      preview: [],
      fieldMappings: {},
      totalRecords: 0,
      file: null
    });
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleStepComplete = (stepData) => {
    setCsvData(prev => ({ ...prev, ...stepData }));
    
    switch (currentStep) {
      case 'method':
        setCurrentStep('upload');
        break;
      case 'upload':
        setCurrentStep('mapping');
        break;
      case 'mapping':
        setCurrentStep('review');
        break;
      case 'review':
        setCurrentStep('complete');
        break;
      case 'complete':
        onSuccess();
        handleClose();
        break;
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'upload':
        setCurrentStep('method');
        break;
      case 'mapping':
        setCurrentStep('upload');
        break;
      case 'review':
        setCurrentStep('mapping');
        break;
      case 'complete':
        setCurrentStep('review');
        break;
    }
  };

  const getCurrentStepNumber = () => {
    const step = STEPS.find(s => s.id === currentStep);
    return step?.number || 0;
  };

  const getProgressPercentage = () => {
    const stepNumber = getCurrentStepNumber();
    return stepNumber > 0 ? (stepNumber / STEPS.length) * 100 : 0;
  };

  const renderMethodSelection = () => (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6 text-center">Select Import Method</h2>
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        <button
          onClick={() => handleStepComplete({})}
          className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
        >
          <Upload className="h-12 w-12 mx-auto mb-3 text-gray-400 group-hover:text-blue-500" />
          <h3 className="font-medium text-gray-900 mb-2">CSV File</h3>
          <p className="text-sm text-gray-600">Upload data from a CSV spreadsheet</p>
        </button>
        
        <button
          disabled
          className="p-6 border-2 border-gray-200 rounded-lg opacity-50 cursor-not-allowed"
        >
          <Database className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <h3 className="font-medium text-gray-900 mb-2">Integrations</h3>
          <p className="text-sm text-gray-600">Import from connected data sources</p>
        </button>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'method':
        return renderMethodSelection();
      case 'upload':
        return (
          <FileUploadStep
            csvData={csvData}
            onComplete={handleStepComplete}
            onBack={handleBack}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        );
      case 'mapping':
        return (
          <FieldMappingStep
            csvData={csvData}
            onComplete={handleStepComplete}
            onBack={handleBack}
          />
        );
      case 'review':
        return (
          <ReviewStep
            csvData={csvData}
            onComplete={handleStepComplete}
            onBack={handleBack}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        );
      case 'complete':
        return (
          <CompletionStep
            csvData={csvData}
            onComplete={handleStepComplete}
            onClose={handleClose}
          />
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={handleOverlayClick}
    >
      <div 
        className="w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Fixed Header */}
          <div className="flex-shrink-0 border-b p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold">Import Batch</h1>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Fixed Progress Steps */}
          {currentStep !== 'method' && (
            <div className="flex-shrink-0 border-b p-6">
              <div className="flex items-center justify-between mb-4">
                {STEPS.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className={`
                      flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                      ${step.number <= getCurrentStepNumber() 
                        ? 'bg-green-500 text-white' 
                        : step.number === getCurrentStepNumber() + 1
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                      }
                    `}>
                      {step.number <= getCurrentStepNumber() ? '✓' : step.number}
                    </div>
                    {index < STEPS.length - 1 && (
                      <div className={`
                        w-16 h-0.5 mx-2
                        ${step.number < getCurrentStepNumber() ? 'bg-green-500' : 'bg-gray-200'}
                      `} />
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between text-sm">
                {STEPS.map(step => (
                  <span
                    key={step.id}
                    className={`
                      ${step.number <= getCurrentStepNumber() ? 'text-green-600 font-medium' : 'text-gray-500'}
                    `}
                  >
                    {step.label}
                  </span>
                ))}
              </div>
              
              <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {renderStepContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
