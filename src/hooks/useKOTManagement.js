import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import soundManager from '../utils/sound';

export const useKOTManagement = () => {
  const { axios } = useAppContext();
  
  const [activeTab, setActiveTab] = useState('kots');
  const [kots, setKots] = useState([]);
  const [kotHistory, setKotHistory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [chefs, setChefs] = useState([]);
  const [tables, setTables] = useState([]);
  const [kotForm, setKotForm] = useState({
    orderId: '',
    tableNo: '',
    items: [],
    priority: 'normal',
    estimatedTime: '',
    assignedChef: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredKots, setFilteredKots] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [newOrderNotification, setNewOrderNotification] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [userRestaurantRole, setUserRestaurantRole] = useState(null);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const socket = null; // WebSocket disabled

  useEffect(() => {
    const loadInitialData = async () => {
      setIsInitialLoading(true);
      await Promise.all([
        fetchUserRole(),
        fetchMenuItems(),
        fetchKOTs(),
        fetchOrders(),
        fetchChefs(),
        fetchTables()
      ]);
      setIsInitialLoading(false);
    };
    
    loadInitialData();
    
    // Polling for new orders
    const pollInterval = setInterval(() => {
      checkForNewOrders();
      fetchKOTs();
      fetchOrders();
    }, 5000);
    
    return () => clearInterval(pollInterval);
  }, [socket]);
  
  useEffect(() => {
    if (menuItems.length > 0) {
      fetchKOTs();
    }
  }, [menuItems]);

  const checkForNewOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/restaurant-orders/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const orders = response.data || [];
      const currentOrderCount = orders.length;
      
      if (lastOrderCount > 0 && currentOrderCount > lastOrderCount) {
        const sortedOrders = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const newOrder = sortedOrders[0];
        
        soundManager.playNewKOTSound();
        
        setNewOrderNotification({
          tableNo: newOrder.tableNo,
          itemCount: newOrder.items?.length || 0,
          orderId: newOrder._id,
          items: newOrder.items || []
        });
        setTimeout(() => setNewOrderNotification(null), 10000);
      }
      
      if (lastOrderCount === 0) {
        setLastOrderCount(currentOrderCount);
      } else {
        setLastOrderCount(currentOrderCount);
      }
    } catch (error) {
      console.error('Error checking for new orders:', error);
    }
  };

  const fetchKOTs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/restaurant-orders/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const consolidatedOrders = response.data.map(order => {
        const allItems = (order.allKotItems || order.items || []).map(item => {
          if (typeof item === 'string') {
            return { name: item, quantity: 1, kotNumber: 1 };
          }
          
          if (typeof item === 'object') {
            let itemName = item.name || item.itemName;
            
            if (item.itemId && menuItems.length > 0) {
              const menuItem = menuItems.find(mi => mi._id === item.itemId || mi.id === item.itemId);
              if (menuItem) {
                itemName = menuItem.name || menuItem.itemName;
              }
            }
            
            if (!itemName && menuItems.length > 0) {
              const menuItem = menuItems.find(mi => 
                mi.name === item.name || 
                mi.itemName === item.itemName ||
                mi._id === item.id
              );
              if (menuItem) {
                itemName = menuItem.name || menuItem.itemName;
              }
            }
            
            return {
              ...item,
              name: itemName || 'Unknown Item',
              kotNumber: item.kotNumber || 1
            };
          }
          
          return item;
        });
        
        return {
          _id: order._id,
          orderId: order._id,
          tableNo: order.tableNo,
          status: order.status || 'pending',
          orderStatus: order.status || 'pending',
          items: allItems,
          kotCount: order.kotCount || 1,
          priority: order.priority || 'normal',
          assignedChef: order.assignedChef,
          createdAt: order.createdAt
        };
      });
      
      const activeOrders = consolidatedOrders.filter(order => {
        const isServed = order.status === 'served';
        const isPaid = order.status === 'paid';
        const isCompleted = order.status === 'completed';
        const isCancelled = order.status === 'cancelled';
        
        return !isServed && !isPaid && !isCompleted && !isCancelled;
      });
      
      const historyOrders = consolidatedOrders.filter(order => {
        const isServed = order.status === 'served';
        const isPaid = order.status === 'paid';
        const isCompleted = order.status === 'completed';
        const isCancelled = order.status === 'cancelled';
        
        return isServed || isPaid || isCompleted || isCancelled;
      });
      
      if (kots.length > 0 && activeOrders.length > kots.length) {
        const newOrder = activeOrders[activeOrders.length - 1];
        
        soundManager.playNewKOTSound();
        
        setNewOrderNotification({
          tableNo: newOrder.tableNo,
          itemCount: newOrder.items?.length || 0,
          orderId: newOrder.orderId,
          items: newOrder.items || []
        });
        
        setTimeout(() => {
          setNewOrderNotification(null);
        }, 10000);
      }
      
      setKots(activeOrders);
      setKotHistory(historyOrders);
      
      // Only update filteredKots if no search is active
      if (!searchQuery.trim()) {
        setFilteredKots(activeTab === 'history' ? historyOrders : activeOrders);
      }
    } catch (error) {
      console.error('Error fetching consolidated orders:', error);
    }
  };
  
  const fetchMenuItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/items/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const itemsData = Array.isArray(response.data) ? response.data : (response.data.items || []);
      setMenuItems(itemsData);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/restaurant-orders/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchChefs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/search/field?model=users&field=role&value=restaurant', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const chefData = Array.isArray(response.data) ? response.data : (response.data.users || response.data.data || []);
      setChefs(chefData.filter(user => user.restaurantRole === 'chef'));
    } catch (error) {
      console.error('Error fetching chefs:', error);
    }
  };

  const fetchTables = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/restaurant/tables', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const tableData = Array.isArray(response.data) ? response.data : (response.data.tables || response.data.data || []);
      setTables(tableData);
    } catch (error) {
      console.error('Error fetching tables:', error);
      setTables([]);
    }
  };

  const fetchUserRole = async () => {
    try {
      const role = localStorage.getItem('role');
      const restaurantRole = localStorage.getItem('restaurantRole');
      
      setUserRole(role);
      setUserRestaurantRole(restaurantRole);
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  return {
    // State
    activeTab,
    kots,
    kotHistory,
    orders,
    chefs,
    tables,
    kotForm,
    searchQuery,
    filteredKots,
    currentPage,
    itemsPerPage,
    newOrderNotification,
    menuItems,
    userRole,
    userRestaurantRole,
    lastOrderCount,
    isInitialLoading,
    
    // Setters
    setActiveTab,
    setKots,
    setKotHistory,
    setOrders,
    setChefs,
    setTables,
    setKotForm,
    setSearchQuery,
    setFilteredKots,
    setCurrentPage,
    setNewOrderNotification,
    setMenuItems,
    setUserRole,
    setUserRestaurantRole,
    setLastOrderCount,
    
    // Functions
    checkForNewOrders,
    fetchKOTs,
    fetchMenuItems,
    fetchOrders,
    fetchChefs,
    fetchTables,
    fetchUserRole,
    
    // KOT Actions
    createKOT: async (e) => {
      e.preventDefault();
      try {
        const token = localStorage.getItem('token');
        const response = await axios.post('/api/kot/create', kotForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (kotForm.assignedChef) {
          try {
            await axios.post('/api/notifications/create', {
              title: 'New KOT Assigned',
              message: `New KOT for Table ${kotForm.tableNo} - ${kotForm.items?.length || 0} items (Priority: ${kotForm.priority})`,
              type: 'kitchen',
              priority: kotForm.priority,
              department: 'kitchen',
              userId: kotForm.assignedChef
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
          } catch (notifError) {
            console.error('Notification failed:', notifError);
          }
        }
        
        alert('KOT created successfully!');
        setKotForm({
          orderId: '',
          tableNo: '',
          items: [],
          priority: 'normal',
          estimatedTime: '',
          assignedChef: ''
        });
        fetchKOTs();
      } catch (error) {
        console.error('Error creating KOT:', error);
        alert('Failed to create KOT');
      }
    },
    
    updateKOTStatus: async (kotId, newStatus, orderId) => {
      try {
        const token = localStorage.getItem('token');
        
        await axios.patch(`/api/kot/${kotId}/status`, {
          status: newStatus
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const getOrderStatusFromKOT = (kotStatus) => {
          switch (kotStatus) {
            case 'pending': return 'pending';
            case 'preparing': return 'preparing';
            case 'ready': return 'ready';
            case 'served': return 'served';
            default: return null;
          }
        };
        
        const orderStatus = getOrderStatusFromKOT(newStatus);
        if (orderStatus && orderId) {
          await axios.patch(`/api/restaurant-orders/${orderId}/status`, {
            status: orderStatus
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          alert(`Order status updated to ${orderStatus}`);
        }
        
        fetchKOTs();
        fetchOrders();
      } catch (error) {
        console.error('Error updating KOT status:', error);
        alert('Failed to update status');
      }
    },
    
    printKOT: (kot) => {
      const printWindow = window.open('', '_blank');
      const printContent = `
          <!DOCTYPE html>
          <html>
          <head>
              <title>KOT #${kot.displayNumber || kot.kotNumber?.slice(-3) || kot.orderId?.slice(-6) || 'N/A'}</title>
              <style>
                  @page {
                      size: 80mm auto;
                      margin: 0;
                  }
                  body {
                      margin: 0;
                      padding: 0;
                      font-family: monospace;
                      width: 80mm;
                      font-size: 10px;
                  }
                  .print-content {
                      width: 80mm;
                      max-width: 80mm;
                      margin: 0;
                      padding: 2mm;
                      font-size: 10px;
                      line-height: 1.2;
                      box-sizing: border-box;
                  }
                  .print-header {
                      font-size: 12px;
                      font-weight: bold;
                  }
                  .text-center { text-align: center; }
                  .mb-1 { margin-bottom: 4px; }
                  .mb-2 { margin-bottom: 8px; }
                  .mb-3 { margin-bottom: 12px; }
                  .border-b { border-bottom: 1px solid #000; }
                  .flex { display: flex; }
                  .justify-between { justify-content: space-between; }
                  .font-bold { font-weight: bold; }
              </style>
          </head>
          <body>
              <div class="print-content">
                  <div class="text-center mb-3">
                      <div class="print-header mb-2">RESTAURANT</div>
                      <div class="mb-1">KITCHEN ORDER TICKET</div>
                      <div class="border-b mb-2"></div>
                  </div>

                  <div class="mb-3">
                      <div class="flex justify-between mb-1">
                          <span>KOT #: ${kot.displayNumber || kot.kotNumber?.slice(-3) || kot.orderId?.slice(-6) || 'N/A'}</span>
                          <span>Table: ${kot.tableNo || 'N/A'}</span>
                      </div>
                      <div class="flex justify-between mb-1">
                          <span>Date: ${new Date().toLocaleDateString('en-GB')}</span>
                          <span>Time: ${new Date().toLocaleTimeString('en-GB', { hour12: false })}</span>
                      </div>
                      <div class="flex justify-between mb-2">
                          <span>Status: ${kot.status?.toUpperCase() || 'PENDING'}</span>
                          <span>Priority: ${kot.priority?.toUpperCase() || 'NORMAL'}</span>
                      </div>
                      <div class="border-b mb-2"></div>
                  </div>

                  <div class="mb-2">
                      <div class="flex justify-between font-bold border-b mb-1">
                          <span style="width: 40%">Item</span>
                          <span style="width: 15%; text-align: center">Qty</span>
                          <span style="width: 15%; text-align: center">KOT</span>
                          <span style="width: 30%">Notes</span>
                      </div>
                  </div>

                  <div class="mb-3">
                      ${kot.items?.map(item => {
                          const itemName = typeof item === 'string' ? item : (item.name || item.itemName || 'Unknown Item');
                          const quantity = typeof item === 'object' ? (item.quantity || 1) : 1;
                          const kotNumber = typeof item === 'object' ? (item.kotNumber || 1) : 1;
                          const note = typeof item === 'object' ? (item.note || '') : '';
                          return `
                              <div class="flex justify-between mb-1">
                                  <span style="width: 40%">${itemName}</span>
                                  <span style="width: 15%; text-align: center">${quantity}</span>
                                  <span style="width: 15%; text-align: center">K${kotNumber}</span>
                                  <span style="width: 30%">${note || '-'}</span>
                              </div>
                          `;
                      }).join('') || '<div>No items</div>'}
                      <div class="border-b mb-2"></div>
                  </div>

                  <div class="mb-3">
                      <div class="mb-1">Chef: ${kot.assignedChef?.name || 'Unassigned'}</div>
                      <div class="mb-1">Total Items: ${kot.items?.length || 0}</div>
                      <div class="border-b mb-2"></div>
                  </div>

                  <div class="text-center mb-3">
                      <div class="mb-2">Kitchen Copy</div>
                      <div class="border-b mb-2"></div>
                      <div>Printed: ${new Date().toLocaleString('en-GB')}</div>
                  </div>
              </div>
              
              <script>
                  window.onload = function() {
                      window.print();
                      window.onafterprint = function() {
                          window.close();
                      };
                  };
              </script>
          </body>
          </html>
      `;
      
      printWindow.document.write(printContent);
      printWindow.document.close();
    },
    
    getStatusColor: (status) => {
      switch (status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'preparing': return 'bg-blue-100 text-blue-800';
        case 'ready': return 'bg-green-100 text-green-800';
        case 'served': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    },
    
    getPriorityColor: (priority) => {
      switch (priority) {
        case 'urgent': return 'bg-red-100 text-red-800';
        case 'high': return 'bg-orange-100 text-orange-800';
        case 'normal': return 'bg-blue-100 text-blue-800';
        case 'low': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    },
    
    handleSearch: (e) => {
      e.preventDefault();
      const sourceKots = activeTab === 'history' ? kotHistory : kots;
      if (searchQuery.trim()) {
        const filtered = sourceKots.filter(kot => 
          kot.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          kot._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          kot.tableNo?.toString().includes(searchQuery)
        );
        setFilteredKots(filtered);
      } else {
        setFilteredKots(sourceKots);
      }
    }
  };
};