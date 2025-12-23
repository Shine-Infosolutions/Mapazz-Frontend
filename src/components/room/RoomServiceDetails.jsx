import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, MapPin, Clock, Phone, CreditCard } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

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

const RoomServiceDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/room-service/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
      } else {
        alert('Order not found');
        navigate('/room-service/history');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      alert('Error fetching order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-orange-100 text-orange-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!order) {
    return <div className="flex items-center justify-center h-screen">Order not found</div>;
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: '#f5f5dc'}}>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6 animate-slideInLeft animate-delay-100">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center hover:opacity-80 transition-opacity text-lg"
            style={{color: '#B8860B'}}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold" style={{color: '#B8860B'}}>Order Details</h1>
          <div></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeInUp animate-delay-200">
          {/* Order Information */}
          <div className="bg-white rounded-xl shadow-md p-6 animate-scaleIn animate-delay-300">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold" style={{color: '#B8860B'}}>
                Order #{order.orderNumber}
              </h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-3" style={{color: '#D4AF37'}} />
                <div>
                  <div className="font-medium">Order Date & Time</div>
                  <div className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <MapPin className="w-5 h-5 mr-3" style={{color: '#D4AF37'}} />
                <div>
                  <div className="font-medium">Room Number</div>
                  <div className="text-sm text-gray-600">{order.roomNumber}</div>
                </div>
              </div>

              <div className="flex items-center">
                <User className="w-5 h-5 mr-3" style={{color: '#D4AF37'}} />
                <div>
                  <div className="font-medium">Guest Name</div>
                  <div className="text-sm text-gray-600">{order.guestName}</div>
                </div>
              </div>

              {order.bookingNo && (
                <div className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-3" style={{color: '#D4AF37'}} />
                  <div>
                    <div className="font-medium">Booking Number</div>
                    <div className="text-sm text-gray-600">{order.bookingNo}</div>
                  </div>
                </div>
              )}

              {order.notes && (
                <div>
                  <div className="font-medium mb-1">Special Instructions</div>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {order.notes}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-xl shadow-md p-6 animate-scaleIn animate-delay-300">
            <h2 className="text-xl font-semibold mb-4" style={{color: '#B8860B'}}>
              Order Items ({order.items.length})
            </h2>

            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{item.itemName}</div>
                    <div className="text-sm text-gray-600">
                      ₹{item.unitPrice} × {item.quantity}
                    </div>
                    {item.category && (
                      <div className="text-xs text-gray-500">{item.category}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold" style={{color: '#8B4513'}}>
                      ₹{item.totalPrice}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t mt-4 pt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total Amount:</span>
                <span style={{color: '#8B4513'}}>₹{order.totalAmount}</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Payment Status: {order.paymentStatus || 'Pending'}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {order.status !== 'completed' && order.status !== 'cancelled' && (
          <div className="mt-6 flex justify-center space-x-4">
            <button
              onClick={() => navigate(`/room-service/edit/${order._id}`)}
              className="px-6 py-3 rounded-lg font-medium text-white transition-colors"
              style={{backgroundColor: '#D4AF37'}}
            >
              Edit Order
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomServiceDetails;