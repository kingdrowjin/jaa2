import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, RefreshCw, Download } from 'lucide-react';

export function DataTable({ csvFileId, onBack }) {
  const [csvFile, setCsvFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCell, setEditingCell] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [exporting, setExporting] = useState(false);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchQuery && { filter: searchQuery })
      });

      const token = localStorage.getItem('token');
      const response = await fetch(`https://jaa2.onrender.com/api/csv/${csvFileId}/data?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const result = await response.json();
      
      setRows(result.data);
      setPagination(result.pagination);
      setCsvFile(result.csvFile);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Export CSV functionality
  const handleExport = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch all data for export (without pagination)
      const response = await fetch(`https://jaa2.onrender.com/api/csv/${csvFileId}/data?limit=10000`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data for export');
      }

      const result = await response.json();
      const allRows = result.data;
      
      if (!allRows || allRows.length === 0) {
        alert('No data to export');
        return;
      }

      // Convert data to CSV format
      const headers = csvFile.columnHeaders;
      const csvContent = [
        // Header row
        headers.join(','),
        // Data rows
        ...allRows.map(row => 
          headers.map(header => {
            const value = row.rowData[header] || '';
            // Escape commas and quotes in CSV
            const escapedValue = typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))
              ? `"${value.replace(/"/g, '""')}"` 
              : value;
            return escapedValue;
          }).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${csvFile.batchName || 'export'}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export CSV: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [csvFileId, pagination.page, searchQuery]);

  // Handle cell editing
  const handleCellClick = (rowId, column, currentValue) => {
    setEditingCell({ rowId, column });
    setEditingValue(currentValue?.toString() || '');
  };

  const handleCellSave = async () => {
    if (!editingCell) return;

    try {
      const row = rows.find(r => r.id === editingCell.rowId);
      if (!row) return;

      const updatedRowData = {
        ...row.rowData,
        [editingCell.column]: editingValue
      };

      const token = localStorage.getItem('token');
      const response = await fetch(`https://jaa2.onrender.com/api/csv/rows/${editingCell.rowId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rowData: updatedRowData })
      });

      if (!response.ok) {
        throw new Error('Failed to update cell');
      }

      // Update local state
      setRows(prev => prev.map(r => 
        r.id === editingCell.rowId 
          ? { ...r, rowData: updatedRowData }
          : r
      ));

    } catch (error) {
      console.error('Error updating cell:', error);
    } finally {
      setEditingCell(null);
      setEditingValue('');
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (editingCell) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCellSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCellCancel();
      }
    }
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  if (loading && !csvFile) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!csvFile) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">CSV file not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{csvFile.batchName}</h1>
            <p className="text-sm text-gray-600">
              {pagination.total} records
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport}
            disabled={exporting || !csvFile}
          >
            <Download className="h-4 w-4 mr-1" />
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {csvFile.columnHeaders.map(column => (
                  <th
                    key={column}
                    className="text-left p-3 font-medium text-gray-900 border-b"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50 border-b">
                  {csvFile.columnHeaders.map(column => (
                    <td
                      key={column}
                      className="p-3 cursor-pointer hover:bg-blue-50"
                      onClick={() => handleCellClick(row.id, column, row.rowData[column])}
                    >
                      {editingCell?.rowId === row.id && editingCell?.column === column ? (
                        <input
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={handleCellSave}
                          onKeyDown={handleKeyDown}
                          className="w-full border-none p-0 bg-transparent focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <span>{row.rowData[column] || '—'}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
          {pagination.total} results
        </p>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            Previous
          </Button>
          
          <span className="text-sm">
            Page {pagination.page} of {pagination.pages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
