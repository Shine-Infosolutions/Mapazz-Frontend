import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';

const InventoryForm = ({ item, categories = [], onClose }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    itemCode: '',
    categoryId: '',
    description: '',
    currentStock: 0,
    minStockLevel: 5,
    reorderLevel: 10,
    unit: 'pieces',
    location: 'Store Room',
    supplier: {
      name: '',
      contact: ''
    },
    pricePerUnit: 0,
    lastPurchased: ''
  });

  const units = ['pieces', 'boxes', 'liters', 'packs', 'kg', 'meters'];
  const locations = ['Store Room', 'Kitchen Store', 'Floor Storage', 'Laundry Room', 'Maintenance Room'];

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        itemCode: item.itemCode || '',
        categoryId: item.categoryId?._id || item.categoryId || '',
        description: item.description || '',
        currentStock: item.currentStock || 0,
        minStockLevel: item.minStockLevel || 5,
        reorderLevel: item.reorderLevel || 10,
        unit: item.unit || 'pieces',
        location: item.location || 'Store Room',
        supplier: {
          name: item.supplier?.name || '',
          contact: item.supplier?.contact || ''
        },
        pricePerUnit: item.pricePerUnit || 0,
        lastPurchased: item.lastPurchased ? new Date(item.lastPurchased).toISOString().split('T')[0] : ''
      });
    } else if (categories.length > 0 && !formData.categoryId) {
      setFormData(prev => ({ ...prev, categoryId: categories[0]?._id || '' }));
    }
  }, [item, categories]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('supplier.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        supplier: {
          ...prev.supplier,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };



  const generateItemCode = () => {
    const selectedCategory = categories.find(cat => cat._id === formData.categoryId);
    const categoryCode = selectedCategory?.name?.substring(0, 3).toUpperCase() || 'ITM';
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newCode = `${categoryCode}${randomNum}`;
    setFormData(prev => ({ ...prev, itemCode: newCode }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = item 
        ? `${import.meta.env.VITE_API_BASE_URL}/api/inventory/items/${item._id}`
        : `${import.meta.env.VITE_API_BASE_URL}/api/inventory/items`;

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token missing. Please login again.');
        return;
      }

      const response = await fetch(url, {
        method: item ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          currentStock: parseInt(formData.currentStock),
          minStockLevel: parseInt(formData.minStockLevel),
          reorderLevel: parseInt(formData.reorderLevel),
          pricePerUnit: parseFloat(formData.pricePerUnit),
          lastPurchased: formData.lastPurchased || null
        })
      });

      if (response.ok) {
        toast.success(item ? 'Item updated successfully!' : 'Item added successfully!');
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save item');
      }
    } catch (error) {
      toast.error('Error saving item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Package className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">
              {item ? 'Edit Inventory Item' : 'Add New Inventory Item'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter item name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Code / SKU *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="itemCode"
                    value={formData.itemCode}
                    onChange={handleChange}
                    required
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter or generate code"
                  />
                  <button
                    type="button"
                    onClick={generateItemCode}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter item description"
                />
              </div>
            </div>
          </div>

          {/* Stock Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Stock *
                </label>
                <input
                  type="number"
                  name="currentStock"
                  value={formData.currentStock}
                  onChange={handleChange}
                  min="0"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Stock Level *
                </label>
                <input
                  type="number"
                  name="minStockLevel"
                  value={formData.minStockLevel}
                  onChange={handleChange}
                  min="0"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reorder Level *
                </label>
                <input
                  type="number"
                  name="reorderLevel"
                  value={formData.reorderLevel}
                  onChange={handleChange}
                  min="0"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit of Measure *
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {units.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Supplier Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplier Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier Name
                </label>
                <input
                  type="text"
                  name="supplier.name"
                  value={formData.supplier.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter supplier name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier Contact
                </label>
                <input
                  type="text"
                  name="supplier.contact"
                  value={formData.supplier.contact}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Phone number or email"
                />
              </div>
            </div>
          </div>

          {/* Pricing Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per Unit (₹)
                </label>
                <input
                  type="number"
                  name="pricePerUnit"
                  value={formData.pricePerUnit}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Purchased Date
                </label>
                <input
                  type="date"
                  name="lastPurchased"
                  value={formData.lastPurchased}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (item ? 'Update Item' : 'Add Item')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

InventoryForm.propTypes = {
  item: PropTypes.object,
  categories: PropTypes.array,
  onClose: PropTypes.func.isRequired,
};

export default InventoryForm;