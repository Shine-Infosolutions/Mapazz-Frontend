import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
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

const CreateRoomService = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const preSelectedBooking = location.state?.preSelectedBooking;
  
  const [formData, setFormData] = useState({
    roomNumber: '',
    guestName: '',
    bookingNo: '',
    bookingId: '',
    serviceType: ''
  });
  const [orderItems, setOrderItems] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [categories, setCategories] = useState([]);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsInitialLoading(true);
      await Promise.all([fetchItems(), fetchBookings(), fetchCategories()]);
      setIsInitialLoading(false);
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (preSelectedBooking) {
      setFormData(prev => ({
        ...prev,
        bookingId: preSelectedBooking._id,
        bookingNo: preSelectedBooking.grcNo || preSelectedBooking.bookingNo,
        guestName: preSelectedBooking.name,
        roomNumber: preSelectedBooking.roomNumber
      }));
    }
  }, [preSelectedBooking]);

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
          stock: item.currentStock || item.stock || 0,
          category: item.categoryId?.name || 'Other'
        })));
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/inventory-categories/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filter out restaurant-related categories
        const nonRestaurantCategories = data.filter(cat => 
          cat.isActive && 
          !cat.name.toLowerCase().includes('restaurant') &&
          !cat.name.toLowerCase().includes('food') &&
          !cat.name.toLowerCase().includes('beverage')
        );
        setCategories(nonRestaurantCategories);
      }
    } catch (error) {
      console.error('Failed to fetch categories');
      // Fallback categories
      setCategories([
        { _id: 'fallback1', name: 'Housekeeping' },
        { _id: 'fallback2', name: 'Laundry' },
        { _id: 'fallback3', name: 'Maintenance' },
        { _id: 'fallback4', name: 'Other' }
      ]);
    }
  };

  const fetchRestaurantItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/menu-items`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const items = data.menuItems || data || [];
        setRestaurantItems(items.map(item => ({
          ...item,
          id: item._id,
          name: item.name,
          price: item.Price || item.price || 0,
          stock: 999
        })));
      }
    } catch (error) {
      console.error('Error fetching restaurant items:', error);
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
        console.log('Bookings data:', data);
        const activeBookings = (data.bookings || data || []).filter(booking => 
          booking.status !== 'Checked Out'
        );
        setBookings(activeBookings);
      } else {
        console.error('Failed to fetch bookings:', response.status);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleBookingSelect = (bookingId) => {
    const booking = bookings.find(b => b._id === bookingId);
    if (booking) {
      setFormData({
        ...formData,
        bookingId: booking._id,
        bookingNo: booking.bookingNo,
        guestName: booking.name,
        roomNumber: booking.roomNumber
      });
    }
  };

  const addItem = (item) => {
    const existingItem = orderItems.find(oi => oi.itemId === item.id);
    if (existingItem) {
      setOrderItems(orderItems.map(oi => 
        oi.itemId === item.id
          ? {...oi, quantity: oi.quantity + 1, totalPrice: (oi.quantity + 1) * oi.unitPrice}
          : oi
      ));
    } else {
      setOrderItems([...orderItems, {
        itemName: item.name,
        quantity: 1,
        unitPrice: item.price,
        totalPrice: item.price,
        category: item.category || 'Restaurant',
        itemId: item.id
      }]);
    }
  };

  const updateQuantity = (index, newQuantity) => {
    if (newQuantity <= 0) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    } else {
      const updatedItems = [...orderItems];
      updatedItems[index] = {
        ...updatedItems[index],
        quantity: newQuantity,
        totalPrice: newQuantity * updatedItems[index].unitPrice
      };
      setOrderItems(updatedItems);
    }
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.bookingId || orderItems.length === 0) {
      alert('Please select a booking and add items');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const orderData = {
        ...formData,
        items: orderItems,
        notes: `Manual Room Service Order - ${formData.guestName || 'Guest'}`
      };

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/room-service/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        setFormData({ roomNumber: '', guestName: '', bookingNo: '', bookingId: '', serviceType: '' });
        setOrderItems([]);
        
        // Navigate back to edit booking form if came from there
        if (preSelectedBooking) {
          navigate(`/edit-booking/${preSelectedBooking._id}`, {
            state: { editBooking: preSelectedBooking }
          });
        } else {
          alert('Room service order created successfully!');
        }
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error creating order');
    } finally {
      setLoading(false);
    }
  };

  if (isInitialLoading) {
    return <DashboardLoader pageName="Create Room Service" />;
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: '#f5f5dc'}}>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6 animate-slideInLeft animate-delay-100">
          <button
            onClick={() => {
              if (preSelectedBooking) {
                navigate(`/edit-booking/${preSelectedBooking._id}`, {
                  state: { editBooking: preSelectedBooking }
                });
              } else {
                navigate('/dashboard');
              }
            }}
            className="flex items-center hover:opacity-80 transition-opacity text-lg"
            style={{color: '#B8860B'}}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {preSelectedBooking ? 'Back to Edit Booking' : 'Back to Dashboard'}
          </button>
          <h1 className="text-3xl font-bold" style={{color: '#B8860B'}}>Create Room Service Order</h1>
          <div></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeInUp animate-delay-200">
          {/* Order Form */}
          <div className="bg-white rounded-xl shadow-md p-6 animate-scaleIn animate-delay-300">
            <h2 className="text-xl font-semibold mb-4" style={{color: '#B8860B'}}>Order Details</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{color: '#8B4513'}}>
                  Select Booking *
                </label>
                <select
                  value={formData.bookingId}
                  onChange={(e) => handleBookingSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  required
                >
                  <option value="">Select a booking</option>
                  {bookings.map(booking => (
                    <option key={booking._id} value={booking._id}>
                      {booking.bookingNo} - {booking.name} - Room {booking.roomNumber}
                    </option>
                  ))}
                </select>
              </div>

              {formData.bookingId && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2" style={{color: '#8B4513'}}>Booking Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>Guest:</strong> {formData.guestName}</div>
                    <div><strong>Room:</strong> {formData.roomNumber}</div>
                    <div><strong>Booking No:</strong> {formData.bookingNo}</div>
                  </div>
                </div>
              )}

              {formData.bookingId && (
                <div>
                  <label className="block text-sm font-medium mb-3" style={{color: '#8B4513'}}>
                    Select Service Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      key="Restaurant"
                      type="button"
                      onClick={() => setFormData({...formData, serviceType: 'Restaurant'})}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        formData.serviceType === 'Restaurant' 
                          ? 'text-white' 
                          : 'bg-white border'
                      }`}
                      style={formData.serviceType === 'Restaurant' ? 
                        {backgroundColor: '#D4AF37'} : 
                        {borderColor: '#D4AF37', color: '#B8860B'}}
                    >
                      Restaurant
                    </button>
                    {categories.map(category => (
                      <button
                        key={category._id}
                        type="button"
                        onClick={() => setFormData({...formData, serviceType: category.name})}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          formData.serviceType === category.name 
                            ? 'text-white' 
                            : 'bg-white border'
                        }`}
                        style={formData.serviceType === category.name ? 
                          {backgroundColor: '#D4AF37'} : 
                          {borderColor: '#D4AF37', color: '#B8860B'}}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-semibold mb-3" style={{color: '#B8860B'}}>
                  Order Items ({orderItems.length})
                </h3>
                
                {orderItems.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No items added</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {orderItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{item.itemName}</div>
                          <div className="text-sm text-gray-600">₹{item.unitPrice} each</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(index, item.quantity - 1)}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-200"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-200"
                          >
                            <Plus className="w-4 h-4" />
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

              <button
                type="submit"
                disabled={loading || orderItems.length === 0 || !formData.bookingId}
                className="w-full py-3 rounded-lg font-medium text-white transition-colors disabled:bg-gray-400"
                style={{backgroundColor: orderItems.length > 0 ? '#D4AF37' : '#gray'}}
              >
                {loading ? 'Creating Order...' : 'Create Order'}
              </button>
            </form>
          </div>

          {/* Available Items */}
          {formData.serviceType && (
            <div className="bg-white rounded-xl shadow-md p-6 animate-scaleIn animate-delay-300">
              <h2 className="text-xl font-semibold mb-4" style={{color: '#B8860B'}}>Available Items</h2>
              
              {formData.serviceType === 'Restaurant' ? (
                <div className="text-center py-8">
                  <button
                    onClick={() => navigate('/restaurant/create-order', {
                      state: {
                        tableNumber: formData.roomNumber,
                        customerName: formData.guestName,
                        bookingId: formData.bookingId,
                        bookingNo: formData.bookingNo,
                        isDineIn: true,
                        returnToEdit: preSelectedBooking ? `/edit-booking/${preSelectedBooking._id}` : null,
                        returnState: preSelectedBooking ? { editBooking: preSelectedBooking } : null
                      }
                    })}
                    className="px-8 py-4 rounded-lg font-medium text-white transition-colors text-lg"
                    style={{backgroundColor: '#8B4513'}}
                  >
                    🍽️ Go to Restaurant Menu
                  </button>
                  <p className="text-gray-600 mt-3">Use the full restaurant system for food orders</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                  {availableItems.filter(item => item.category === formData.serviceType).map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
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
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateRoomService;
