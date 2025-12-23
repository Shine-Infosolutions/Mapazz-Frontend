import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';

const LaundryOrderView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

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
      setOrder(data.order || data);
    } catch (error) {
      toast.error('Failed to fetch order');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (!order) return <div className="p-6 text-center">Order not found</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/laundry/orders')} className="text-gray-600 hover:text-gray-800">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Eye size={24} />
          View Laundry Order
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-3">Order Details</h3>
            <div className="space-y-2">
              <p><span className="text-gray-600">GRC No:</span> {order.grcNo}</p>
              <p><span className="text-gray-600">Room:</span> {order.roomNumber}</p>
              <p><span className="text-gray-600">Guest:</span> {order.requestedByName}</p>
              <p><span className="text-gray-600">Status:</span> 
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  order.laundryStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  order.laundryStatus === 'ready' ? 'bg-green-100 text-green-800' :
                  order.laundryStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {order.laundryStatus}
                </span>
              </p>
              <p><span className="text-gray-600">Service Type:</span> {order.serviceType}</p>
              <p><span className="text-gray-600">Total Amount:</span> ₹{order.totalAmount}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Items</h3>
            <div className="space-y-2">
              {order.items?.map((item, index) => (
                <div key={index} className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>{item.itemName}</span>
                  <span>₹{item.price} x {item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button 
            onClick={() => navigate(`/laundry/orders/edit/${id}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Edit Order
          </button>
          <button 
            onClick={() => navigate('/laundry/orders')}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Back to Orders
          </button>
        </div>
      </div>
    </div>
  );
};

export default LaundryOrderView;