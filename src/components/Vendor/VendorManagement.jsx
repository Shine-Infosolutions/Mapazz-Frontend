import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Building2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [formData, setFormData] = useState({
    vendorName: '',
    contactPerson: '',
    email: '',
    phoneNumber: '',
    address: '',
    gstNumber: '',
    UpiID: '',
    scannerImg: '',
    isActive: true,
    remarks: ''
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    filterVendors();
  }, [vendors, searchQuery]);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/vendors/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setVendors(Array.isArray(data) ? data : (data.vendors || []));
    } catch (error) {
      toast.error('Failed to fetch vendors');
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const filterVendors = () => {
    if (!Array.isArray(vendors)) return;
    if (!searchQuery) {
      setFilteredVendors(vendors);
      return;
    }
    const query = searchQuery.toLowerCase();
    setFilteredVendors(vendors.filter(v =>
      v.vendorName?.toLowerCase().includes(query) ||
      v.contactPerson?.toLowerCase().includes(query) ||
      v.phoneNumber?.includes(query)
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingVendor
        ? `${import.meta.env.VITE_API_BASE_URL}/api/vendors/update/${editingVendor._id}`
        : `${import.meta.env.VITE_API_BASE_URL}/api/vendors/add`;
      
      const response = await fetch(url, {
        method: editingVendor ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(`Vendor ${editingVendor ? 'updated' : 'added'} successfully`);
        setShowForm(false);
        resetForm();
        fetchVendors();
      }
    } catch (error) {
      toast.error('Failed to save vendor');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/vendors/delete/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success('Vendor deleted successfully');
        fetchVendors();
      }
    } catch (error) {
      toast.error('Failed to delete vendor');
    }
  };

  const handleEdit = (vendor) => {
    setEditingVendor(vendor);
    setFormData(vendor);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      vendorName: '',
      contactPerson: '',
      email: '',
      phoneNumber: '',
      address: '',
      gstNumber: '',
      UpiID: '',
      scannerImg: '',
      isActive: true,
      remarks: ''
    });
    setEditingVendor(null);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-4 mb-4 border border-border">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-text flex items-center gap-2">
                <Building2 className="text-primary" size={24} />
                Vendor Management
              </h1>
              <p className="text-gray-600 mt-1">Manage all vendors and suppliers</p>
            </div>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="px-4 py-2 bg-primary hover:bg-hover text-white rounded-lg flex items-center gap-2 text-sm transition-all duration-200"
            >
              <Plus size={16} />
              Add Vendor
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg p-3 mb-4 shadow border border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200"
            />
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading vendors...</p>
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg text-center py-16 border border-border">
            <Building2 className="mx-auto mb-4 text-gray-400" size={64} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No vendors found</h3>
            <p className="text-gray-500">Try adjusting your search or add a new vendor</p>
          </div>
        ) : (
        <>
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {filteredVendors.map((vendor) => (
              <div key={vendor._id} className="bg-white rounded-2xl shadow-lg p-6 border border-border hover:shadow-xl transition-all duration-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{vendor.vendorName}</h3>
                    <p className="text-gray-600 font-medium">{vendor.contactPerson}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${vendor.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {vendor.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{vendor.phoneNumber}</span></div>
                  <div><span className="text-gray-500">Email:</span> <span className="font-medium">{vendor.email}</span></div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEdit(vendor)} 
                    className="px-3 py-1.5 bg-primary hover:bg-hover text-white text-xs rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 shadow-sm hover:shadow-md"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(vendor._id)} 
                    className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 shadow-sm hover:shadow-md"
                  >
                    Delete
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
                  <th className="px-6 py-4 text-left text-sm font-bold text-text uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-text uppercase tracking-wider">Contact Person</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-text uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-text uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-text uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-text uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredVendors.map((vendor) => (
                  <tr key={vendor._id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">{vendor.vendorName}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-700">{vendor.contactPerson}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-700">{vendor.phoneNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-700">{vendor.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${vendor.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {vendor.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEdit(vendor)} 
                          className="px-3 py-1.5 bg-primary hover:bg-hover text-white text-xs rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 shadow-sm hover:shadow-md"
                          title="Edit Vendor"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(vendor._id)} 
                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 shadow-sm hover:shadow-md"
                          title="Delete Vendor"
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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50" style={{animation: 'fadeIn 0.15s ease-out'}}>
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{animation: 'slideIn 0.15s ease-out'}}>
              <h2 className="text-2xl font-bold mb-4">{editingVendor ? 'Edit' : 'Add'} Vendor</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Vendor Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.vendorName}
                    onChange={(e) => setFormData({...formData, vendorName: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone (10 digits) *</label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200"
                    rows="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">GST Number</label>
                  <input
                    type="text"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({...formData, gstNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">UPI ID</label>
                  <input
                    type="text"
                    value={formData.UpiID}
                    onChange={(e) => setFormData({...formData, UpiID: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Remarks</label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200"
                    rows="2"
                  />
                </div>
                <div className="col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                      className="mr-2"
                    />
                    Active
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-hover text-white rounded-lg transition-all duration-200"
                >
                  {editingVendor ? 'Update' : 'Add'} Vendor
                </button>
              </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorManagement;
