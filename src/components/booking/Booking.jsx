import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, XCircle, CheckCircle, Search, X, FileText, Trash2, Calendar, Eye } from "lucide-react";
import { useBookingList } from "../../hooks/useBookingList";
import { useAppContext } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import Pagination from "../common/Pagination";
import DashboardLoader from '../DashboardLoader';
import HotelCheckout from './HotelCheckout';

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
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}



const BookingPage = () => {
  const navigate = useNavigate();
  const { axios } = useAppContext();
  const { hasRole } = useAuth();
  const {
    bookings,
    loading,
    error,
    setError,
    search,
    setSearch,
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
  } = useBookingList();

  const [showInvoice, setShowInvoice] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [grcSearchResult, setGrcSearchResult] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedBookingForCheckout, setSelectedBookingForCheckout] = useState(null);
  const [showAmendModal, setShowAmendModal] = useState(false);
  const [selectedBookingForAmend, setSelectedBookingForAmend] = useState(null);
  const [amendmentData, setAmendmentData] = useState({
    newCheckOutDate: '',
    reason: ''
  });

  const getAuthToken = () => localStorage.getItem("token");

  React.useEffect(() => {
    const loadInitialData = async () => {
      setIsInitialLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
      setIsInitialLoading(false);
    };
    loadInitialData();
  }, []);

  const fetchBookingByGrc = async (grcNo) => {
    try {
      const token = getAuthToken();
      const res = await axios.get(`/api/bookings/fetch-by-grc/${grcNo}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGrcSearchResult(res.data);
    } catch (err) {
      setError(`No booking found for GRC: ${grcNo}`);
      setGrcSearchResult(null);
    }
  };



  const toggleBookingStatus = async (bookingId) => {
    try {
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking) throw new Error("Booking not found");

      const token = getAuthToken();
      
      if (booking.status === "Booked") {
        // Unbook the room (set to Cancelled)
        await axios.put(`/api/bookings/unbook/${bookingId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Update room status to Available
        await updateRoomStatus(booking.roomNumber, "Available");
      } else if (booking.status === "Cancelled" || booking.status !== "Booked") {
        // Book the room (update status to Booked)
        await axios.put(`/api/bookings/update/${bookingId}`, {
          status: "Booked"
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Update room status to Booked
        await updateRoomStatus(booking.roomNumber, "Booked");
      }

      // Refresh data to get updated status
      fetchData();
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error toggling booking status:", err);
    }
  };

  const updateRoomStatus = async (roomNumber, status) => {
    try {
      const token = getAuthToken();
      const roomsRes = await axios.get("/api/rooms/all", { headers: { Authorization: `Bearer ${token}` } });
      const rooms = Array.isArray(roomsRes.data) ? roomsRes.data : [];
      const room = rooms.find(r => r.room_number == roomNumber || r.roomNumber == roomNumber);
      
      if (room) {
        await axios.put(`/api/rooms/update/${room._id || room.id}`, { status }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.error("Error updating room status:", err);
    }
  };



  const openCheckout = (bookingId) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) {
      setError("Booking not found");
      return;
    }
    setSelectedBookingForCheckout(booking._raw);
    setShowCheckout(true);
  };

  const handleCheckoutComplete = () => {
    fetchData(); // Refresh the bookings list
  };

  const openAmendModal = async (bookingId) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) {
      setError("Booking not found");
      return;
    }
    if (booking.status === 'Checked Out') {
      setError("Cannot amend checked out booking");
      return;
    }
    
    // Fetch conflicting dates
    try {
      const token = getAuthToken();
      const response = await axios.get(`/api/bookings/conflicts/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConflictingDates(response.data.conflictingDates || []);
    } catch (error) {
      console.error('Error fetching conflicting dates:', error);
      setConflictingDates([]);
    }
    
    setSelectedBookingForAmend(booking);
    setAmendmentData({
      newCheckOutDate: '',
      reason: ''
    });
    setShowAmendModal(true);
  };

  const [amendingStay, setAmendingStay] = useState(false);
  const [conflictingDates, setConflictingDates] = useState([]);

  const handleAmendStay = async () => {
    if (!amendmentData.newCheckOutDate) {
      setError('Please select new check-out date');
      return;
    }

    if (new Date(selectedBookingForAmend.checkIn) >= new Date(amendmentData.newCheckOutDate)) {
      setError('Check-out date must be after original check-in date');
      return;
    }

    setAmendingStay(true);
    try {
      const token = getAuthToken();
      const response = await axios.post(`/api/bookings/amend/${selectedBookingForAmend.id}`, amendmentData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowAmendModal(false);
      setSelectedBookingForAmend(null);
      setError(null);
      fetchData(); // Refresh the bookings list
      
      // Show success message with amendment details
      const amendment = response.data.amendment;
      alert(`Booking stay amended successfully!\n\nRate adjustment: ₹${amendment.totalAdjustment}\nNew total: ₹${amendment.newTotalAmount}`);
      
    } catch (error) {
      console.error('Error amending booking:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to amend booking';
      setError(errorMessage);
    } finally {
      setAmendingStay(false);
    }
  };





  if (isInitialLoading) {
    return <DashboardLoader pageName="Bookings" />;
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: 'hsl(45, 100%, 95%)', opacity: isInitialLoading ? 0 : 1, transition: 'opacity 0.3s ease-in-out'}}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-8 animate-slideInLeft animate-delay-100">
          <h1 className="text-3xl font-extrabold" style={{color: 'hsl(45, 100%, 20%)'}}>
            Bookings
          </h1>
        <button
          onClick={() => navigate("/bookingform")}
          className="font-semibold py-2 px-4 sm:px-6 rounded-lg shadow-md transition duration-300 text-sm sm:text-base"
          style={{ backgroundColor: 'hsl(45, 43%, 58%)', color: 'white' }}
        >
          Add Booking
        </button>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 animate-fadeInUp animate-delay-200">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by name, room number, or GRC No..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 w-full shadow-sm transition duration-300 text-sm sm:text-base"
            style={{ 
              backgroundColor: 'white', 
              border: '1px solid hsl(45, 100%, 85%)',
              focusRingColor: 'hsl(45, 43%, 58%)'
            }}
          />
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        </div>
        <button
          onClick={() => fetchBookingByGrc(search)}
          className="font-semibold px-4 py-3 rounded-lg shadow-md transition duration-300 text-sm sm:text-base whitespace-nowrap"
          style={{ backgroundColor: 'hsl(45, 43%, 58%)', color: 'white' }}
        >
          Search GRC
        </button>
        <button
          onClick={() => setShowOnlyExtraBed(!showOnlyExtraBed)}
          className={`font-semibold px-4 py-3 rounded-lg shadow-md transition duration-300 text-sm sm:text-base whitespace-nowrap ${
            showOnlyExtraBed ? 'ring-2 ring-green-500' : ''
          }`}
          style={{ 
            backgroundColor: showOnlyExtraBed ? 'hsl(120, 60%, 50%)' : 'hsl(45, 43%, 58%)', 
            color: 'white' 
          }}
        >
          {showOnlyExtraBed ? 'Show All' : 'Extra Bed Only'}
        </button>
        <button
          onClick={fetchData}
          className="font-semibold px-4 py-3 rounded-lg shadow-md transition duration-300 text-sm sm:text-base whitespace-nowrap"
          style={{ backgroundColor: 'hsl(200, 60%, 50%)', color: 'white' }}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg relative mb-4 flex items-center justify-between shadow-sm" style={{ backgroundColor: 'hsl(0, 100%, 95%)', border: '1px solid hsl(0, 100%, 85%)', color: 'hsl(0, 100%, 30%)' }}>
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="transition duration-300"
            style={{ color: 'hsl(0, 100%, 30%)' }}
          >
            <X size={20} />
          </button>
        </div>
      )}

      {grcSearchResult && (
        <div className="px-4 py-3 rounded-lg relative mb-4" style={{ backgroundColor: 'hsl(120, 100%, 95%)', border: '1px solid hsl(120, 100%, 85%)', color: 'hsl(120, 100%, 30%)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">GRC Search Result:</p>
              <p>Name: {grcSearchResult.name}</p>
              <p>GRC: {grcSearchResult.grcNo}</p>
              <p>Room: {grcSearchResult.roomNumber}</p>
            </div>
            <button
              onClick={() => setGrcSearchResult(null)}
              className="transition duration-300"
              style={{ color: 'hsl(120, 100%, 30%)' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 mx-auto" style={{borderColor: 'hsl(45, 43%, 58%)'}}></div>
          <p className="mt-4" style={{ color: 'hsl(45, 100%, 20%)' }}>Loading bookings...</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-xl shadow-lg overflow-hidden bg-white animate-scaleIn animate-delay-300" style={{ border: '1px solid hsl(45, 100%, 85%)' }}>
          <div className="overflow-x-auto overflow-y-scroll max-h-[70vh]" style={{scrollbarWidth: 'thin'}}>
            <table className="w-full">
              <thead className="border-b" style={{ backgroundColor: 'hsl(45, 100%, 90%)', borderColor: 'hsl(45, 100%, 85%)' }}>
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider w-20" style={{ color: 'hsl(45, 100%, 20%)' }}>
                    GRC
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider w-20" style={{ color: 'hsl(45, 100%, 20%)' }}>
                    Invoice
                  </th>
                  <th className="px-1 py-3 text-left text-xs font-semibold uppercase tracking-wider w-32" style={{ color: 'hsl(45, 100%, 20%)' }}>
                    Name
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider w-24" style={{ color: 'hsl(45, 100%, 20%)' }}>
                    Room
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider w-20 hidden lg:table-cell" style={{ color: 'hsl(45, 100%, 20%)' }}>
                    Category
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider w-20 hidden lg:table-cell" style={{ color: 'hsl(45, 100%, 20%)' }}>
                    Extra
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider w-20 hidden lg:table-cell" style={{ color: 'hsl(45, 100%, 20%)' }}>
                    Check In
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider w-20 hidden lg:table-cell" style={{ color: 'hsl(45, 100%, 20%)' }}>
                    Check Out
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider w-24" style={{ color: 'hsl(45, 100%, 20%)' }}>
                    Status
                  </th>
                  {paginatedBookings.some(booking => booking._raw?.amendmentHistory && booking._raw.amendmentHistory.length > 0) && (
                    <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider w-16 hidden lg:table-cell" style={{ color: 'hsl(45, 100%, 20%)' }}>
                      Amended
                    </th>
                  )}
                  <th className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider w-20 hidden lg:table-cell" style={{ color: 'hsl(45, 100%, 20%)' }}>
                    Payment
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider w-32" style={{ color: 'hsl(45, 100%, 20%)' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ backgroundColor: 'white', borderColor: 'hsl(45, 100%, 90%)' }}>
                {paginatedBookings.map((booking, index) => (
                  <tr
                    key={booking.id}
                    className="transition-colors duration-200 animate-fadeInUp"
                    style={{animationDelay: `${Math.min(index * 50 + 400, 800)}ms`}}
                  >
                    <td className="px-2 py-3 whitespace-nowrap text-xs" style={{ color: 'hsl(45, 100%, 20%)' }}>
                      {booking.grcNo}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-xs" style={{ color: 'hsl(45, 100%, 20%)' }}>
                      <div className="truncate" title={booking._raw?.invoiceNumber}>{booking._raw?.invoiceNumber || 'N/A'}</div>
                    </td>
                    <td className="px-1 py-3 text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>
                      <div className="truncate" title={booking.name}>{booking.name}</div>
                    </td>
                    <td className="px-2 py-3 text-xs" style={{ color: 'hsl(45, 100%, 20%)' }}>
                      {booking.roomNumber.includes(',') ? (
                        <div className="flex flex-wrap gap-1">
                          {booking.roomNumber.split(',').slice(0, 2).map((room, idx) => (
                            <span key={idx} className="inline-block bg-blue-100 text-blue-800 text-xs px-1 py-0.5 rounded">
                              {room.trim()}
                            </span>
                          ))}
                          {booking.roomNumber.split(',').length > 2 && (
                            <span className="text-xs text-gray-500">+{booking.roomNumber.split(',').length - 2}</span>
                          )}
                        </div>
                      ) : (
                        booking.roomNumber
                      )}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-xs hidden lg:table-cell" style={{ color: 'hsl(45, 100%, 20%)' }}>
                      <div className="truncate" title={booking.category}>{booking.category}</div>
                    </td>
                    <td className="px-2 py-3 text-xs hidden lg:table-cell">
                      {booking.extraBedRooms && booking.extraBedRooms.length > 0 ? (
                        <span className="text-green-600">{booking.extraBedRooms.length}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-xs hidden lg:table-cell" style={{ color: 'hsl(45, 100%, 20%)' }}>
                      {booking.checkIn}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap text-xs hidden lg:table-cell" style={{ color: 'hsl(45, 100%, 20%)' }}>
                      {booking.checkOut}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      <select
                        value={booking.status}
                        onChange={(e) => {
                          if (confirm(`Are you sure you want to change booking status to "${e.target.value}"?`)) {
                            updateBookingStatus(booking.id, e.target.value);
                          }
                        }}
                        disabled={booking.status === 'Checked Out'}
                        className={`px-1 py-1 rounded border text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-full ${
                          booking.status === 'Checked Out' ? 'cursor-not-allowed opacity-60' : ''
                        } ${
                          booking.status === "Booked"
                            ? "bg-green-100 text-green-800 border-green-300"
                            : booking.status === "Cancelled"
                            ? "bg-red-100 text-red-800 border-red-300"
                            : booking.status === "Checked In"
                            ? "bg-blue-100 text-blue-800 border-blue-300"
                            : "bg-yellow-100 text-yellow-800 border-yellow-300"
                        }`}
                      >
                        <option value="Booked">Booked</option>
                        <option value="Checked In">Checked In</option>
                        <option value="Checked Out">Checked Out</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    {paginatedBookings.some(booking => booking._raw?.amendmentHistory && booking._raw.amendmentHistory.length > 0) && (
                      <td className="px-2 py-3 text-center text-xs hidden lg:table-cell">
                        {booking._raw?.amendmentHistory && booking._raw.amendmentHistory.length > 0 ? (
                          <button
                            onClick={() => {
                              alert(`Amendment History:\n${booking._raw.amendmentHistory.map((a, i) => 
                                `${i+1}. ${new Date(a.amendedOn).toLocaleDateString()}: Extended to ${new Date(a.newCheckOut).toLocaleDateString()} (₹${a.totalAdjustment || 0})`
                              ).join('\n')}`);
                            }}
                            className="bg-orange-100 text-orange-800 px-1 py-0.5 rounded text-xs hover:bg-orange-200"
                            title="View amendment history"
                          >
                            {booking._raw.amendmentHistory.length}x
                          </button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    )}
                    <td className="px-2 py-3 whitespace-nowrap hidden lg:table-cell">
                      <select
                        value={booking.status === "Checked Out" ? "Paid" : booking.paymentStatus}
                        onChange={(e) => {
                          if (confirm(`Are you sure you want to change payment status to "${e.target.value}"?`)) {
                            updatePaymentStatus(booking.id, e.target.value);
                          }
                        }}
                        disabled={booking.status === 'Checked Out'}
                        className={`px-1 py-1 rounded border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-full ${
                          booking.status === 'Checked Out' ? 'cursor-not-allowed opacity-60' : ''
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Failed">Failed</option>
                        <option value="Partial">Partial</option>
                      </select>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex flex-col gap-1 items-center">
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => navigate(`/booking-details/${booking._raw?.bookingNo || booking.id}`)}
                            title="View"
                            className="p-1 rounded transition duration-300 text-indigo-600 hover:bg-indigo-50"
                          >
                            <Eye size={12} />
                          </button>

                          <button
                            onClick={() => navigate(`/edit-booking/${booking._raw?.grcNo || booking.id}`, { state: { editBooking: booking._raw } })}
                            disabled={booking.status === 'Checked Out'}
                            title="Edit"
                            className={`p-1 rounded transition duration-300 ${
                              booking.status === 'Checked Out' 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : 'text-blue-600 hover:bg-blue-50'
                            }`}
                          >
                            <Edit size={12} />
                          </button>

                          <button
                            onClick={() => openAmendModal(booking.id)}
                            disabled={booking.status === 'Checked Out'}
                            title="Amend"
                            className={`p-1 rounded transition duration-300 ${
                              booking.status === 'Checked Out' 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : 'text-orange-600 hover:bg-orange-50'
                            }`}
                          >
                            <Calendar size={12} />
                          </button>

                          <button
                            onClick={() => generateInvoice(booking.id)}
                            disabled={generatingInvoice}
                            title="Bill"
                            className={`p-1 rounded transition duration-300 ${
                              generatingInvoice ? 'text-gray-400 cursor-not-allowed' : 'text-green-600 hover:bg-green-50'
                            }`}
                          >
                            <FileText size={12} />
                          </button>
                          
                          {hasRole('ADMIN') && (
                            <button
                              onClick={() => deleteBooking(booking.id)}
                              title="Delete"
                              className="p-1 rounded text-red-600 transition duration-300 hover:bg-red-50"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                        
                        <div>
                          {booking.status === 'Booked' && (
                            <button
                              onClick={() => {
                                if (confirm(`CHECK-IN CONFIRMATION\n\nGuest: ${booking.name}\nGRC No: ${booking.grcNo}\nRoom: ${booking.roomNumber}\n\nAre you sure you want to check in this guest?`)) {
                                  updateBookingStatus(booking.id, 'Checked In');
                                }
                              }}
                              className="bg-blue-600 text-white px-2 py-1 rounded text-xs transition duration-300 hover:bg-blue-700"
                            >
                              Check In
                            </button>
                          )}
                          {booking.status === 'Checked In' && (
                            <button
                              onClick={() => openCheckout(booking.id)}
                              className="bg-purple-600 text-white px-2 py-1 rounded text-xs transition duration-300 hover:bg-purple-700"
                            >
                              Checkout
                            </button>
                          )}
                          {booking.status === 'Checked Out' && (
                            <span className="bg-gray-400 text-white px-2 py-1 rounded text-xs">
                              Checked Out
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {paginatedBookings.map((booking, index) => (
            <div
              key={booking.id}
              className="rounded-lg shadow-md p-4 bg-white animate-scaleIn"
              style={{ border: '1px solid hsl(45, 100%, 85%)', animationDelay: `${Math.min(index * 100 + 300, 700)}ms` }}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg" style={{ color: 'hsl(45, 100%, 20%)' }}>{booking.name}</h3>
                  <p className="text-sm" style={{ color: 'hsl(45, 100%, 40%)' }}>GRC: {booking.grcNo}</p>
                  <p className="text-sm" style={{ color: 'hsl(45, 100%, 40%)' }}>Invoice: {booking._raw?.invoiceNumber || 'N/A'}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    booking.status === "Booked"
                      ? "bg-green-100 text-green-800"
                      : booking.status === "Cancelled"
                      ? "bg-red-100 text-red-800"
                      : booking.status === "Checked In"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {booking.status}
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 text-sm">
                <div>
                  <span style={{ color: 'hsl(45, 100%, 40%)' }}>Room{booking.roomNumber.includes(',') ? 's' : ''}:</span>
                  <div className="ml-1 font-medium" style={{ color: 'hsl(45, 100%, 20%)' }}>
                    {booking.roomNumber.includes(',') ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {booking.roomNumber.split(',').map((room, idx) => (
                          <span key={idx} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {room.trim()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      booking.roomNumber
                    )}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'hsl(45, 100%, 40%)' }}>Category:</span>
                  <span className="ml-1 font-medium" style={{ color: 'hsl(45, 100%, 20%)' }}>{booking.category}</span>
                </div>
                <div>
                  <span style={{ color: 'hsl(45, 100%, 40%)' }}>Extra Bed Rooms:</span>
                  <div className="ml-1 mt-1">
                    {booking.extraBedRooms && booking.extraBedRooms.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {booking.extraBedRooms.map((room, idx) => (
                          <span key={idx} className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            {room}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500 text-xs">None</span>
                    )}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'hsl(45, 100%, 40%)' }}>Check In:</span>
                  <span className="ml-1 font-medium" style={{ color: 'hsl(45, 100%, 20%)' }}>{booking.checkIn}</span>
                </div>
                <div>
                  <span style={{ color: 'hsl(45, 100%, 40%)' }}>Check Out:</span>
                  <span className="ml-1 font-medium" style={{ color: 'hsl(45, 100%, 20%)' }}>{booking.checkOut}</span>
                </div>
                <div>
                  <span style={{ color: 'hsl(45, 100%, 40%)' }}>Amended:</span>
                  <div className="ml-1">
                    {booking._raw?.amendmentHistory && booking._raw.amendmentHistory.length > 0 ? (
                      <div className="flex items-center">
                        <span className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">
                          {booking._raw.amendmentHistory.length}x
                        </span>
                        <button
                          onClick={() => {
                            alert(`Amendment History:\n${booking._raw.amendmentHistory.map((a, i) => 
                              `${i+1}. ${new Date(a.amendedOn).toLocaleDateString()}: Extended to ${new Date(a.newCheckOut).toLocaleDateString()} (₹${a.totalAdjustment || 0})`
                            ).join('\n')}`);
                          }}
                          className="ml-1 text-orange-600 hover:text-orange-800 text-xs"
                          title="View amendment history"
                        >
                          ℹ️
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-xs">None</span>
                    )}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'hsl(45, 100%, 40%)' }}>Payment:</span>
                  <select
                    value={booking.status === "Checked Out" ? "Paid" : booking.paymentStatus}
                    onChange={(e) => {
                      if (confirm(`Are you sure you want to change payment status to "${e.target.value}"?`)) {
                        updatePaymentStatus(booking.id, e.target.value);
                      }
                    }}
                    disabled={booking.status === 'Checked Out'}
                    className={`ml-1 px-2 py-1 rounded border border-gray-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      booking.status === 'Checked Out' ? 'cursor-not-allowed opacity-60' : ''
                    }`}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Failed">Failed</option>
                    <option value="Partial">Partial</option>
                  </select>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t" style={{ borderColor: 'hsl(45, 100%, 90%)' }}>
                <button
                  onClick={() => navigate(`/booking-details/${booking._raw?.bookingNo || booking.id}`)}
                  className="p-2 rounded-full transition duration-300"
                  style={{ color: '#6366F1' }}
                  title="View Details"
                >
                  <Eye size={18} />
                </button>

                <button
                  onClick={() => navigate(`/edit-booking/${booking._raw?.grcNo || booking.id}`, { state: { editBooking: booking._raw } })}
                  disabled={booking.status === 'Checked Out'}
                  className={`p-2 rounded-full transition duration-300 ${
                    booking.status === 'Checked Out' 
                      ? 'cursor-not-allowed' 
                      : ''
                  }`}
                  style={{ 
                    color: booking.status === 'Checked Out' 
                      ? '#9CA3AF' 
                      : 'hsl(45, 43%, 58%)' 
                  }}
                  title={booking.status === 'Checked Out' ? 'Cannot edit checked out booking' : 'Edit'}
                >
                  <Edit size={18} />
                </button>

                <button
                  onClick={() => openAmendModal(booking.id)}
                  disabled={booking.status === 'Checked Out'}
                  className={`p-2 rounded-full transition duration-300 ${
                    booking.status === 'Checked Out' 
                      ? 'cursor-not-allowed' 
                      : ''
                  }`}
                  style={{ 
                    color: booking.status === 'Checked Out' 
                      ? '#9CA3AF' 
                      : '#EA580C' 
                  }}
                  title={booking.status === 'Checked Out' ? 'Cannot amend checked out booking' : 'Amend Stay'}
                >
                  <Calendar size={18} />
                </button>

                <button
                  onClick={() => generateInvoice(booking.id)}
                  disabled={generatingInvoice}
                  className={`p-2 rounded-full transition duration-300 ${
                    generatingInvoice ? 'cursor-not-allowed' : ''
                  }`}
                  style={{ color: generatingInvoice ? '#9CA3AF' : 'hsl(120, 60%, 40%)' }}
                  title={generatingInvoice ? "Generating..." : "Generate Bill"}
                >
                  <FileText size={18} />
                </button>
                {booking.status === 'Booked' && (
                  <button
                    onClick={() => {
                      if (confirm(`CHECK-IN CONFIRMATION\n\nGuest: ${booking.name}\nGRC No: ${booking.grcNo}\nRoom: ${booking.roomNumber}\n\nAre you sure you want to check in this guest?`)) {
                        updateBookingStatus(booking.id, 'Checked In');
                      }
                    }}
                    className="px-3 py-1 rounded text-sm transition duration-300"
                    style={{ backgroundColor: 'hsl(200, 60%, 50%)', color: 'white' }}
                  >
                    Check In
                  </button>
                )}
                {booking.status === 'Checked In' && (
                  <button
                    onClick={() => openCheckout(booking.id)}
                    className="px-3 py-1 rounded text-sm transition duration-300"
                    style={{ backgroundColor: 'hsl(45, 71%, 69%)', color: 'hsl(45, 100%, 20%)' }}
                  >
                    Checkout
                  </button>
                )}
                {booking.status === 'Checked Out' && (
                  <button
                    disabled
                    className="px-3 py-1 rounded text-sm cursor-not-allowed"
                    style={{ backgroundColor: '#9CA3AF', color: '#6B7280' }}
                  >
                    Checked Out
                  </button>
                )}
                {hasRole('ADMIN') && (
                  <button
                    onClick={() => deleteBooking(booking.id)}
                    className="p-2 rounded-full transition duration-300"
                    style={{ color: 'hsl(0, 60%, 50%)' }}
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
          </div>
          <div className="animate-fadeInUp animate-delay-300">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={10}
              totalItems={bookings.length}
            />
          </div>
        </>
      )}



      {showInvoice && currentInvoice && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'hsl(45, 100%, 95%)' }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold" style={{ color: 'hsl(45, 100%, 20%)' }}>Invoice</h3>
              <button
                onClick={() => setShowInvoice(false)}
                className="transition duration-300"
                style={{ color: 'hsl(45, 100%, 40%)' }}
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold">Invoice Number:</p>
                  <p>{currentInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="font-semibold">Date:</p>
                  <p>{new Date(currentInvoice.issueDate || Date.now()).toLocaleDateString()}</p>
                </div>
              </div>
              <div>
                <p className="font-semibold">Guest Details:</p>
                <p>{currentInvoice.booking?.name}</p>
                <p>Room: {currentInvoice.booking?.roomNumber}</p>
              </div>
              <div>
                <p className="font-semibold">Items:</p>
                {currentInvoice.items?.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{item.description}</span>
                    <span>₹{item.amount}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{currentInvoice.subTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>₹{currentInvoice.tax}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>₹{currentInvoice.totalAmount}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded transition duration-300"
                style={{ backgroundColor: 'hsl(45, 43%, 58%)', color: 'white' }}
              >
                Print
              </button>
              <button
                onClick={() => setShowInvoice(false)}
                className="px-4 py-2 rounded transition duration-300"
                style={{ backgroundColor: 'hsl(45, 100%, 85%)', color: 'hsl(45, 100%, 20%)' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && selectedBookingForCheckout && (
        <HotelCheckout
          booking={selectedBookingForCheckout}
          onClose={() => {
            setShowCheckout(false);
            setSelectedBookingForCheckout(null);
          }}
          onCheckoutComplete={handleCheckoutComplete}
        />
      )}

      {/* Amendment Modal */}
      {showAmendModal && selectedBookingForAmend && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Amend Booking Stay</h3>
              <button
                onClick={() => {
                  setShowAmendModal(false);
                  setSelectedBookingForAmend(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Current Stay:</strong><br />
                  Guest: {selectedBookingForAmend.name}<br />
                  Room: {selectedBookingForAmend.roomNumber}<br />
                  Check-in: {selectedBookingForAmend.checkIn} (Fixed)<br />
                  Check-out: {selectedBookingForAmend.checkOut}<br />
                  <span className="text-xs">Amendments made: {selectedBookingForAmend._raw?.amendmentHistory?.length || 0}/3</span>
                </p>
              </div>
              
              {selectedBookingForAmend._raw?.amendmentHistory && selectedBookingForAmend._raw.amendmentHistory.length > 0 && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm text-yellow-800 font-medium mb-2">Previous Amendments:</p>
                  {selectedBookingForAmend._raw.amendmentHistory.slice(-2).map((amendment, index) => (
                    <div key={index} className="text-xs text-yellow-700 mb-1">
                      {new Date(amendment.amendedOn).toLocaleDateString()}: Extended to {new Date(amendment.newCheckOut).toLocaleDateString()} (₹{amendment.totalAdjustment || 0})
                    </div>
                  ))}
                  {selectedBookingForAmend._raw.amendmentHistory.length > 2 && (
                    <div className="text-xs text-yellow-600 mt-1">
                      ... and {selectedBookingForAmend._raw.amendmentHistory.length - 2} more
                    </div>
                  )}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">New Check-out Date</label>
                <input
                  type="date"
                  value={amendmentData.newCheckOutDate}
                  min={selectedBookingForAmend.checkIn}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    if (conflictingDates.includes(selectedDate)) {
                      setError(`Room is not available on ${new Date(selectedDate).toLocaleDateString()}. Please select another date.`);
                      return;
                    }
                    setError(null);
                    setAmendmentData(prev => ({ ...prev, newCheckOutDate: selectedDate }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {conflictingDates.length > 0 && (
                  <p className="text-xs text-red-600">
                    Room unavailable on: {conflictingDates.slice(0, 5).map(d => new Date(d).toLocaleDateString()).join(', ')}
                    {conflictingDates.length > 5 && ` and ${conflictingDates.length - 5} more dates`}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Reason for Amendment</label>
                <textarea
                  value={amendmentData.reason}
                  onChange={(e) => setAmendmentData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Enter reason for date change..."
                />
              </div>
              
              {amendmentData.newCheckOutDate && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>New Stay:</strong><br />
                    Check-in: {selectedBookingForAmend.checkIn} (Same)<br />
                    Check-out: {new Date(amendmentData.newCheckOutDate).toLocaleDateString()}<br />
                    Duration: {Math.ceil((new Date(amendmentData.newCheckOutDate) - new Date(selectedBookingForAmend.checkIn)) / (1000 * 60 * 60 * 24))} days
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAmendModal(false);
                  setSelectedBookingForAmend(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAmendStay}
                disabled={amendingStay}
                className={`px-4 py-2 text-white rounded-md transition-colors ${
                  amendingStay 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {amendingStay ? 'Amending...' : 'Amend Stay'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default BookingPage;
