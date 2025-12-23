import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Shirt, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ConfirmationDialog from '../common/ConfirmationDialog';

const LaundryManagement = ({ activeTab: initialTab = 'items' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [lossReports, setLossReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [pendingSubmission, setPendingSubmission] = useState(null);
  const [formData, setFormData] = useState({
    itemName: '',
    category: '',
    serviceType: '',
    rate: '',
    unit: 'piece',
    vendorId: '',
    isActive: true
  });

  const categories = ['gentlemen', 'ladies', 'Hotel Laundry'];
  const serviceTypes = ['dry_clean', 'wash', 'press'];
  const units = ['piece', 'pair', 'set'];

  useEffect(() => {
    fetchItems();
    fetchVendors();
    fetchLossReports();
  }, []);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

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

  const fetchLossReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/laundry/loss-reports`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setLossReports(data.reports || []);
    } catch (error) {
      console.error('Error fetching loss reports:', error);
      setLossReports([]);
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
      filtered = filtered.filter(item => item.category === categoryFilter);
    }
    
    if (vendorFilter) {
      filtered = filtered.filter(item => item.vendorId?._id === vendorFilter);
    }
    
    setFilteredItems(filtered);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setPendingSubmission(e);
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
      
      const response = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
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
      setPendingSubmission(null);
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

  const handleStatusUpdate = (reportId, newStatus) => {
    setConfirmAction(() => () => performStatusUpdate(reportId, newStatus));
    setShowConfirmDialog(true);
  };

  const performStatusUpdate = async (reportId, newStatus) => {
    setShowConfirmDialog(false);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/laundry/loss-reports/${reportId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        }
      );
      if (response.ok) {
        toast.success('Status updated successfully');
        fetchLossReports();
      }
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setConfirmAction(null);
    }
  };

  const handleCancelAction = () => {
    setShowConfirmDialog(false);
    setConfirmAction(null);
    setPendingSubmission(null);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      itemName: item.itemName,
      category: item.category,
      serviceType: item.serviceType,
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
      category: '',
      serviceType: '',
      rate: '',
      unit: 'piece',
      vendorId: '',
      isActive: true
    });
    setEditingItem(null);
  };

  const getStatusBadge = (status) => {
    const colors = {
      reported: 'bg-red-100 text-red-800',
      investigating: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      compensated: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shirt className="text-blue-600" />
            Laundry Management
          </h1>
          <p className="text-gray-600 mt-1">Manage laundry items and loss reports</p>
        </div>
        {activeTab === 'items' && (
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={20} />
            Add Item
          </button>
        )}
      </div>

      <div className="mb-6 border-b">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('items')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'items'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Shirt className="inline mr-2" size={18} />
            Laundry Items
          </button>
          <button
            onClick={() => setActiveTab('loss')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'loss'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <AlertTriangle className="inline mr-2" size={18} />
            Loss Reports ({lossReports.length})
          </button>
        </div>
      </div>

      {activeTab === 'items' && (
        <>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Vendors</option>
                {vendors.map(vendor => (
                  <option key={vendor._id} value={vendor._id}>{vendor.vendorName}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.map((item) => (
                    <tr key={item._id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{item.itemName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                          {item.serviceType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">₹{item.rate}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.vendorId?.vendorName || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800">
                            <Edit size={18} />
                          </button>
                          <button onClick={() => handleDelete(item._id)} className="text-red-600 hover:text-red-800">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === 'loss' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {lossReports.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <AlertTriangle className="mx-auto mb-3" size={48} />
              <p>No loss reports found</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lost Items Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loss Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loss Note</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reported</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lossReports.map((report) => (
                  <tr key={report._id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{report.roomNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{report.guestName || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        {report.lostItems?.map((item, idx) => (
                          <div key={idx} className="text-sm">
                            <span className="font-medium">{item.itemName}</span>
                            <span className="text-gray-500 ml-1">(Qty: {item.quantity}, ₹{item.calculatedAmount})</span>
                          </div>
                        )) || 'No items'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">₹{report.totalLossAmount}</td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs text-sm text-gray-600">
                        {report.lossNote || 'No note provided'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(report.status)}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div>{new Date(report.createdAt).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500">by {report.reportedBy || 'Staff'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={report.status}
                        onChange={(e) => handleStatusUpdate(report._id, e.target.value)}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="reported">Reported</option>
                        <option value="investigating">Investigating</option>
                        <option value="resolved">Resolved</option>
                        <option value="compensated">Compensated</option>
                      </select>
                    </td>
                  </tr>
                ))
              </tbody>
            </table>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingItem ? 'Edit' : 'Add'} Laundry Item</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Item Name</label>
                <input type="text" value={formData.itemName} onChange={(e) => setFormData({...formData, itemName: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required>
                  <option value="">Select Category</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Service Type</label>
                <select value={formData.serviceType} onChange={(e) => setFormData({...formData, serviceType: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required>
                  <option value="">Select Service</option>
                  {serviceTypes.map(type => <option key={type} value={type}>{type}</option>)}
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
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingItem ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={handleCancelAction}
        onConfirm={confirmAction}
        title={confirmAction?.toString().includes('Delete') ? 'Confirm Deletion' : activeTab === 'loss' ? 'Confirm Status Update' : `Confirm ${editingItem ? 'Update' : 'Creation'}`}
        message={confirmAction?.toString().includes('Delete') 
          ? 'Are you sure you want to delete this laundry item? This action cannot be undone.'
          : activeTab === 'loss'
          ? 'Are you sure you want to update the status of this loss report?'
          : `Are you sure you want to ${editingItem ? 'update' : 'create'} this laundry item "${formData.itemName}"?`
        }
        confirmText={confirmAction?.toString().includes('Delete') ? 'Delete' : activeTab === 'loss' ? 'Update' : (editingItem ? 'Update' : 'Create')}
        cancelText="Cancel"
        type={confirmAction?.toString().includes('Delete') ? 'danger' : 'info'}
      />
    </div>
  );
};

export default LaundryManagement;
