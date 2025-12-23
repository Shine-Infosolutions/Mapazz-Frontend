import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  Edit, Trash2, TrendingUp, TrendingDown, 
  AlertTriangle, CheckCircle, ChevronUp, ChevronDown, Package 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const InventoryTable = ({ items, loading, onEdit, onStockIn, onStockOut, onRefresh }) => {
  const { hasRole } = useAuth();
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Handle nested supplier name
    if (sortField === 'supplier') {
      aValue = a.supplier?.name || '';
      bValue = b.supplier?.name || '';
    }

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/inventory/items/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Item deleted successfully!');
        onRefresh();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete item');
      }
    } catch (error) {
      toast.error('Error deleting item');
    }
  };

  const getStockStatus = (item) => {
    if (item.currentStock === 0) {
      return { status: 'out', color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle };
    } else if (item.currentStock <= item.minStockLevel) {
      return { status: 'low', color: 'text-orange-600', bg: 'bg-orange-100', icon: AlertTriangle };
    } else {
      return { status: 'good', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle };
    }
  };

  const SortHeader = ({ field, children }) => (
    <th 
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
        )}
      </div>
    </th>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Inventory Items ({items.length})
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortHeader field="name">Item Name</SortHeader>
              <SortHeader field="itemCode">Item Code</SortHeader>
              <SortHeader field="category">Category</SortHeader>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock Status
              </th>
              <SortHeader field="currentStock">Current Stock</SortHeader>
              <SortHeader field="minStockLevel">Min Level</SortHeader>
              <SortHeader field="location">Location</SortHeader>
              <SortHeader field="supplier">Supplier</SortHeader>
              <SortHeader field="pricePerUnit">Price/Unit</SortHeader>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedItems.map((item) => {
              const stockStatus = getStockStatus(item);
              const StatusIcon = stockStatus.icon;

              return (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      {item.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {item.itemCode}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.categoryId?.name ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {item.categoryId.name}
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                        Uncategorized
                      </span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                      <StatusIcon size={12} className="mr-1" />
                      {stockStatus.status === 'out' ? 'Out of Stock' : 
                       stockStatus.status === 'low' ? 'Low Stock' : 'Good Stock'}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${stockStatus.color}`}>
                      {item.currentStock} {item.unit}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.minStockLevel} {item.unit}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.location}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.supplier?.name || '-'}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{item.pricePerUnit}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onStockIn(item)}
                        className="text-green-600 hover:text-green-900 p-1 rounded"
                        title="Stock In"
                      >
                        <TrendingUp size={16} />
                      </button>
                      <button
                        onClick={() => onStockOut(item)}
                        className="text-orange-600 hover:text-orange-900 p-1 rounded"
                        title="Stock Out"
                        disabled={item.currentStock === 0}
                      >
                        <TrendingDown size={16} />
                      </button>
                      <button
                        onClick={() => onEdit(item)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      {hasRole('ADMIN') && (
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {items.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <Package size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No inventory items found</h3>
              <p className="text-sm">Add your first inventory item to get started.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

InventoryTable.propTypes = {
  items: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  onEdit: PropTypes.func.isRequired,
  onStockIn: PropTypes.func.isRequired,
  onStockOut: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
};

export default InventoryTable;