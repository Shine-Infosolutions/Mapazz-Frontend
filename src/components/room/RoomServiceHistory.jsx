import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Calendar, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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

const RoomServiceHistory = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [bookingFilter, setBookingFilter] = useState('all');

  useEffect(() => {
    fetchAllOrders();
    fetchBookings();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter, dateFilter, bookingFilter]);

  const fetchAllOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/room-service/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/bookings/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBookings(data || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/room-service/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        fetchAllOrders();
        alert(`Order ${status} successfully`);
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Error updating order');
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    if (searchQuery) {
      filtered = filtered.filter(order => 
        order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.guestName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.roomNumber?.toString().includes(searchQuery)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (dateFilter) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
        return orderDate === dateFilter;
      });
    }

    if (bookingFilter !== 'all') {
      filtered = filtered.filter(order => 
        order.bookingId === bookingFilter || 
        (order.bookingId && order.bookingId._id === bookingFilter)
      );
    }

    setFilteredOrders(filtered);
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
          <h1 className="text-3xl font-bold" style={{color: '#B8860B'}}>Room Service History</h1>
          <div></div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 animate-fadeInUp animate-delay-200">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{color: '#D4AF37'}} />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{color: '#D4AF37'}} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in-progress">In Progress</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{color: '#D4AF37'}} />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{color: '#D4AF37'}} />
              <select
                value={bookingFilter}
                onChange={(e) => setBookingFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                <option value="all">All Bookings</option>
                {bookings.filter(booking => booking.status === 'Checked In').map(booking => (
                  <option key={booking._id} value={booking._id}>
                    {booking.grcNo} - {booking.name} (Room {booking.roomNumber})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setDateFilter('');
                setBookingFilter('all');
              }}
              className="px-6 py-3 rounded-lg font-medium text-white transition-colors"
              style={{backgroundColor: '#D4AF37'}}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-xl shadow-md p-6 animate-fadeInUp animate-delay-300">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold" style={{color: '#B8860B'}}>
              All Orders ({filteredOrders.length})
            </h2>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No orders found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4" style={{color: '#B8860B'}}>Order #</th>
                    <th className="text-left py-3 px-4" style={{color: '#B8860B'}}>Date & Time</th>
                    <th className="text-left py-3 px-4" style={{color: '#B8860B'}}>Room</th>
                    <th className="text-left py-3 px-4" style={{color: '#B8860B'}}>Guest</th>
                    <th className="text-left py-3 px-4" style={{color: '#B8860B'}}>Items</th>
                    <th className="text-left py-3 px-4" style={{color: '#B8860B'}}>Amount</th>
                    <th className="text-left py-3 px-4" style={{color: '#B8860B'}}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, index) => (
                    <tr key={order._id} className={`border-b hover:bg-gray-50 animate-scaleIn`} style={{animationDelay: `${Math.min(index * 50 + 400, 800)}ms`}}>
                      <td className="py-3 px-4 font-medium">{order.orderNumber}</td>
                      <td className="py-3 px-4 text-sm">
                        {new Date(order.createdAt).toLocaleDateString()}<br/>
                        {new Date(order.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4">{order.roomNumber}</td>
                      <td className="py-3 px-4">{order.guestName}</td>
                      <td className="py-3 px-4 text-sm">
                        {order.items.length} item(s)
                      </td>
                      <td className="py-3 px-4 font-semibold" style={{color: '#8B4513'}}>
                        ₹{order.totalAmount}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => navigate(`/room-service/details/${order._id}`)}
                              className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                            >
                              Details
                            </button>
                            <button
                              onClick={() => navigate(`/room-service/edit/${order._id}`)}
                              className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                            >
                              Edit
                            </button>
                            {hasRole('ADMIN') && (
                              <button
                                onClick={() => updateOrderStatus(order._id, 'cancelled')}
                                className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomServiceHistory;