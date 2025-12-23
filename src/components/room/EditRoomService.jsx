import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Minus } from 'lucide-react';
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

const EditRoomService = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOrder();
    fetchItems();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/room-service/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
        setOrderItems(data.order.items || []);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/inventory/items`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const items = data.items || data || [];
        setAvailableItems(items.map(item => ({
          ...item,
          id: item._id,
          name: item.itemName || item.name,
          price: item.pricePerUnit || item.sellingPrice || item.price || 0,
          stock: item.currentStock || item.stock || 0
        })));
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const addItem = (item) => {
    const existingItem = orderItems.find(oi => oi.itemName === item.name);
    if (existingItem) {
      setOrderItems(orderItems.map(oi => 
        oi.itemName === item.name
          ? {...oi, quantity: oi.quantity + 1, totalPrice: (oi.quantity + 1) * oi.unitPrice}
          : oi
      ));
    } else {
      setOrderItems([...orderItems, {
        itemName: item.name,
        quantity: 1,
        unitPrice: item.price,
        totalPrice: item.price,
        category: item.category || 'Restaurant'
      }]);
    }
  };

  const updateQuantity = (index, newQuantity) => {
    console.log(`Updating item ${index} to quantity ${newQuantity}`);
    
    if (newQuantity <= 0) {
      const filteredItems = orderItems.filter((_, i) => i !== index);
      console.log('Removing item, new items:', filteredItems);
      setOrderItems(filteredItems);
    } else {
      const updatedItems = [...orderItems];
      updatedItems[index] = {
        ...updatedItems[index],
        quantity: newQuantity,
        totalPrice: newQuantity * updatedItems[index].unitPrice
      };
      console.log('Updated items:', updatedItems);
      setOrderItems(updatedItems);
    }
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const handleSave = async () => {
    console.log('Current orderItems before save:', orderItems);
    
    if (orderItems.length === 0) {
      // If no items, cancel the order instead
      const confirmCancel = window.confirm('No items in order. This will cancel the order. Continue?');
      if (!confirmCancel) return;
      
      try {
        const token = localStorage.getItem('token');
        console.log('Token for cancel:', token);
        
        if (!token) {
          alert('Authentication token missing. Please login again.');
          return;
        }
        
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/room-service/${orderId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: 'cancelled' })
        });
        
        if (response.ok) {
          alert('Order cancelled successfully!');
          navigate('/room-service/history');
        }
      } catch (error) {
        alert('Error cancelling order');
      }
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Token for update:', token);
      
      if (!token) {
        alert('Authentication token missing. Please login again.');
        setSaving(false);
        return;
      }
      
      // Calculate totals
      const subtotal = calculateTotal();
      const updateData = {
        items: orderItems,
        subtotal,
        totalAmount: subtotal
      };

      console.log('Sending update data:', updateData);
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/room-service/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);

      if (response.ok) {
        alert('Order updated successfully!');
        navigate('/room-service/history');
      } else {
        alert(`Error: ${result.message || 'Failed to update order'}`);
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Error updating order');
    } finally {
      setSaving(false);
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
            onClick={() => navigate('/room-service/history')}
            className="flex items-center hover:opacity-80 transition-opacity text-lg"
            style={{color: '#B8860B'}}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to History
          </button>
          <h1 className="text-3xl font-bold" style={{color: '#B8860B'}}>Edit Room Service Order</h1>
          <div></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeInUp animate-delay-200">
          {/* Order Details */}
          <div className="bg-white rounded-xl shadow-md p-6 animate-scaleIn animate-delay-300">
            <h2 className="text-xl font-semibold mb-4" style={{color: '#B8860B'}}>Order Details</h2>
            
            <div className="space-y-3 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Order #:</strong> {order.orderNumber}</div>
                <div><strong>Status:</strong> {order.status}</div>
                <div><strong>Room:</strong> {order.roomNumber}</div>
                <div><strong>Guest:</strong> {order.guestName}</div>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="text-lg font-semibold mb-3" style={{color: '#B8860B'}}>
                Order Items ({orderItems.length})
              </h3>
              
              {orderItems.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No items in order</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {orderItems.map((item, index) => (
                    <div key={index} className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-fadeInUp`} style={{animationDelay: `${index * 50 + 400}ms`}}>
                      <div className="flex-1">
                        <div className="font-medium">{item.itemName}</div>
                        <div className="text-sm text-gray-600">₹{item.unitPrice} each</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-200"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(index, item.quantity + 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-200"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateQuantity(index, 0)}
                          className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="ml-4 font-semibold">₹{item.totalPrice}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span style={{color: '#8B4513'}}>₹{calculateTotal()}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => navigate('/room-service/history')}
                className="flex-1 py-3 rounded-lg font-medium border transition-colors"
                style={{borderColor: '#D4AF37', color: '#B8860B'}}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-lg font-medium text-white transition-colors disabled:bg-gray-400"
                style={{backgroundColor: orderItems.length > 0 ? '#D4AF37' : '#gray'}}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Available Items */}
          <div className="bg-white rounded-xl shadow-md p-6 animate-scaleIn animate-delay-300">
            <h2 className="text-xl font-semibold mb-4" style={{color: '#B8860B'}}>Add More Items</h2>
            
            <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
              {availableItems.map((item, index) => (
                <div key={item.id} className={`border rounded-lg p-4 hover:shadow-md transition-shadow animate-scaleIn`} style={{animationDelay: `${Math.min(index * 50 + 500, 1000)}ms`}}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{item.name}</h3>
                    <span className="text-lg font-bold" style={{color: '#8B4513'}}>₹{item.price}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Stock: {item.stock}</p>
                  <button
                    onClick={() => addItem(item)}
                    disabled={item.stock === 0}
                    className="w-full py-2 rounded-lg font-medium text-white transition-colors disabled:bg-gray-400"
                    style={{backgroundColor: item.stock > 0 ? '#D4AF37' : '#gray'}}
                  >
                    {item.stock > 0 ? 'Add to Order' : 'Out of Stock'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditRoomService;