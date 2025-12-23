import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'react-hot-toast';

const StockMovementModal = ({ item, operation, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    quantity: '',
    issuedTo: '',
    reason: '',
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = `${import.meta.env.VITE_API_BASE_URL}/api/inventory/items/${item._id}/stock-${operation}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quantity: parseInt(formData.quantity),
          issuedTo: formData.issuedTo,
          reason: formData.reason,
          notes: formData.notes
        })
      });

      if (response.ok) {
        toast.success(`Stock ${operation === 'in' ? 'added' : 'issued'} successfully!`);
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to ${operation === 'in' ? 'add' : 'issue'} stock`);
      }
    } catch (error) {
      toast.error('Error processing stock movement');
    } finally {
      setLoading(false);
    }
  };

  const isStockIn = operation === 'in';
  const Icon = isStockIn ? TrendingUp : TrendingDown;
  const title = isStockIn ? 'Stock In' : 'Stock Out';
  const actionText = isStockIn ? 'Add Stock' : 'Issue Stock';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Icon 
              className={isStockIn ? 'text-green-600' : 'text-orange-600'} 
              size={24} 
            />
            <div>
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-600">{item.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={24} />
          </button>
        </div>

        {/* Current Stock Info */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Current Stock:</span>
            <span className="font-semibold text-gray-900">
              {item.currentStock} {item.unit}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-gray-600">Item Code:</span>
            <span className="font-mono text-sm text-gray-900">{item.itemCode}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity *
            </label>
            <div className="relative">
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                max={!isStockIn ? item.currentStock : undefined}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter quantity"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                {item.unit}
              </span>
            </div>
            {!isStockIn && (
              <p className="text-xs text-gray-500 mt-1">
                Maximum available: {item.currentStock} {item.unit}
              </p>
            )}
          </div>

          {!isStockIn && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issued To
              </label>
              <input
                type="text"
                name="issuedTo"
                value={formData.issuedTo}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Department, person, or room number"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason
            </label>
            <input
              type="text"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={isStockIn ? "Purchase, return, etc." : "Maintenance, guest request, etc."}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes (optional)"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.quantity}
              className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
                isStockIn 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {loading ? 'Processing...' : actionText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

StockMovementModal.propTypes = {
  item: PropTypes.object.isRequired,
  operation: PropTypes.oneOf(['in', 'out']).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default StockMovementModal;