import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../../utils/toaster';
import { toast } from 'react-hot-toast';

const CheckoutPage = () => {
  const { axios } = useAppContext();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState('');
  const [checkoutData, setCheckoutData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPaymentTable, setShowPaymentTable] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [inspectionCompleted, setInspectionCompleted] = useState(false);
  const [staff, setStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [showHousekeepingForm, setShowHousekeepingForm] = useState(false);

  useEffect(() => {
    fetchBookings();
    fetchRooms();
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/housekeeping/available-staff`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Staff API response:', response.data);
      
      let staffData = [];
      if (response.data.availableStaff) {
        staffData = response.data.availableStaff;
      } else if (Array.isArray(response.data)) {
        staffData = response.data;
      } else if (response.data.staff) {
        staffData = response.data.staff;
      } else if (response.data.data) {
        staffData = response.data.data;
      }
      
      console.log('Processed staff data:', staffData);
      setStaff(staffData);
    } catch (error) {
      console.error('Error fetching staff:', error);
      setStaff([]);
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/bookings/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/rooms/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchCheckoutData = async (bookingId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // First, try to get existing checkout or create one
      let checkoutResponse;
      try {
        // Try to get existing checkout
        checkoutResponse = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/checkout/booking/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (error) {
        // If no checkout exists, create one
        checkoutResponse = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/checkout/create`, {
          bookingId: bookingId
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      const checkoutData = checkoutResponse.data.checkout;
      console.log('Checkout data:', checkoutData);
      
      setCheckoutData(checkoutData);
    } catch (error) {
      console.error('Error fetching checkout data:', error);
      setCheckoutData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSelect = (bookingId) => {
    setSelectedBooking(bookingId);
    setCheckoutData(null);
    setInspectionCompleted(false);
  };

  const assignHousekeepingTask = async () => {
    if (!selectedStaff) {
      showToast.error('Please select a staff member');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      // First create the task
      const selectedBookingData = bookings.find(b => b._id === selectedBooking);
      const roomNumber = selectedBookingData.roomNumber || selectedBookingData.room_number;
      const roomData = rooms.find(room => room.roomNumber === roomNumber || room.room_number === roomNumber);
      
      const taskData = {
        bookingId: selectedBooking,
        roomId: roomData._id,
        assignedTo: selectedStaff,
        department: 'Housekeeping',
        priority: 'high',
        cleaningType: 'checkout',
        notes: 'Room cleaning after checkout and inspection'
      };
      
      const taskResponse = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/housekeeping/tasks`, taskData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Then assign it using PUT if task creation returns an ID
      if (taskResponse.data._id) {
        await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/housekeeping/tasks/${taskResponse.data._id}/assign`, {
          assignedTo: selectedStaff
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      const assignedStaffMember = staff.find(s => s._id === selectedStaff);
      const staffName = assignedStaffMember?.username || assignedStaffMember?.name || 'staff member';
      toast.success(`🧹 Checkout cleaning task assigned to ${staffName} successfully!`);
      setShowHousekeepingForm(false);
      setSelectedStaff('');
      
    } catch (error) {
      console.error('Error assigning housekeeping task:', error);
      showToast.error('Error assigning housekeeping task');
    }
  };

  const handleViewCharges = () => {
    if (selectedBooking) {
      fetchCheckoutData(selectedBooking);
    }
  };

  const processPayment = async () => {
    if (!selectedBooking || !checkoutData || !paymentAmount) {
      showToast.error('Please enter payment amount');
      return;
    }
    
    // Validate that checkoutData has a valid _id
    if (!checkoutData._id) {
      showToast.error('Invalid checkout data. Please refresh and try again.');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      // Process payment using the correct checkout ID
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/checkout/${checkoutData._id}/payment`, {
        status: 'Completed',
        paidAmount: parseFloat(paymentAmount)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local checkout data status immediately
      setCheckoutData(prev => ({
        ...prev,
        status: 'paid'
      }));
      
      showToast.success(`💰 Payment of ₹${paymentAmount} processed successfully via ${paymentMethod}!`);
      alert(`🎉 Payment of ₹${paymentAmount} processed successfully via ${paymentMethod}! Guest checkout completed.`);
      
      setShowPaymentForm(false);
      setPaymentAmount('');
      
      // Refresh bookings to show updated status
      fetchBookings();
      
    } catch (error) {
      console.error('Error processing payment:', error);
      const errorMessage = error.response?.data?.message || 'Error processing payment';
      showToast.error(errorMessage);
    }
  };

  const generateBill = () => {
    if (!checkoutData || !selectedBooking) return;
    
    const selectedBookingData = bookings.find(b => b._id === selectedBooking);
    const billContent = `
      HOTEL CHECKOUT BILL
      ==================
      
      Guest: ${selectedBookingData?.name}
      GRC: ${selectedBookingData?.grcNo || selectedBookingData?.guestRegistrationCardNo}
      Room: ${selectedBookingData?.roomNumber || selectedBookingData?.room_number}
      Phone: ${selectedBookingData?.mobileNo || selectedBookingData?.mobile_no}
      
      ITEMIZED CHARGES:
      ----------------
      ${checkoutData.serviceItems?.restaurant?.map(order => 
        order.items?.map(item => `${item.itemName} x ${item.quantity} - ₹${item.amount}`).join('\n')
      ).join('\n') || ''}
      ${checkoutData.serviceItems?.laundry?.map(service => 
        service.items?.map(item => `${item.itemName} x ${item.quantity} - ₹${item.amount}`).join('\n')
      ).join('\n') || ''}
      ${checkoutData.serviceItems?.inspection?.map(inspection => 
        inspection.items?.map(item => `${item.description} - ₹${item.amount}`).join('\n')
      ).join('\n') || ''}
      
      SUMMARY:
      --------
      Booking Charges: ₹${checkoutData.bookingCharges || 0}
      Restaurant Charges: ₹${Math.round(checkoutData.restaurantCharges || 0)}
      Laundry Charges: ₹${checkoutData.laundryCharges || 0}
      Inspection Charges: ₹${checkoutData.inspectionCharges || 0}
      
      TOTAL AMOUNT: ₹${checkoutData.totalAmount || 0}
      PENDING: ₹${checkoutData.pendingAmount || 0}
    `;
    
    const newWindow = window.open('', '_blank');
    newWindow.document.write(`<pre>${billContent}</pre>`);
    newWindow.print();
  };

  const performRoomInspection = async () => {
    if (!selectedBooking) {
      showToast.error('Please select a booking first');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const selectedBookingData = bookings.find(b => b._id === selectedBooking);
      
      if (!selectedBookingData) {
        showToast.error('Booking data not found');
        return;
      }
      
      const roomNumber = selectedBookingData.roomNumber || selectedBookingData.room_number;
      const roomData = rooms.find(room => room.roomNumber === roomNumber || room.room_number === roomNumber);
      
      if (!roomData) {
        showToast.error('Room data not found');
        return;
      }
      
      // Fetch checklist from API
      let checklist = [];
      try {
        const checklistResponse = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/housekeeping/checklist/${roomData._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (Array.isArray(checklistResponse.data)) {
          checklist = checklistResponse.data.map(item => ({
            inventoryId: item.inventoryId || item._id,
            item: item.item || item.name || 'Checklist Item',
            quantity: item.quantity || 1,
            status: 'ok',
            remarks: 'Inspected during checkout',
            costPerUnit: item.costPerUnit || 0
          }));
        }
      } catch (error) {
        console.log('No checklist found, using default');
        checklist = [
          {
            item: 'Room cleanliness',
            quantity: 1,
            status: 'ok',
            remarks: 'Room inspected after checkout',
            costPerUnit: 0
          }
        ];
      }
      
      const inspectionData = {
        roomId: roomData._id,
        bookingId: selectedBooking,
        inspectedBy: '507f1f77bcf86cd799439011',
        inspectionType: 'checkout',
        checklist: checklist,
        totalCharges: checklist.reduce((total, item) => total + (item.costPerUnit * item.quantity), 0),
        status: 'completed'
      };
      
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/housekeeping/room-inspection`, inspectionData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setInspectionCompleted(true);
      showToast.success('🔍 Room inspection completed successfully!');
      
    } catch (error) {
      console.error('Error performing room inspection:', error.response?.data || error.message);
      showToast.error(`Error performing room inspection: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-yellow-900">Guest Checkout</h1>
          <p className="text-yellow-800 opacity-80 text-sm sm:text-base">Process guest checkout and payments</p>
        </div>
        
        {/* Booking Selection */}
        <div className="rounded-xl shadow-lg p-6 mb-6" style={{backgroundColor: 'white', border: '1px solid hsl(45, 100%, 85%)'}}>
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3" style={{backgroundColor: 'hsl(45, 100%, 80%)'}}>
              <span className="font-semibold text-sm" style={{color: 'hsl(45, 100%, 20%)'}}>1</span>
            </div>
            <h2 className="text-xl font-semibold" style={{color: 'hsl(45, 100%, 20%)'}}>Select Booking</h2>
          </div>
          <select
            value={selectedBooking}
            onChange={(e) => handleBookingSelect(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="">Select a booking</option>
            {bookings.map((booking) => (
              <option key={booking._id} value={booking._id}>
                {booking.name} - Room {booking.roomNumber || booking.room_number} (GRC: {booking.grcNo || booking.guestRegistrationCardNo})
              </option>
            ))}
          </select>
        </div>
        
        <div className="rounded-xl shadow-lg p-6 mb-6" style={{backgroundColor: 'white', border: '1px solid hsl(45, 100%, 85%)'}}>
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3" style={{backgroundColor: 'hsl(45, 100%, 80%)'}}>
              <span className="font-semibold text-sm" style={{color: 'hsl(45, 100%, 20%)'}}>2</span>
            </div>
            <h2 className="text-xl font-semibold" style={{color: 'hsl(45, 100%, 20%)'}}>View Charges</h2>
          </div>
          <button
            onClick={handleViewCharges}
            disabled={!selectedBooking || loading}
            className="bg-yellow-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Loading...' : 'View Charges'}
          </button>
        </div>

        {checkoutData && (
          <div className="rounded-xl shadow-lg p-6 mb-6" style={{backgroundColor: 'white', border: '1px solid hsl(45, 100%, 85%)'}}>
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3" style={{backgroundColor: 'hsl(45, 100%, 80%)'}}>
                <span className="font-semibold text-sm" style={{color: 'hsl(45, 100%, 20%)'}}>3</span>
              </div>
              <h2 className="text-xl font-semibold" style={{color: 'hsl(45, 100%, 20%)'}}>Checkout Summary</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Booking Charges:</span>
                  <span className="font-semibold">₹{checkoutData.bookingCharges || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Restaurant Charges:</span>
                  <span className="font-semibold">₹{Math.round(checkoutData.restaurantCharges || 0)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Room Service Charges:</span>
                  <span className="font-semibold">₹{Math.round(checkoutData.roomServiceCharges || 0)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Laundry Charges:</span>
                  <span className="font-semibold">₹{checkoutData.laundryCharges || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-600">Inspection Charges:</span>
                  <span className="font-semibold text-red-600">₹{checkoutData.inspectionCharges || 0}</span>
                </div>
                {(() => {
                  const selectedBookingData = bookings.find(b => b._id === selectedBooking);
                  const discountPercent = selectedBookingData?.discountPercent || 0;
                  const discountNotes = selectedBookingData?.discountNotes || '';
                  
                  if (discountPercent > 0) {
                    return (
                      <>
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="text-gray-600">Discount ({discountPercent}%):</span>
                          <span className="font-semibold text-green-600">Applied</span>
                        </div>
                        {discountNotes && (
                          <div className="py-2 border-b border-gray-200">
                            <span className="text-gray-600 text-sm">Discount Notes:</span>
                            <p className="text-sm text-gray-700 mt-1 italic">"{discountNotes}"</p>
                          </div>
                        )}
                      </>
                    );
                  }
                  return null;
                })()}
                <div className="flex justify-between items-center py-3 border-t-2 border-yellow-400">
                  <span className="text-lg font-bold text-yellow-900">Total Amount:</span>
                  <span className="text-lg font-bold text-yellow-900">₹{checkoutData.totalAmount || 0}</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-900 mb-2">Payment Status</h3>
                  <p className="text-yellow-800 capitalize">
                    {(() => {
                      const selectedBookingData = bookings.find(b => b._id === selectedBooking);
                      const bookingStatus = selectedBookingData?.status;
                      return bookingStatus === 'Checked Out' ? 'paid' : checkoutData.status;
                    })()}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={() => setShowPaymentForm(true)}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Process Payment
                  </button>
                  
                  <button
                    onClick={generateBill}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Generate Bill
                  </button>
                  
                  <button
                    onClick={performRoomInspection}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                  >
                    Room Inspection
                  </button>
                  
                  {inspectionCompleted && (
                    <button
                      onClick={() => setShowHousekeepingForm(true)}
                      className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
                    >
                      Assign Housekeeping
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {showPaymentForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Process Payment</h3>
                <button
                  onClick={() => setShowPaymentForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowPaymentForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={processPayment}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Process
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showHousekeepingForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Assign Housekeeping</h3>
                <button
                  onClick={() => setShowHousekeepingForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Staff Member
                  </label>
                  <select
                    value={selectedStaff}
                    onChange={(e) => setSelectedStaff(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select staff member</option>
                    {Array.isArray(staff) && staff.map((member) => (
                      <option key={member._id || member.id} value={member._id || member.id}>
                        {member.username || member.name || member.fullName || `Staff ${member._id}`}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowHousekeepingForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={assignHousekeepingTask}
                    className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
                  >
                    Assign Task
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    //     </div>


    //   </div>
    // </div>
  );
};

export default CheckoutPage;
