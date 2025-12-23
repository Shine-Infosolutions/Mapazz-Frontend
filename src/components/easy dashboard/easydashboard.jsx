import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Bed, AlertTriangle, Clock, CalendarCheck, DoorOpen, DollarSign, Users, TrendingUp, ChevronRight, Loader2, User, Package, MapPin, ChefHat, RefreshCw } from 'lucide-react';
import DashboardLoader from '../DashboardLoader';

// --- Configuration ---
const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;
const TODAY = new Date().toDateString();

// Add CSS animations
const styles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .animate-fadeInUp {
    opacity: 0;
    animation: fadeInUp 0.5s ease-out forwards;
  }
  
  .animate-slideInLeft {
    opacity: 0;
    animation: slideInLeft 0.4s ease-out forwards;
  }
  
  .animate-scaleIn {
    opacity: 0;
    animation: scaleIn 0.3s ease-out forwards;
  }
  
  .animate-delay-100 { animation-delay: 0.1s; }
  .animate-delay-200 { animation-delay: 0.2s; }
  .animate-delay-300 { animation-delay: 0.3s; }
  .animate-delay-400 { animation-delay: 0.4s; }
  .animate-delay-500 { animation-delay: 0.5s; }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

// --- Utility: Fetch with Exponential Backoff ---
// This robust function ensures stability by retrying API calls if they fail.
const fetchWithRetry = async (url, retries = 3) => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers,
            });

            if (!response.ok) {
                // For 404 errors on optional endpoints, return empty array instead of throwing
                if (response.status === 404 && (url.includes('/pantry/') || url.includes('/restaurant-orders/'))) {
                    console.warn(`Endpoint ${url} not found (404), returning empty array`);
                    return [];
                }
                // For 401 errors on bookings endpoint, return empty array to allow dashboard to load
                if (response.status === 401 && url.includes('/bookings/')) {
                    console.warn(`Authentication required for ${url}, returning empty array`);
                    return [];
                }
                // Throw an error to trigger the catch block and retry
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Attempt ${i + 1} failed for ${url}:`, error.message);
            if (i < retries - 1) {
                // Exponential backoff: 1s, 2s, 4s delay
                const delay = Math.pow(2, i) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                console.error(`Failed to fetch data from ${url} after ${retries} attempts.`);
                // For optional endpoints and bookings, return empty array instead of throwing
                if (url.includes('/pantry/') || url.includes('/restaurant-orders/') || url.includes('/bookings/')) {
                    console.warn(`Endpoint ${url} failed, returning empty array`);
                    return [];
                }
                throw new Error(`Failed to fetch data: ${error.message}`);
            }
        }
    }
};




// --- Sub-Component: StatCard (Themed Classy UI) ---
const StatCard = ({ title, value, subText, icon: Icon }) => (
    <div 
        className="bg-white rounded-xl shadow-xl p-4 sm:p-6 border-l-4 transition-transform duration-300 hover:scale-[1.02] border-[--color-primary] hover:shadow-2xl" 
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-light text-gray-500 uppercase tracking-widest">{title}</p>
          <p className="text-3xl sm:text-4xl lg:text-5xl font-light mt-1 truncate" style={{color: 'var(--color-text)'}}>{value}</p>
        </div>
        <div className="p-2 sm:p-3 rounded-xl bg-[--color-accent]/50 flex-shrink-0" style={{color: 'var(--color-primary)'}}>
          <Icon size={24} className="sm:w-8 sm:h-8 lg:w-9 lg:h-9" />
        </div>
      </div>
      <p className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4 border-t border-gray-200 pt-2">{subText}</p>
    </div>
  );

// --- Sub-Component: StatusLegend ---
const StatusLegend = () => {
    const statusItems = [
        { status: 'available', color: 'bg-green-500', label: 'Available', icon: DoorOpen },
        { status: 'booked', color: 'bg-red-700', label: 'Occupied', icon: Users },
        { status: 'maintenance', color: 'bg-yellow-600', label: 'Maintenance', icon: AlertTriangle }
    ];

    return (
        <div className="bg-white rounded-lg shadow-md p-4 border" style={{borderColor: 'var(--color-border)'}}>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Room Status</h4>
            <div className="space-y-2">
                {statusItems.map(({ status, color, label, icon: Icon }) => (
                    <div key={status} className="flex items-center text-sm">
                        <div className={`w-3 h-3 rounded-full ${color} mr-2`}></div>
                        <Icon size={14} className="mr-2 text-gray-600" />
                        <span className="text-gray-700">{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Sub-Component: FoodOrderCard ---
const FoodOrderCard = ({ foodOrders, onRefresh }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'preparing': return 'bg-blue-100 text-blue-800';
            case 'ready': return 'bg-green-100 text-green-800';
            case 'completed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const stats = {
        total: foodOrders.length,
        pending: foodOrders.filter(order => order.status === 'pending').length,
        preparing: foodOrders.filter(order => order.status === 'preparing').length,
        ready: foodOrders.filter(order => order.status === 'ready').length,
        completed: foodOrders.filter(order => order.status === 'completed').length
    };

    return (
        <div className="bg-white rounded-2xl shadow-2xl p-6 border mb-8" style={{borderColor: 'var(--color-border)'}}>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-light tracking-wider flex items-center" style={{color: 'var(--color-text)'}}>
                    <ChefHat className="mr-3" size={24} style={{color: 'var(--color-primary)'}} />
                    Food Orders ({stats.total})
                </h3>
                <button 
                    onClick={onRefresh}
                    className="flex items-center px-4 py-2 text-sm rounded-lg transition-colors"
                    style={{backgroundColor: 'var(--color-primary)', color: 'white'}}
                >
                    <RefreshCw size={16} className="mr-2" />
                    Refresh
                </button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                    <div className="text-sm text-yellow-600 uppercase tracking-wide">Pending</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <ChefHat className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">{stats.preparing}</div>
                    <div className="text-sm text-blue-600 uppercase tracking-wide">Preparing</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <AlertTriangle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">{stats.ready}</div>
                    <div className="text-sm text-green-600 uppercase tracking-wide">Ready</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <CalendarCheck className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-600">{stats.completed}</div>
                    <div className="text-sm text-gray-600 uppercase tracking-wide">Completed</div>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-700 border-b pb-2">Recent Orders</h4>
                {foodOrders.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto space-y-3">
                        {foodOrders.slice(0, 10).map((order) => (
                            <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:shadow-md transition-shadow">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="font-semibold text-gray-800">
                                            Order #{order._id.slice(-6)}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                            {order.status || 'pending'}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <div>Table {order.tableNo || 'N/A'} • {order.customerName || 'Guest'}</div>
                                        <div>{order.items?.length || 0} items • ₹{order.advancePayment || order.amount || 0}</div>
                                        <div className="text-xs text-gray-500">
                                            {new Date(order.createdAt || order.orderDate).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-lg">No food orders found</p>
                        <p className="text-sm">Orders will appear here when customers place them</p>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- Main Component: EasyDashboard (Themed Classy UI) ---
const EasyDashboard = () => {
    const navigate = useNavigate();
    
    // --- State for Live Data ---
    const [rooms, setRooms] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [categories, setCategories] = useState([]);
    const [laundryData, setLaundryData] = useState([]);
    const [pantryOrders, setPantryOrders] = useState([]);
    const [foodOrders, setFoodOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [showGuestDetails, setShowGuestDetails] = useState(false);

    // --- Data Fetching Effect ---
    useEffect(() => {
        const fetchAllData = async () => {
            setIsLoading(true);
            setError(null);
            
            try {
                // Fetch all data concurrently
                const [roomsData, bookingsData, categoriesData, laundryData, pantryData, foodOrdersData] = await Promise.all([
                    fetchWithRetry(`${BACKEND_URL}/api/rooms/all`),
                    fetchWithRetry(`${BACKEND_URL}/api/bookings/all`),
                    fetchWithRetry(`${BACKEND_URL}/api/categories/all`),
                    fetchWithRetry(`${BACKEND_URL}/api/laundry/all`).catch(() => []),
                    fetchWithRetry(`${BACKEND_URL}/api/pantry/orders`).catch(() => []),
                    fetchWithRetry(`${BACKEND_URL}/api/restaurant-orders/all`).catch(() => [])
                ]);

                // Filter out non-array responses
                setRooms(Array.isArray(roomsData) ? roomsData : []);
                setBookings(Array.isArray(bookingsData) ? bookingsData : []);
                setCategories(Array.isArray(categoriesData) ? categoriesData : []);
                setLaundryData(Array.isArray(laundryData) ? laundryData : laundryData?.data || []);
                setPantryOrders(Array.isArray(pantryData) ? pantryData : pantryData?.data || []);
                setFoodOrders(Array.isArray(foodOrdersData) ? foodOrdersData : []);

            } catch (err) {
                console.error("Data loading error:", err);
                setError("Failed to load dashboard data. Please check the backend connection.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
    }, []); // Run once on component mount

    
    // --- Utility Functions (Refactored to be safe with async data) ---

    // Memoize utility functions using useCallback for better performance
    const getRoomCategory = useCallback((room) => {
        // First check if categoryId is already populated with category object
        if (typeof room.categoryId === 'object' && room.categoryId?.name) {
            return room.categoryId.name;
        }
        
        // Handle categoryId as string/ObjectId - match with categories array
        const categoryId = room.categoryId || room.category;
        
        if (categoryId && categories.length > 0) {
            const category = categories.find(cat => 
                cat._id === categoryId || 
                cat._id.toString() === categoryId.toString()
            );
            if (category) {
                return category.name;
            }
        }
        
        // Fallback to room title or default
        return room.title || 'Standard Room';
    }, [categories]);

    const getRoomBooking = useCallback((roomNumber) => {
        return bookings.find(booking => {
            const isValidStatus = booking.status === 'Confirmed' || booking.status === 'Booked' || booking.status === 'CheckedIn' || booking.status === 'Checked In';
            
            // Handle comma-separated room numbers in booking
            if (booking.roomNumber && booking.roomNumber.includes(',')) {
                const roomNumbers = booking.roomNumber.split(',').map(num => num.trim());
                const roomMatch = roomNumbers.includes(roomNumber.toString()) || roomNumbers.includes(roomNumber);
                return roomMatch && isValidStatus;
            }
            
            // Check multiple possible field names for room number
            const roomMatch = booking.roomNumber === roomNumber || 
                             booking.roomNumber === roomNumber.toString() ||
                             booking.room_number === roomNumber ||
                             booking.room_number === roomNumber.toString() ||
                             booking.roomNo === roomNumber ||
                             booking.roomNo === roomNumber.toString() ||
                             booking.room === roomNumber ||
                             booking.room === roomNumber.toString();
            
            return roomMatch && isValidStatus;
        });
    }, [bookings]);
    
    const getRoomStatus = useCallback((room) => {
        // First check the room's own status from the API
        if (room.status === 'booked') return 'booked';
        if (room.status === 'maintenance') return 'maintenance';
        
        // Then check if there's a booking in the bookings array
        const booking = getRoomBooking(room.room_number);
        if (booking) return 'booked';
        
        // Default to available
        return 'available';
    }, [getRoomBooking]);


    const getRoomStats = useCallback(() => { 
        const total = rooms.length;
        let available = 0; let booked = 0; let maintenance = 0;
        
        rooms.forEach(room => {
            const currentStatus = getRoomStatus(room);
            if (currentStatus === 'available') available++;
            else if (currentStatus === 'booked') booked++;
            else if (currentStatus === 'maintenance') maintenance++;
        });
        return { total, available, booked, maintenance };
    }, [rooms, getRoomStatus]);

    const getFloorFromRoomNumber = (roomNumber) => {
        const roomNum = parseInt(roomNumber);
        if (isNaN(roomNum)) return 0;
        // Logic: 101 -> 1, 204 -> 2, 003 -> 0 (Ground Floor)
        return Math.floor(roomNum / 100);
    };

    const getRoomsByFloor = useCallback(() => {
        const roomsByFloor = {};
        rooms.forEach(room => {
            const floor = getFloorFromRoomNumber(room.room_number);
            if (!roomsByFloor[floor]) roomsByFloor[floor] = [];
            roomsByFloor[floor].push(room);
        });
        // Sort floors and rooms
        Object.keys(roomsByFloor).forEach(floor => {
            roomsByFloor[floor].sort((a, b) => parseInt(a.room_number) - parseInt(b.room_number));
        });
        return roomsByFloor;
    }, [rooms]);

    // Get laundry data for a specific room/guest
    const getGuestLaundry = useCallback((roomNumber, guestName) => {
        console.log(`Looking for laundry for room ${roomNumber}, guest: ${guestName}`);
        
        const matchingLaundry = laundryData.filter(laundry => {
            // Check room number match (multiple field variations)
            const roomMatch = laundry.roomNumber === roomNumber || 
                             laundry.roomNumber === roomNumber.toString() ||
                             laundry.room_number === roomNumber ||
                             laundry.room_number === roomNumber.toString() ||
                             laundry.roomNo === roomNumber ||
                             laundry.roomNo === roomNumber.toString();
            
            // Check guest name match (case insensitive)
            const nameMatch = guestName && laundry.guestName && 
                             (laundry.guestName.toLowerCase().includes(guestName.toLowerCase()) ||
                              guestName.toLowerCase().includes(laundry.guestName.toLowerCase()));
            
            return roomMatch || nameMatch;
        });
        
        console.log(`Found ${matchingLaundry.length} matching laundry services:`, matchingLaundry);
        return matchingLaundry;
    }, [laundryData]);

    // Get food orders for a specific room/guest
    const getGuestFoodOrders = useCallback((roomNumber, guestName) => {
        console.log(`Looking for food orders for room ${roomNumber}, guest: ${guestName}`);
        console.log('Available food orders:', foodOrders);
        
        const matchingOrders = foodOrders.filter(order => {
            // Check room number match (multiple field variations)
            const roomMatch = order.roomNumber === roomNumber || 
                             order.roomNumber === roomNumber.toString() ||
                             order.room_number === roomNumber ||
                             order.room_number === roomNumber.toString() ||
                             order.roomNo === roomNumber ||
                             order.roomNo === roomNumber.toString() ||
                             order.tableNo === roomNumber ||
                             order.tableNo === roomNumber.toString();
            
            // Check guest name match (case insensitive)
            const nameMatch = guestName && (
                (order.guestName && (order.guestName.toLowerCase().includes(guestName.toLowerCase()) ||
                 guestName.toLowerCase().includes(order.guestName.toLowerCase()))) ||
                (order.customerName && (order.customerName.toLowerCase().includes(guestName.toLowerCase()) ||
                 guestName.toLowerCase().includes(order.customerName.toLowerCase())))
            );
            
            console.log(`Order ${order._id}: roomMatch=${roomMatch}, nameMatch=${nameMatch}`, order);
            
            return roomMatch || nameMatch;
        });
        
        console.log(`Found ${matchingOrders.length} matching orders:`, matchingOrders);
        return matchingOrders;
    }, [foodOrders]);

    // Calculate stay duration
    const calculateStayDuration = useCallback((checkIn, checkOut) => {
        if (!checkIn) return 'N/A';
        const checkInDate = new Date(checkIn);
        const checkOutDate = checkOut ? new Date(checkOut) : new Date();
        const diffTime = Math.abs(checkOutDate - checkInDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }, []);
    // -----------------------------------------------------------------

    // Debug: Console log all data
    console.log('All rooms data:', rooms);
    console.log('All bookings data:', bookings);
    console.log('All laundry data:', laundryData);
    console.log('All pantry orders:', pantryOrders);
    
    // Console log all rooms with their calculated status
    rooms.forEach(room => {
        const status = getRoomStatus(room);
        const booking = getRoomBooking(room.room_number);
        console.log(`Room ${room.room_number}: Status = ${status}, Booking = `, booking);
    });
    
    const roomStats = getRoomStats();
    const roomsByFloor = getRoomsByFloor();
    
    // Stats for cards calculations
    // NOTE: Total revenue is still a static placeholder as it's not available in the provided APIs
    const totalRevenue = 15000000; 
    
    const todayCheckins = bookings.filter(b => b.status === 'Confirmed' && new Date(b.checkInDate).toDateString() === TODAY).length;
    
    // Find occupied rooms and calculate occupancy
    const bookedRoomsCount = rooms.filter(room => getRoomStatus(room) === 'booked').length;
    const occupancyPercent = rooms.length > 0 ? ((bookedRoomsCount / rooms.length) * 100).toFixed(1) : 0;
    
    // --- Render Logic ---
    if (isLoading) {
        return <DashboardLoader pageName="Easy Dashboard" />;
    }

    if (error) {
        return (
            <div className="min-h-screen p-4 sm:p-10 flex items-center justify-center" style={{backgroundColor: 'var(--color-background)'}}>
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md w-full max-w-xl" role="alert">
                    <p className="font-bold mb-2 flex items-center"><AlertTriangle className="mr-2"/> Data Error</p>
                    <p>{error}</p>
                    <p className="text-sm mt-2">Please check the backend URL: <a href={BACKEND_URL} target="_blank" rel="noopener noreferrer" className="underline">{BACKEND_URL}</a></p>
                </div>
            </div>
        );
    }


    return (
        <div 
            className="min-h-screen p-4 sm:p-10 font-sans" 
            style={{backgroundColor: 'var(--color-background)', opacity: isLoading ? 0 : 1, transition: 'opacity 0.3s ease-in-out'}}
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-10 pb-5 border-b gap-4 animate-slideInLeft animate-delay-100" style={{borderColor: 'var(--color-border)'}}>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-wider flex items-center" style={{color: 'var(--color-text)'}}>
                    <Home size={24} className="sm:w-7 sm:h-7 lg:w-8 lg:h-8 mr-2 sm:mr-3" style={{color: 'var(--color-primary)'}} /> 
                    <span className="hidden sm:inline">HOSPITALITY MANAGEMENT</span>
                    <span className="sm:hidden">DASHBOARD</span>
                </h1>

            </div>



            {/* Floor-wise Room Display - Elegant White Panel */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 border animate-scaleIn animate-delay-200" style={{borderColor: 'var(--color-border)'}}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
                    <h2 className="text-xl sm:text-2xl font-light tracking-wider" style={{color: 'var(--color-text)'}}>Rooms Details</h2>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs">
                        <span className="text-gray-600 font-medium hidden sm:inline">Room Status:</span>
                        <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-green-500 mr-1 sm:mr-2"></div>Available</span>
                        <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-red-700 mr-1 sm:mr-2"></div>Occupied</span>
                        <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-yellow-600 mr-1 sm:mr-2"></div>Maintenance</span>
                    </div>
                </div>
                
                {Object.keys(roomsByFloor).sort((a, b) => {
                    // Custom sort: Ground Floor (0) first, then First Floor (1), then Second Floor (2), etc.
                    const floorA = parseInt(a);
                    const floorB = parseInt(b);
                    return floorA - floorB;
                }).map(floor => {
                    const floorRooms = roomsByFloor[floor];
                    const floorStats = floorRooms.reduce((acc, room) => {
                        const status = getRoomStatus(room);
                        acc[status] = (acc[status] || 0) + 1;
                        return acc;
                    }, {});

                    return (
                        <div key={floor} className="mb-6 sm:mb-8 pb-4 border-b border-gray-200 last:border-b-0 animate-fadeInUp" style={{animationDelay: `${parseInt(floor) * 100 + 300}ms`}}>
                            <h3 className="text-lg sm:text-xl font-medium mb-4 sm:mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center text-gray-700 gap-2">
                                <span className="flex items-center tracking-wide" style={{color: 'var(--color-text)'}}>
                                    <ChevronRight size={16} className="sm:w-5 sm:h-5 mr-1" style={{color: 'var(--color-primary)'}}/> 
                                    <span className="text-base sm:text-xl">
                                        {floor === '0' ? 'GROUND FLOOR' : floor === '1' ? 'FIRST FLOOR' : floor === '2' ? 'SECOND FLOOR' : `LEVEL ${floor}`} - (TOTAL: {floorRooms.length})
                                    </span>
                                </span>
                                <span className="text-xs sm:text-sm font-normal text-gray-500 flex gap-2 sm:gap-4">
                                    <span className="text-green-600">Ready: {floorStats.available || 0}</span>
                                    <span className="text-red-600">Locked: {floorStats.booked || 0}</span>
                                </span>
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3 lg:gap-4">
                                {floorRooms.map((room) => {
                                    const currentStatus = getRoomStatus(room);
                                    const booking = getRoomBooking(room.room_number);
                                    const isBooked = currentStatus === 'booked';
                                    
                                    return (
                                        <div
                                            key={room._id}
                                            className={`
                                                ${isBooked ? 'bg-red-200 hover:bg-red-300' : currentStatus === 'available' ? 'bg-green-50 hover:bg-green-100' : 'bg-yellow-100 hover:bg-yellow-200'}
                                                rounded-lg shadow-md border-t-2 ${isBooked ? 'border-red-700' : currentStatus === 'available' ? 'border-green-500' : 'border-yellow-600'}
                                                transition-all duration-300 cursor-pointer hover:shadow-lg hover:scale-105
                                                min-h-[120px] sm:min-h-[140px]
                                                animate-scaleIn
                                            `}
                                            style={{ animationDelay: `${Math.min((parseInt(room.room_number) % 10) * 50 + 400, 600)}ms` }}
                                            onClick={() => {
                                                console.log('🔥 ROOM CLICKED:', room.room_number, 'Status:', currentStatus);
                                                
                                                if (isBooked && booking) {
                                                    console.log('🚀 Navigating to room service');
                                                    const roomData = { ...room, booking };
                                                    localStorage.setItem('selectedRoomService', JSON.stringify(roomData));
                                                    window.location.href = '/room-service';
                                                } else if (currentStatus === 'available') {
                                                    console.log('📝 Navigating to booking form');
                                                    const roomData = { 
                                                        roomNumber: room.room_number, 
                                                        category: getRoomCategory(room), 
                                                        roomId: room._id, 
                                                        rate: room.price || 0,
                                                        categoryId: room.category?._id || room.category
                                                    };
                                                    localStorage.setItem('selectedRoomForBooking', JSON.stringify(roomData));
                                                    navigate('/bookingform');
                                                }
                                            }}
                                        >
                                            <div className="p-2 sm:p-3 flex flex-col items-center h-full justify-center">
                                                <div className={`font-extrabold text-xl sm:text-2xl lg:text-3xl mb-1`} style={{color: 'var(--color-text)'}}>
                                                    {room.room_number}
                                                </div>
                                                
                                                <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1 sm:mb-2 text-gray-500 text-center">
                                                    {isBooked ? 'OCCUPIED' : currentStatus === 'available' ? 'AVAILABLE' : 'MAINTENANCE'}
                                                </div>

                                                {isBooked && booking ? (
                                                    <div className="text-xs sm:text-sm text-gray-600 font-medium mb-1 sm:mb-2 text-center px-1">
                                                        {booking.name || 'Guest'}
                                                    </div>
                                                ) : (
                                                    <div className="text-xs sm:text-sm text-gray-400 italic mb-1 sm:mb-2 text-center px-1">
                                                        {getRoomCategory(room)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
                
                {!isLoading && rooms.length === 0 && (
                    <div className="text-center py-12 text-lg text-gray-500">
                        No room inventory data available from the backend.
                    </div>
                )}
            </div>
            
            {/* Guest Details Modal */}
            {showGuestDetails && selectedRoom && (() => {
                const booking = selectedRoom.booking;
                const guestLaundry = getGuestLaundry(selectedRoom.room_number, booking?.name);
                const guestFoodOrders = getGuestFoodOrders(selectedRoom.room_number, booking?.name);
                const stayDuration = calculateStayDuration(booking?.checkInDate, booking?.checkOutDate);
                
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-2 sm:p-4 animate-fadeInUp">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-xs sm:max-w-4xl lg:max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden animate-scaleIn">
                            <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800">
                                    Room {selectedRoom.room_number} - Guest Details
                                </h3>
                                <button
                                    onClick={() => setShowGuestDetails(false)}
                                    className="text-gray-500 hover:text-gray-700 focus:outline-none p-1"
                                >
                                    <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="p-4 sm:p-6 overflow-y-auto" style={{ maxHeight: "calc(95vh - 80px)" }}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                    {/* Guest Information */}
                                    <div className="space-y-4 animate-slideInLeft animate-delay-100">
                                        <h4 className="text-base sm:text-lg font-semibold text-gray-800 border-b pb-2 flex items-center">
                                            <User className="mr-2" size={18} /> Guest Information
                                        </h4>
                                        <div className="space-y-2">
                                            <p><span className="font-medium">Name:</span> {booking?.name || booking?.guestName || booking?.customerName || 'N/A'}</p>
                                            <p><span className="font-medium">Phone:</span> {booking?.mobileNo || booking?.phoneNo || booking?.phone || booking?.mobile || 'N/A'}</p>
                                            <p><span className="font-medium">Email:</span> {booking?.email || booking?.emailAddress || 'N/A'}</p>
                                            <p><span className="font-medium">ID Proof:</span> {booking?.idProofType || booking?.idProof || booking?.idType || 'N/A'}</p>
                                            <p><span className="font-medium">Address:</span> {booking?.address || booking?.guestAddress || booking?.customerAddress || 'N/A'}</p>
                                            <p><span className="font-medium">Adults:</span> {booking?.noOfAdults || booking?.adults || booking?.pax || booking?.numberOfGuests || 'N/A'}</p>
                                            <p><span className="font-medium">Children:</span> {booking?.noOfChildren || booking?.children || booking?.childrenCount || '0'}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Stay Information */}
                                    <div className="space-y-4 animate-slideInLeft animate-delay-200">
                                        <h4 className="text-base sm:text-lg font-semibold text-gray-800 border-b pb-2 flex items-center">
                                            <Clock className="mr-2" size={18} /> Stay Details
                                        </h4>
                                        <div className="space-y-2">
                                            <p><span className="font-medium">Check-in:</span> {booking?.checkInDate || booking?.checkinDate || booking?.startDate ? new Date(booking.checkInDate || booking.checkinDate || booking.startDate).toLocaleDateString('en-IN') : 'N/A'}</p>
                                            <p><span className="font-medium">Check-out:</span> {booking?.checkOutDate || booking?.checkoutDate || booking?.endDate ? new Date(booking.checkOutDate || booking.checkoutDate || booking.endDate).toLocaleDateString('en-IN') : 'Ongoing'}</p>
                                            <p><span className="font-medium">Duration:</span> {stayDuration} days</p>
                                            <p><span className="font-medium">Room Rate:</span> ₹{booking?.rate || booking?.roomRate || booking?.dailyRate || selectedRoom.price || 'N/A'}</p>
                                            <p><span className="font-medium">Total Amount:</span> ₹{booking?.totalAmount || booking?.total || booking?.totalCost || (booking?.rate && booking?.days ? booking.rate * booking.days : 'N/A')}</p>
                                            <p><span className="font-medium">Payment Status:</span> {booking?.paymentStatus || 'N/A'}</p>
                                            <p><span className="font-medium">Payment Mode:</span> {booking?.paymentMode || 'N/A'}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Food Orders */}
                                    <div className="space-y-4 animate-slideInLeft animate-delay-300">
                                        <h4 className="text-base sm:text-lg font-semibold text-gray-800 border-b pb-2 flex items-center">
                                            <Package className="mr-2" size={18} /> Food Orders ({guestFoodOrders.length})
                                        </h4>
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {guestFoodOrders.length > 0 ? (
                                                guestFoodOrders.map((order, index) => (
                                                    <div key={order._id || index} className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                                                        <p><span className="font-medium">Order #{order._id?.slice(-6) || index + 1}</span></p>
                                                        <p><span className="font-medium">Date:</span> {new Date(order.createdAt || order.orderDate || order.date).toLocaleDateString('en-IN')}</p>
                                                        <p><span className="font-medium">Table:</span> {order.tableNo || 'N/A'}</p>
                                                        <p><span className="font-medium">Items:</span> {order.items?.length || 0} items</p>
                                                        <p><span className="font-medium">Status:</span> <span className={`px-2 py-1 rounded text-xs ${
                                                            order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                                            order.status === 'ready' ? 'bg-green-100 text-green-800' :
                                                            order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }`}>{order.status || 'pending'}</span></p>
                                                        <p><span className="font-medium">Amount:</span> ₹{order.advancePayment || order.amount || order.totalAmount || 'N/A'}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-gray-500 italic">No food orders found</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Laundry Services - Full Width */}
                                <div className="mt-4 sm:mt-6 space-y-4 animate-fadeInUp animate-delay-400">
                                    <h4 className="text-base sm:text-lg font-semibold text-gray-800 border-b pb-2 flex items-center">
                                        <MapPin className="mr-2" size={18} /> Laundry Services ({guestLaundry.length})
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-h-64 overflow-y-auto">
                                        {guestLaundry.length > 0 ? (
                                            guestLaundry.map((service, index) => (
                                                <div key={index} className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                                                    <p><span className="font-medium">Service #{service.serviceNumber || index + 1}</span></p>
                                                    <p><span className="font-medium">Date:</span> {new Date(service.createdAt || service.date).toLocaleDateString('en-IN')}</p>
                                                    <p><span className="font-medium">Items:</span> {
                                                        service.items && service.items.length > 0 
                                                            ? service.items.map(item => {
                                                                const itemName = item.name || item.itemName || item.type || item.description || 'Item';
                                                                const quantity = item.quantity || item.qty || 1;
                                                                return `${itemName} (${quantity})`;
                                                            }).join(', ')
                                                            : service.itemsList || service.itemsDescription || service.description || 'No items specified'
                                                    }</p>
                                                    <p><span className="font-medium">Service Type:</span> {service.serviceType || 'Regular'}</p>
                                                    <p><span className="font-medium">Status:</span> <span className={`px-2 py-1 rounded text-xs ${service.status === 'completed' ? 'bg-green-100 text-green-800' : service.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>{service.status || 'Pending'}</span></p>
                                                    <p><span className="font-medium">Amount:</span> ₹{service.totalAmount || service.amount || 'N/A'}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 italic col-span-full">No laundry services found</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default EasyDashboard;