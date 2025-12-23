import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Eye, Edit, Trash2, Calendar, Clock, User, MapPin, Package, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';

const LaundryOrdersNew = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    orderType: 'all',
    search: '',
    startDate: '',
    endDate: '',
    itemStatus: 'all'
  });

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      
      if (filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.orderType !== 'all') queryParams.append('orderType', filters.orderType);
      if (filters.itemStatus !== 'all') queryParams.append('itemStatus', filters.itemStatus);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      
      const url = `${import.meta.env.VITE_API_BASE_URL}/api/laundry/all${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setOrders(Array.isArray(data) ? data : (data.orders || []));
    } catch (error) {
      toast.error('Failed to fetch orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      picked_up: 'bg-blue-100 text-blue-800 border-blue-200',
      ready: 'bg-green-100 text-green-800 border-green-200',
      delivered: 'bg-gray-100 text-gray-800 border-gray-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      lost: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/laundry/${orderId}/status`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ laundryStatus: newStatus, updateAllItems: true })
      });
      
      if (response.ok) {
        toast.success('Status updated successfully');
        fetchOrders();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (orderId) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/laundry/${orderId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success('Order deleted successfully');
        fetchOrders();
      } else {
        toast.error('Failed to delete order');
      }
    } catch (error) {
      toast.error('Failed to delete order');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="text-blue-600" size={28} />
                Laundry Orders
              </h1>
              <p className="text-gray-600 mt-1">Manage and track all laundry orders</p>
            </div>
            <button
              onClick={() => navigate('/laundry/orders/create')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus size={20} />
              New Order
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="picked_up">Picked Up</option>
                <option value="ready">Ready</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="lost">Lost</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Status</label>
              <select
                value={filters.itemStatus}
                onChange={(e) => setFilters({...filters, itemStatus: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Items</option>
                <option value="pending">Pending</option>
                <option value="picked_up">Picked Up</option>
                <option value="ready">Ready</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="lost">Lost</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
              <select
                value={filters.orderType}
                onChange={(e) => setFilters({...filters, orderType: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="room_laundry">Room Laundry</option>
                <option value="hotel_laundry">Hotel Laundry</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Room, GRC, Guest..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setFilters({status: 'all', orderType: 'all', search: '', startDate: '', endDate: '', itemStatus: 'all'})}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Orders Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <Package className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">Create your first laundry order to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {order.orderType?.replace('_', ' ')}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900">GRC: {order.grcNo}</h3>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.laundryStatus)}`}>
                      {order.laundryStatus}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      <span>Room {order.roomNumber}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      <span>{order.requestedByName || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Items */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Items ({order.items?.length || 0})</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {order.items?.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span className={`${item.status === 'cancelled' || item.status === 'lost' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                            {item.itemName} {item.status === 'lost' ? '(Lost)' : item.status === 'cancelled' ? '(Cancelled)' : ''}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-xs ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </div>
                      ))}
                      {order.items?.length > 3 && (
                        <div className="text-xs text-gray-500">+{order.items.length - 3} more items</div>
                      )}
                    </div>
                  </div>

                  {/* Item Status Summary */}
                  {order.itemStatusSummary && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Status Summary</h4>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(order.itemStatusSummary).map(([status, count]) => (
                          <span key={status} className={`px-2 py-1 rounded text-xs ${getStatusColor(status)}`}>
                            {status}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-500">Service:</span>
                      <div className="font-medium capitalize">{order.serviceType}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Amount:</span>
                      <div className="font-medium text-green-600">₹{order.totalAmount}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <div className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Updated:</span>
                      <div className="font-medium">{new Date(order.updatedAt).toLocaleDateString()}</div>
                    </div>
                  </div>

                  {/* Status Update */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Update Status</label>
                    <select
                      value={order.laundryStatus}
                      onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="picked_up">Picked Up</option>
                      <option value="ready">Ready</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-gray-100 bg-gray-50">
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/laundry/orders/${order._id}`)}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Eye size={14} />
                      View
                    </button>
                    <button
                      onClick={() => navigate(`/laundry/orders/edit/${order._id}`)}
                      className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(order._id)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LaundryOrdersNew;