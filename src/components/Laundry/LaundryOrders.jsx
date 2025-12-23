import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ClipboardList, Eye, Edit, Trash2, X, Filter, Search, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import LossReportModal from './LossReportModal';
import DashboardLoader from '../DashboardLoader';

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

const LaundryOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editItems, setEditItems] = useState([]);
  const [laundryItems, setLaundryItems] = useState([]);
  const [showLossModal, setShowLossModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    orderType: 'all',
    search: '',
    startDate: '',
    endDate: '',
    itemStatus: 'all'
  });
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsInitialLoading(true);
      await Promise.all([fetchOrders(), fetchLaundryItems()]);
      setIsInitialLoading(false);
    };
    loadInitialData();
  }, []);
  
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
      setLaundryItems([]);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      picked_up: 'bg-blue-100 text-blue-800',
      ready: 'bg-green-100 text-green-800',
      delivered: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleView = (orderId) => {
    // Find order from existing orders array instead of API call
    const order = orders.find(o => o._id === orderId);
    if (!order) {
      toast.error('Order not found');
      return;
    }
    
    setSelectedOrder(order);
    setShowViewModal(true);
  };

  const handleEdit = (orderId) => {
    // Find order from existing orders array instead of API call
    const order = orders.find(o => o._id === orderId);
    if (!order) {
      toast.error('Order not found');
      return;
    }
    
    setSelectedOrder(order);
    setEditFormData(order);
    setEditItems(order.items || []);
    setShowEditModal(true);
  };

  const handleUpdateOrder = async () => {
    try {
      // Check which NEW items don't have rateId (existing items may not have rateId)
      const newItemsWithoutRateId = editItems.filter(item => !item._id && (!item.rateId || item.rateId.trim() === ''));
      
      if (newItemsWithoutRateId.length > 0) {
        toast.error(`Please select items from dropdown for ${newItemsWithoutRateId.length} new item(s)`);
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
        setShowEditModal(false);
        fetchOrders();
      } else {
        const errorData = await response.json();

        toast.error(errorData.error || 'Failed to update order');
      }
    } catch (error) {

      toast.error('Failed to update order');
    }
  };

  const addNewItem = () => {
    setEditItems([...editItems, { itemName: '', quantity: 1, price: 0, rateId: '' }]);
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

  const handleCancel = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/laundry/${orderId}/cancel`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cancelAllItems: true })
      });
      
      if (response.ok) {
        toast.success('Order cancelled successfully');
        fetchOrders();
      } else {
        toast.error('Failed to cancel order');
      }
    } catch (error) {
      toast.error('Failed to cancel order');
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

  const handleInvoice = (orderId) => {
    // Navigate to invoice generation or open invoice modal
    toast.info('Invoice generation feature coming soon');
  };

  const handleReturn = (orderId) => {
    // Handle return process
    toast.info('Return process feature coming soon');
  };

  const handleLoss = (orderId) => {
    // Find order from existing orders array instead of API call
    const order = orders.find(o => o._id === orderId);
    if (!order) {
      toast.error('Order not found');
      return;
    }
    
    setSelectedOrder(order);
    setShowLossModal(true);
  };

  const handlePayNow = (orderId) => {
    // Handle payment process
    toast.info('Payment processing feature coming soon');
  };

  const handleLossReportSuccess = () => {
    fetchOrders();
  };

  if (isInitialLoading) {
    return <DashboardLoader pageName="Laundry Orders" />;
  }

  return (
    <div className="min-h-screen bg-background p-4" style={{opacity: loading && orders.length === 0 ? 0 : 1, transition: 'opacity 0.3s ease-in-out'}}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-4 mb-4 border border-border animate-slideInLeft animate-delay-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-text">Laundry Order Management</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/laundry/orders/create')}
                className="px-4 py-2 bg-primary hover:bg-hover text-white rounded-lg flex items-center gap-2 text-sm transition-all duration-200"
                title="Create New Laundry Order"
              >
                <Plus size={16} />
                New Order
              </button>
              <button
                onClick={() => navigate('/laundry/items')}
                className="px-4 py-2 bg-secondary hover:bg-primary text-white rounded-lg flex items-center gap-2 text-sm transition-all duration-200"
                title="Manage Laundry Rates"
              >
                <Plus size={16} />
                Add Rate
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-3 mb-4 shadow border border-border animate-fadeInUp animate-delay-200">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-primary" />
              <span className="text-sm font-medium text-text">Filters:</span>
            </div>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="px-3 py-1.5 text-sm border border-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="picked_up">Picked Up</option>
              <option value="ready">Ready</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="lost">Lost</option>
            </select>
            
            <select
              value={filters.itemStatus}
              onChange={(e) => setFilters({...filters, itemStatus: e.target.value})}
              className="px-3 py-1.5 text-sm border border-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
            >
              <option value="all">All Items</option>
              <option value="pending">Item Pending</option>
              <option value="picked_up">Item Picked Up</option>
              <option value="ready">Item Ready</option>
              <option value="delivered">Item Delivered</option>
              <option value="cancelled">Item Cancelled</option>
              <option value="lost">Item Lost</option>
            </select>
            
            <select
              value={filters.orderType}
              onChange={(e) => setFilters({...filters, orderType: e.target.value})}
              className="px-3 py-1.5 text-sm border border-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
            >
              <option value="all">All Types</option>
              <option value="room_laundry">Room Laundry</option>
              <option value="hotel_laundry">Hotel Laundry</option>
            </select>
            
            <div className="relative">
              <Search size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Room or GRC"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="pl-7 pr-3 py-1.5 text-sm border border-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary w-32"
              />
            </div>
            
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              className="px-3 py-1.5 text-sm border border-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
            />
            
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              className="px-3 py-1.5 text-sm border border-border rounded-lg focus:ring-1 focus:ring-primary focus:border-primary"
            />
            
            <button
              onClick={() => setFilters({status: 'all', orderType: 'all', search: '', startDate: '', endDate: '', itemStatus: 'all'})}
              className="px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
              title="Clear All Filters"
            >
              Clear
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg text-center py-16 border border-border">
            <ClipboardList className="mx-auto mb-4 text-gray-400" size={64} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No orders found</h3>
            <p className="text-gray-500">Try adjusting your filters or create a new order</p>
          </div>
        ) : (
        <>
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {orders.map((order, index) => (
              <div key={order._id} className="bg-white rounded-2xl shadow-lg p-6 border border-border hover:shadow-xl transition-all duration-200 animate-scaleIn" style={{animationDelay: `${Math.min(index * 100 + 300, 700)}ms`}}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">GRC: {order.grcNo}</h3>
                    <p className="text-gray-600 font-medium">Room: {order.roomNumber}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(order.laundryStatus)}`}>
                    {order.laundryStatus}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Items:</span> <span className="font-medium">{order.items?.length || 0} items</span></div>
                  <div><span className="text-gray-500">Amount:</span> <span className="font-medium">₹{order.totalAmount}</span></div>
                  <div className="col-span-2"><span className="text-gray-500">Type:</span> <span className="font-medium">{order.serviceType}</span></div>
                  {order.itemStatusSummary && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Item Status:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(order.itemStatusSummary).map(([status, count]) => (
                          <span key={status} className={`px-1 py-0.5 rounded text-xs ${
                            status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            status === 'picked_up' ? 'bg-blue-100 text-blue-700' :
                            status === 'ready' ? 'bg-green-100 text-green-700' :
                            status === 'delivered' ? 'bg-gray-100 text-gray-700' :
                            status === 'lost' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {status}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <button 
                    onClick={() => handleView(order._id)} 
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors text-sm"
                  >
                    View
                  </button>
                  {order.laundryStatus !== 'cancelled' && (
                    <>
                      <button 
                        onClick={() => handleEdit(order._id)} 
                        className="text-green-600 hover:text-green-800 hover:bg-green-50 px-2 py-1 rounded transition-colors text-sm"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleCancel(order._id)} 
                        className="text-orange-600 hover:text-orange-800 hover:bg-orange-50 px-2 py-1 rounded transition-colors text-sm"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => handleDelete(order._id)} 
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors text-sm"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-2xl shadow-lg overflow-hidden border border-border">
            <table className="min-w-full">
              <thead className="bg-background">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-text uppercase tracking-wider">#</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-text uppercase tracking-wider">Order Info</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-text uppercase tracking-wider">Service Type</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-text uppercase tracking-wider">Items</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-text uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-text uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-text uppercase tracking-wider">Dates</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-text uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order, index) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors duration-150 animate-fadeInUp" style={{animationDelay: `${Math.min(index * 50 + 300, 800)}ms`}}>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-accent text-primary rounded-full font-bold text-sm">
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-gray-900">{order.orderType === 'room_laundry' ? 'Room Laundry' : 'Hotel Laundry'}</div>
                        <div className="text-gray-600 text-sm">Room: <span className="font-medium">{order.roomNumber}</span></div>
                        <div className="text-gray-500 text-xs">GRC: {order.grcNo}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {order.vendorId?.vendorName || (order.serviceType === 'vendor' ? 'Vendor' : 'In-House')}
                      </div>
                      {order.vendorOrderId && <div className="text-gray-500 text-sm">{order.vendorOrderId}</div>}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm">
                        <div>{order.items?.length || 0} items</div>
                        <div className="text-xs space-y-1">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className={`${item.status === 'cancelled' || item.status === 'lost' ? 'text-red-600 line-through' : 'text-gray-700'}`}>
                                {item.itemName} {item.status === 'lost' ? '(Lost)' : item.status === 'cancelled' ? '(Cancelled)' : ''}
                              </span>
                              <span className={`px-1 py-0.5 rounded text-xs ${
                                item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                item.status === 'picked_up' ? 'bg-blue-100 text-blue-700' :
                                item.status === 'ready' ? 'bg-green-100 text-green-700' :
                                item.status === 'delivered' ? 'bg-gray-100 text-gray-700' :
                                item.status === 'lost' ? 'bg-orange-100 text-orange-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {item.status}
                              </span>
                            </div>
                          ))}
                        </div>
                        {order.itemStatusSummary && (
                          <div className="text-xs text-gray-500 mt-1">
                            {Object.entries(order.itemStatusSummary).map(([status, count]) => (
                              <span key={status} className="mr-2">{status}: {count}</span>
                            ))}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">₹{order.items?.reduce((sum, item) => sum + (item.calculatedAmount || 0), 0) || 0}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.laundryStatus}
                        onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                        className="text-sm border border-border rounded-lg px-3 py-2 hover:border-primary focus:border-primary focus:ring-2 focus:ring-accent focus:outline-none transition-all duration-200 bg-white"
                        title="Update Order Status"
                      >
                        <option value="pending">Pending</option>
                        <option value="picked_up">Picked Up</option>
                        <option value="ready">Ready</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="lost">Lost</option>
                      </select>
                      <div className="flex items-center mt-2">
                        <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                          order.laundryStatus === 'pending' ? 'bg-yellow-400' :
                          order.laundryStatus === 'picked_up' ? 'bg-blue-400' :
                          order.laundryStatus === 'ready' ? 'bg-green-400' :
                          order.laundryStatus === 'delivered' ? 'bg-gray-400' :
                          order.laundryStatus === 'cancelled' ? 'bg-red-400' :
                          'bg-orange-400'
                        }`}></span>
                        <span className="text-sm font-medium capitalize text-gray-700">{order.laundryStatus}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-lg font-bold text-gray-900">₹{order.totalAmount || 0}</div>
                        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Unpaid
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="space-y-1">
                        <div className="text-gray-600">
                          <span className="font-medium">Created:</span><br/>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-gray-500 text-xs">
                          Updated: {new Date(order.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button 
                          onClick={() => handleView(order._id)} 
                          className="px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white text-xs rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 shadow-sm hover:shadow-md"
                          title="View Order"
                        >
                          View
                        </button>
                        {order.laundryStatus !== 'cancelled' && (
                          <>
                            <button 
                              onClick={() => handleEdit(order._id)} 
                              className="px-3 py-1.5 bg-primary hover:bg-hover text-white text-xs rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 shadow-sm hover:shadow-md"
                              title="Edit Order"
                            >
                              Edit
                            </button>
                            {/* Only show Loss button if there are items that are not lost */}
                            {order.items?.some(item => item.status !== 'lost') && (
                              <button 
                                onClick={() => handleLoss(order._id)} 
                                className="px-3 py-1.5 bg-secondary hover:bg-primary text-white text-xs rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 shadow-sm hover:shadow-md"
                                title="Report Loss"
                              >
                                Loss
                              </button>
                            )}
                            <button 
                              onClick={() => handleCancel(order._id)} 
                              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 shadow-sm hover:shadow-md"
                              title="Cancel Order"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
        )}

        {/* View Modal */}
        {showViewModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50" style={{animation: 'fadeIn 0.15s ease-out'}}>
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" style={{animation: 'slideIn 0.15s ease-out'}}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">View Order</h2>
                <button 
                  onClick={() => setShowViewModal(false)} 
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1 rounded transition-colors duration-200"
                  title="Close Modal"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="font-medium">GRC:</span> {selectedOrder.grcNo}</div>
                <div><span className="font-medium">Room:</span> {selectedOrder.roomNumber}</div>
                <div><span className="font-medium">Guest:</span> {selectedOrder.requestedByName}</div>
                <div><span className="font-medium">Status:</span> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusBadge(selectedOrder.laundryStatus)}`}>
                    {selectedOrder.laundryStatus}
                  </span>
                </div>
                <div><span className="font-medium">Service:</span> {selectedOrder.serviceType}</div>
                <div><span className="font-medium">Amount:</span> ₹{selectedOrder.totalAmount}</div>
              </div>
              <div className="mt-4">
                <h3 className="font-medium mb-2">Items:</h3>
                {selectedOrder.items?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded mb-1">
                    <div className="flex flex-col">
                      <span className={item.status === 'cancelled' || item.status === 'lost' ? 'line-through text-red-600' : ''}>
                        {item.itemName} {item.status === 'lost' ? '(Lost)' : item.status === 'cancelled' ? '(Cancelled)' : ''}
                      </span>
                      <span className="text-xs text-gray-500">
                        Qty: {item.quantity} | Delivered: {item.deliveredQuantity || 0}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span>₹{item.calculatedAmount || (item.price * item.quantity)}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        item.status === 'picked_up' ? 'bg-blue-100 text-blue-700' :
                        item.status === 'ready' ? 'bg-green-100 text-green-700' :
                        item.status === 'delivered' ? 'bg-gray-100 text-gray-700' :
                        item.status === 'lost' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <LossReportModal
          isOpen={showLossModal}
          onClose={() => setShowLossModal(false)}
          selectedOrder={selectedOrder}
          onSuccess={handleLossReportSuccess}
        />

        {/* Edit Modal */}
        {showEditModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50" style={{animation: 'fadeIn 0.15s ease-out'}}>
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" style={{animation: 'slideIn 0.15s ease-out'}}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Edit Order</h2>
                <button 
                  onClick={() => setShowEditModal(false)} 
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
                    <input type="text" value={editFormData.grcNo || ''} onChange={(e) => setEditFormData({...editFormData, grcNo: e.target.value})} className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Room Number</label>
                    <input type="text" value={editFormData.roomNumber || ''} onChange={(e) => setEditFormData({...editFormData, roomNumber: e.target.value})} className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Guest Name</label>
                    <input type="text" value={editFormData.requestedByName || ''} onChange={(e) => setEditFormData({...editFormData, requestedByName: e.target.value})} className="w-full p-2 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select value={editFormData.laundryStatus || 'pending'} onChange={(e) => setEditFormData({...editFormData, laundryStatus: e.target.value})} className="w-full p-2 border rounded">
                      <option value="pending">Pending</option>
                      <option value="picked_up">Picked Up</option>
                      <option value="ready">Ready</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Service Type</label>
                    <select value={editFormData.serviceType || 'inhouse'} onChange={(e) => setEditFormData({...editFormData, serviceType: e.target.value})} className="w-full p-2 border rounded">
                      <option value="inhouse">In-House</option>
                      <option value="vendor">Vendor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Total Amount</label>
                    <input type="number" value={editFormData.totalAmount || 0} onChange={(e) => setEditFormData({...editFormData, totalAmount: parseFloat(e.target.value)})} className="w-full p-2 border rounded" />
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
                      <div key={index} className={`grid gap-2 p-2 bg-gray-50 rounded ${item.rateId ? 'grid-cols-4' : 'grid-cols-5'}`}>
                        {!item.rateId && (
                          <select
                            value={item.rateId || ''}
                            onChange={(e) => handleItemSelect(index, e.target.value)}
                            className="p-2 border rounded"
                          >
                            <option value="">Select Item</option>
                            {laundryItems.map((laundryItem) => (
                              <option key={laundryItem._id} value={laundryItem._id}>
                                {laundryItem.itemName} - ₹{laundryItem.rate}
                              </option>
                            ))}
                          </select>
                        )}
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                          placeholder="Item name"
                          className="p-2 border rounded"
                        />
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          placeholder="Quantity"
                          className="p-2 border rounded"
                        />
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                          placeholder="Price"
                          className="p-2 border rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors duration-200"
                          title="Remove Item"
                        >
                          Remove
                        </button>
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
                    onClick={() => setShowEditModal(false)} 
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors duration-200"
                    title="Cancel Changes"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LaundryOrders;