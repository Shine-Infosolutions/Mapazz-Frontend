import React from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const SaleBill = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const order = location.state?.order;
  const printParam = location.state?.print;

  React.useEffect(() => {
    if (printParam === true) {
      setTimeout(() => window.print(), 500);
    }
  }, [printParam]);

  if (!order) {
    return <div>No order data found</div>;
  }

  return (
    <>
      <style>{`
        @media print {
          * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible !important; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          @page { margin: 0.5in; size: A4; }
          body { margin: 0; padding: 0; background: white !important; }
        }
      `}</style>
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="w-full max-w-2xl mx-auto bg-white shadow-2xl print-area" style={{fontFamily: 'monospace'}}>
          <div className="p-8 text-base">
            <div className="flex justify-between items-center mb-6 no-print">
              <button 
                onClick={() => navigate(-1)} 
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </button>
              <button 
                onClick={() => window.print()} 
                className="flex items-center text-green-600 hover:text-green-800"
              >
                <Printer className="w-5 h-5 mr-2" />
                Print
              </button>
            </div>
            
            <div className="text-center mb-6">
              <div className="font-bold text-2xl">MAPAZZ HOTEL</div>
              <div className="text-lg">Room Service Bill</div>
              <div className="text-lg">================================</div>
            </div>

            <div className="mb-6 text-lg">
              <div>Order: #{order.orderNumber || order._id.slice(-6)}</div>
              <div>Room: {order.roomNumber || order.tableNo}</div>
              <div>Guest: {order.guestName || 'Guest'}</div>
              <div>Date: {new Date().toLocaleDateString()}</div>
              <div>Time: {new Date().toLocaleTimeString()}</div>
            </div>

            <div className="text-lg">================================</div>
            
            <div className="my-6">
              {order.items?.map((item, index) => (
                <div key={index} className="mb-3">
                  <div className="flex justify-between text-lg">
                    <span>{item.quantity}x {item.itemName || item.name}</span>
                    <span>₹{(item.totalPrice || (item.price * item.quantity) || (item.unitPrice * item.quantity)).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-lg">================================</div>
            
            <div className="my-6 space-y-2">
              <div className="flex justify-between text-lg">
                <span>Subtotal:</span>
                <span>₹{(order.subtotal || order.amount).toFixed(2)}</span>
              </div>
            </div>

            <div className="text-lg">================================</div>
            
            <div className="flex justify-between font-bold text-xl my-4">
              <span>TOTAL:</span>
              <span>₹{(order.totalAmount || order.subtotal || order.amount).toFixed(2)}</span>
            </div>

            <div className="text-lg">================================</div>
            
            <div className="text-center mt-6 text-lg">
              <div>Thank you for your order!</div>
              <div>Have a great day!</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SaleBill;
