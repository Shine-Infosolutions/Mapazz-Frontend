import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import mapazzLogo from '/mapazz.png';
import { RiPhoneFill, RiMailFill } from 'react-icons/ri';
import axios from 'axios';

export default function SharedHotelInvoice() {
  const { id } = useParams();
  const invoiceRef = useRef();
  
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        setLoading(true);
        console.log('Fetching invoice for ID:', id);
        
        // First try to get invoice by checkout ID
        try {
          const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/checkout/${id}/invoice`);
          console.log('Invoice response:', response.data);
          setInvoiceData(response.data.invoice);
          return;
        } catch (checkoutError) {
          console.log('Checkout not found, trying to get by booking ID:', checkoutError.response?.data?.message);
          
          // If checkout doesn't exist, try to get checkout by booking ID
          const checkoutResponse = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/checkout/booking/${id}`);
          if (checkoutResponse.data.success && checkoutResponse.data.checkout) {
            // Now get invoice using the checkout ID
            const invoiceResponse = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/checkout/${checkoutResponse.data.checkout._id}/invoice`);
            setInvoiceData(invoiceResponse.data.invoice);
            return;
          }
          
          throw new Error('No checkout found for this booking');
        }
      } catch (error) {
        console.error('Invoice fetch error:', error);
        setError(`Failed to load invoice: ${error.response?.data?.message || error.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchInvoiceData();
    }
  }, [id]);

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
    const otherChargesTotal = invoiceData.otherCharges?.reduce((sum, charge) => sum + (charge.amount || 0), 0) || 0;
    const exactTotal = baseAmount + sgst + cgst + otherChargesTotal;
    const roundedTotal = Math.round(exactTotal);
    return roundedTotal.toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-4 flex items-center justify-center">
        <div className="text-lg">Loading Invoice...</div>
      </div>
    );
  }

  if (error || !invoiceData) {
    return (
      <div className="min-h-screen bg-white p-4 flex items-center justify-center">
        <div className="text-lg text-red-600">{error || 'Invoice not found'}</div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible !important; }
          .print-content { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            box-sizing: border-box;
            padding: 10px;
          }
          .no-print { display: none !important; }
          @page { 
            margin: 0.5in; 
            size: A4;
          }
          body { margin: 0; padding: 0; background: white !important; }
        }
      `}</style>
      <div className="min-h-screen bg-white p-4">
        <div className="no-print mb-4 text-center">
          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Print Invoice
          </button>
        </div>
        
        <div ref={invoiceRef} className="max-w-4xl mx-auto border-2 border-black p-4 print-content">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-4">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="border border-black p-2">
                <div className="w-16 h-16 sm:w-20 sm:h-20">
                  <img src={mapazzLogo} alt="Mapazz Logo" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="text-xs text-center sm:text-left">
                <p className="font-bold text-sm sm:text-base">MAPAZZ HOTEL</p>
                <p className="text-xs">Deoria Bypass Rd, near LIC Office Gorakhpur</p>
                <p className="text-xs">Taramandal, Gorakhpur, Uttar Pradesh 273016</p>
                <p className="text-xs">Website: <a href="http://mapazz-hotel.com" className="text-blue-600">mapazz-hotel.com</a></p>
                <p className="text-xs">contact@hotelmapazz.in</p>
              </div>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="text-xs flex items-center space-x-2">
                <RiPhoneFill className="text-lg text-yellow-600" />
                <span>+91-XXXX-XXXXXX</span>
              </div>
              <div className="text-xs flex items-center space-x-2">
                <RiMailFill className="text-lg text-yellow-600" />
                <span>contact@hotelmapazz.in</span>
              </div>
            </div>
          </div>

          <div className="text-center font-bold text-lg mb-4">
            TAX INVOICE
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 text-xs border border-black mb-4">
            <div className="border-r border-black p-2">
              <p><span className="font-bold">GSTIN No. : </span>{invoiceData.clientDetails?.gstin}</p>
              <div className="grid grid-cols-3 gap-x-1 gap-y-1">
                <p className="col-span-1">Name</p>
                <p className="col-span-2">: {invoiceData.clientDetails?.name}</p>
                <p className="col-span-1">Address</p>
                <p className="col-span-2">: {invoiceData.clientDetails?.address}</p>
                <p className="col-span-1">City</p>
                <p className="col-span-2">: {invoiceData.clientDetails?.city}</p>
                <p className="col-span-1">Company</p>
                <p className="col-span-2">: {invoiceData.clientDetails?.company}</p>
                <p className="col-span-1">Mobile No.</p>
                <p className="col-span-2">: {invoiceData.clientDetails?.mobileNo}</p>
              </div>
            </div>

            <div className="p-2">
              <div className="grid grid-cols-2 gap-y-1">
                <p className="font-bold">Bill No. & Date</p>
                <p className="font-medium">: {invoiceData.invoiceDetails?.billNo} {invoiceData.invoiceDetails?.billDate}</p>
                <p className="font-bold">GRC No.</p>
                <p className="font-medium">: {invoiceData.invoiceDetails?.grcNo}</p>
                <p className="font-bold">Room No./Type</p>
                <p className="font-medium">: {invoiceData.invoiceDetails?.roomNo} {invoiceData.invoiceDetails?.roomType}</p>
                <p className="font-bold">PAX</p>
                <p className="font-medium">: {invoiceData.invoiceDetails?.pax} Adult: {invoiceData.invoiceDetails?.adult}</p>
                <p className="font-bold">CheckIn Date</p>
                <p className="font-medium">: {invoiceData.invoiceDetails?.checkInDate}</p>
                <p className="font-bold">CheckOut Date</p>
                <p className="font-medium">: {invoiceData.invoiceDetails?.checkOutDate}</p>
                {invoiceData.bookingData?.advanceAmount > 0 && (
                  <>
                    <p className="font-bold text-green-600">Advance Paid</p>
                    <p className="font-medium text-green-600">: ₹{invoiceData.bookingData.advanceAmount.toFixed(2)}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mb-4 overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border border-black bg-gray-200">
                  <th className="p-1 border border-black">Date</th>
                  <th className="p-1 border border-black">Particulars</th>
                  <th className="p-1 border border-black text-center">PAX</th>
                  <th className="p-1 border border-black text-right">Declared Rate</th>
                  <th className="p-1 border border-black text-center">HSN/SAC Code</th>
                  <th className="p-1 border border-black text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.items?.map((item, index) => (
                  <tr key={index} className="border border-black">
                    <td className="p-1 border border-black">{item.date || 'N/A'}</td>
                    <td className="p-1 border border-black">{item.particulars || 'N/A'}</td>
                    <td className="p-1 border border-black text-center">{item.pax || 1}</td>
                    <td className="p-1 border border-black text-right">₹{item.declaredRate?.toFixed(2) || '0.00'}</td>
                    <td className="p-1 border border-black text-center">{item.hsn || 'N/A'}</td>
                    <td className="p-1 border border-black text-right font-bold">₹{item.amount?.toFixed(2) || '0.00'}</td>
                  </tr>
                ))}
                <tr className="border border-black bg-gray-100">
                  <td colSpan="3" className="p-1 text-right font-bold border border-black">SUB TOTAL :</td>
                  <td className="p-1 text-right border border-black font-bold">₹{invoiceData.taxes?.[0]?.taxableAmount?.toFixed(2)}</td>
                  <td className="p-1 border border-black font-bold"></td>
                  <td className="p-1 text-right border border-black font-bold">₹{calculateTotal()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mb-4">
            <div className="w-2/5">
              <p className="font-bold mb-1">Net Amount Summary</p>
              <table className="w-full border-collapse border border-black">
                <tbody>
                  <tr>
                    <td className="p-1 text-right text-xs font-medium">Amount:</td>
                    <td className="p-1 border-l border-black text-right text-xs">₹{invoiceData.payment?.taxableAmount?.toFixed(2) || '0.00'}</td>
                  </tr>
                  <tr>
                    <td className="p-1 text-right text-xs font-medium">SGST (2.5%):</td>
                    <td className="p-1 border-l border-black text-right text-xs">₹{invoiceData.payment?.sgst?.toFixed(2) || '0.00'}</td>
                  </tr>
                  <tr>
                    <td className="p-1 text-right text-xs font-medium">CGST (2.5%):</td>
                    <td className="p-1 border-l border-black text-right text-xs">₹{invoiceData.payment?.cgst?.toFixed(2) || '0.00'}</td>
                  </tr>
                  <tr className="bg-gray-200">
                    <td className="p-1 font-bold text-right text-xs">NET AMOUNT:</td>
                    <td className="p-1 border-l border-black text-right font-bold text-xs">₹{calculateNetTotal()}</td>
                  </tr>
                  {invoiceData.bookingData?.advanceAmount > 0 && (
                    <>
                      <tr className="bg-green-50">
                        <td className="p-1 text-right text-xs font-medium text-green-700">Advance Received:</td>
                        <td className="p-1 border-l border-black text-right text-xs font-bold text-green-700">₹{invoiceData.bookingData.advanceAmount.toFixed(2)}</td>
                      </tr>
                      <tr className="bg-orange-50">
                        <td className="p-1 font-bold text-right text-xs text-orange-700">BALANCE DUE:</td>
                        <td className="p-1 border-l border-black text-right font-bold text-xs text-orange-700">₹{(parseFloat(calculateNetTotal()) - invoiceData.bookingData.advanceAmount).toFixed(2)}</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 text-xs">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 border-b border-t border-black py-4">
              <div>
                <p className="font-bold">HAVE YOU DEPOSITED YOUR ROOM KEY AND LOCKERS KEY?</p>
                <div className="flex items-center space-x-4 mt-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" /> YES
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" /> NO
                  </label>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold">CHECK OUT TIME : 12:00</p>
                <p>I AGREE THAT I AM RESPONSIBLE FOR THE FULL PAYMENT OF THIS BILL</p>
              </div>
            </div>
            <div className="grid grid-cols-3 mt-4">
              <div className="text-left font-bold">FRONT OFFICE MANAGER</div>
              <div className="text-center font-bold">CASHIER</div>
              <div className="text-right font-bold">Guest Sign.</div>
            </div>
            <p className="mt-4 text-center text-lg font-bold">Thank You, Visit Again</p>
          </div>
        </div>
      </div>
    </>
  );
}