import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { FaWhatsapp } from 'react-icons/fa';
import { useAppContext } from '../../context/AppContext';

export default function RoomServiceInvoice({ orderData: propOrderData, isEmbedded = false }) {
  const { axios } = useAppContext();
  const location = useLocation();
  const { orderId } = useParams();
  const orderData = propOrderData || location.state?.orderData;
  
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(!isEmbedded);

  const fetchInvoiceData = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let order = orderData;
      if (!order && id) {
        const response = await axios.get(`/api/room-service/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        order = response.data;
      }

      if (!order) {
        throw new Error('Room service order not found');
      }

      const invoiceData = {
        clientDetails: {
          name: order.guestName || order.customerName || 'Guest',
          address: order.address || 'N/A',
          city: order.city || 'N/A',
          company: order.company || 'N/A',
          mobileNo: order.phoneNumber || order.mobileNo || 'N/A',
          gstin: order.gstin || 'N/A'
        },
        invoiceDetails: {
          billNo: `RS-${(order._id || id).slice(-6)}`,
          billDate: new Date(order.createdAt || Date.now()).toLocaleDateString('en-GB'),
          grcNo: order.grcNo || `GRC-${(order._id || id).slice(-6)}`,
          serviceType: 'Room Service',
          serviceDate: new Date(order.createdAt || Date.now()).toLocaleDateString('en-GB'),
          roomNo: order.roomNumber || order.roomNo || 'N/A'
        },
        items: order.items?.map((item, index) => ({
          sno: index + 1,
          particulars: `${item.itemName || item.name || 'Unknown Item'}${item.isFree ? ' (NC)' : ''}`,
          quantity: item.quantity || 1,
          rate: item.price || item.Price || 0,
          hsn: '996332',
          amount: item.isFree ? 0 : ((item.price || item.Price || 0) * (item.quantity || 1)),
          isFree: item.isFree || false
        })) || [],
        payment: {
          taxableAmount: order.nonChargeable ? 0 : (order.subtotal || order.amount || 0),
          sgst: order.nonChargeable ? 0 : (order.sgstAmount || 0),
          cgst: order.nonChargeable ? 0 : (order.cgstAmount || 0),
          total: order.nonChargeable ? 0 : (order.totalAmount || order.amount || 0),
          sgstRate: order.sgstRate || 2.5,
          cgstRate: order.cgstRate || 2.5
        }
      };
      
      setInvoiceData(invoiceData);
      
    } catch (error) {
      console.error('Error fetching room service invoice data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEmbedded && propOrderData) {
      fetchInvoiceData(propOrderData._id);
    } else {
      const id = orderId || orderData?._id;
      if (id || orderData) {
        fetchInvoiceData(id);
      }
    }
  }, [orderId, orderData, propOrderData, isEmbedded]);

  const calculateTotal = () => {
    if (!invoiceData?.items) return '0.00';
    const subTotal = invoiceData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
    return subTotal.toFixed(2);
  };

  const calculateNetTotal = () => {
    if (!invoiceData) return '0.00';
    const baseAmount = invoiceData.payment?.taxableAmount || 0;
    const sgst = invoiceData.payment?.sgst || 0;
    const cgst = invoiceData.payment?.cgst || 0;
    return (baseAmount + sgst + cgst).toFixed(2);
  };

  const shareInvoice = () => {
    const sharedUrl = `${window.location.origin}/shared-room-service-invoice/${orderId || orderData?._id}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(sharedUrl)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-2 sm:p-4 flex items-center justify-center">
        <div className="text-lg">Loading Room Service Invoice...</div>
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div className="min-h-screen bg-white p-2 sm:p-4 flex items-center justify-center">
        <div className="text-lg text-red-600">Failed to load room service invoice data</div>
      </div>
    );
  }

  const additionalButtons = [
    {
      label: 'Back',
      onClick: () => window.history.back(),
      className: 'bg-gray-600 text-white hover:bg-gray-700',
      icon: null
    },
    {
      label: 'Share on WhatsApp',
      onClick: shareInvoice,
      className: 'bg-green-500 text-white hover:bg-green-600',
      icon: <FaWhatsapp className="text-lg" />
    }
  ];

  if (isEmbedded) {
    return (
      <div className="py-4">
        <div className="client-details-grid grid grid-cols-1 lg:grid-cols-2 text-xs border border-black mb-4">
          <div className="client-details-left border-r border-black p-2">
            <div className="client-info-grid grid grid-cols-3 gap-x-1 gap-y-1">
              <p className="col-span-1">Name</p>
              <p className="col-span-2">: {invoiceData?.clientDetails?.name || 'Guest'}</p>
              <p className="col-span-1">Bill No. & Date</p>
              <p className="col-span-2">: {invoiceData?.invoiceDetails?.billNo} {invoiceData?.invoiceDetails?.billDate}</p>
              <p className="col-span-1">GRC No.</p>
              <p className="col-span-2">: {invoiceData?.invoiceDetails?.grcNo}</p>
              <p className="col-span-1">Room</p>
              <p className="col-span-2">: {invoiceData?.invoiceDetails?.roomNo}</p>
              <p className="col-span-1">Order Date</p>
              <p className="col-span-2">: {invoiceData?.invoiceDetails?.serviceDate}</p>
              <p className="col-span-1">Order Time</p>
              <p className="col-span-2">: {new Date().toLocaleTimeString()}</p>
            </div>
          </div>
          <div className="client-details-right p-2">
          </div>
        </div>

        <div className="mb-4 overflow-x-auto">
          <table className="items-table w-full text-xs border-collapse">
            <thead>
              <tr className="border border-black bg-gray-200">
                <th className="p-1 border border-black whitespace-nowrap">S.No</th>
                <th className="p-1 border border-black whitespace-nowrap">Item Name</th>
                <th className="p-1 border border-black text-center whitespace-nowrap">Qty</th>
                <th className="p-1 border border-black text-right whitespace-nowrap">Rate</th>
                <th className="p-1 border border-black text-center whitespace-nowrap">HSN/SAC</th>
                <th className="p-1 border border-black text-right whitespace-nowrap">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData?.items?.map((item, index) => (
                <tr key={index} className="border border-black">
                  <td className="p-1 border border-black text-center">{item.sno}</td>
                  <td className="p-1 border border-black">{item.particulars}</td>
                  <td className="p-1 border border-black text-center">{item.quantity}</td>
                  <td className="p-1 border border-black text-right">₹{item.rate?.toFixed(2)}</td>
                  <td className="p-1 border border-black text-center">{item.hsn}</td>
                  <td className="p-1 border border-black text-right font-bold">₹{item.amount?.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="border border-black bg-gray-100">
                <td colSpan="5" className="p-1 text-right font-bold border border-black">SUB TOTAL :</td>
                <td className="p-1 text-right border border-black font-bold">₹{calculateTotal()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-4 flex justify-end">
          <div className="w-full lg:w-1/2">
            <p className="font-bold mb-1">Net Amount Summary</p>
            <table className="w-full border-collapse border border-black">
              <tbody>
                <tr>
                  <td className="p-1 text-right text-xs font-medium">Subtotal:</td>
                  <td className="p-1 border-l border-black text-right text-xs">₹{invoiceData?.payment?.taxableAmount?.toFixed(2) || '0.00'}</td>
                </tr>
                <tr className="bg-gray-200">
                  <td className="p-1 font-bold text-right text-xs">NET AMOUNT:</td>
                  <td className="p-1 border-l border-black text-right font-bold text-xs">₹{calculateNetTotal()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 text-xs">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 border-b border-t border-black py-4">
            <div>
              <p className="font-bold">PAYMENT METHOD:</p>
              <div className="flex items-center space-x-4 mt-2">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" /> CASH
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" /> CARD
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" /> UPI
                </label>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold">ROOM SERVICE TIMING: 24 Hours</p>
              <p>Thank you for choosing our room service!</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 mt-4 gap-2 sm:gap-0">
            <div className="text-left font-bold">ROOM SERVICE MANAGER</div>
            <div className="text-center font-bold">CASHIER</div>
            <div className="text-right font-bold">Customer Sign.</div>
            <div className="text-left text-xs">Subject to GORAKHPUR Jurisdiction only.</div>
            <div className="text-center text-xs">E. & O.E.</div>
            <div></div>
          </div>
          <p className="mt-4 text-center text-lg font-bold">Thank You, Visit Again</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-2 sm:p-4">
      <div className="text-lg text-red-600">Standalone room service invoice not implemented</div>
    </div>
  );
}