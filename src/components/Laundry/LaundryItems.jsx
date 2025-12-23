import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Shirt } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ConfirmationDialog from '../common/ConfirmationDialog';
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
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

const LaundryItems = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [formData, setFormData] = useState({
    itemName: '',
    categoryId: '',
    rate: '',
    unit: 'piece',
    vendorId: '',
    isActive: true
  });
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const units = ['piece', 'pair', 'set'];

  useEffect(() => {
    const loadInitialData = async () => {
      setIsInitialLoading(true);
      await Promise.all([fetchItems(), fetchVendors(), fetchCategories()]);
      setIsInitialLoading(false);
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchQuery, categoryFilter, vendorFilter]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/laundry-items/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setItems(Array.isArray(data) ? data : (data.laundryItems || []));
    } catch (error) {
      toast.error('Failed to fetch laundry items');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/vendors/active`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setVendors(data.vendors || []);
    } catch (error) {
      setVendors([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/laundry-categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setCategories(Array.isArray(data) ? data : (data.categories || []));
    } catch (error) {
      setCategories([]);
    }
  };

  const filterItems = () => {
    if (!Array.isArray(items)) return;
    let filtered = [...items];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.itemName?.toLowerCase().includes(query) ||
        item.serviceType?.toLowerCase().includes(query)
      );
    }
    
    if (categoryFilter) {
      filtered = filtered.filter(item => item.categoryId?._id === categoryFilter);
    }
    
    if (vendorFilter) {
      filtered = filtered.filter(item => item.vendorId?._id === vendorFilter);
    }
    
    setFilteredItems(filtered);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmAction(() => performSubmit);
    setShowConfirmDialog(true);
  };

  const performSubmit = async () => {
    setShowConfirmDialog(false);
    try {
      const token = localStorage.getItem('token');
      const url = editingItem
        ? `${import.meta.env.VITE_API_BASE_URL}/api/laundry-items/${editingItem._id}`
        : `${import.meta.env.VITE_API_BASE_URL}/api/laundry-items/`;
      
      const payload = { ...formData };
      if (!payload.vendorId) {
        delete payload.vendorId;
      }
      
      const response = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success(`Laundry item ${editingItem ? 'updated' : 'added'} successfully`);
        setShowForm(false);
        resetForm();
        fetchItems();
      }
    } catch (error) {
      toast.error('Failed to save laundry item');
    } finally {
      setConfirmAction(null);
    }
  };

  const handleDelete = (id) => {
    setConfirmAction(() => () => performDelete(id));
    setShowConfirmDialog(true);
  };

  const performDelete = async (id) => {
    setShowConfirmDialog(false);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/laundry-items/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success('Laundry item deleted successfully');
        fetchItems();
      }
    } catch (error) {
      toast.error('Failed to delete laundry item');
    } finally {
      setConfirmAction(null);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      itemName: item.itemName,
      categoryId: item.categoryId?._id || '',
      rate: item.rate,
      unit: item.unit || 'piece',
      vendorId: item.vendorId?._id || '',
      isActive: item.isActive !== undefined ? item.isActive : true
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      itemName: '',
      categoryId: '',
      rate: '',
      unit: 'piece',
      vendorId: '',
      isActive: true
    });
    setEditingItem(null);
  };

  if (isInitialLoading) {
    return <DashboardLoader pageName="Laundry Items" />;
  }

  return (
    <div className="min-h-screen bg-background p-4" style={{opacity: loading ? 0 : 1, transition: 'opacity 0.3s ease-in-out'}}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-4 mb-4 border border-border animate-slideInLeft animate-delay-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-text flex items-center gap-2">
                <Shirt className="text-primary" size={20} />
                Laundry Items
              </h1>
            </div>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="px-4 py-2 bg-primary hover:bg-hover text-white rounded-lg flex items-center gap-2 text-sm transition-all duration-200"
            >
              <Plus size={16} />
              Add Item
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-3 mb-4 shadow border border-border animate-fadeInUp animate-delay-200">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-3 py-1.5 text-sm border border-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary w-40"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.categoryName}</option>
              ))}
            </select>
            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
            >
              <option value="">All Vendors</option>
              {vendors.map(vendor => (
                <option key={vendor._id} value={vendor._id}>{vendor.vendorName}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading items...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg text-center py-16 border border-border">
            <Shirt className="mx-auto mb-4 text-gray-400" size={64} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No items found</h3>
            <p className="text-gray-500">Create your first laundry item</p>
          </div>
        ) : (
        <>
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {filteredItems.map((item, index) => (
              <div key={item._id} className="bg-white rounded-2xl shadow-lg p-6 border border-border hover:shadow-xl transition-all duration-200 animate-scaleIn" style={{animationDelay: `${Math.min(index * 100 + 300, 700)}ms`}}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">{item.itemName}</h3>
                    <div className="flex gap-2 mt-2">
                      <span className="px-3 py-1 bg-accent text-primary rounded-full text-sm font-medium">{item.categoryId?.categoryName || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div><span className="text-gray-500">Rate:</span> <span className="font-medium">₹{item.rate}</span></div>
                  <div><span className="text-gray-500">Unit:</span> <span className="font-medium">{item.unit}</span></div>
                  <div className="col-span-2"><span className="text-gray-500">Vendor:</span> <span className="font-medium">{item.vendorId?.vendorName || 'In-House'}</span></div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEdit(item)} 
                    className="flex-1 px-3 py-1.5 bg-primary hover:bg-hover text-white text-sm rounded-lg transition-all duration-200"
                  >
                    <Edit size={16} className="inline mr-1" /> Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(item._id)} 
                    className="flex-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-all duration-200"
                  >
                    <Trash2 size={16} className="inline mr-1" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-2xl shadow-lg overflow-hidden border border-border">
            <table className="min-w-full">
              <thead className="bg-background">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-text uppercase tracking-wider">Item Name</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-text uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-text uppercase tracking-wider">Rate</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-text uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-text uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-text uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map((item, index) => (
                  <tr key={item._id} className="hover:bg-gray-50 transition-colors duration-150 animate-fadeInUp" style={{animationDelay: `${Math.min(index * 50 + 300, 700)}ms`}}>
                    <td className="px-6 py-4 font-semibold text-gray-900">{item.itemName}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-accent text-primary rounded-full text-sm font-medium">{item.categoryId?.categoryName || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">₹{item.rate}</td>
                    <td className="px-6 py-4 text-gray-600">{item.unit}</td>
                    <td className="px-6 py-4 text-gray-600">{item.vendorId?.vendorName || 'In-House'}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEdit(item)} 
                          className="px-3 py-1.5 bg-primary hover:bg-hover text-white text-xs rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 shadow-sm hover:shadow-md"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(item._id)} 
                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 shadow-sm hover:shadow-md"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
        )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingItem ? 'Edit' : 'Add'} Laundry Item</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Item Name</label>
                <input type="text" value={formData.itemName} onChange={(e) => setFormData({...formData, itemName: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select value={formData.categoryId} onChange={(e) => setFormData({...formData, categoryId: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required>
                  <option value="">Select Category</option>
                  {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.categoryName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rate (₹)</label>
                <input type="number" value={formData.rate} onChange={(e) => setFormData({...formData, rate: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit</label>
                <select value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                  {units.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vendor (Optional)</label>
                <select value={formData.vendorId} onChange={(e) => setFormData({...formData, vendorId: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">No Vendor</option>
                  {vendors.map(vendor => <option key={vendor._id} value={vendor._id}>{vendor.vendorName}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 text-white rounded-lg" style={{background: 'linear-gradient(to bottom, hsl(45, 43%, 58%), hsl(45, 32%, 46%))'}}>{editingItem ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => { setShowConfirmDialog(false); setConfirmAction(null); }}
        onConfirm={confirmAction}
        title={confirmAction?.toString().includes('Delete') ? 'Confirm Deletion' : `Confirm ${editingItem ? 'Update' : 'Creation'}`}
        message={confirmAction?.toString().includes('Delete') 
          ? 'Are you sure you want to delete this laundry item? This action cannot be undone.'
          : `Are you sure you want to ${editingItem ? 'update' : 'create'} this laundry item "${formData.itemName}"?`
        }
        confirmText={confirmAction?.toString().includes('Delete') ? 'Delete' : (editingItem ? 'Update' : 'Create')}
        cancelText="Cancel"
        type={confirmAction?.toString().includes('Delete') ? 'danger' : 'info'}
      />
      </div>
    </div>
  );
};

export default LaundryItems;
