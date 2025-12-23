import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const EditModal = ({ isOpen, onClose, selectedOrder, onSuccess }) => {
  const [editFormData, setEditFormData] = useState({});
  const [editItems, setEditItems] = useState([]);
  const [laundryItems, setLaundryItems] = useState([]);

  useEffect(() => {
    if (selectedOrder) {
      setEditFormData(selectedOrder);
      setEditItems(selectedOrder.items || []);
    }
  }, [selectedOrder]);

  useEffect(() => {
    if (isOpen && laundryItems.length === 0) {
      fetchLaundryItems();
    }
  }, [isOpen]);

  const fetchLaundryItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/laundry-items/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setLaundryItems(data.success ? data.laundryItems : []);
    } catch (error) {
      console.error('Failed to fetch laundry items');
    }
  };

  const handleUpdateOrder = async () => {
    try {
      const itemsWithoutRateId = editItems.filter(item => !item.rateId || item.rateId.trim() === '');
      
      if (itemsWithoutRateId.length > 0) {
        toast.error(`Please select items from dropdown for ${itemsWithoutRateId.length} item(s)`);
        return;
      }
      
      const token = localStorage.getItem('token');
      const updatedData = {
        ...editFormData,
        items: editItems
      };
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/laundry/${selectedOrder._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      });
      
      if (response.ok) {
        toast.success('Order updated successfully');
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update order');
      }
    } catch (error) {
      toast.error('Failed to update order');
    }
  };

  const addNewItem = () => {
    setEditItems([...editItems, { itemName: '', quantity: 1, price: 0, rateId: '', status: 'pending' }]);
  };

  const handleItemSelect = (index, selectedItemId) => {
    const selectedItem = laundryItems.find(item => item._id === selectedItemId);
    if (selectedItem) {
      updateItem(index, 'rateId', selectedItem._id);
      updateItem(index, 'itemName', selectedItem.itemName);
      updateItem(index, 'price', selectedItem.rate);
    }
  };

  const updateItem = (index, field, value) => {
    const updatedItems = [...editItems];
    updatedItems[index][field] = value;
    setEditItems(updatedItems);
  };

  const removeItem = (index) => {
    setEditItems(editItems.filter((_, i) => i !== index));
  };

  const handleMarkAsLost = async (itemIndex) => {
    try {
      const item = editItems[itemIndex];
      const token = localStorage.getItem('token');
      
      if (item._id) {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/laundry/item/${item._id}/status`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'cancelled' })
        });

        if (response.ok) {
          updateItem(itemIndex, 'status', 'cancelled');
          toast.success('Item marked as lost');
        } else {
          toast.error('Failed to update item status');
        }
      } else {
        updateItem(itemIndex, 'status', 'cancelled');
        toast.success('Item marked as lost');
      }
    } catch (error) {
      toast.error('Failed to mark item as lost');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      picked_up: 'bg-blue-100 text-blue-800',
      ready: 'bg-green-100 text-green-800',
      delivered: 'bg-green-200 text-green-900',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (!isOpen || !selectedOrder) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50" style={{animation: 'fadeIn 0.15s ease-out'}}>
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" style={{animation: 'slideIn 0.15s ease-out'}}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Order</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1 rounded transition-colors duration-200"
            title="Close Modal"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">GRC No</label>
              <input 
                type="text" 
                value={editFormData.grcNo || ''} 
                onChange={(e) => setEditFormData({...editFormData, grcNo: e.target.value})} 
                className="w-full p-2 border rounded" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Room Number</label>
              <input 
                type="text" 
                value={editFormData.roomNumber || ''} 
                onChange={(e) => setEditFormData({...editFormData, roomNumber: e.target.value})} 
                className="w-full p-2 border rounded" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Guest Name</label>
              <input 
                type="text" 
                value={editFormData.requestedByName || ''} 
                onChange={(e) => setEditFormData({...editFormData, requestedByName: e.target.value})} 
                className="w-full p-2 border rounded" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select 
                value={editFormData.laundryStatus || 'pending'} 
                onChange={(e) => setEditFormData({...editFormData, laundryStatus: e.target.value})} 
                className="w-full p-2 border rounded"
              >
                <option value="pending">Pending</option>
                <option value="picked_up">Picked Up</option>
                <option value="ready">Ready</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Service Type</label>
              <select 
                value={editFormData.serviceType || 'inhouse'} 
                onChange={(e) => setEditFormData({...editFormData, serviceType: e.target.value})} 
                className="w-full p-2 border rounded"
              >
                <option value="inhouse">In-House</option>
                <option value="vendor">Vendor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Total Amount</label>
              <input 
                type="number" 
                value={editFormData.totalAmount || 0} 
                onChange={(e) => setEditFormData({...editFormData, totalAmount: parseFloat(e.target.value)})} 
                className="w-full p-2 border rounded" 
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">Items</label>
              <button
                type="button"
                onClick={addNewItem}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors duration-200"
                title="Add New Item"
              >
                Add Item
              </button>
            </div>
            
            <div className="space-y-2">
              {editItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 p-3 bg-gray-50 rounded border">
                  <div className="col-span-3">
                    <select
                      value={item.rateId || ''}
                      onChange={(e) => handleItemSelect(index, e.target.value)}
                      className="w-full p-2 border rounded text-sm"
                    >
                      <option value="">Select Item</option>
                      {laundryItems.map((laundryItem) => (
                        <option key={laundryItem._id} value={laundryItem._id}>
                          {laundryItem.itemName} - ₹{laundryItem.rate}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={item.itemName}
                      onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                      placeholder="Item name"
                      className="w-full p-2 border rounded text-sm"
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      placeholder="Qty"
                      className="w-full p-2 border rounded text-sm"
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                      placeholder="Price"
                      className="w-full p-2 border rounded text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <select
                      value={item.status || 'pending'}
                      onChange={(e) => updateItem(index, 'status', e.target.value)}
                      className="w-full p-2 border rounded text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="picked_up">Picked Up</option>
                      <option value="ready">Ready</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Lost/Cancelled</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(item.status)}`}>
                      {item.status || 'pending'}
                    </span>
                  </div>
                  <div className="col-span-1">
                    {item.status !== 'cancelled' && (
                      <button
                        onClick={() => handleMarkAsLost(index)}
                        className="w-full p-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 flex items-center justify-center"
                        title="Mark as Lost"
                      >
                        <AlertTriangle size={12} />
                      </button>
                    )}
                    {item.status === 'cancelled' && (
                      <span className="text-red-600 text-xs font-medium">Lost</span>
                    )}
                  </div>
                  <div className="col-span-12 mt-1">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors duration-200"
                      title="Remove Item"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button 
              onClick={handleUpdateOrder}
              className="px-4 py-2 text-white rounded hover:opacity-90 transition-opacity duration-200"
              style={{background: 'linear-gradient(to bottom, hsl(45, 43%, 58%), hsl(45, 32%, 46%))', border: '1px solid hsl(45, 43%, 58%)'}}
              title="Save Changes"
            >
              Update
            </button>
            <button 
              onClick={onClose} 
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors duration-200"
              title="Cancel Changes"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditModal;