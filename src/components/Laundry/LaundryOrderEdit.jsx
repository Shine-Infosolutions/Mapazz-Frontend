import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { UpdateButton } from '../common/SubmitButton';

const LaundryOrderEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    grcNo: '',
    roomNumber: '',
    requestedByName: '',
    laundryStatus: 'pending',
    serviceType: 'wash',
    totalAmount: 0,
    items: []
  });

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/laundry/orders/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      const order = data.order || data;
      setFormData({
        grcNo: order.grcNo || '',
        roomNumber: order.roomNumber || '',
        requestedByName: order.requestedByName || '',
        laundryStatus: order.laundryStatus || 'pending',
        serviceType: order.serviceType || 'wash',
        totalAmount: order.totalAmount || 0,
        items: order.items || []
      });
    } catch (error) {
      toast.error('Failed to fetch order');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/laundry/orders/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Order updated successfully');
        navigate('/laundry/orders');
      } else {
        toast.error('Failed to update order');
      }
    } catch (error) {
      toast.error('Failed to update order');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/laundry/orders')} className="text-gray-600 hover:text-gray-800">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Edit size={24} />
          Edit Laundry Order
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">GRC No</label>
              <input
                type="text"
                name="grcNo"
                value={formData.grcNo}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Room Number</label>
              <input
                type="text"
                name="roomNumber"
                value={formData.roomNumber}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Guest Name</label>
              <input
                type="text"
                name="requestedByName"
                value={formData.requestedByName}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                name="laundryStatus"
                value={formData.laundryStatus}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
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
                name="serviceType"
                value={formData.serviceType}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="wash">Wash</option>
                <option value="dry_clean">Dry Clean</option>
                <option value="iron">Iron</option>
                <option value="wash_iron">Wash & Iron</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Total Amount</label>
              <input
                type="number"
                name="totalAmount"
                value={formData.totalAmount}
                onChange={handleChange}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-3">Items</h3>
          <div className="space-y-2">
            {formData.items?.map((item, index) => (
              <div key={index} className="grid grid-cols-3 gap-2 p-2 bg-gray-50 rounded">
                <input
                  type="text"
                  value={item.itemName || ''}
                  onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                  placeholder="Item name"
                  className="p-2 border rounded"
                />
                <input
                  type="number"
                  value={item.quantity || 1}
                  onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                  placeholder="Quantity"
                  className="p-2 border rounded"
                />
                <input
                  type="number"
                  value={item.price || 0}
                  onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value))}
                  placeholder="Price"
                  className="p-2 border rounded"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <UpdateButton 
            onSubmit={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <Save size={16} />
            Update Order
          </UpdateButton>
          <button 
            onClick={() => navigate('/laundry/orders')}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LaundryOrderEdit;