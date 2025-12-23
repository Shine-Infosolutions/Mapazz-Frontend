import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAppContext } from "../../context/AppContext";

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

const RoomServiceBilling = () => {
  const { axios } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [showPayment, setShowPayment] = useState(null);
  const [showItems, setShowItems] = useState(null);
  const [paymentData, setPaymentData] = useState({
    paidAmount: 0,
    paymentMethod: 'cash'
  });
  const [grcNo, setGrcNo] = useState(null);


  useEffect(() => {
    // Get GRC number from navigation state or localStorage
    const navGrcNo = location.state?.grcNo;
    const roomData = localStorage.getItem('selectedRoomService');
    
    let currentGrcNo = null;
    if (navGrcNo) {
      currentGrcNo = navGrcNo;
      setGrcNo(navGrcNo);
    } else if (roomData) {
      const parsed = JSON.parse(roomData);
      currentGrcNo = parsed.booking?.grcNo;
      setGrcNo(currentGrcNo);
    }
    
    // Fetch orders with the current GRC number
    fetchRoomServiceOrders(currentGrcNo);
  }, [location.state]);

  // Separate useEffect to refetch when grcNo changes
  useEffect(() => {
    if (grcNo) {
      fetchRoomServiceOrders(grcNo);
    }
  }, [grcNo]);

  const fetchRoomServiceOrders = async (filterGrcNo = null) => {
    try {
      const token = localStorage.getItem('token');
      const currentGrcNo = filterGrcNo || grcNo;
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (currentGrcNo) {
        queryParams.append('grcNo', currentGrcNo);
      }
      
      const response = await axios.get(`/api/room-service/all?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const roomOrders = response.data.orders || [];
      setOrders(roomOrders);
    } catch (error) {
      console.error('Error fetching room service orders:', error);
      setOrders([]);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Create bill
      const billData = {
        orderId: showPayment._id,
        tableNo: showPayment.roomNumber || showPayment.tableNo,
        subtotal: showPayment.subtotal || showPayment.amount,
        tax: 0,
        totalAmount: showPayment.totalAmount || showPayment.subtotal || showPayment.amount,
        paymentMethod: paymentData.paymentMethod,
        billNumber: `RS-${Date.now().toString().slice(-6)}`,
        cashierId: user?._id || 'default'
      };
      
      await axios.post('/api/bills/create', billData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update order status to paid
      await axios.patch(`/api/room-service/${showPayment._id}/payment`, {
        paymentStatus: 'paid'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Payment processed successfully!');
      setShowPayment(null);
      fetchRoomServiceOrders();
    } catch (error) {

      alert('Failed to process payment');
    }
  };

  return (
    <div className="min-h-screen p-6" style={{backgroundColor: 'var(--color-background)'}}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 animate-slideInLeft animate-delay-100">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center hover:opacity-80 transition-opacity"
              style={{color: 'var(--color-primary)'}}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <h1 className="text-2xl font-bold" style={{color: 'var(--color-text)'}}>
              Room Service Billing {location.state?.guestName && `- ${location.state.guestName}`}
              {grcNo && <span className="text-sm text-gray-500 block">GRC: {grcNo}</span>}
            </h1>
            <div></div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden animate-fadeInUp animate-delay-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{backgroundColor: 'var(--color-secondary)'}}>
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Order ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Room</th>
                  <th className="px-4 py-3 text-left font-semibold">Guest</th>
                  <th className="px-4 py-3 text-left font-semibold">Items</th>
                  <th className="px-4 py-3 text-left font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr key={order._id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} animate-scaleIn`} style={{animationDelay: `${Math.min(index * 100 + 300, 800)}ms`}}>
                    <td className="px-4 py-3 font-mono">{order.orderNumber || order._id.slice(-6)}</td>
                    <td className="px-4 py-3">{order.roomNumber || order.tableNo}</td>
                    <td className="px-4 py-3">{order.guestName || 'Guest'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setShowItems(order)}
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                      >
                        View Items ({order.items?.length || 0})
                      </button>
                    </td>
                    <td className="px-4 py-3 font-semibold">₹{order.totalAmount || order.amount}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        order.status === 'paid' ? 'bg-green-100 text-green-800' :
                        order.status === 'served' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        {order.status === 'served' && (
                          <button
                            onClick={() => setShowPayment(order)}
                            className="px-3 py-1 rounded text-sm text-white hover:opacity-80"
                            style={{backgroundColor: 'var(--color-primary)'}}
                          >
                            Pay Now
                          </button>
                        )}
                        <button
                          onClick={() => navigate('/sale-bill', { state: { order } })}
                          className="px-3 py-1 rounded text-sm border hover:bg-gray-50"
                        >
                          Sale Bill
                        </button>
                        <button
                          onClick={() => {
                            navigate('/sale-bill', { state: { order, print: true } });
                          }}
                          className="px-3 py-1 rounded text-sm bg-green-600 text-white hover:bg-green-700"
                        >
                          Print
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {orders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {grcNo ? `No orders found for GRC: ${grcNo}` : 'No room service orders found.'}
            </div>
          )}
        </div>
      </div>

      {/* Items Modal */}
      {showItems && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Order Items</h3>
                  <p className="text-sm text-gray-600">Order #{showItems.orderNumber || showItems._id.slice(-6)} - {showItems.roomNumber || showItems.tableNo}</p>
                </div>
                <button
                  onClick={() => setShowItems(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-3">
                {showItems.items?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{item.itemName || item.name}</div>
                      <div className="text-sm text-gray-600">
                        KOT ID: {item.kotId || showItems._id.slice(-6)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">₹{item.unitPrice || item.price} × {item.quantity}</div>
                      <div className="text-sm text-gray-600">₹{item.totalPrice || (item.unitPrice || item.price) * item.quantity}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total Amount:</span>
                  <span>₹{showItems.totalAmount || showItems.amount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold">Process Payment</h3>
              <p className="text-sm text-gray-600">Order #{showPayment._id.slice(-6)} - {showPayment.tableNo}</p>
            </div>

            <form onSubmit={handlePayment} className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span>Total Amount:</span>
                  <span className="font-bold text-lg">₹{showPayment.totalAmount || showPayment.subtotal || showPayment.amount}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Total Amount: ₹{showPayment.totalAmount || showPayment.subtotal || showPayment.amount}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Payment Amount</label>
                <input
                  type="number"
                  value={paymentData.paidAmount}
                  onChange={(e) => setPaymentData({...paymentData, paidAmount: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Payment Method</label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({...paymentData, paymentMethod: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 rounded-lg text-white font-medium"
                  style={{backgroundColor: 'var(--color-primary)'}}
                >
                  Process Payment
                </button>
                <button
                  type="button"
                  onClick={() => setShowPayment(null)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
};

export default RoomServiceBilling;
