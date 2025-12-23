import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { showToast } from '../utils/toaster';

export const useOrderManagement = (location) => {
  const { axios } = useAppContext();
  
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [staff, setStaff] = useState([]);
  const [tables, setTables] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingFilter, setBookingFilter] = useState('all');
  const [orderData, setOrderData] = useState({
    staffName: '',
    staffId: '',
    customerName: '',
    tableNo: '',
    items: [],
    amount: 0
  });
  
  const [gstRates, setGstRates] = useState(() => {
    const savedRates = localStorage.getItem('defaultGstRates');
    return savedRates ? JSON.parse(savedRates) : {
      sgstRate: 0,
      cgstRate: 0,
      gstRate: 0
    };
  });

  useEffect(() => {
    // If coming from booking edit form with preSelectedBooking
    if (location.state?.preSelectedBooking) {
      const booking = location.state.preSelectedBooking;
      const roomNumbers = booking.roomNumber ? booking.roomNumber.split(',').map(num => num.trim()) : [];
      const firstRoom = roomNumbers[0];
      
      if (firstRoom) {
        setOrderData(prev => ({
          ...prev,
          tableNo: firstRoom,
          customerName: booking.name || prev.customerName
        }));
        
        setTables(prev => {
          const existingRoom = prev.find(room => room.tableNumber === firstRoom);
          if (!existingRoom) {
            return [...prev, {
              _id: booking._id,
              tableNumber: firstRoom,
              status: 'occupied',
              guestName: booking.name || 'Guest',
              bookingNo: booking.bookingNo,
              bookingId: booking._id
            }];
          }
          return prev;
        });
      }
    }
    
    // If coming from dine-in, immediately set the room data
    if (location.state?.tableNumber) {
      setOrderData(prev => ({
        ...prev,
        tableNo: location.state.tableNumber,
        customerName: location.state.customerName || prev.customerName
      }));
      
      // Add the room to tables immediately to avoid waiting
      setTables(prev => {
        const existingRoom = prev.find(room => room.tableNumber === location.state.tableNumber);
        if (!existingRoom) {
          return [...prev, {
            _id: `dine-in-${location.state.tableNumber}`,
            tableNumber: location.state.tableNumber,
            status: 'occupied',
            guestName: location.state.customerName || 'Guest',
            bookingNo: location.state.bookingNo,
            bookingId: location.state.bookingId
          }];
        }
        return prev;
      });
    }
    
    fetchData();
    
    // Load default GST rates
    const savedRates = localStorage.getItem('defaultGstRates');
    if (savedRates) {
      setGstRates(JSON.parse(savedRates));
    } else {
      setGstRates({ sgstRate: 0, cgstRate: 0, gstRate: 0 });
    }
  }, [location.state]);

  const fetchData = async () => {
    try {
      // Fetch items
      try {
        const token = localStorage.getItem('token');
        const itemsRes = await axios.get('/api/menu-items', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const itemsData = itemsRes.data.data || itemsRes.data || [];
        setMenuItems(Array.isArray(itemsData) ? itemsData : []);
      } catch (error) {
        console.error('Error fetching items:', error);
        setMenuItems([]);
      }
      
      // Fetch categories
      try {
        const categoriesRes = await axios.get('/api/restaurant-categories/all');
        setCategories(categoriesRes.data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
      
      // Fetch restaurant staff
      try {
        const token = localStorage.getItem('token');
        const usersRes = await axios.get('/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const usersData = usersRes.data || [];
        
        const restaurantStaff = usersData
          .filter(user => user.role === 'restaurant' && user.restaurantRole === 'staff')
          .map(member => ({
            _id: member._id,
            name: member.username,
            username: member.username,
            role: member.role
          }));
        
        setStaff(restaurantStaff);
      } catch (error) {
        console.error('Error fetching staff:', error);
        setStaff([]);
      }
      
      // Fetch occupied rooms with optimized query
      try {
        const token = localStorage.getItem('token');
        const bookingRes = await axios.get('/api/bookings/all?status=Checked In', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const bookingData = Array.isArray(bookingRes.data) ? bookingRes.data : (bookingRes.data.bookings || []);
        
        const occupiedRooms = [];
        bookingData.forEach(booking => {
          if (booking.roomNumber && booking.status === 'Checked In') {
            const roomNumbers = booking.roomNumber.split(',').map(num => num.trim());
            roomNumbers.forEach(roomNum => {
              occupiedRooms.push({
                _id: `${booking._id}_${roomNum}`,
                tableNumber: roomNum,
                status: 'occupied',
                guestName: booking.name || 'Guest',
                bookingNo: booking.bookingNo,
                bookingId: booking._id
              });
            });
          }
        });
        
        setTables(occupiedRooms);
        setAllBookings(bookingData);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setTables([]);
        setAllBookings([]);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleAddToCart = (item) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(i => i._id === item._id);
      if (existingItem) {
        return prevItems.map(i =>
          i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        return [...prevItems, { ...item, quantity: 1, note: '' }];
      }
    });
  };

  const handleRemoveItem = (itemId) => {
    setCartItems(prevItems => prevItems.filter(item => item._id !== itemId));
  };

  const handleQuantityChange = (itemId, change) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item._id === itemId ? { ...item, quantity: Math.max(1, item.quantity + change) } : item
      )
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const getSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.Price || item.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };
  
  const getTotalAmount = () => {
    const subtotal = getSubtotal();
    const sgstAmount = (subtotal * gstRates.sgstRate) / 100;
    const cgstAmount = (subtotal * gstRates.cgstRate) / 100;
    return subtotal + sgstAmount + cgstAmount;
  };
  
  const getGstAmounts = () => {
    const subtotal = getSubtotal();
    const sgstAmount = (subtotal * gstRates.sgstRate) / 100;
    const cgstAmount = (subtotal * gstRates.cgstRate) / 100;
    return { subtotal, sgstAmount, cgstAmount, total: subtotal + sgstAmount + cgstAmount };
  };

  const handlePlaceOrder = async (nonChargeable = false, navigate = null) => {
    if (isPlacingOrder) return;
    
    if (cartItems.length === 0) {
      showToast.error('Please add items to cart first!');
      return;
    }
    
    if (!orderData.tableNo) {
      showToast.error('Please select a room!');
      return;
    }
    
    setIsPlacingOrder(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        showToast.error('Authentication token missing. Please login again.');
        return;
      }
      
      const orderItems = cartItems.map(item => ({
        itemId: item._id,
        itemName: item.name,
        price: item.Price || 0,
        quantity: item.quantity,
        note: item.note || '',
        isFree: item.isFree || false
      }));
      
      const gstAmounts = getGstAmounts();
      
      // Get booking details for selected room
      const selectedRoom = tables.find(room => room.tableNumber === orderData.tableNo);
      
      const finalOrderData = {
        staffName: orderData.customerName || 'Restaurant Staff',
        customerName: orderData.customerName,
        tableNo: orderData.tableNo,
        bookingNo: selectedRoom?.bookingNo,
        bookingId: selectedRoom?.bookingId,
        items: orderItems,
        notes: cartItems.map(item => item.note).filter(note => note).join(', ') || '',
        subtotal: gstAmounts.subtotal,
        gstRate: gstRates.gstRate,
        sgstRate: gstRates.sgstRate,
        cgstRate: gstRates.cgstRate,
        sgstAmount: gstAmounts.sgstAmount,
        cgstAmount: gstAmounts.cgstAmount,
        totalGstAmount: gstAmounts.sgstAmount + gstAmounts.cgstAmount,
        amount: gstAmounts.total,
        discount: 0,
        nonChargeable: nonChargeable,
        isMembership: false,
        isLoyalty: false
      };
      
      const orderResponse = await axios.post('/api/restaurant-orders/create', finalOrderData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Create KOT record
      const kotData = {
        kotNumber: `KOT-${Date.now()}`,
        orderId: orderResponse.data._id,
        orderType: 'restaurant',
        tableNo: orderData.tableNo,
        items: orderItems.map(item => ({
          itemName: item.itemName,
          quantity: item.quantity,
          specialInstructions: item.note || ''
        })),
        status: 'pending'
      };
      
      await axios.post('/api/kot/create', kotData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      showToast.success('🎉 Order placed successfully!');
      setCartItems([]);
      setOrderData({ staffName: '', staffId: '', customerName: '', tableNo: '', items: [], amount: 0 });
      setIsCartOpen(false);
      
      // Navigate back to edit booking form if returnToEdit is provided
      if (location.state?.returnToEdit && navigate) {
        navigate(location.state.returnToEdit, {
          state: location.state.returnState
        });
      }
      
    } catch (error) {
      console.error('Error placing order:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to place order!';
      showToast.error(errorMsg);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const filteredMenu = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter tables based on booking filter
  const filteredTables = bookingFilter === 'all' 
    ? tables 
    : tables.filter(table => table.bookingId === bookingFilter);

  return {
    // State
    menuItems,
    categories,
    staff,
    tables: filteredTables,
    allBookings,
    cartItems,
    isCartOpen,
    isPlacingOrder,
    searchQuery,
    bookingFilter,
    orderData,
    filteredMenu,
    gstRates,
    
    // Setters
    setIsCartOpen,
    setSearchQuery,
    setBookingFilter,
    setOrderData,
    setCartItems,
    setGstRates,
    
    // Functions
    handleAddToCart,
    handleRemoveItem,
    handleQuantityChange,
    handleClearCart,
    getSubtotal,
    getTotalAmount,
    getGstAmounts,
    handlePlaceOrder,
    fetchData
  };
};