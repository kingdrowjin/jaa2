import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  FileText, 
  Calendar, 
  Users, 
  Building2,
  MoreHorizontal,
  Trash2,
  Eye,
  Download,
  LogOut
} from 'lucide-react';
import { ImportBatchModal } from '@/components/csv/ImportBatchModal';
import { DataTable } from '@/components/csv/DataTable';

const API_BASE_URL = 'https://jaa2.onrender.com';

export function CsvManagerPage({ onLogout }) {
  const [csvFiles, setCsvFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Fetch CSV files
  const fetchCsvFiles = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/csv/files`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch CSV files');
      }

      const result = await response.json();
      setCsvFiles(result.csvFiles);
    } catch (error) {
      console.error('Error fetching CSV files:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCsvFiles();
  }, []);

  const handleImportSuccess = () => {
    fetchCsvFiles();
    setShowImportModal(false);
  };

  const handleDeleteFile = async (fileId) => {
    if (!confirm('Are you sure you want to delete this CSV file? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/csv/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete CSV file');
      }

      fetchCsvFiles();
    } catch (error) {
      console.error('Error deleting CSV file:', error);
      alert('Failed to delete CSV file');
    }
  };

  const handleViewFile = (fileId) => {
    setSelectedFile(fileId);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // If viewing a specific file, show the data table
  if (selectedFile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <DataTable 
          csvFileId={selectedFile} 
          onBack={() => setSelectedFile(null)} 
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">CSV Manager</h1>
          <p className="text-gray-600">Import and manage your CSV data files</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button onClick={() => setShowImportModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Import Batch
          </Button>
          <Button variant="outline" onClick={onLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{csvFiles.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {csvFiles.reduce((sum, file) => sum + file.rowCount, 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Company Batches</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {csvFiles.filter(file => file.batchType === 'Company').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CSV Files List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Uploaded Files</h2>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : csvFiles.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No CSV files yet</h3>
              <p className="text-gray-600 mb-4">
                Get started by importing your first CSV file
              </p>
              <Button onClick={() => setShowImportModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Import Your First Batch
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {csvFiles.map(file => (
              <Card key={file.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-medium truncate">
                        {file.batchName}
                      </CardTitle>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {file.originalName}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={file.batchType === 'Company' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {file.batchType}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Records:</span>
                      <span className="font-medium">{file.rowCount.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Columns:</span>
                      <span className="font-medium">{file.columnHeaders.length}</span>
                    </div>
                    
                    <div className="flex items-center text-xs text-gray-500 mt-3">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(file.uploadedAt)}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewFile(file.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Data
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteFile(file.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Import Modal */}
      <ImportBatchModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}
