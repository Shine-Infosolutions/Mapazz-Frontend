import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ShoppingCart } from 'lucide-react';
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

const RoomService = () => {
  const navigate = useNavigate();
  const [roomData, setRoomData] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);




  useEffect(() => {
    const loadInitialData = async () => {
      setIsInitialLoading(true);
      
      const storedRoomData = localStorage.getItem('selectedRoomService');
      
      if (storedRoomData) {
        try {
          const parsedData = JSON.parse(storedRoomData);
          setRoomData(parsedData);
          await fetchItems();
        } catch (error) {
          navigate('/easy-dashboard');
        }
      } else {
        setTimeout(() => navigate('/easy-dashboard'), 100);
      }
      
      setIsInitialLoading(false);
    };
    
    loadInitialData();
  }, [navigate]);

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('token');

      
      // Fetch inventory items
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/inventory/items`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      

      
      if (res.ok) {
        const response = await res.json();
        
        const inventoryItems = response.items || response || [];
        const formattedItems = (Array.isArray(inventoryItems) ? inventoryItems : []).map(item => ({
          ...item,
          category: item.category || 'Restaurant',
          name: item.itemName || item.name,
          price: item.pricePerUnit || item.sellingPrice || item.salePrice || item.price || item.unitPrice || item.rate || item.cost || item.amount || 0,
          stock: item.currentStock || item.stock || item.quantity || 0,
          id: item._id
        }));
        setAvailableItems(formattedItems);
      } else {

      }
    } catch (error) {

    }
  };

  const addItemToOrder = (item, quantity = 1) => {
    if (item.stock < quantity) {
      alert(`Insufficient stock! Only ${item.stock} items available.`);
      return;
    }
    
    const totalPrice = quantity * item.price;
    const existingItem = orderItems.find(oi => oi.itemId === item.id);
    
    if (existingItem) {
      setOrderItems(orderItems.map(oi => 
        oi.itemId === item.id
          ? {...oi, quantity: oi.quantity + quantity, totalPrice: (oi.quantity + quantity) * oi.unitPrice}
          : oi
      ));
    } else {
      setOrderItems([...orderItems, {
        itemName: item.name,
        quantity,
        unitPrice: item.price,
        totalPrice,
        category: item.category,
        specialInstructions: '',
        itemId: item.id,
        stock: item.stock
      }]);
    }
  };



  // Fix cart modal update function name conflict
  const updateCartItemQuantity = (index, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(index);
      return;
    }
    
    const item = orderItems[index];
    if (newQuantity > item.stock) {
      alert(`Cannot exceed available stock of ${item.stock}`);
      return;
    }
    
    const updatedItems = [...orderItems];
    updatedItems[index] = {
      ...item,
      quantity: newQuantity,
      totalPrice: newQuantity * item.unitPrice
    };
    setOrderItems(updatedItems);
  };

  const removeItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };



  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalAmount = subtotal;
    return { subtotal, totalAmount };
  };

  const handleKOTEntry = async () => {
    if (orderItems.length === 0) {
      alert('Please add items to create KOT');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      // Deduct stock for each item
      for (const item of orderItems) {

        
        const stockResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/inventory/items/${item.itemId}/stock`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            quantity: item.quantity,
            type: 'OUT',
            reason: `Room Service - Room ${roomData.room_number}`,
            notes: `Order by ${roomData.booking?.name || 'Guest'}`
          })
        });
        
        if (stockResponse.ok) {

        } else {

        }
      }
      
      const restaurantItems = orderItems.filter(item => item.category === 'Restaurant');
      
      // Create room service order
      const roomServiceOrderData = {
        serviceType: 'Restaurant',
        roomNumber: roomData.room_number,
        guestName: roomData.booking?.name || 'Guest',
        bookingNo: roomData.booking?.bookingNo,
        bookingId: roomData.booking?._id,
        items: orderItems,
        notes: `Room Service Order - ${roomData.booking?.name || 'Guest'}`
      };
      
      console.log('Sending room service order:', roomServiceOrderData);
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/room-service/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(roomServiceOrderData)
      });
      
      const result = await response.json();
      console.log('Room service response:', result);
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to create order');
      }
      
      alert('🎉 Order created successfully! Stock updated and room service notified.');
      setOrderItems([]);
      fetchItems(); // Refresh items to show updated stock
    } catch (error) {
      console.error('Room service order error:', error);
      alert(`Error creating order: ${error.message}`);
    }
  };

  const handleSaleBill = () => {
    navigate('/room-service-billing', { 
      state: { 
        bookingId: roomData.booking?._id,
        roomNumber: roomData.room_number,
        guestName: roomData.booking?.name 
      }
    });
  };

  const handleBillLookup = () => {
    navigate('/bill-lookup', { 
      state: { 
        bookingId: roomData.booking?._id,
        roomNumber: roomData.room_number,
        guestName: roomData.booking?.name 
      }
    });
  };

  const handleDineIn = () => {
    navigate('/restaurant/create-order', {
      state: {
        tableNumber: roomData.room_number,
        customerName: roomData.booking?.name || 'Guest',
        bookingId: roomData.booking?._id,
        isDineIn: true
      }
    });
  };

  if (isInitialLoading || !roomData) {
    return <DashboardLoader pageName="Room Service" />;
  }

  const booking = roomData.booking;

  const filteredItems = availableItems.filter(item => 
    (selectedCategory === 'All' || item.category === selectedCategory) && 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen" style={{backgroundColor: '#f5f5dc'}}>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-slideInLeft animate-delay-100">
          <button
            onClick={() => navigate('/easy-dashboard')}
            className="flex items-center hover:opacity-80 transition-opacity text-lg"
            style={{color: '#B8860B'}}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold" style={{color: '#B8860B'}}>Room Service</h1>
          <div className="flex space-x-3">
            <button 
              onClick={handleDineIn}
              className="px-6 py-2 rounded-lg font-medium text-white transition-colors"
              style={{backgroundColor: '#8B4513'}}
            >
              Dine In
            </button>
            <button 
              onClick={handleSaleBill}
              className="px-6 py-2 rounded-lg font-medium text-white transition-colors"
              style={{backgroundColor: '#D4AF37'}}
            >
              Sale Bill
            </button>
            <button 
              onClick={handleBillLookup}
              className="px-6 py-2 rounded-lg font-medium border transition-colors"
              style={{borderColor: '#D4AF37', color: '#B8860B'}}
            >
              Bill Lookup
            </button>
          </div>
        </div>

        {/* Guest Details */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 animate-fadeInUp animate-delay-200">
          <h3 className="text-xl font-semibold mb-4" style={{color: '#B8860B'}}>Guest Details - Room {roomData.room_number}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium" style={{color: '#B8860B'}}>Room No.: </span>
              <span style={{color: '#8B4513'}}>{roomData.room_number}</span>
            </div>

            <div>
              <span className="font-medium" style={{color: '#B8860B'}}>Name: </span>
              <span style={{color: '#8B4513'}}>{booking?.name || 'Anshu'}</span>
            </div>
            <div>
              <span className="font-medium" style={{color: '#B8860B'}}>PAX: </span>
              <span style={{color: '#8B4513'}}>{booking?.noOfAdults || 1}</span>
            </div>
            <div>
              <span className="font-medium" style={{color: '#B8860B'}}>Mobile No.: </span>
              <span style={{color: '#8B4513'}}>{booking?.mobileNo || '9227390327'}</span>
            </div>
            <div>
              <span className="font-medium" style={{color: '#B8860B'}}>Plan: </span>
              <span style={{color: '#8B4513'}}>{booking?.planPackage || 'CP STANDARD'}</span>
            </div>
            <div>
              <span className="font-medium" style={{color: '#B8860B'}}>Company: </span>
              <span style={{color: '#8B4513'}}>{booking?.companyName || '-'}</span>
            </div>
            <div>
              <span className="font-medium" style={{color: '#B8860B'}}>Remark: </span>
              <span style={{color: '#8B4513'}}>{booking?.remark || '-'}</span>
            </div>
          </div>
        </div>

        {/* Search Menu */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 animate-fadeInUp animate-delay-300">
          <h3 className="text-xl font-semibold mb-4" style={{color: '#B8860B'}}>Search Menu</h3>
          
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{color: '#D4AF37'}} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          
          {/* Available Items Count */}
          <p className="text-sm mb-4" style={{color: '#D4AF37'}}>
            Available items: {availableItems.length}
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-3 mb-6 animate-fadeInUp animate-delay-300">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === 'All' ? 'text-white' : 'bg-white border'
            }`}
            style={selectedCategory === 'All' ? 
              {backgroundColor: '#D4AF37'} : 
              {borderColor: '#D4AF37', color: '#B8860B'}}
          >
            All Items
          </button>
          {[...new Set(availableItems.map(item => item.category))].map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === category ? 'text-white' : 'bg-white border'
              }`}
              style={selectedCategory === category ? 
                {backgroundColor: '#D4AF37'} : 
                {borderColor: '#D4AF37', color: '#B8860B'}}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6 animate-fadeInUp animate-delay-300">
          {availableItems.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              Loading items...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              No items found
            </div>
          ) : filteredItems.map((item, index) => {
            const isInOrder = orderItems.some(orderItem => orderItem.itemId === item.id);
            const orderItem = orderItems.find(orderItem => orderItem.itemId === item.id);
            
            return (
              <div key={index} className={`bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow ${item.stock === 0 ? 'opacity-50' : ''} animate-scaleIn`} style={{animationDelay: `${Math.min(index * 50 + 400, 800)}ms`}}>
                <h5 className="text-lg font-semibold mb-2" style={{color: '#8B4513'}}>{item.name}</h5>
                <p className="text-sm mb-1" style={{color: '#B8860B'}}>{item.category}</p>
                <p className="text-sm mb-2" style={{color: item.stock > 0 ? '#22c55e' : '#ef4444'}}>Stock: {item.stock}</p>
                <p className="text-2xl font-bold mb-4" style={{color: '#8B4513'}}>₹{item.price}</p>
                
                {item.stock > 0 ? (
                  isInOrder ? (
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            const updatedItems = orderItems.map(oi => 
                              oi.itemId === item.id && oi.quantity > 1
                                ? {...oi, quantity: oi.quantity - 1, totalPrice: (oi.quantity - 1) * oi.unitPrice}
                                : oi
                            ).filter(oi => oi.quantity > 0);
                            setOrderItems(updatedItems);
                          }}
                          className="w-8 h-8 rounded-full border-2 flex items-center justify-center hover:bg-gray-100"
                          style={{borderColor: '#D4AF37', color: '#B8860B'}}
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-semibold" style={{color: '#8B4513'}}>
                          {orderItem?.quantity || 0}
                        </span>
                        <button
                          onClick={() => {
                            if (orderItem && orderItem.quantity < item.stock) {
                              const updatedItems = orderItems.map(oi => 
                                oi.itemId === item.id
                                  ? {...oi, quantity: oi.quantity + 1, totalPrice: (oi.quantity + 1) * oi.unitPrice}
                                  : oi
                              );
                              setOrderItems(updatedItems);
                            } else {
                              alert(`Cannot exceed available stock of ${item.stock}`);
                            }
                          }}
                          className="w-8 h-8 rounded-full border-2 flex items-center justify-center hover:bg-gray-100"
                          style={{borderColor: '#D4AF37', color: '#B8860B'}}
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => setOrderItems(orderItems.filter(oi => oi.itemId !== item.id))}
                        className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addItemToOrder(item, 1)}
                      className="w-full py-3 rounded-lg font-medium text-white transition-colors"
                      style={{backgroundColor: '#D4AF37'}}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#B8860B'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#D4AF37'}
                    >
                      Add to Order
                    </button>
                  )
                ) : (
                  <button
                    disabled
                    className="w-full py-3 rounded-lg font-medium text-white bg-gray-400 cursor-not-allowed"
                  >
                    Out of Stock
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Cart Modal */}
        {showCart && orderItems.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold" style={{color: '#B8860B'}}>Cart Items</h3>
                <button onClick={() => setShowCart(false)} className="text-gray-500 hover:text-gray-700">
                  ✕
                </button>
              </div>
              
              <div className="space-y-3 mb-4">
                {orderItems.map((item, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{item.itemName}</span>
                      <button
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateCartItemQuantity(index, item.quantity - 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-200"
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateCartItemQuantity(index, item.quantity + 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-200"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-sm text-gray-600">
                        ₹{item.unitPrice} × {item.quantity} = ₹{item.totalPrice}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 mb-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>₹{calculateTotals().totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCart(false)}
                  className="flex-1 py-3 rounded-lg font-medium border transition-colors"
                  style={{borderColor: '#D4AF37', color: '#B8860B'}}
                >
                  Continue Shopping
                </button>
                <button
                  onClick={() => {
                    setShowCart(false);
                    handleKOTEntry();
                  }}
                  className="flex-1 py-3 rounded-lg font-medium text-white transition-colors"
                  style={{backgroundColor: '#D4AF37'}}
                >
                  Place Order
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Cart Button */}
        {orderItems.length > 0 && (
          <div className="fixed bottom-6 right-6">
            <button
              onClick={() => setShowCart(true)}
              className="flex items-center justify-center w-16 h-16 rounded-full text-white shadow-lg transition-transform hover:scale-110"
              style={{backgroundColor: '#D4AF37'}}
            >
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                {orderItems.length}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomService;
