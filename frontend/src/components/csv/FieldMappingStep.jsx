import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

// System field definitions based on batch type
const SYSTEM_FIELDS = {
  Company: [
    { key: 'companyName', label: 'Company Name', required: true },
    { key: 'industry', label: 'Industry', required: false },
    { key: 'website', label: 'Website', required: false },
    { key: 'employeeCount', label: 'Employee Count', required: false },
    { key: 'annualRevenue', label: 'Annual Revenue', required: false },
    { key: 'country', label: 'Country', required: false },
    { key: 'state', label: 'State/Province', required: false },
    { key: 'city', label: 'City', required: false },
    { key: 'size', label: 'Size', required: false },
    { key: 'revenue', label: 'Revenue', required: false },
    { key: 'founded', label: 'Founded', required: false }
  ],
  People: [
    { key: 'firstName', label: 'First Name', required: true },
    { key: 'lastName', label: 'Last Name', required: true },
    { key: 'email', label: 'Email', required: false },
    { key: 'phone', label: 'Phone', required: false },
    { key: 'title', label: 'Title', required: false },
    { key: 'company', label: 'Company', required: false },
    { key: 'location', label: 'Location', required: false },
    { key: 'industry', label: 'Industry', required: false }
  ]
};

export function FieldMappingStep({ csvData, onComplete, onBack }) {
  const [fieldMappings, setFieldMappings] = useState(csvData.fieldMappings || {});
  const [errors, setErrors] = useState({});

  const systemFields = SYSTEM_FIELDS[csvData.batchType];
  const availableCsvColumns = csvData.columnHeaders;

  // Auto-map fields based on similarity
  useEffect(() => {
    const autoMappings = {};
    
    systemFields.forEach(systemField => {
      // Find best matching CSV column
      const matchingColumn = availableCsvColumns.find(csvCol => {
        const csvColLower = csvCol.toLowerCase().replace(/[^a-z0-9]/g, '');
        const systemFieldLower = systemField.key.toLowerCase().replace(/[^a-z0-9]/g, '');
        const labelLower = systemField.label.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        return csvColLower === systemFieldLower || 
               csvColLower === labelLower ||
               csvColLower.includes(systemFieldLower) ||
               systemFieldLower.includes(csvColLower);
      });
      
      if (matchingColumn) {
        autoMappings[systemField.key] = matchingColumn;
      }
    });
    
    setFieldMappings(prev => ({ ...autoMappings, ...prev }));
  }, [csvData.columnHeaders, csvData.batchType]);

  const handleMappingChange = (systemFieldKey, csvColumn) => {
    setFieldMappings(prev => ({
      ...prev,
      [systemFieldKey]: csvColumn === '-- Not Mapped --' ? '' : csvColumn
    }));
    
    // Clear error for this field
    if (errors[systemFieldKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[systemFieldKey];
        return newErrors;
      });
    }
  };

  const validateMappings = () => {
    const newErrors = {};
    
    // Check required fields
    systemFields.forEach(field => {
      if (field.required && !fieldMappings[field.key]) {
        newErrors[field.key] = `${field.label} is required`;
      }
    });
    
    // Check for duplicate mappings
    const usedColumns = Object.values(fieldMappings).filter(col => col);
    const duplicateColumns = usedColumns.filter((col, index) => usedColumns.indexOf(col) !== index);
    
    if (duplicateColumns.length > 0) {
      systemFields.forEach(field => {
        if (duplicateColumns.includes(fieldMappings[field.key])) {
          newErrors[field.key] = 'This column is mapped to multiple fields';
        }
      });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateMappings()) {
      onComplete({ fieldMappings });
    }
  };

  const getUsedColumns = () => {
    return Object.values(fieldMappings).filter(col => col);
  };

  const isColumnUsed = (column) => {
    return getUsedColumns().includes(column);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-6 border-b">
        <h2 className="text-lg font-semibold mb-2">Map Fields</h2>
        <p className="text-gray-600">
          Map your CSV columns to our system fields. Required fields are marked with an asterisk (*).
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-3">SYSTEM FIELD</h3>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-3">CSV COLUMN</h3>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          {systemFields.map(field => (
            <div key={field.key} className="grid grid-cols-2 gap-6 items-start">
              <div className="flex items-center">
                <Label className="text-sm">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
              </div>
              
              <div className="space-y-1">
                <select
                  value={fieldMappings[field.key] || ''}
                  onChange={(e) => handleMappingChange(field.key, e.target.value)}
                  className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${
                    errors[field.key] ? 'border-red-500' : ''
                  }`}
                >
                  <option value="">-- Not Mapped --</option>
                  {availableCsvColumns.map(column => (
                    <option
                      key={column}
                      value={column}
                      disabled={isColumnUsed(column) && fieldMappings[field.key] !== column}
                    >
                      {column}
                      {isColumnUsed(column) && fieldMappings[field.key] !== column && ' (already used)'}
                    </option>
                  ))}
                </select>
                
                {errors[field.key] && (
                  <p className="text-sm text-red-600">{errors[field.key]}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CSV Columns Preview */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Available CSV Columns:</h4>
          <div className="flex flex-wrap gap-2">
            {availableCsvColumns.map(column => (
              <span
                key={column}
                className={`
                  px-2 py-1 rounded text-xs
                  ${isColumnUsed(column) 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }
                `}
              >
                {column}
                {isColumnUsed(column) && <span className="ml-1">✓</span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Actions - Fixed */}
      <div className="flex-shrink-0 flex justify-between p-6 border-t bg-white">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
