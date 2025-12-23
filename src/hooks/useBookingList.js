import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

// Utility function to format dates from MongoDB
const formatDate = (dateValue) => {
  if (!dateValue) return "N/A";
  
  try {
    // Handle MongoDB $date objects
    if (dateValue && typeof dateValue === 'object' && dateValue.$date) {
      return new Date(dateValue.$date).toLocaleDateString();
    }
    
    // Handle regular date strings/objects
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }
    
    return date.toLocaleDateString();
  } catch (error) {
    console.error('Date formatting error:', error);
    return "Invalid Date";
  }
};

export const useBookingList = () => {
  const navigate = useNavigate();
  const { axios } = useAppContext();
  
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showOnlyExtraBed, setShowOnlyExtraBed] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  const getAuthToken = () => localStorage.getItem("token");

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      const [bookingsRes, roomsRes, categoriesRes] = await Promise.all([
        axios.get("/api/bookings/all", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/rooms/all", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/categories/all", { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const bookingsData = bookingsRes.data;
      const roomsData = Array.isArray(roomsRes.data) ? roomsRes.data : [];
      const categoriesData = Array.isArray(categoriesRes.data) ? categoriesRes.data : [];
      
      setRooms(roomsData);
      setCategories(categoriesData);
      
      const bookingsArray = Array.isArray(bookingsData) ? bookingsData : bookingsData.bookings || [];

      const mappedBookings = bookingsArray.map((b) => {
        const room = roomsData.find(r => r.room_number == b.roomNumber || r.roomNumber == b.roomNumber);
        const category = categoriesData.find(c => 
          c._id == b.categoryId || 
          c.id == b.categoryId ||
          c._id == b.categoryId?._id || 
          c.id == b.categoryId?._id
        ) || (room ? categoriesData.find(c => 
          c._id == room.categoryId || 
          c.id == room.categoryId || 
          c._id == room.category?._id || 
          c.id == room.category?._id
        ) : null);
        
        let extraBedRooms = [];
        if (b.extraBedRooms && Array.isArray(b.extraBedRooms)) {
          extraBedRooms = b.extraBedRooms;
        } else {
          const roomNumbers = b.roomNumber ? b.roomNumber.split(',').map(r => r.trim()) : [];
          extraBedRooms = roomNumbers.filter(roomNum => {
            const roomData = roomsData.find(r => 
              String(r.room_number) === String(roomNum) || 
              String(r.roomNumber) === String(roomNum)
            );
            return roomData?.extra_bed === true;
          });
        }
        
        return {
          id: b._id || "N/A",
          grcNo: b.grcNo || "N/A",
          name: b.name || "N/A",
          mobileNo: b.mobileNo || "N/A",
          roomNumber: b.roomNumber || "N/A",
          category: category?.name || category?.categoryName || b.categoryId?.name || "N/A",
          checkIn: b.checkInDate ? formatDate(b.checkInDate) : "N/A",
          checkOut: b.checkOutDate ? formatDate(b.checkOutDate) : "N/A",
          status: b.status || "N/A",
          paymentStatus: b.paymentStatus || "Pending",
          vip: b.vip || false,
          extraBed: b.extraBed || extraBedRooms.length > 0,
          extraBedRooms: extraBedRooms,
          _raw: b,
        };
      });

      // Sort bookings by creation date (latest first)
      const sortedBookings = mappedBookings.sort((a, b) => {
        const dateA = new Date(a._raw.createdAt || a._raw.bookingDate || 0);
        const dateB = new Date(b._raw.createdAt || b._raw.bookingDate || 0);
        return dateB - dateA; // Descending order (latest first)
      });
      
      setBookings(sortedBookings);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (bookingId, newPaymentStatus) => {
    try {
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking) throw new Error("Booking not found");

      const token = getAuthToken();
      const updateData = {
        paymentStatus: newPaymentStatus,
      };
      
      // If payment status is set to "Paid", set balance due to 0
      if (newPaymentStatus === "Paid") {
        updateData.balanceAmount = 0;
      }
      
      await axios.put(`/api/bookings/update/${bookingId}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                paymentStatus: newPaymentStatus,
                _raw: {
                  ...b._raw,
                  paymentStatus: newPaymentStatus,
                },
              }
            : b
        )
      );

      setError(null);
    } catch (err) {
      console.error("Error updating payment status:", err);
      setError(err.response?.data?.message || err.message || "Failed to update payment status");
    }
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      const token = getAuthToken();
      await axios.put(`/api/bookings/update/${bookingId}`, {
        status: newStatus,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Refresh data to ensure all related updates are reflected
      await fetchData();
      setError(null);
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update status';
      setError(errorMessage);
      console.error("Status update error:", error);
    }
  };

  const deleteBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to delete this booking?")) return;
    
    try {
      const token = getAuthToken();
      await axios.delete(`/api/bookings/delete/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(prev => prev.filter(b => b.id !== bookingId));
      setError(null);
    } catch (err) {
      console.error("Error deleting booking:", err);
      setError(err.response?.data?.message || err.message || "Failed to delete booking");
    }
  };

  const generateInvoice = async (bookingId) => {
    if (generatingInvoice) return;
    
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) {
      setError("Booking not found");
      return;
    }
    
    setGeneratingInvoice(true);
    try {
      const token = getAuthToken();
      
      let checkoutId;
      try {
        const existingCheckoutRes = await axios.get(`/api/checkout/booking/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        checkoutId = existingCheckoutRes.data.checkout._id;
      } catch (error) {
        try {
          const checkoutRes = await axios.post('/api/checkout/create', 
            { bookingId },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          checkoutId = checkoutRes.data.checkout._id;
        } catch (createError) {
          checkoutId = bookingId;
        }
      }
      
      const invoiceBookingData = {
        ...booking._raw,
        customerName: booking.name,
        phoneNumber: booking._raw.mobileNo,
        totalAmount: booking._raw.rate || 0,
        amount: booking._raw.rate || 0
      };
      
      navigate('/invoice', { 
        state: { 
          bookingData: invoiceBookingData,
          checkoutId: checkoutId,
          guestName: booking.name,
          roomNumber: booking.roomNumber,
          grcNo: booking.grcNo
        } 
      });
    } catch (error) {
      console.error('Error generating invoice:', error);
      setError('Failed to generate invoice');
    } finally {
      setTimeout(() => setGeneratingInvoice(false), 2000);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch = b.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      b.roomNumber.toString().includes(debouncedSearch.toString()) ||
      b.grcNo.toLowerCase().includes(debouncedSearch.toLowerCase());
    
    const matchesExtraBed = showOnlyExtraBed ? b.extraBed : true;
    
    return matchesSearch && matchesExtraBed;
  });

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Debounce search to prevent excessive API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    fetchData();
  }, []);

  // Add cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup any pending requests
    };
  }, []);

  return {
    bookings,
    loading,
    error,
    setError,
    search,
    setSearch,
    debouncedSearch,
    currentPage,
    totalPages,
    paginatedBookings,
    showOnlyExtraBed,
    setShowOnlyExtraBed,
    generatingInvoice,
    fetchData,
    updatePaymentStatus,
    updateBookingStatus,
    deleteBooking,
    generateInvoice,
    handlePageChange
  };
};