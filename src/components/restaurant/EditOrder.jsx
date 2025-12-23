import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { showToast } from '../../utils/toaster';
import { ArrowLeft, Plus, Minus, Trash2, ShoppingCart, Save, X } from 'lucide-react';

const EditOrder = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { axios } = useAppContext();
  
  const [order, setOrder] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [editedItems, setEditedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrderAndMenu();
  }, [orderId]);

  const fetchOrderAndMenu = async () => {
    try {
      const token = localStorage.getItem('token');
      const [orderRes, menuRes] = await Promise.all([
        axios.get(`/api/restaurant-orders/all`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/menu-items', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const foundOrder = orderRes.data.find(o => o._id === orderId);
      if (!foundOrder) {
        showToast.error('Order not found');
        navigate('/restaurant/all-orders');
        return;
      }

      console.log('Found order:', foundOrder);
      console.log('Order items:', foundOrder.items);

      setOrder(foundOrder);
      // Ensure we copy all items properly
      const itemsCopy = foundOrder.items ? [...foundOrder.items] : [];
      console.log('Items copy:', itemsCopy);
      setEditedItems(itemsCopy);
      setMenuItems(menuRes.data.data || menuRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast.error('Failed to load order data');
    } finally {
      setLoading(false);
    }
  };

  const updateItemQuantity = (index, change) => {
    setEditedItems(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity: Math.max(1, item.quantity + change) } : item
    ));
  };

  const removeItem = (index) => {
    setEditedItems(prev => prev.filter((_, i) => i !== index));
  };

  const addNewItem = (menuItem) => {
    const existingIndex = editedItems.findIndex(item => item.itemId === menuItem._id);
    if (existingIndex >= 0) {
      updateItemQuantity(existingIndex, 1);
      showToast.success(`Increased ${menuItem.name} quantity`);
    } else {
      setEditedItems(prev => [...prev, {
        itemId: menuItem._id,
        itemName: menuItem.name,
        price: menuItem.Price || menuItem.price || 0,
        quantity: 1
      }]);
      showToast.success(`Added ${menuItem.name} to order`);
    }
  };

  const calculateTotal = () => {
    return editedItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const saveChanges = async () => {
    if (editedItems.length === 0) {
      showToast.error('Order must have at least one item');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const newTotal = calculateTotal();
      
      await axios.patch(`/api/restaurant-orders/${orderId}`, {
        items: editedItems,
        amount: newTotal,
        subtotal: newTotal
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showToast.success('Order updated successfully');
      navigate('/restaurant/all-orders');
    } catch (error) {
      console.error('Error updating order:', error);
      showToast.error('Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!order) {
    return <div className="text-center py-12">Order not found</div>;
  }

  const filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/restaurant/all-orders')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Orders
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Edit Order #{order._id.slice(-6)}
                </h1>
                <p className="text-sm text-gray-500">
                  {order.customerName} • Table {order.tableNo} • {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-indigo-600">₹{calculateTotal()}</div>
                <div className="text-sm text-gray-500">{editedItems.length} items</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Order Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <ShoppingCart className="w-5 h-5 mr-2 text-indigo-600" />
                    Order Items
                  </h2>
                  <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {editedItems.length} items
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                {editedItems.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No items in order</p>
                    <p className="text-sm text-gray-400">Add items from the menu</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {editedItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-200 transition-colors">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{item.itemName}</h3>
                          <p className="text-sm text-gray-500">₹{item.price} each</p>
                          <p className="text-sm font-medium text-indigo-600">₹{item.price * item.quantity} total</p>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-300">
                            <button
                              onClick={() => updateItemQuantity(index, -1)}
                              className="p-2 hover:bg-gray-100 rounded-l-lg transition-colors"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-4 h-4 text-gray-600" />
                            </button>
                            <span className="px-3 py-2 font-medium text-gray-900 min-w-[3rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateItemQuantity(index, 1)}
                              className="p-2 hover:bg-gray-100 rounded-r-lg transition-colors"
                            >
                              <Plus className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                          
                          <button
                            onClick={() => removeItem(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => navigate('/restaurant/all-orders')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={saveChanges}
                disabled={saving || editedItems.length === 0}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Menu Items */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Add Items</h2>
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="Search menu items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <div className="p-4">
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {filteredMenuItems.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No items found</p>
                  ) : (
                    filteredMenuItems.map((item) => {
                      const isInOrder = editedItems.some(orderItem => orderItem.itemId === item._id);
                      return (
                        <div key={item._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-indigo-200 hover:bg-indigo-50 transition-colors">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{item.name}</h3>
                            <p className="text-sm text-gray-500">₹{item.Price || item.price || 0}</p>
                            {isInOrder && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                                In order
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => addNewItem(item)}
                            className="ml-3 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditOrder;