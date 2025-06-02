import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function ReviewStep({ csvData, onComplete, onBack, isLoading, setIsLoading }) {

  const handleImport = async () => {
    if (!csvData.file) return;

    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('csvFile', csvData.file);
      formData.append('batchName', csvData.batchName);
      formData.append('batchType', csvData.batchType);
      formData.append('fieldMappings', JSON.stringify(csvData.fieldMappings));

      const token = localStorage.getItem('token');
      const response = await fetch('https://jaa2.onrender.com/api/csv/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      
      onComplete({
        ...csvData,
        uploadResult: result
      });

    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import CSV: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getMappedFieldsCount = () => {
    return Object.values(csvData.fieldMappings).filter(mapping => mapping).length;
  };

  const getUnmappedColumns = () => {
    const mappedColumns = Object.values(csvData.fieldMappings).filter(mapping => mapping);
    return csvData.columnHeaders.filter(column => !mappedColumns.includes(column));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Review Import</h2>
        <p className="text-gray-600">
          Please review your batch information and field mappings before importing.
        </p>
      </div>

      {/* Batch Information */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Batch Information</h3>
          <Badge variant={csvData.batchType === 'Company' ? 'default' : 'secondary'}>
            {csvData.batchType}
          </Badge>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Batch Name</p>
              <p className="text-sm text-gray-900 break-words">{csvData.batchName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Batch Type</p>
              <p className="text-sm text-gray-900">{csvData.batchType}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">File</p>
              <p className="text-sm text-gray-900 break-words">{csvData.file?.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Records</p>
              <p className="text-sm text-gray-900">{csvData.totalRecords}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Field Mappings */}
      <div className="border rounded-lg p-4">
        <h3 className="font-medium mb-4">Field Mappings</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 pb-2 border-b font-medium text-sm text-gray-600">
            <div>SYSTEM FIELD</div>
            <div>CSV COLUMN</div>
          </div>
          
          {Object.entries(csvData.fieldMappings)
            .filter(([_, csvColumn]) => csvColumn)
            .map(([systemField, csvColumn]) => (
              <div key={systemField} className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-gray-900 break-words">
                  {systemField.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div className="text-gray-700 break-words">{csvColumn}</div>
              </div>
            ))
          }
          
          <div className="pt-3 border-t">
            <p className="text-sm text-gray-600">
              {getMappedFieldsCount()} of {csvData.columnHeaders.length} columns mapped
            </p>
            
            {getUnmappedColumns().length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-1">Unmapped columns:</p>
                <div className="flex flex-wrap gap-1">
                  {getUnmappedColumns().map(column => (
                    <Badge key={column} variant="outline" className="text-xs break-all">
                      {column}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Data Preview */}
      <div className="border rounded-lg p-4">
        <h3 className="font-medium mb-4">Data Preview</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                {csvData.columnHeaders.map(header => (
                  <th key={header} className="text-left p-2 font-medium text-gray-600 whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {csvData.preview.slice(0, 3).map((row, index) => (
                <tr key={index} className="border-b">
                  {csvData.columnHeaders.map(header => (
                    <td key={header} className="p-2 text-gray-900 whitespace-nowrap">
                      {row[header] || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {csvData.totalRecords > 3 && (
          <p className="text-sm text-gray-500 mt-3">
            ... and {csvData.totalRecords - 3} more records
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>
          Back
        </Button>
        <Button 
          onClick={handleImport} 
          disabled={isLoading}
          className="min-w-24"
        >
          {isLoading ? 'Importing...' : 'Import Batch'}
        </Button>
      </div>
    </div>
  );
}
