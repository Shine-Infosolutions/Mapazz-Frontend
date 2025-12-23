import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Plus, Search, Filter, AlertTriangle, Package, 
  TrendingUp, TrendingDown, Download, BarChart3 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import InventoryTable from './InventoryTable';
import InventoryForm from './InventoryForm';
import InventoryCategoryForm from './InventoryCategoryForm';
import StockMovementModal from './StockMovementModal';
import StockMovementLog from './StockMovementLog';
import Dashboard from './Dashboard';
import DashboardLoader from '../DashboardLoader';

// Add CSS animations
const styles = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  .animate-fadeInUp { opacity: 0; animation: fadeInUp 0.5s ease-out forwards; }
  .animate-slideInLeft { opacity: 0; animation: slideInLeft 0.4s ease-out forwards; }
  .animate-scaleIn { opacity: 0; animation: scaleIn 0.3s ease-out forwards; }
  .animate-delay-100 { animation-delay: 0.1s; }
  .animate-delay-200 { animation-delay: 0.2s; }
  .animate-delay-300 { animation-delay: 0.3s; }
  .animate-delay-400 { animation-delay: 0.4s; }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

const HotelInventory = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  
  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showMovementLog, setShowMovementLog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [stockOperation, setStockOperation] = useState('in');
  const [categories, setCategories] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const locations = ['Store Room', 'Kitchen Store', 'Floor Storage', 'Laundry Room', 'Maintenance Room'];

  useEffect(() => {
    const loadInitialData = async () => {
      setIsInitialLoading(true);
      await Promise.all([
        fetchItems(),
        fetchLowStockItems(),
        fetchCategories()
      ]);
      setIsInitialLoading(false);
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchQuery, selectedCategory, selectedLocation, stockFilter]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token missing. Please login again.');
        return;
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/inventory/items`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        toast.error('Session expired. Please login again.');
        return;
      }
      
      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('hotel inventory error', error);
      toast.error('Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStockItems = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/inventory/low-stock`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLowStockItems(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch low stock items');
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/inventory-categories/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data.filter(cat => cat.isActive));
      }
    } catch (error) {
      console.error('Failed to fetch categories');
      // Fallback to static categories if API fails
      const fallbackCategories = [
        { _id: 'fallback1', name: 'Housekeeping' },
        { _id: 'fallback2', name: 'Consumables' },
        { _id: 'fallback3', name: 'Kitchen' },
        { _id: 'fallback4', name: 'Linen' },
        { _id: 'fallback5', name: 'Maintenance' }
      ];
      setCategories(fallbackCategories);
    }
  };

  const filterItems = () => {
    let filtered = [...items];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.itemCode.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.supplier?.name.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Location filter
    if (selectedLocation) {
      filtered = filtered.filter(item => item.location === selectedLocation);
    }

    // Stock level filter
    if (stockFilter === 'low') {
      filtered = filtered.filter(item => item.currentStock <= item.minStockLevel);
    } else if (stockFilter === 'out') {
      filtered = filtered.filter(item => item.currentStock === 0);
    } else if (stockFilter === 'good') {
      filtered = filtered.filter(item => item.currentStock > item.minStockLevel);
    }

    setFilteredItems(filtered);
  };

  const handleSearch = async (query) => {
    if (query.length > 2) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/inventory/search?query=${query}`);
        const data = await response.json();
        setFilteredItems(data.items || []);
      } catch (error) {
        console.error('Search failed');
      }
    } else {
      setSearchQuery(query);
    }
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleStockOperation = (item, operation) => {
    setSelectedItem(item);
    setStockOperation(operation);
    setShowStockModal(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingItem(null);
    fetchItems();
    fetchLowStockItems();
  };

  const handleStockModalClose = () => {
    setShowStockModal(false);
    setSelectedItem(null);
    fetchItems();
    fetchLowStockItems();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedLocation('');
    setStockFilter('');
  };

  const exportData = () => {
    const csvContent = [
      ['Item Name', 'Item Code', 'Category', 'Current Stock', 'Min Stock', 'Location', 'Supplier'],
      ...filteredItems.map(item => [
        item.name,
        item.itemCode,
        item.category,
        item.currentStock,
        item.minStockLevel,
        item.location,
        item.supplier?.name || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hotel-inventory.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Inventory exported successfully!');
  };

  if (isInitialLoading) {
    return <DashboardLoader pageName="Hotel Inventory" />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" style={{opacity: loading && items.length === 0 ? 0 : 1, transition: 'opacity 0.3s ease-in-out'}}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 animate-slideInLeft animate-delay-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="text-blue-600" />
            Hotel Inventory Management
          </h1>
          <p className="text-gray-600 mt-1">Manage all hotel inventory items and stock levels</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowMovementLog(true)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <BarChart3 size={20} />
            Stock Log
          </button>
          <button
            onClick={exportData}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Download size={20} />
            Export
          </button>
          <button
            onClick={() => setShowCategoryForm(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={20} />
            Add Category
          </button>
          <button
            onClick={handleAddItem}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={20} />
            Add Item
          </button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="animate-scaleIn animate-delay-200">
        <Dashboard items={items} lowStockItems={lowStockItems} />
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-fadeInUp animate-delay-300">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle size={20} />
            <span className="font-semibold">Low Stock Alert</span>
          </div>
          <p className="text-red-700 mt-1">
            {lowStockItems.length} item(s) are running low on stock and need attention.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {lowStockItems.slice(0, 5).map(item => (
              <span key={item._id} className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                {item.name} ({item.currentStock} left)
              </span>
            ))}
            {lowStockItems.length > 5 && (
              <span className="text-red-600 text-sm">+{lowStockItems.length - 5} more</span>
            )}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6 animate-scaleIn animate-delay-400">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search items, codes, or suppliers..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Locations</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Stock Levels</option>
              <option value="good">Good Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {(searchQuery || selectedCategory || selectedLocation || stockFilter) && (
          <div className="mt-4 flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <span className="text-sm text-gray-600">Active filters:</span>
            {searchQuery && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                Search: "{searchQuery}"
              </span>
            )}
            {selectedCategory && (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                Category: {selectedCategory}
              </span>
            )}
            {selectedLocation && (
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                Location: {selectedLocation}
              </span>
            )}
            {stockFilter && (
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm">
                Stock: {stockFilter}
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-red-600 hover:text-red-800 text-sm underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Inventory Table */}
      <div className="animate-fadeInUp animate-delay-400">
        <InventoryTable
          items={filteredItems}
          loading={loading}
          onEdit={handleEditItem}
          onStockIn={(item) => handleStockOperation(item, 'in')}
          onStockOut={(item) => handleStockOperation(item, 'out')}
          onRefresh={fetchItems}
        />
      </div>

      {/* Modals */}
      {showForm && (
        <InventoryForm
          item={editingItem}
          categories={categories}
          onClose={handleFormClose}
        />
      )}

      {showStockModal && selectedItem && (
        <StockMovementModal
          item={selectedItem}
          operation={stockOperation}
          onClose={handleStockModalClose}
        />
      )}

      {showCategoryForm && (
        <InventoryCategoryForm
          onClose={() => setShowCategoryForm(false)}
          onSuccess={fetchCategories}
        />
      )}

      {showMovementLog && (
        <StockMovementLog
          onClose={() => setShowMovementLog(false)}
        />
      )}
    </div>
  );
};

HotelInventory.propTypes = {
  // No props currently used
};

export default HotelInventory;