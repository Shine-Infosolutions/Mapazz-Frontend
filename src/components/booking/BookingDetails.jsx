import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, CreditCard, Bed, Users, Edit2, Plus } from 'lucide-react';
import axios from 'axios';

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

// Utility function to calculate days between dates
const calculateDays = (checkInDate, checkOutDate) => {
  try {
    const checkIn = checkInDate && checkInDate.$date 
      ? new Date(checkInDate.$date) 
      : new Date(checkInDate);
    const checkOut = checkOutDate && checkOutDate.$date 
      ? new Date(checkOutDate.$date) 
      : new Date(checkOutDate);
    
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return 0;
    }
    
    return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.error('Date calculation error:', error);
    return 0;
  }
};

const BookingDetails = () => {
  const { bookingId } = useParams(); // This will now be bookingNo
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serviceCharges, setServiceCharges] = useState([]);
  const [restaurantCharges, setRestaurantCharges] = useState([]);
  const [laundryCharges, setLaundryCharges] = useState([]);


  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${BASE_URL}/api/bookings/booking-number/${bookingId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setBooking(response.data.booking);
      
      // Fetch service charges
      if (response.data.booking._id) {
        await fetchServiceCharges(response.data.booking._id, token, response.data.booking);
      }
    } catch (err) {
      setError(`Failed to fetch booking details: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceCharges = async (bookingId, token, bookingData = booking) => {
    try {
      console.log('Fetching charges for booking ID:', bookingId);
      
      // Fetch room service orders by booking ID
      const serviceResponse = await axios.get(`${BASE_URL}/api/room-service/all`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { bookingId }
      });
      
      // Fetch restaurant orders by booking ID and booking number
      const restaurantResponse = await axios.get(`${BASE_URL}/api/restaurant-orders/all`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { 
          bookingId: bookingId,
          bookingNumber: bookingData?.grcNo
        }
      });
      
      // Fetch laundry orders by room number and GRC
      const laundryResponse = await axios.get(`${BASE_URL}/api/laundry/all`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: {
          search: bookingData?.roomNumber || bookingData?.grcNo
        }
      });
      
      console.log('Room service response:', serviceResponse.data);
      console.log('Restaurant response:', restaurantResponse.data);
      
      // Filter restaurant orders
      const allRestaurantOrders = restaurantResponse.data || [];
      console.log('All restaurant orders:', allRestaurantOrders);
      console.log('Current booking room number:', bookingData?.roomNumber);
      console.log('Current booking ID:', bookingId);
      
      const filteredRestaurantOrders = allRestaurantOrders.filter(order => {
        console.log('Checking order:', order._id, 'bookingId:', order.bookingId, 'bookingNumber:', order.bookingNumber, 'tableNo:', order.tableNo, 'status:', order.status);
        
        // Match only by booking ID or booking number
        const matchesBookingId = (order.bookingId && order.bookingId._id === bookingId) || order.bookingId === bookingId;
        const matchesBookingNumber = order.bookingNumber === bookingData?.grcNo;
        
        const isForThisBooking = matchesBookingId || matchesBookingNumber;
        const isNotCancelled = order.status !== 'cancelled' && order.status !== 'canceled';
        
        console.log('Match result:', { matchesBookingId, matchesBookingNumber, isForThisBooking, isNotCancelled });
        
        return isForThisBooking && isNotCancelled;
      });
      
      // Filter room service orders to exclude cancelled ones
      const filteredServiceOrders = (serviceResponse.data.orders || []).filter(order => 
        order.status !== 'cancelled' && order.status !== 'canceled'
      );
      
      // Filter laundry orders by room number or GRC
      const allLaundryOrders = laundryResponse.data || [];
      const roomNumbers = bookingData?.roomNumber ? bookingData.roomNumber.split(',').map(num => num.trim()) : [];
      const filteredLaundryOrders = allLaundryOrders.filter(order => {
        const matchesRoom = roomNumbers.some(roomNum => order.roomNumber === roomNum);
        const matchesGRC = order.grcNo === bookingData?.grcNo;
        const isNotCancelled = order.laundryStatus !== 'cancelled' && order.laundryStatus !== 'canceled';
        
        return (matchesRoom || matchesGRC) && isNotCancelled;
      });
      
      console.log('Final filtered restaurant orders:', filteredRestaurantOrders);
      console.log('Final filtered service orders:', filteredServiceOrders);
      console.log('Final filtered laundry orders:', filteredLaundryOrders);
      
      setServiceCharges(filteredServiceOrders);
      setRestaurantCharges(filteredRestaurantOrders);
      setLaundryCharges(filteredLaundryOrders);
    } catch (err) {
      console.error('Failed to fetch service charges:', err);
    }
  };







  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error || 'Booking not found'}</p>
          <button
            onClick={() => navigate('/booking')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/booking')}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Bookings
          </button>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800">Booking Details</h1>
            <button
              onClick={() => navigate(`/edit-booking/${booking.grcNo}`, { state: { editBooking: booking } })}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit2 size={18} className="mr-2" />
              Edit
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Guest Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <User className="mr-2 text-blue-600" size={20} />
                Guest Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Full Name</label>
                  <p className="text-lg font-medium text-gray-800">{booking.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Mobile Number</label>
                  <p className="text-lg font-medium text-gray-800 flex items-center">
                    <Phone size={16} className="mr-2 text-gray-500" />
                    {booking.mobileNo}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Email</label>
                  <p className="text-lg font-medium text-gray-800 flex items-center">
                    <Mail size={16} className="mr-2 text-gray-500" />
                    {booking.email || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Address</label>
                  <p className="text-lg font-medium text-gray-800 flex items-center">
                    <MapPin size={16} className="mr-2 text-gray-500" />
                    {booking.address || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">ID Proof Type</label>
                  <p className="text-lg font-medium text-gray-800">{booking.idProofType || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">ID Proof Number</label>
                  <p className="text-lg font-medium text-gray-800">{booking.idProofNumber || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Room Guest Details */}
            {booking.roomGuestDetails && booking.roomGuestDetails.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Users className="mr-2 text-blue-600" size={20} />
                  Room Guest Details
                </h2>
                <div className="space-y-4">
                  {booking.roomRates?.map((roomRate, index) => {
                    // Find corresponding guest details for this room
                    const guestDetails = booking.roomGuestDetails?.find(guest => guest.roomNumber === roomRate.roomNumber);
                    
                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-medium text-gray-800 mb-2">Room {roomRate.roomNumber}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Adults:</span>
                            <span className="ml-2 font-medium">{guestDetails?.adults || 0}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Children:</span>
                            <span className="ml-2 font-medium">{guestDetails?.children || 0}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Rate:</span>
                            <span className="ml-2 font-medium">₹{roomRate.customRate || 0}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Extra Bed:</span>
                            <span className="ml-2 font-medium">{roomRate.extraBed ? 'Yes' : 'No'}</span>
                          </div>
                        </div>
                        {roomRate.extraBed && roomRate.extraBedStartDate && (
                          <div className="mt-2 text-xs text-green-600">
                            Extra bed from: {new Date(roomRate.extraBedStartDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Room Service Orders */}
            {serviceCharges.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Room Service Orders ({serviceCharges.length})</h2>
                <div className="space-y-4">
                  {serviceCharges.map((order) => (
                    <div key={order._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium text-gray-800">Order #{order.orderNumber || order._id.slice(-6)}</p>
                          <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className="text-lg font-semibold text-blue-600">
                          {order.nonChargeable ? (
                            <span className="text-green-600 font-bold">NC</span>
                          ) : (
                            `₹${order.totalAmount || 0}`
                          )}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm text-gray-700">
                            <span>{item.itemName} x {item.quantity}</span>
                            <span className="text-green-600 font-bold">
                              {(item.nonChargeable || item.isFree || item.nc || order.nonChargeable) ? 'NC' : `₹${(item.quantity * (item.unitPrice || item.price || 0)).toFixed(2)}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Restaurant Orders */}
            {restaurantCharges.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Restaurant Orders ({restaurantCharges.length})</h2>
                <div className="space-y-4">
                  {restaurantCharges.map((order) => (
                    <div key={order._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium text-gray-800">Order #{order.orderNumber || order._id.slice(-6)}</p>
                          <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className="text-lg font-semibold text-blue-600">
                          {order.nonChargeable ? (
                            <span className="text-green-600 font-bold">NC</span>
                          ) : (
                            `₹${order.amount || 0}`
                          )}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm text-gray-700">
                            <span>{item.name || item.itemName || 'Unknown Item'} x {item.quantity}</span>
                            <span className="text-green-600 font-bold">
                              {(item.nonChargeable || item.isFree || item.nc || order.nonChargeable) ? 'NC' : `₹${(item.quantity * (item.unitPrice || item.price || 0)).toFixed(2)}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Laundry Orders */}
            {laundryCharges.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Laundry Orders ({laundryCharges.length})</h2>
                <div className="space-y-4">
                  {laundryCharges.map((order) => (
                    <div key={order._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium text-gray-800">Order #{order._id.slice(-6)}</p>
                          <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-600">Status: <span className={`px-2 py-1 rounded text-xs ${
                            order.laundryStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            order.laundryStatus === 'picked_up' ? 'bg-blue-100 text-blue-700' :
                            order.laundryStatus === 'ready' ? 'bg-green-100 text-green-700' :
                            order.laundryStatus === 'delivered' ? 'bg-gray-100 text-gray-700' :
                            order.laundryStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>{order.laundryStatus}</span></p>
                          <p className="text-sm text-gray-600">Service: {order.serviceType === 'vendor' ? 'Vendor' : 'In-House'}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-semibold text-blue-600">
                            ₹{order.items?.filter(item => !item.nonChargeable && item.status !== 'lost').reduce((sum, item) => sum + (item.calculatedAmount || 0), 0) || 0}
                          </span>
                          <p className="text-xs text-gray-500">Chargeable</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <div className="flex-1">
                              <span className={`${item.status === 'lost' || item.status === 'cancelled' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                {item.itemName} x {item.quantity}
                              </span>
                              <span className={`ml-2 px-1 py-0.5 rounded text-xs ${
                                item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                item.status === 'picked_up' ? 'bg-blue-100 text-blue-700' :
                                item.status === 'ready' ? 'bg-green-100 text-green-700' :
                                item.status === 'delivered' ? 'bg-gray-100 text-gray-700' :
                                item.status === 'lost' ? 'bg-orange-100 text-orange-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {item.status}
                              </span>
                            </div>
                            <span className={`font-medium ${item.nonChargeable || item.status === 'lost' ? 'text-green-600' : ''}`}>
                              {item.nonChargeable ? 'NC' : item.status === 'lost' ? 'LOST' : `₹${(item.calculatedAmount || 0).toFixed(2)}`}
                            </span>
                          </div>
                        ))}
                      </div>
                      {order.vendorId && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-600">Vendor: {order.vendorId.vendorName || 'External Vendor'}</p>
                          {order.vendorOrderId && <p className="text-xs text-gray-600">Vendor Order ID: {order.vendorOrderId}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Amendment History */}
            {booking.amendmentHistory && booking.amendmentHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Amendment History</h2>
                <div className="space-y-3">
                  {booking.amendmentHistory.map((amendment, index) => (
                    <div key={index} className="border-l-4 border-orange-400 pl-4 py-2 bg-orange-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">
                            Amendment #{index + 1}
                          </p>
                          <p className="text-sm text-gray-600">
                            Date: {new Date(amendment.amendedOn).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            Extended to: {new Date(amendment.newCheckOut).toLocaleDateString()}
                          </p>
                          {amendment.reason && (
                            <p className="text-sm text-gray-600">Reason: {amendment.reason}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-orange-600">
                            ₹{amendment.totalAdjustment || 0}
                          </p>
                          <p className="text-xs text-gray-500">Adjustment</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Booking Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">GRC Number:</span>
                  <span className="font-medium">{booking.grcNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    booking.status === 'Booked' ? 'bg-green-100 text-green-800' :
                    booking.status === 'Checked In' ? 'bg-blue-100 text-blue-800' :
                    booking.status === 'Checked Out' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {booking.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    booking.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' :
                    booking.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {booking.paymentStatus}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Calendar className="mr-2 text-blue-600" size={20} />
                Stay Details
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Check-in Date</label>
                  <p className="text-lg font-medium text-gray-800">
                    {formatDate(booking.checkInDate)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Check-out Date</label>
                  <p className="text-lg font-medium text-gray-800">
                    {formatDate(booking.checkOutDate)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Duration</label>
                  <p className="text-lg font-medium text-gray-800">
                    {calculateDays(booking.checkInDate, booking.checkOutDate)} nights
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Bed className="mr-2 text-blue-600" size={20} />
                Room Details
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Room Numbers</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {booking.roomNumber ? booking.roomNumber.split(',').map((room, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {room.trim()}
                      </span>
                    )) : (
                      <span className="text-gray-500 text-sm">No rooms assigned</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Total Guests</label>
                  <p className="text-lg font-medium text-gray-800">
                    {booking.roomGuestDetails && booking.roomGuestDetails.length > 0 ? 
                      booking.roomGuestDetails.reduce((sum, room) => sum + (room.adults || 0) + (room.children || 0), 0) :
                      (booking.noOfAdults || 0) + (booking.noOfChildren || 0) || 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">VIP Guest</label>
                  <p className="text-lg font-medium text-gray-800">
                    {booking.vip ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            </div>

            {/* Advance Payments */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <CreditCard className="mr-2 text-blue-600" size={20} />
                Advance Payments
              </h2>
              {booking.advancePayments && booking.advancePayments.length > 0 ? (
                <div className="space-y-3">
                  {booking.advancePayments.map((payment, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">Payment #{index + 1}</p>
                          <p className="text-sm text-gray-600">{payment.paymentMode}</p>
                          <p className="text-sm text-gray-600">{new Date(payment.paymentDate).toLocaleDateString()}</p>
                          {payment.reference && (
                            <p className="text-xs text-gray-500">Ref: {payment.reference}</p>
                          )}
                          {payment.notes && (
                            <p className="text-xs text-gray-500">{payment.notes}</p>
                          )}
                        </div>
                        <span className="font-medium text-lg text-green-600">₹{payment.amount}</span>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total Advance Received:</span>
                      <span className="text-green-600">₹{booking.advancePayments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)}</span>
                    </div>

                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No advance payments recorded</p>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <CreditCard className="mr-2 text-blue-600" size={20} />
                Billing Details
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Room Cost ({calculateDays(booking.checkInDate, booking.checkOutDate)} days):</span>
                  <span className="font-medium">₹{(() => {
                    // Calculate room cost from room rates if available
                    if (booking.roomRates && booking.roomRates.length > 0) {
                      const days = calculateDays(booking.checkInDate, booking.checkOutDate);
                      return booking.roomRates.reduce((sum, roomRate) => {
                        return sum + (roomRate.customRate || 0);
                      }, 0) * days;
                    }
                    return booking.rate || 0;
                  })()}</span>
                </div>
                {(() => {
                  // Calculate extra bed charges with proper date handling
                  const extraBedTotal = booking.roomRates ? booking.roomRates.reduce((sum, roomRate) => {
                    if (!roomRate.extraBed) return sum;
                    
                    // Calculate extra bed days properly
                    const startDate = new Date(roomRate.extraBedStartDate || booking.checkInDate);
                    const endDate = new Date(booking.checkOutDate);
                    
                    // If start date is same or after checkout, no extra bed charge
                    if (startDate >= endDate) return sum;
                    
                    const timeDiff = endDate.getTime() - startDate.getTime();
                    const extraBedDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                    
                    return sum + ((booking.extraBedCharge || 500) * Math.max(0, extraBedDays));
                  }, 0) : 0;
                  
                  if (extraBedTotal > 0) {
                    const extraBedCount = booking.roomRates ? booking.roomRates.filter(r => r.extraBed).length : 0;
                    return (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Extra Beds ({extraBedCount} beds × variable days × ₹{booking.extraBedCharge || 500}):</span>
                        <span className="font-medium">₹{extraBedTotal.toFixed(2)}</span>
                      </div>
                    );
                  }
                  return null;
                })()}
                <div className="flex justify-between">
                  <span className="text-gray-600">Room Subtotal:</span>
                  <span className="font-medium">₹{(() => {
                    const roomCost = booking.roomRates && booking.roomRates.length > 0 
                      ? (() => {
                          const days = Math.ceil((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24));
                          return booking.roomRates.reduce((sum, roomRate) => sum + (roomRate.customRate || 0), 0) * days;
                        })()
                      : (booking.rate || 0);
                    const extraBedTotal = booking.roomRates ? booking.roomRates.reduce((sum, roomRate) => {
                      if (!roomRate.extraBed) return sum;
                      
                      // Calculate extra bed days properly
                      const startDate = new Date(roomRate.extraBedStartDate || booking.checkInDate);
                      const endDate = new Date(booking.checkOutDate);
                      
                      // If start date is same or after checkout, no extra bed charge
                      if (startDate >= endDate) return sum;
                      
                      const timeDiff = endDate.getTime() - startDate.getTime();
                      const extraBedDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                      
                      return sum + ((booking.extraBedCharge || 500) * Math.max(0, extraBedDays));
                    }, 0) : 0;
                    return (roomCost + extraBedTotal).toFixed(2);
                  })()}</span>
                </div>
                {booking.discountPercent > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount ({booking.discountPercent}%) - Room Only:</span>
                      <span className="font-medium text-red-600">-₹{(() => {
                        const roomCost = booking.roomRates && booking.roomRates.length > 0 
                          ? (() => {
                              const days = Math.ceil((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24));
                              return booking.roomRates.reduce((sum, roomRate) => sum + (roomRate.customRate || 0), 0) * days;
                            })()
                          : (booking.rate || 0);
                        const extraBedTotal = booking.roomRates ? booking.roomRates.reduce((sum, roomRate) => {
                          if (!roomRate.extraBed) return sum;
                          
                          // Calculate extra bed days properly
                          const startDate = new Date(roomRate.extraBedStartDate || booking.checkInDate);
                          const endDate = new Date(booking.checkOutDate);
                          
                          // If start date is same or after checkout, no extra bed charge
                          if (startDate >= endDate) return sum;
                          
                          const timeDiff = endDate.getTime() - startDate.getTime();
                          const extraBedDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                          
                          return sum + ((booking.extraBedCharge || 500) * Math.max(0, extraBedDays));
                        }, 0) : 0;
                        const roomSubtotal = roomCost + extraBedTotal;
                        return (roomSubtotal * (booking.discountPercent / 100)).toFixed(2);
                      })()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Room After Discount:</span>
                      <span className="font-medium">₹{(() => {
                        const roomCost = booking.roomRates && booking.roomRates.length > 0 
                          ? (() => {
                              const days = Math.ceil((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24));
                              return booking.roomRates.reduce((sum, roomRate) => sum + (roomRate.customRate || 0), 0) * days;
                            })()
                          : (booking.rate || 0);
                        const extraBedTotal = booking.roomRates ? booking.roomRates.reduce((sum, roomRate) => {
                          if (!roomRate.extraBed) return sum;
                          
                          // Calculate extra bed days properly
                          const startDate = new Date(roomRate.extraBedStartDate || booking.checkInDate);
                          const endDate = new Date(booking.checkOutDate);
                          
                          // If start date is same or after checkout, no extra bed charge
                          if (startDate >= endDate) return sum;
                          
                          const timeDiff = endDate.getTime() - startDate.getTime();
                          const extraBedDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                          
                          return sum + ((booking.extraBedCharge || 500) * Math.max(0, extraBedDays));
                        }, 0) : 0;
                        const roomSubtotal = roomCost + extraBedTotal;
                        const discount = roomSubtotal * ((booking.discountPercent || 0) / 100);
                        return (roomSubtotal - discount).toFixed(2);
                      })()}</span>
                    </div>
                  </>
                )}
                {(serviceCharges.length > 0 || restaurantCharges.length > 0 || laundryCharges.length > 0) && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Room Service:</span>
                      <span className="font-medium">₹{serviceCharges.reduce((sum, order) => {
                        if (order.nonChargeable) return sum;
                        const orderTotal = order.items.reduce((itemSum, item) => {
                          const isNC = item.nonChargeable || item.isFree || item.nc;
                          if (isNC) return itemSum;
                          const unitPrice = item.unitPrice || item.price || 0;
                          return itemSum + (item.quantity * unitPrice);
                        }, 0);
                        return sum + orderTotal;
                      }, 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Restaurant:</span>
                      <span className="font-medium">₹{restaurantCharges.reduce((sum, order) => {
                        if (order.nonChargeable) return sum;
                        const orderTotal = order.items.reduce((itemSum, item) => {
                          const isNC = item.nonChargeable || item.isFree || item.nc;
                          if (isNC) return itemSum;
                          const unitPrice = item.unitPrice || item.price || 0;
                          return itemSum + (item.quantity * unitPrice);
                        }, 0);
                        return sum + orderTotal;
                      }, 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Laundry:</span>
                      <span className="font-medium">₹{laundryCharges.reduce((sum, order) => {
                        const chargeableAmount = order.items?.filter(item => !item.nonChargeable && item.status !== 'lost').reduce((itemSum, item) => itemSum + (item.calculatedAmount || 0), 0) || 0;
                        return sum + chargeableAmount;
                      }, 0)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Subtotal:</span>
                  <span className="font-medium">₹{(() => {
                    const roomCost = booking.roomRates && booking.roomRates.length > 0 
                      ? (() => {
                          const days = Math.ceil((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24));
                          return booking.roomRates.reduce((sum, roomRate) => sum + (roomRate.customRate || 0), 0) * days;
                        })()
                      : (booking.rate || 0);
                    const extraBedTotal = booking.roomRates ? booking.roomRates.reduce((sum, roomRate) => {
                      if (!roomRate.extraBed) return sum;
                      
                      // Calculate extra bed days properly
                      const startDate = new Date(roomRate.extraBedStartDate || booking.checkInDate);
                      const endDate = new Date(booking.checkOutDate);
                      
                      // If start date is same or after checkout, no extra bed charge
                      if (startDate >= endDate) return sum;
                      
                      const timeDiff = endDate.getTime() - startDate.getTime();
                      const extraBedDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                      
                      return sum + ((booking.extraBedCharge || 500) * Math.max(0, extraBedDays));
                    }, 0) : 0;
                    const roomSubtotal = roomCost + extraBedTotal;
                    const discount = roomSubtotal * ((booking.discountPercent || 0) / 100);
                    const afterDiscount = roomSubtotal - discount;
                    const serviceTotal = serviceCharges.reduce((sum, order) => {
                      if (order.nonChargeable) return sum;
                      const orderTotal = order.items.reduce((itemSum, item) => {
                        const isNC = item.nonChargeable || item.isFree || item.nc;
                        if (isNC) return itemSum;
                        const unitPrice = item.unitPrice || item.price || 0;
                        return itemSum + (item.quantity * unitPrice);
                      }, 0);
                      return sum + orderTotal;
                    }, 0);
                    const restaurantTotal = restaurantCharges.reduce((sum, order) => {
                      if (order.nonChargeable) return sum;
                      const orderTotal = order.items.reduce((itemSum, item) => {
                        const isNC = item.nonChargeable || item.isFree || item.nc;
                        if (isNC) return itemSum;
                        const unitPrice = item.unitPrice || item.price || 0;
                        return itemSum + (item.quantity * unitPrice);
                      }, 0);
                      return sum + orderTotal;
                    }, 0);
                    const laundryTotal = laundryCharges.reduce((sum, order) => {
                      const chargeableAmount = order.items?.filter(item => !item.nonChargeable && item.status !== 'lost').reduce((itemSum, item) => itemSum + (item.calculatedAmount || 0), 0) || 0;
                      return sum + chargeableAmount;
                    }, 0);
                    return (afterDiscount + serviceTotal + restaurantTotal + laundryTotal).toFixed(2);
                  })()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">CGST ({((booking.cgstRate || 0.025) * 100).toFixed(1)}%):</span>
                  <span className="font-medium">₹{(() => {
                    const roomCost = booking.roomRates && booking.roomRates.length > 0 
                      ? (() => {
                          const days = Math.ceil((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24));
                          return booking.roomRates.reduce((sum, roomRate) => sum + (roomRate.customRate || 0), 0) * days;
                        })()
                      : (booking.rate || 0);
                    const extraBedTotal = booking.roomRates ? booking.roomRates.reduce((sum, roomRate) => {
                      if (!roomRate.extraBed) return sum;
                      
                      // Calculate extra bed days properly
                      const startDate = new Date(roomRate.extraBedStartDate || booking.checkInDate);
                      const endDate = new Date(booking.checkOutDate);
                      
                      // If start date is same or after checkout, no extra bed charge
                      if (startDate >= endDate) return sum;
                      
                      const timeDiff = endDate.getTime() - startDate.getTime();
                      const extraBedDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                      
                      return sum + ((booking.extraBedCharge || 500) * Math.max(0, extraBedDays));
                    }, 0) : 0;
                    const roomSubtotal = roomCost + extraBedTotal;
                    const discount = roomSubtotal * ((booking.discountPercent || 0) / 100);
                    const afterDiscount = roomSubtotal - discount;
                    const serviceTotal = serviceCharges.reduce((sum, order) => {
                      if (order.nonChargeable) return sum;
                      const orderTotal = order.items.reduce((itemSum, item) => {
                        const isNC = item.nonChargeable || item.isFree || item.nc;
                        if (isNC) return itemSum;
                        const unitPrice = item.unitPrice || item.price || 0;
                        return itemSum + (item.quantity * unitPrice);
                      }, 0);
                      return sum + orderTotal;
                    }, 0);
                    const restaurantTotal = restaurantCharges.reduce((sum, order) => {
                      if (order.nonChargeable) return sum;
                      const orderTotal = order.items.reduce((itemSum, item) => {
                        const isNC = item.nonChargeable || item.isFree || item.nc;
                        if (isNC) return itemSum;
                        const unitPrice = item.unitPrice || item.price || 0;
                        return itemSum + (item.quantity * unitPrice);
                      }, 0);
                      return sum + orderTotal;
                    }, 0);
                    const laundryTotal = laundryCharges.reduce((sum, order) => {
                      const chargeableAmount = order.items?.filter(item => !item.nonChargeable && item.status !== 'lost').reduce((itemSum, item) => itemSum + (item.calculatedAmount || 0), 0) || 0;
                      return sum + chargeableAmount;
                    }, 0);
                    const totalSubtotal = afterDiscount + serviceTotal + restaurantTotal + laundryTotal;
                    return (totalSubtotal * (booking.cgstRate || 0.025)).toFixed(2);
                  })()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">SGST ({((booking.sgstRate || 0.025) * 100).toFixed(1)}%):</span>
                  <span className="font-medium">₹{(() => {
                    const roomCost = booking.roomRates && booking.roomRates.length > 0 
                      ? (() => {
                          const days = Math.ceil((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24));
                          return booking.roomRates.reduce((sum, roomRate) => sum + (roomRate.customRate || 0), 0) * days;
                        })()
                      : (booking.rate || 0);
                    const extraBedTotal = booking.roomRates ? booking.roomRates.reduce((sum, roomRate) => {
                      if (!roomRate.extraBed) return sum;
                      
                      // Calculate extra bed days properly
                      const startDate = new Date(roomRate.extraBedStartDate || booking.checkInDate);
                      const endDate = new Date(booking.checkOutDate);
                      
                      // If start date is same or after checkout, no extra bed charge
                      if (startDate >= endDate) return sum;
                      
                      const timeDiff = endDate.getTime() - startDate.getTime();
                      const extraBedDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                      
                      return sum + ((booking.extraBedCharge || 500) * Math.max(0, extraBedDays));
                    }, 0) : 0;
                    const roomSubtotal = roomCost + extraBedTotal;
                    const discount = roomSubtotal * ((booking.discountPercent || 0) / 100);
                    const afterDiscount = roomSubtotal - discount;
                    const serviceTotal = serviceCharges.reduce((sum, order) => {
                      if (order.nonChargeable) return sum;
                      const orderTotal = order.items.reduce((itemSum, item) => {
                        const isNC = item.nonChargeable || item.isFree || item.nc;
                        if (isNC) return itemSum;
                        const unitPrice = item.unitPrice || item.price || 0;
                        return itemSum + (item.quantity * unitPrice);
                      }, 0);
                      return sum + orderTotal;
                    }, 0);
                    const restaurantTotal = restaurantCharges.reduce((sum, order) => {
                      if (order.nonChargeable) return sum;
                      const orderTotal = order.items.reduce((itemSum, item) => {
                        const isNC = item.nonChargeable || item.isFree || item.nc;
                        if (isNC) return itemSum;
                        const unitPrice = item.unitPrice || item.price || 0;
                        return itemSum + (item.quantity * unitPrice);
                      }, 0);
                      return sum + orderTotal;
                    }, 0);
                    const laundryTotal = laundryCharges.reduce((sum, order) => {
                      const chargeableAmount = order.items?.filter(item => !item.nonChargeable && item.status !== 'lost').reduce((itemSum, item) => itemSum + (item.calculatedAmount || 0), 0) || 0;
                      return sum + chargeableAmount;
                    }, 0);
                    const totalSubtotal = afterDiscount + serviceTotal + restaurantTotal + laundryTotal;
                    return (totalSubtotal * (booking.sgstRate || 0.025)).toFixed(2);
                  })()}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Round Off:</span>
                  <span className="font-medium">{(() => {
                    const roomCost = booking.roomRates && booking.roomRates.length > 0 
                      ? (() => {
                          const days = Math.ceil((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24));
                          return booking.roomRates.reduce((sum, roomRate) => sum + (roomRate.customRate || 0), 0) * days;
                        })()
                      : (booking.rate || 0);
                    const extraBedTotal = booking.roomRates ? booking.roomRates.reduce((sum, roomRate) => {
                      if (!roomRate.extraBed) return sum;
                      
                      // Calculate extra bed days properly
                      const startDate = new Date(roomRate.extraBedStartDate || booking.checkInDate);
                      const endDate = new Date(booking.checkOutDate);
                      
                      // If start date is same or after checkout, no extra bed charge
                      if (startDate >= endDate) return sum;
                      
                      const timeDiff = endDate.getTime() - startDate.getTime();
                      const extraBedDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                      
                      return sum + ((booking.extraBedCharge || 500) * Math.max(0, extraBedDays));
                    }, 0) : 0;
                    const roomSubtotal = roomCost + extraBedTotal;
                    const discount = roomSubtotal * ((booking.discountPercent || 0) / 100);
                    const afterDiscount = roomSubtotal - discount;
                    const serviceTotal = serviceCharges.reduce((sum, order) => {
                      if (order.nonChargeable) return sum;
                      const orderTotal = order.items.reduce((itemSum, item) => {
                        const isNC = item.nonChargeable || item.isFree || item.nc;
                        if (isNC) return itemSum;
                        const unitPrice = item.unitPrice || item.price || 0;
                        return itemSum + (item.quantity * unitPrice);
                      }, 0);
                      return sum + orderTotal;
                    }, 0);
                    const restaurantTotal = restaurantCharges.reduce((sum, order) => {
                      if (order.nonChargeable) return sum;
                      const orderTotal = order.items.reduce((itemSum, item) => {
                        const isNC = item.nonChargeable || item.isFree || item.nc;
                        if (isNC) return itemSum;
                        const unitPrice = item.unitPrice || item.price || 0;
                        return itemSum + (item.quantity * unitPrice);
                      }, 0);
                      return sum + orderTotal;
                    }, 0);
                    const laundryTotal = laundryCharges.reduce((sum, order) => {
                      const chargeableAmount = order.items?.filter(item => !item.nonChargeable && item.status !== 'lost').reduce((itemSum, item) => itemSum + (item.calculatedAmount || 0), 0) || 0;
                      return sum + chargeableAmount;
                    }, 0);
                    const totalSubtotal = afterDiscount + serviceTotal + restaurantTotal + laundryTotal;
                    const cgstAmount = totalSubtotal * (booking.cgstRate || 0.025);
                    const sgstAmount = totalSubtotal * (booking.sgstRate || 0.025);
                    const exactTotal = totalSubtotal + cgstAmount + sgstAmount;
                    const roundedTotal = Math.round(exactTotal);
                    const roundOff = (roundedTotal - exactTotal);
                    return (roundOff >= 0 ? '+' : '') + roundOff.toFixed(2);
                  })()}</span>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>NET AMOUNT:</span>
                    <span>₹{(() => {
                      const roomCost = booking.roomRates && booking.roomRates.length > 0 
                        ? (() => {
                            const days = Math.ceil((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24));
                            return booking.roomRates.reduce((sum, roomRate) => sum + (roomRate.customRate || 0), 0) * days;
                          })()
                        : (booking.rate || 0);
                      const extraBedTotal = booking.roomRates ? booking.roomRates.reduce((sum, roomRate) => {
                        if (!roomRate.extraBed) return sum;
                        
                        // Calculate extra bed days properly
                        const startDate = new Date(roomRate.extraBedStartDate || booking.checkInDate);
                        const endDate = new Date(booking.checkOutDate);
                        
                        // If start date is same or after checkout, no extra bed charge
                        if (startDate >= endDate) return sum;
                        
                        const timeDiff = endDate.getTime() - startDate.getTime();
                        const extraBedDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                        
                        return sum + ((booking.extraBedCharge || 500) * Math.max(0, extraBedDays));
                      }, 0) : 0;
                      const roomSubtotal = roomCost + extraBedTotal;
                      const discount = roomSubtotal * ((booking.discountPercent || 0) / 100);
                      const afterDiscount = roomSubtotal - discount;
                      const serviceTotal = serviceCharges.reduce((sum, order) => {
                        if (order.nonChargeable) return sum;
                        const orderTotal = order.items.reduce((itemSum, item) => {
                          const isNC = item.nonChargeable || item.isFree || item.nc;
                          if (isNC) return itemSum;
                          const unitPrice = item.unitPrice || item.price || 0;
                          return itemSum + (item.quantity * unitPrice);
                        }, 0);
                        return sum + orderTotal;
                      }, 0);
                      const restaurantTotal = restaurantCharges.reduce((sum, order) => {
                        if (order.nonChargeable) return sum;
                        const orderTotal = order.items.reduce((itemSum, item) => {
                          const isNC = item.nonChargeable || item.isFree || item.nc;
                          if (isNC) return itemSum;
                          const unitPrice = item.unitPrice || item.price || 0;
                          return itemSum + (item.quantity * unitPrice);
                        }, 0);
                        return sum + orderTotal;
                      }, 0);
                      const laundryTotal = laundryCharges.reduce((sum, order) => {
                        const chargeableAmount = order.items?.filter(item => !item.nonChargeable && item.status !== 'lost').reduce((itemSum, item) => itemSum + (item.calculatedAmount || 0), 0) || 0;
                        return sum + chargeableAmount;
                      }, 0);
                      const lateCheckoutFee = (booking.lateCheckoutFine?.applied && booking.lateCheckoutFine.amount > 0 && !booking.lateCheckoutFine.waived) ? booking.lateCheckoutFine.amount : 0;
                      const totalSubtotal = afterDiscount + serviceTotal + restaurantTotal + laundryTotal + lateCheckoutFee;
                      const cgstAmount = totalSubtotal * (booking.cgstRate || 0.025);
                      const sgstAmount = totalSubtotal * (booking.sgstRate || 0.025);
                      const exactTotal = totalSubtotal + cgstAmount + sgstAmount;
                      const roundedTotal = Math.round(exactTotal);
                      return roundedTotal.toString();
                    })()}</span>
                  </div>
                  {booking.advancePayments && booking.advancePayments.length > 0 && (
                    <div className="flex justify-between text-lg font-medium text-green-600 mt-2">
                      <span>Advance Payment:</span>
                      <span>-₹{booking.advancePayments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold text-orange-600 mt-2">
                    <span>BALANCE DUE:</span>
                    <span>₹{(() => {
                      // If payment status is "Paid", balance due is 0
                      if (booking.paymentStatus === 'Paid') {
                        return '0.00';
                      }
                      
                      const roomCost = booking.roomRates && booking.roomRates.length > 0 
                        ? (() => {
                            const days = Math.ceil((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24));
                            return booking.roomRates.reduce((sum, roomRate) => sum + (roomRate.customRate || 0), 0) * days;
                          })()
                        : (booking.rate || 0);
                      const extraBedTotal = booking.roomRates ? booking.roomRates.reduce((sum, roomRate) => {
                        if (!roomRate.extraBed) return sum;
                        
                        // Calculate extra bed days properly
                        const startDate = new Date(roomRate.extraBedStartDate || booking.checkInDate);
                        const endDate = new Date(booking.checkOutDate);
                        
                        // If start date is same or after checkout, no extra bed charge
                        if (startDate >= endDate) return sum;
                        
                        const timeDiff = endDate.getTime() - startDate.getTime();
                        const extraBedDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                        
                        return sum + ((booking.extraBedCharge || 500) * Math.max(0, extraBedDays));
                      }, 0) : 0;
                      const roomSubtotal = roomCost + extraBedTotal;
                      const discount = roomSubtotal * ((booking.discountPercent || 0) / 100);
                      const afterDiscount = roomSubtotal - discount;
                      const serviceTotal = serviceCharges.reduce((sum, order) => {
                        if (order.nonChargeable) return sum;
                        const orderTotal = order.items.reduce((itemSum, item) => {
                          const isNC = item.nonChargeable || item.isFree || item.nc;
                          if (isNC) return itemSum;
                          const unitPrice = item.unitPrice || item.price || 0;
                          return itemSum + (item.quantity * unitPrice);
                        }, 0);
                        return sum + orderTotal;
                      }, 0);
                      const restaurantTotal = restaurantCharges.reduce((sum, order) => {
                        if (order.nonChargeable) return sum;
                        const orderTotal = order.items.reduce((itemSum, item) => {
                          const isNC = item.nonChargeable || item.isFree || item.nc;
                          if (isNC) return itemSum;
                          const unitPrice = item.unitPrice || item.price || 0;
                          return itemSum + (item.quantity * unitPrice);
                        }, 0);
                        return sum + orderTotal;
                      }, 0);
                      const laundryTotal = laundryCharges.reduce((sum, order) => {
                        const chargeableAmount = order.items?.filter(item => !item.nonChargeable && item.status !== 'lost').reduce((itemSum, item) => itemSum + (item.calculatedAmount || 0), 0) || 0;
                        return sum + chargeableAmount;
                      }, 0);
                      const lateCheckoutFee = (booking.lateCheckoutFine?.applied && booking.lateCheckoutFine.amount > 0 && !booking.lateCheckoutFine.waived) ? booking.lateCheckoutFine.amount : 0;
                      const totalSubtotal = afterDiscount + serviceTotal + restaurantTotal + laundryTotal + lateCheckoutFee;
                      const cgstAmount = totalSubtotal * (booking.cgstRate || 0.025);
                      const sgstAmount = totalSubtotal * (booking.sgstRate || 0.025);
                      const exactTotal = totalSubtotal + cgstAmount + sgstAmount;
                      const roundedTotal = Math.round(exactTotal);
                      const totalAdvance = booking.advancePayments?.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0) || 0;
                      return Math.max(0, (roundedTotal - totalAdvance)).toString();
                    })()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;