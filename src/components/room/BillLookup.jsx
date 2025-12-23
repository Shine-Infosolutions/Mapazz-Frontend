import React, { useState, useEffect } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";

const BillLookup = () => {
  const { axios } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [grcNo, setGrcNo] = useState("");
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gstData, setGstData] = useState(null);
  const [hotelGstNumber, setHotelGstNumber] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableBill, setEditableBill] = useState(null);

  useEffect(() => {
    const navGrcNo = location.state?.grcNo;
    if (navGrcNo) {
      setGrcNo(navGrcNo);
      fetchBillsForGrc(navGrcNo);
    }
    fetchGstData();
  }, [location.state]);

  const fetchGstData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [gstResponse, gstNumberResponse] = await Promise.all([
        axios.get('/api/gst/all', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/gst-numbers/all', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const activeGst = gstResponse.data.find(gst => gst.isActive);
      const activeGstNumber = gstNumberResponse.data.find(gstn => gstn.isActive);
      
      setGstData(activeGst);
      setHotelGstNumber(activeGstNumber);
    } catch (error) {
      // Error fetching GST data
    }
  };

  const fetchBillsForGrc = async (grcNumber) => {
    if (!grcNumber.trim()) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/room-service/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const roomOrders = (response.data.orders || []).filter(order => 
        order.grcNo === grcNumber
      );
      
      if (roomOrders.length > 0) {
        const combinedItems = [];
        let totalAmount = 0;
        
        roomOrders.forEach(order => {
          if (order.items) {
            combinedItems.push(...order.items);
          }
          totalAmount += order.subtotal || order.amount || 0;
        });
        
        const consolidatedBill = {
          _id: `combined-${grcNumber}`,
          billNumber: `CB-${grcNumber}`,
          grcNo: grcNumber,
          tableNo: roomOrders[0].roomNumber || roomOrders[0].tableNo,
          guestName: roomOrders[0].guestName,
          items: combinedItems,
          amount: totalAmount,
          totalAmount: totalAmount,
          createdAt: new Date().toISOString(),
          orderCount: roomOrders.length
        };
        
        setBills([consolidatedBill]);
        setEditableBill(consolidatedBill);
      } else {
        setBills([]);
        setEditableBill(null);
      }
    } catch (error) {
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBills = () => {
    fetchBillsForGrc(grcNo);
  };

  return (
    <>
      <style>{`
        @media print {
          * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible !important; }
          .print-content { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          @page { margin: 0.5in; size: A4; }
          body { margin: 0; padding: 0; background: white !important; }
        }
      `}</style>
      <div className="min-h-screen p-6" style={{backgroundColor: 'var(--color-background)'}}>
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h1 className="text-2xl font-bold mb-4" style={{color: 'var(--color-text)'}}>Bill Lookup</h1>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Enter GRC Number"
                value={grcNo}
                onChange={(e) => setGrcNo(e.target.value)}
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{borderColor: 'var(--color-border)', '--tw-ring-color': 'var(--color-primary)'}}
              />
              <button
                onClick={fetchBills}
                disabled={!grcNo.trim() || loading}
                className="px-6 py-2 rounded-lg text-white font-medium disabled:opacity-50"
                style={{backgroundColor: 'var(--color-primary)'}}
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">
            Loading bill...
          </div>
        ) : bills.length > 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 print-content">
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-between items-start mb-8">
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center hover:opacity-80 transition-opacity no-print"
                  style={{color: 'var(--color-primary)'}}
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </button>
                <div className="text-center flex-1">
                  <h2 className="text-3xl font-bold mb-2" style={{color: 'var(--color-text)'}}>MAPAZZ HOTEL</h2>
                  <p className="text-lg text-gray-600">Consolidated Room Service Bill</p>
                </div>
                <div className="flex gap-2 no-print">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center px-4 py-2 rounded-lg border hover:bg-gray-50"
                    style={{borderColor: 'var(--color-border)', color: 'var(--color-text)'}}
                  >
                    {isEditing ? 'Save' : 'Edit'}
                  </button>
                  <button 
                    onClick={() => window.print()} 
                    className="flex items-center px-4 py-2 rounded-lg border hover:bg-gray-50"
                    style={{borderColor: 'var(--color-border)', color: 'var(--color-text)'}}
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold mb-4" style={{color: 'var(--color-text)'}}>Bill Details</h3>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Bill Number:</span>
                    <span>{bills[0].billNumber}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">GRC Number:</span>
                    <span>{bills[0].grcNo}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Room:</span>
                    <span>{bills[0].tableNo}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Guest:</span>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editableBill?.guestName || 'Guest'}
                        onChange={(e) => setEditableBill({...editableBill, guestName: e.target.value})}
                        className="border rounded px-2 py-1 text-sm"
                      />
                    ) : (
                      <span>{editableBill?.guestName || 'Guest'}</span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold mb-4" style={{color: 'var(--color-text)'}}>Order Summary</h3>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Total Orders:</span>
                    <span>{bills[0].orderCount}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Date:</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-medium">Time:</span>
                    <span>{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4" style={{color: 'var(--color-text)'}}>Items Ordered</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Item</th>
                        <th className="px-4 py-3 text-left font-semibold">Quantity</th>
                        <th className="px-4 py-3 text-left font-semibold">Unit Price</th>
                        <th className="px-4 py-3 text-left font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editableBill?.items?.map((item, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3">{item.itemName || item.name}</td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => {
                                  const newItems = [...editableBill.items];
                                  newItems[index].quantity = parseInt(e.target.value) || 0;
                                  const newAmount = newItems.reduce((sum, i) => sum + ((i.unitPrice || i.price) * i.quantity), 0);
                                  setEditableBill({...editableBill, items: newItems, amount: newAmount, totalAmount: newAmount});
                                }}
                                className="border rounded px-2 py-1 w-16 text-sm"
                              />
                            ) : (
                              item.quantity
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.01"
                                value={(item.unitPrice || item.price)?.toFixed(2) || '0.00'}
                                onChange={(e) => {
                                  const newItems = [...editableBill.items];
                                  const newPrice = parseFloat(e.target.value) || 0;
                                  newItems[index].unitPrice = newPrice;
                                  newItems[index].price = newPrice;
                                  const newAmount = newItems.reduce((sum, i) => sum + ((i.unitPrice || i.price) * i.quantity), 0);
                                  setEditableBill({...editableBill, items: newItems, amount: newAmount, totalAmount: newAmount});
                                }}
                                className="border rounded px-2 py-1 w-20 text-sm"
                              />
                            ) : (
                              `₹${(item.unitPrice || item.price)?.toFixed(2) || '0.00'}`
                            )}
                          </td>
                          <td className="px-4 py-3 font-semibold">₹{(item.totalPrice || (item.unitPrice || item.price) * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="max-w-md ml-auto space-y-3">
                  <div className="flex justify-between py-3 border-t-2 text-xl font-bold" style={{color: 'var(--color-primary)'}}>
                    <span>TOTAL:</span>
                    <span>₹{editableBill?.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <div className="text-sm font-medium mb-2">Hotel GST Details:</div>
                    <div className="text-xs text-gray-600">
                      <div>GSTIN: {hotelGstNumber?.gstNumber || 'Not Available'}</div>
                      <div>Company: {hotelGstNumber?.companyName || 'MAPAZZ HOTEL'}</div>
                      <div>Total GST: {gstData?.totalGST || 18}%</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center mt-8 pt-6 border-t">
                <p className="text-lg font-medium" style={{color: 'var(--color-text)'}}>Thank you for your stay!</p>
                <p className="text-gray-600">Have a great day!</p>
              </div>
            </div>
          </div>
        ) : grcNo && !loading && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">
            No orders found for GRC: {grcNo}
          </div>
        )}
        </div>
      </div>
    </>
  );
};

export default BillLookup;
