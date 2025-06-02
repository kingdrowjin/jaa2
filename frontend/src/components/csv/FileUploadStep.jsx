import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, X } from 'lucide-react';
import Papa from 'papaparse';

export function FileUploadStep({ csvData, onComplete, onBack, isLoading, setIsLoading }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(csvData.file || null);
  const [batchName, setBatchName] = useState(csvData.batchName || '');
  const [batchType, setBatchType] = useState(csvData.batchType || 'Company');
  const [error, setError] = useState('');

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    setError('');
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setError('Please upload a CSV file');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploadedFile(file);
    
    // Auto-set batch name from filename if not already set
    if (!batchName) {
      const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, '');
      setBatchName(nameWithoutExtension);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setError('');
  };

  const parseAndContinue = async () => {
    if (!uploadedFile || !batchName.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const fileContent = await uploadedFile.text();
      
      const parseResult = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim()
      });

      if (parseResult.errors.length > 0) {
        setError('Error parsing CSV: ' + parseResult.errors[0].message);
        setIsLoading(false);
        return;
      }

      const columnHeaders = parseResult.meta.fields || [];
      const preview = parseResult.data.slice(0, 5); // First 5 rows for preview
      const totalRecords = parseResult.data.length;

      if (columnHeaders.length === 0) {
        setError('CSV file appears to be empty or has no headers');
        setIsLoading(false);
        return;
      }

      onComplete({
        file: uploadedFile,
        batchName: batchName.trim(),
        batchType,
        columnHeaders,
        preview,
        totalRecords
      });

    } catch (error) {
      console.error('Error parsing CSV:', error);
      setError('Failed to parse CSV file. Please check the file format.');
    } finally {
      setIsLoading(false);
    }
  };

  const canContinue = uploadedFile && batchName.trim().length > 0;

  return (
    <div className="p-6 space-y-6">
      {/* Batch Configuration */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="batchName">Batch Name</Label>
          <Input
            id="batchName"
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
            placeholder="Enter batch name"
            className="mt-1"
          />
        </div>

        <div>
          <Label>Batch Type</Label>
          <div className="mt-2 space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="company"
                name="batchType"
                value="Company"
                checked={batchType === 'Company'}
                onChange={(e) => setBatchType(e.target.value)}
                className="w-4 h-4"
              />
              <Label htmlFor="company">Company</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="people"
                name="batchType"
                value="People"
                checked={batchType === 'People'}
                onChange={(e) => setBatchType(e.target.value)}
                className="w-4 h-4"
              />
              <Label htmlFor="people">People</Label>
            </div>
          </div>
        </div>
      </div>

      {/* File Upload */}
      <div>
        <Label>Upload CSV File</Label>
        <div
          className={`
            mt-2 border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
            ${uploadedFile ? 'border-green-400 bg-green-50' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {uploadedFile ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <FileText className="h-8 w-8 text-green-600" />
                <div className="text-left">
                  <p className="font-medium text-green-800">{uploadedFile.name}</p>
                  <p className="text-sm text-green-600">
                    {(uploadedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={removeFile}
                  className="p-1 hover:bg-red-100 rounded"
                >
                  <X className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-700">
                  Drag and drop your CSV file here, or click to browse
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Maximum file size: 10MB
                </p>
              </div>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                Choose File
              </Button>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          onClick={parseAndContinue}
          disabled={!canContinue || isLoading}
          className="min-w-24"
        >
          {isLoading ? 'Processing...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
