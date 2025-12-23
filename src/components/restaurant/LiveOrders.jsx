import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import CountdownTimer from "./CountdownTimer";

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

const LiveOrders = () => {
  const { axios } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [itemStates, setItemStates] = useState({});
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  


  // Custom event listener for immediate order status updates
  useEffect(() => {
    const handleOrderStatusChange = (e) => {
      const updateData = e.detail;
      console.log('🔄 Order status changed via custom event:', updateData);
      
      if (updateData.status === 'cancelled' || updateData.status === 'completed') {
        console.log('⚡ Removing cancelled/completed order from live view');
        setOrders(prevOrders => prevOrders.filter(order => order.orderId !== updateData.orderId));
        setTimeout(fetchOrders, 500);
      }
    };

    window.addEventListener('orderStatusChanged', handleOrderStatusChange);
    
    return () => {
      window.removeEventListener('orderStatusChanged', handleOrderStatusChange);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const [kotResponse, orderResponse] = await Promise.all([
        axios.get('/api/kot/all', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/restaurant-orders/all', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      console.log('KOT Response:', kotResponse.data);
      console.log('Order Response:', orderResponse.data);
      
      // Create a map of orders by ID for quick lookup
      const orderMap = new Map();
      orderResponse.data.forEach(order => {
        orderMap.set(order._id.toString(), order);
      });
      
      // Process KOT data with pricing from restaurant orders
      const activeOrders = kotResponse.data
        .filter(kot => {
          const restaurantOrder = orderMap.get(kot.orderId.toString());
          console.log('🔍 Checking KOT:', kot._id, 'KOT Status:', kot.status, 'Order Status:', restaurantOrder?.status);
          
          // Check both KOT status and restaurant order status
          const kotActive = kot.status && 
                           kot.status.toLowerCase() !== 'completed' && 
                           kot.status.toLowerCase() !== 'cancelled' &&
                           kot.status.toLowerCase() !== 'cancel';
          
          const orderActive = !restaurantOrder || 
                             (restaurantOrder.status.toLowerCase() !== 'completed' && 
                              restaurantOrder.status.toLowerCase() !== 'cancelled');
          
          const isActive = kotActive && orderActive;
          console.log('✅ KOT active:', kotActive, 'Order active:', orderActive, 'Final:', isActive);
          return isActive;
        })
        .map(kot => {
          const restaurantOrder = orderMap.get(kot.orderId.toString());
          console.log('Matching order for KOT:', kot.orderId, restaurantOrder);
          
          return {
            _id: kot._id,
            kotId: kot._id,
            orderId: kot.orderId, // Add orderId for tracking
            tableNo: kot.tableNo,
            customerName: restaurantOrder?.customerName || 'Guest',
            status: kot.status,
            createdAt: kot.createdAt,
            amount: restaurantOrder?.amount || 0,
            invoiceNumber: restaurantOrder?.invoiceNumber || kot.kotNumber || kot._id.slice(-4),
            items: kot.items?.map((item, index) => {
              const orderItem = restaurantOrder?.items?.find(oi => 
                oi.itemName === item.itemName
              );
              return {
                itemName: item.itemName,
                quantity: item.quantity,
                price: orderItem?.price || 0,
                prepTime: 0,
                status: 'pending'
              };
            }) || []
          };
        });
      
      console.log('Active Orders:', activeOrders);
      setOrders(activeOrders);
      setItemStates({});
    } catch (error) {
      console.error('Error fetching orders data:', error);
      setOrders([]);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setIsInitialLoading(true);
      await fetchOrders();
      setIsInitialLoading(false);
    };
    loadInitialData();
    
    // Set up refresh every 2 minutes when page is visible
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchOrders();
      }
    }, 120000);
    
    return () => clearInterval(interval);
  }, []);
  


  const updateOrderStatus = async (kotId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      
      // Find the KOT and its corresponding restaurant order
      const order = orders.find(o => o._id === kotId);
      if (!order) return;
      
      // Update KOT status
      await axios.patch(`/api/kot/${kotId}/status`, {
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update restaurant order status using the orderId from KOT
      const kotResponse = await axios.get('/api/kot/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const kot = kotResponse.data.find(k => k._id === kotId);
      
      if (kot && kot.orderId) {
        await axios.patch(`/api/restaurant-orders/${kot.orderId}/status`, {
          status: newStatus
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      // Immediately refresh orders to reflect the change
      await fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      // Still refresh on error to ensure UI is in sync
      fetchOrders();
    }
  };

  if (isInitialLoading) {
    return <DashboardLoader pageName="Live Orders Dashboard" />;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 animate-slideInLeft animate-delay-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Live Orders Dashboard</h1>
            <p className="text-gray-600">Manage kitchen orders</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchOrders}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
            >
              Refresh
            </button>

          </div>
        </div>
      </div>

      {/* Active Orders Count */}
      <div className="mb-6 animate-fadeInUp animate-delay-200">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">Active Orders ({orders.length})</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeInUp animate-delay-300">
        {orders.map((order, index) => (
          <div key={order._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 min-h-[320px] flex flex-col animate-scaleIn" style={{animationDelay: `${Math.min(index * 100 + 400, 800)}ms`}}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3">
              <div className="flex-1">
                <div className="text-xs sm:text-sm text-gray-500 truncate">
                  Invoice# {order.invoiceNumber} / {order.orderType || 'Dine In'}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>

            {/* Table Info */}
            <div className="flex items-center mb-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-semibold mr-2">
                {(order.tableNo?.toString().startsWith('R') || /^\d+$/.test(order.tableNo)) ? (order.tableNo?.toString().replace('R', '') || order.tableNo) : (order.tableNo || 'T')}
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500">{(order.tableNo?.toString().startsWith('R') || /^\d+$/.test(order.tableNo)) ? 'Room' : 'Table'}</div>
                <div className="text-sm font-medium truncate">
                  {(order.tableNo?.toString().startsWith('R') || /^\d+$/.test(order.tableNo)) ? `Room ${order.tableNo?.toString().replace('R', '')}` : (order.tableNo || 'N/A')}
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-end mb-3">
              <div className="text-xs sm:text-sm text-orange-500 font-medium">
                {order.items?.length || 0} Items →
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 mb-3">
              <div className="grid grid-cols-6 text-xs text-gray-500 font-medium border-b pb-2 mb-2 gap-2">
                <span className="text-center">✓</span>
                <span className="col-span-3">Items</span>
                <span className="text-right">Price</span>
                <span className="text-right">Timer</span>
              </div>
              <div className="max-h-32 sm:max-h-40 overflow-y-auto space-y-2">
                {order.items?.map((item, index) => (
                  <div key={index} className="grid grid-cols-6 text-xs sm:text-sm gap-2 py-1 border-b border-gray-100 last:border-b-0">
                    <div className="flex justify-center">
                      <input 
                        type="checkbox" 
                        className="w-3 h-3" 
                        checked={itemStates[`${order._id}-${index}`]?.checked || itemStates[`${order._id}-${index}`]?.status === 'delivered'}
                        disabled={itemStates[`${order._id}-${index}`]?.status === 'delivered'}
                        onChange={(e) => {
                          const key = `${order._id}-${index}`;
                          setItemStates(prev => ({
                            ...prev,
                            [key]: { 
                              ...prev[key], 
                              checked: e.target.checked 
                            }
                          }));
                        }}
                      />
                    </div>
                    <span 
                      className={`col-span-3 break-words text-xs leading-tight ${
                        itemStates[`${order._id}-${index}`]?.status === 'delivered' 
                          ? 'text-green-600 line-through' 
                          : itemStates[`${order._id}-${index}`]?.status === 'served' 
                          ? 'text-orange-600' 
                          : 'text-gray-700'
                      }`} 
                      title={`${item.itemName || item.name || 'Unknown'} x ${item.quantity || 1}`}
                    >
                      {item.itemName || item.name || 'Unknown'} x {item.quantity || 1}
                    </span>
                    <span className="text-right text-gray-600">₹{item.price || 0}</span>
                    <div className="text-right">
                      {item.prepTime > 0 && (
                        itemStates[`${order._id}-${index}`]?.status === 'delivered' ? (
                          <div className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-green-100 text-green-600">
                            <span className="text-xs">00:00</span>
                          </div>
                        ) : (
                          <CountdownTimer 
                            orderTime={order.createdAt}
                            prepTime={item.prepTime}
                            status={order.status}
                          />
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="border-t pt-2 mb-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-800 text-sm">Total</span>
                <span className="font-bold text-base sm:text-lg">₹{order.amount || 0}</span>
              </div>
            </div>

            {/* Action Buttons */}
            {order.status !== 'completed' && order.status !== 'cancelled' && (
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => updateOrderStatus(order._id, 'completed')}
                  className="w-full bg-green-500 text-white py-2 px-3 rounded text-sm font-medium hover:bg-green-600"
                >
                  Complete Order
                </button>
              </div>
            )}
            
            {/* Completed Status Display */}
            {order.status === 'completed' && (
              <div className="bg-green-100 border border-green-300 rounded-lg p-2 text-center">
                <span className="text-green-700 font-medium text-sm">✓ Order Completed</span>
              </div>
            )}
            
            {/* Cancelled Status Display */}
            {order.status === 'cancelled' && (
              <div className="bg-red-100 border border-red-300 rounded-lg p-2 text-center">
                <span className="text-red-700 font-medium text-sm">✗ Order Cancelled</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">🍳</div>
          <div className="text-gray-500">
            No active orders in kitchen
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveOrders;