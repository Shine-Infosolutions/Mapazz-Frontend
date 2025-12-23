import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, User, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

const RoomServiceToday = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodaysOrders();
  }, []);

  const fetchTodaysOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0];
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/room-service/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const todaysOrders = data.orders.filter(order => {
          const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
          return orderDate === today;
        });
        setOrders(todaysOrders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
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

  return (
    <div className="min-h-screen" style={{backgroundColor: '#f5f5dc'}}>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6 animate-slideInLeft animate-delay-100">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center hover:opacity-80 transition-opacity text-lg"
            style={{color: '#B8860B'}}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold" style={{color: '#B8860B'}}>Today's Room Service Orders</h1>
          <div></div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 animate-fadeInUp animate-delay-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold" style={{color: '#B8860B'}}>
              Orders ({orders.length})
            </h2>
            <span className="text-sm text-gray-500">
              {new Date().toLocaleDateString()}
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No room service orders today
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, index) => (
                <div key={order._id} className={`border rounded-lg p-4 hover:shadow-md transition-shadow animate-scaleIn`} style={{animationDelay: `${Math.min(index * 100 + 300, 800)}ms`}}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg" style={{color: '#8B4513'}}>
                        Order #{order.orderNumber}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" style={{color: '#B8860B'}} />
                      <span className="text-sm">Room {order.roomNumber}</span>
                    </div>
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2" style={{color: '#B8860B'}} />
                      <span className="text-sm">{order.guestName}</span>
                    </div>
                    <div className="text-sm font-semibold" style={{color: '#8B4513'}}>
                      ₹{order.totalAmount}
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium" style={{color: '#B8860B'}}>Items:</h4>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/room-service/details/${order._id}`)}
                          className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                        >
                          Details
                        </button>
                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <button
                            onClick={() => navigate(`/room-service/edit/${order._id}`)}
                            className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                          >
                            Edit Items
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          {item.itemName} × {item.quantity} = ₹{item.totalPrice}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomServiceToday;