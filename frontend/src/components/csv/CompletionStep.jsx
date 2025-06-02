import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export function CompletionStep({ csvData, onComplete, onClose }) {
  
  const handleBackToList = () => {
    onClose();
  };

  const handleImportAnother = () => {
    onComplete();
  };

  return (
    <div className="p-6">
      <div className="text-center py-8">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Batch Import Successful
        </h2>
        
        <p className="text-gray-600 mb-8">
          Your batch "{csvData.batchName}" has been successfully imported and is now
          available in your batches list.
        </p>
        
        <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left max-w-md mx-auto">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Batch Name:</span>
              <span className="text-sm text-gray-900">{csvData.batchName}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Type:</span>
              <span className="text-sm text-gray-900">{csvData.batchType}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Records:</span>
              <span className="text-sm text-gray-900">{csvData.totalRecords}</span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={handleBackToList}>
            Back to Lists & Batches
          </Button>
          <Button onClick={handleImportAnother} className="bg-black text-white hover:bg-gray-800">
            Import Another Batch
          </Button>
        </div>
      </div>
      
      <div className="border-t pt-6">
        <div className="text-center">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
