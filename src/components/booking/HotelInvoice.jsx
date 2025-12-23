import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ashokaLogo from '../../assets/hawana golden png.png';
import { RiPhoneFill, RiMailFill } from 'react-icons/ri';
import { FaWhatsapp, FaFilePdf } from 'react-icons/fa';
import { useAppContext } from '../../context/AppContext';
import { useReactToPrint } from 'react-to-print';
import BackButton from '../common/BackButton';
import RestaurantInvoice from '../restaurant/RestaurantInvoice';
import { RoomServiceInvoice, LaundryInvoice } from '../invoices';

export default function Invoice() {
  const { axios } = useAppContext();
  const location = useLocation();
  const bookingData = location.state?.bookingData;
  const invoiceRef = useRef();
  
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [gstRates, setGstRates] = useState({ cgstRate: 2.5, sgstRate: 2.5 });
  const [showPaxDetails, setShowPaxDetails] = useState(false);
  const [laundryOrders, setLaundryOrders] = useState([]);
  const [activeInvoice, setActiveInvoice] = useState('hotel');
  const [restaurantOrders, setRestaurantOrders] = useState([]);
  const [roomServiceOrders, setRoomServiceOrders] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

  // Generate or retrieve existing invoice number
  const getOrGenerateInvoiceNumber = async (orderId, prefix) => {
    console.log('getOrGenerateInvoiceNumber called with:', { orderId, prefix });
    const storageKey = `invoice_${prefix}_${orderId}`;
    
    const existing = localStorage.getItem(storageKey);
    
    // Return existing invoice number if already generated
    if (existing) {
      console.log('Using existing invoice number:', existing);
      return existing;
    }
    
    console.log('No existing invoice number found, calling backend API...');
    try {
      // First check if this booking already has an invoice
      const response = await axios.get(`/api/invoices/next-invoice-number?bookingId=${orderId}&preview=false`);
      console.log('Backend response:', response.data);
      if (response.data && response.data.invoiceNumber) {
        const invoiceNumber = response.data.invoiceNumber;
        localStorage.setItem(storageKey, invoiceNumber);
        console.log('Generated new invoice number from backend:', invoiceNumber);
        return invoiceNumber;
      } else {
        console.error('Invalid response from backend:', response.data);
      }
    } catch (error) {
      console.error('Failed to get invoice number from backend:', error);
      console.error('Error details:', error.response?.data);
    }
    
    // Fallback to local generation if backend fails
    console.log('Using fallback invoice number generation');
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const sequence = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
    const invoiceNumber = `HH/${month}/${sequence}`;
    localStorage.setItem(storageKey, invoiceNumber);
    
    return invoiceNumber;
  };

  // Format date as DD/MM/YYYY
  const formatDate = (date = new Date()) => {
    if (!date || date === 'N/A' || date === 'NaN/NaN/NaN' || date === null || date === undefined) {
      return new Date().toLocaleDateString('en-GB');
    }
    
    try {
      // Handle MongoDB $date objects
      if (date && typeof date === 'object' && date.$date) {
        const d = new Date(date.$date);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-GB');
        }
      }
      
      // Handle regular date strings/objects
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB');
      }
      
      // Fallback to current date
      return new Date().toLocaleDateString('en-GB');
    } catch (error) {
      return new Date().toLocaleDateString('en-GB');
    }
  };

  useEffect(() => {
    if (activeInvoice === 'hotel') {
      const checkoutId = location.state?.checkoutId || bookingData?._id;
      if (checkoutId) {
        fetchInvoiceData(checkoutId);
      }
    }
  }, [location.state, activeInvoice]);

  useEffect(() => {
    if (activeInvoice === 'restaurant' && bookingData?._id && restaurantOrders.length === 0) {
      const fetchRestaurantOrders = async () => {
        setLoadingServices(true);
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get('/api/restaurant-orders/all', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const bookingOrders = response.data.filter(order => 
            order.bookingId?._id === bookingData._id || order.bookingId === bookingData._id
          );
          setRestaurantOrders(bookingOrders);
        } catch (error) {
          console.error('Error fetching restaurant orders:', error);
        } finally {
          setLoadingServices(false);
        }
      };
      fetchRestaurantOrders();
    }

    if (activeInvoice === 'roomservice' && bookingData?._id && roomServiceOrders.length === 0) {
      const fetchRoomServiceOrders = async () => {
        setLoadingServices(true);
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get('/api/room-service/all', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const orders = Array.isArray(response.data) ? response.data : (response.data.orders || []);
          const bookingOrders = orders.filter(order => 
            order.bookingId?._id === bookingData._id || order.bookingId === bookingData._id
          );
          setRoomServiceOrders(bookingOrders);
        } catch (error) {
          console.error('Error fetching room service orders:', error);
          setRoomServiceOrders([]);
        } finally {
          setLoadingServices(false);
        }
      };
      fetchRoomServiceOrders();
    }

    if (activeInvoice === 'laundry' && bookingData?._id && laundryOrders.length === 0) {
      const fetchLaundryOrdersForTab = async () => {
        setLoadingServices(true);
        try {
          const token = localStorage.getItem('token');
          // Try multiple API endpoints
          let response;
          try {
            response = await axios.get(`/api/laundry/booking/${bookingData._id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
          } catch (err) {
            response = await axios.get('/api/laundry/all', {
              headers: { Authorization: `Bearer ${token}` }
            });
          }
          
          let orders = response.data.orders || response.data || [];
          
          // Filter by booking ID
          const bookingOrders = orders.filter(order => {
            return order.bookingId?._id === bookingData._id || 
                   order.bookingId === bookingData._id ||
                   order.booking?._id === bookingData._id ||
                   order.booking === bookingData._id;
          });
          
          const filteredLaundry = bookingOrders.filter(order => {
            const isNotCancelled = order.laundryStatus !== 'cancelled' && order.laundryStatus !== 'canceled';
            return isNotCancelled;
          });

          setLaundryOrders(filteredLaundry);
        } catch (error) {
          console.error('Error fetching laundry orders:', error);
          setLaundryOrders([]);
        } finally {
          setLoadingServices(false);
        }
      };
      fetchLaundryOrdersForTab();
    }
  }, [activeInvoice, bookingData?._id]);

  // Fetch invoice data from checkout API or use restaurant order data
  const fetchInvoiceData = async (checkoutId) => {
    // Load current GST rates
    const savedRates = localStorage.getItem('defaultGstRates');
    const currentGstRates = savedRates ? JSON.parse(savedRates) : { cgstRate: 2.5, sgstRate: 2.5 };
    setGstRates(currentGstRates);
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Check if this is a restaurant order or checkout based on bookingData
      if (bookingData && (bookingData.tableNo || bookingData.staffName)) {
        // This is a restaurant order, use the data passed from navigation
        const orderData = bookingData;
        
        // Transform restaurant order data to invoice format
        const invoiceData = {
          clientDetails: {
            name: orderData.customerName || 'Guest',
            address: orderData.address || 'N/A',
            city: orderData.city || 'N/A',
            company: orderData.company || 'N/A',
            mobileNo: orderData.phoneNumber || 'N/A',
            gstin: orderData.gstin || 'N/A'
          },
          invoiceDetails: {
            billNo: await getOrGenerateInvoiceNumber(orderData._id || checkoutId, 'REST'),
            billDate: formatDate(),
            grcNo: orderData.grcNo || 'N/A',
            roomNo: `Table ${orderData.tableNo || 'N/A'}`,
            roomType: 'Restaurant',
            pax: orderData.pax || 1,
            adult: orderData.adult || 1,
            checkInDate: formatDate(),
            checkOutDate: formatDate()
          },
          items: orderData.items?.filter(item => !orderData.nonChargeable && !item.nonChargeable).map((item, index) => {
            const itemPrice = item.isFree ? 0 : (typeof item === 'object' ? (item.price || item.Price || 0) : 0);
            return {
              date: formatDate(),
              particulars: typeof item === 'string' ? item : (item.name || item.itemName || 'Unknown Item'),
              pax: 1,
              declaredRate: itemPrice,
              hsn: '996331',
              rate: 12,
              cgstRate: itemPrice * (currentGstRates.cgstRate / 100),
              sgstRate: itemPrice * (currentGstRates.sgstRate / 100),
              amount: itemPrice,
              isFree: item.isFree || false
            };
          }) || [],
          taxes: [{
            taxableAmount: orderData.nonChargeable ? 0 : (orderData.amount || orderData.totalAmount || 0),
            cgst: orderData.nonChargeable ? 0 : ((orderData.amount || orderData.totalAmount || 0) * (currentGstRates.cgstRate / 100)),
            sgst: orderData.nonChargeable ? 0 : ((orderData.amount || orderData.totalAmount || 0) * (currentGstRates.sgstRate / 100)),
            amount: orderData.nonChargeable ? 0 : (orderData.amount || orderData.totalAmount || 0)
          }],
          payment: {
            taxableAmount: orderData.nonChargeable ? 0 : (orderData.amount || orderData.totalAmount || 0),
            cgst: orderData.nonChargeable ? 0 : ((orderData.amount || orderData.totalAmount || 0) * (currentGstRates.cgstRate / 100)),
            sgst: orderData.nonChargeable ? 0 : ((orderData.amount || orderData.totalAmount || 0) * (currentGstRates.sgstRate / 100)),
            total: orderData.nonChargeable ? 0 : (orderData.amount || orderData.totalAmount || 0)
          },
          otherCharges: [
            {
              particulars: 'Service Charge',
              amount: 0
            }
          ]
        };
        
        setInvoiceData(invoiceData);
        
        // Try to load saved restaurant invoice details first
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(`/api/restaurant-invoices/${orderData._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.data.success && response.data.invoice) {
            const savedDetails = response.data.invoice.clientDetails;
            setInvoiceData(prev => ({
              ...prev,
              clientDetails: {
                ...prev.clientDetails,
                ...savedDetails
              }
            }));
          }
        } catch (error) {
          // If no saved invoice details, fetch GST details if GST number exists
          if (orderData.gstin && orderData.gstin !== 'N/A') {
            fetchGSTDetails(orderData.gstin);
          }
        }
      } else {
        // This is a checkout order, use the existing API
        const response = await axios.get(`/api/checkout/${checkoutId}/invoice`, { headers });
        
        // Use the invoice data directly from API response
        const mappedData = response.data.invoice;
        
        // Ensure invoice numbers are persistent and dates are formatted
        if (mappedData.invoiceDetails) {
          // Use existing invoice number from booking if available, otherwise generate new one
          const billNo = bookingData?.invoiceNumber || await getOrGenerateInvoiceNumber(checkoutId, 'HH');
          mappedData.invoiceDetails.billNo = billNo;
          // Keep the original GRC from booking data
          if (!mappedData.invoiceDetails.grcNo && bookingData?.grcNo) {
            mappedData.invoiceDetails.grcNo = bookingData.grcNo;
          }
          mappedData.invoiceDetails.billDate = formatDate(mappedData.invoiceDetails.billDate);
          // Handle check-in date
          if (mappedData.invoiceDetails.checkInDate && 
              mappedData.invoiceDetails.checkInDate !== 'N/A' && 
              !mappedData.invoiceDetails.checkInDate.includes('NaN')) {
            mappedData.invoiceDetails.checkInDate = formatDate(mappedData.invoiceDetails.checkInDate);
          } else if (bookingData?.checkInDate) {
            mappedData.invoiceDetails.checkInDate = formatDate(bookingData.checkInDate);
          } else {
            mappedData.invoiceDetails.checkInDate = 'N/A';
          }
          
          // Handle check-out date
          if (mappedData.invoiceDetails.checkOutDate && 
              mappedData.invoiceDetails.checkOutDate !== 'N/A' && 
              !mappedData.invoiceDetails.checkOutDate.includes('NaN')) {
            mappedData.invoiceDetails.checkOutDate = formatDate(mappedData.invoiceDetails.checkOutDate);
          } else if (bookingData?.checkOutDate) {
            mappedData.invoiceDetails.checkOutDate = formatDate(bookingData.checkOutDate);
          } else {
            mappedData.invoiceDetails.checkOutDate = 'N/A';
          }
        }
        
        // Extra bed charges are now handled in the backend checkout controller
        
        setInvoiceData(mappedData);
        
        // Update GST rates from booking data if available
        if (mappedData.cgstRate !== undefined && mappedData.sgstRate !== undefined) {
          const bookingGstRates = {
            cgstRate: mappedData.cgstRate * 100, // Convert from decimal to percentage
            sgstRate: mappedData.sgstRate * 100
          };
          setGstRates(bookingGstRates);
        }
        
        // Fetch GST details if GST number exists
        if (mappedData.clientDetails?.gstin && mappedData.clientDetails.gstin !== 'N/A') {
          fetchGSTDetails(mappedData.clientDetails.gstin);
        }
        
        // Fetch laundry orders for this booking
        fetchLaundryOrders(checkoutId);
      }
      
    } catch (error) {
      // Handle error silently
    } finally {
      // Set final GST rates
      setGstRates(currentGstRates);
      setLoading(false);
    }
  };



  const fetchLaundryOrders = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/laundry/booking/${bookingId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const laundryOrders = response.data.orders || [];
      const filteredLaundry = laundryOrders.filter(order => {
        const isNotCancelled = order.laundryStatus !== 'cancelled' && order.laundryStatus !== 'canceled';
        return isNotCancelled;
      });
      
      setLaundryOrders(filteredLaundry);
    } catch (error) {
      console.error('Error fetching laundry orders:', error);
    }
  };

  const fetchGSTDetails = async (gstNumber) => {
    if (!gstNumber || gstNumber === 'N/A' || gstNumber.trim() === '') return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/gst-numbers/details/${gstNumber}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success && response.data.gstNumber) {
        const gstDetails = response.data.gstNumber;
        setInvoiceData(prev => ({
          ...prev,
          clientDetails: {
            ...prev.clientDetails,
            name: gstDetails.name || prev.clientDetails.name,
            address: gstDetails.address || prev.clientDetails.address,
            city: gstDetails.city || prev.clientDetails.city,
            company: gstDetails.company || prev.clientDetails.company,
            mobileNo: gstDetails.mobileNumber || prev.clientDetails.mobileNo
          }
        }));
      }
    } catch (error) {
      // GST details not found, continue with manual entry
    }
  };

  const saveInvoiceUpdates = async () => {
    const { gstin, name, address, city, company, mobileNo } = invoiceData.clientDetails;
    
    if (!gstin || gstin === 'N/A' || gstin.trim() === '') {
      alert('Valid GST Number is required to save details');
      return;
    }
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      // Save GST details
      const gstData = {
        gstNumber: gstin,
        name: name || '',
        address: address || '',
        city: city || '',
        company: company || '',
        mobileNumber: mobileNo || ''
      };
      
      await axios.post('/api/gst-numbers/create', gstData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Save restaurant invoice details if this is a restaurant order
      if (bookingData && (bookingData.tableNo || bookingData.staffName)) {
        const invoiceData = {
          orderId: bookingData._id,
          clientDetails: {
            name: name || '',
            address: address || '',
            city: city || '',
            company: company || '',
            mobileNo: mobileNo || '',
            gstin: gstin
          }
        };
        
        await axios.post('/api/restaurant-invoices/save', invoiceData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setIsEditing(false);
      alert('Invoice details saved successfully!');
    } catch (error) {
      alert('Failed to save invoice details');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    // Only fetch invoice data for hotel tab
    if (activeInvoice === 'hotel' && bookingData) {
      const checkoutId = location.state?.checkoutId || bookingData._id || bookingData.id || `REST-${Date.now()}`;
      if (checkoutId) {
        fetchInvoiceData(checkoutId);
      }
    }
  }, [bookingData, location.state, activeInvoice]);

  const calculateTotal = () => {
    if (!invoiceData?.items) return '0.00';
    const subTotal = invoiceData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
    return subTotal.toFixed(2);
  };
  
  const calculateOtherChargesTotal = () => {
    if (!invoiceData?.otherCharges) return '0.00';
    const total = invoiceData.otherCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0);
    return total.toFixed(2);
  };

  const calculateRoundOff = () => {
    if (!invoiceData) return 0;
    
    // Only room charges (including extra beds) are taxable
    const roomCharges = invoiceData.items?.filter(item => 
      item.particulars && (item.particulars.includes('Room') || item.particulars.includes('ROOM') || item.particulars.includes('Extra Bed')) &&
      !item.particulars.includes('Service') && !item.particulars.includes('Restaurant') && !item.particulars.includes('DINING')
    ).reduce((sum, item) => sum + (item.isFree ? 0 : (item.amount || 0)), 0) || 0;
    
    // Apply discount only to room charges
    const discountPercent = bookingData?.discountPercent || 0;
    const discountAmount = roomCharges * (discountPercent / 100);
    const discountedRoomCharges = roomCharges - discountAmount;
    
    // Add service charges to taxable amount
    const serviceCharges = invoiceData.items?.filter(item => 
      item.particulars && (
        item.particulars.includes('IN ROOM DINING') || 
        item.particulars.includes('Room Service Charges') ||
        (item.particulars.includes('Service') && !item.particulars.includes('Laundry')) ||
        (item.particulars.includes('Restaurant') && !item.particulars.includes('Laundry')) ||
        (item.particulars.includes('DINING') && !item.particulars.includes('Laundry'))
      )
    ).reduce((sum, item) => sum + (item.isFree ? 0 : (item.amount || 0)), 0) || 0;
    
    const laundryCharges = invoiceData.items?.filter(item => 
      item.particulars && (item.particulars.includes('Laundry Services') || item.particulars.includes('LAUNDRY'))
    ).reduce((sum, item) => sum + (item.isFree ? 0 : (item.amount || 0)), 0) || 0;
    
    const totalTaxableAmount = discountedRoomCharges + serviceCharges + laundryCharges;
    
    const sgstRate = bookingData?.sgstRate !== undefined ? bookingData.sgstRate : (gstRates.sgstRate / 100);
    const cgstRate = bookingData?.cgstRate !== undefined ? bookingData.cgstRate : (gstRates.cgstRate / 100);
    const sgst = totalTaxableAmount * sgstRate;
    const cgst = totalTaxableAmount * cgstRate;
    const otherChargesTotal = invoiceData.otherCharges?.reduce((sum, charge) => {
      if (charge.particulars === 'ROOM SERVICE') return sum;
      return sum + (charge.amount || 0);
    }, 0) || 0;
    const exactTotal = totalTaxableAmount + sgst + cgst + otherChargesTotal;
    const roundedTotal = Math.round(exactTotal);
    const roundOff = (roundedTotal - exactTotal);
    return roundOff;
  };

  const calculateNetTotal = () => {
    if (!invoiceData) return '0';
    
    // Only room charges (including extra beds) are taxable
    const roomCharges = invoiceData.items?.filter(item => 
      item.particulars && (item.particulars.includes('Room') || item.particulars.includes('ROOM') || item.particulars.includes('Extra Bed')) &&
      !item.particulars.includes('Service') && !item.particulars.includes('Restaurant') && !item.particulars.includes('DINING')
    ).reduce((sum, item) => sum + (item.isFree ? 0 : (item.amount || 0)), 0) || 0;
    
    // Apply discount only to room charges
    const discountPercent = bookingData?.discountPercent || 0;
    const discountAmount = roomCharges * (discountPercent / 100);
    const discountedRoomCharges = roomCharges - discountAmount;
    
    // Add service charges to taxable amount
    const serviceCharges = invoiceData.items?.filter(item => 
      item.particulars && (
        item.particulars.includes('IN ROOM DINING') || 
        item.particulars.includes('Room Service Charges') ||
        (item.particulars.includes('Service') && !item.particulars.includes('Laundry')) ||
        (item.particulars.includes('Restaurant') && !item.particulars.includes('Laundry')) ||
        (item.particulars.includes('DINING') && !item.particulars.includes('Laundry'))
      )
    ).reduce((sum, item) => sum + (item.isFree ? 0 : (item.amount || 0)), 0) || 0;
    
    const laundryCharges = invoiceData.items?.filter(item => 
      item.particulars && (item.particulars.includes('Laundry Services') || item.particulars.includes('LAUNDRY'))
    ).reduce((sum, item) => sum + (item.isFree ? 0 : (item.amount || 0)), 0) || 0;
    
    const totalTaxableAmount = discountedRoomCharges + serviceCharges + laundryCharges;
    
    // Calculate taxes on the total taxable amount
    const sgstRate = bookingData?.sgstRate !== undefined ? bookingData.sgstRate : (gstRates.sgstRate / 100);
    const cgstRate = bookingData?.cgstRate !== undefined ? bookingData.cgstRate : (gstRates.cgstRate / 100);
    const sgst = totalTaxableAmount * sgstRate;
    const cgst = totalTaxableAmount * cgstRate;
    
    // Calculate round off
    const roundOff = calculateRoundOff();
    
    // Net total = total taxable amount + taxes + round off
    const netTotal = totalTaxableAmount + sgst + cgst + roundOff;
    
    return netTotal.toString();
  };

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice_${invoiceData?.invoiceDetails?.billNo || 'Unknown'}`,
    onBeforePrint: () => setGeneratingPdf(true),
    onAfterPrint: () => setGeneratingPdf(false)
  });

  const shareInvoicePDF = () => {
    // Try to get checkout ID from various sources
    let checkoutId = location.state?.checkoutId;
    
    // If no checkout ID, try booking ID (might need to create checkout first)
    if (!checkoutId) {
      checkoutId = bookingData?._id || bookingData?.id;
    }
    
    console.log('Sharing invoice with ID:', checkoutId);
    const sharedUrl = `${window.location.origin}/shared-invoice/${checkoutId}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(sharedUrl)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Only show loading for hotel tab
  if (activeInvoice === 'hotel') {
    if (loading) {
      return (
        <div className="min-h-screen bg-white p-2 sm:p-4 flex items-center justify-center">
          <div className="text-lg">Loading Invoice...</div>
        </div>
      );
    }

    if (!invoiceData) {
      return (
        <div className="min-h-screen bg-white p-2 sm:p-4 flex items-center justify-center">
          <div className="text-lg text-red-600">Failed to load invoice data</div>
        </div>
      );
    }
  }

  // Render different invoice components based on active selection
  const renderInvoiceContent = () => {
    if (activeInvoice === 'restaurant') {
      if (loadingServices) {
        return <div className="text-center py-8">Loading restaurant orders...</div>;
      }
      
      if (restaurantOrders.length === 0) {
        return (
          <div className="text-center py-8">
            <p className="text-lg font-bold mb-4">No Restaurant Orders</p>
            <p className="text-gray-600">No restaurant orders found for this booking.</p>
          </div>
        );
      }
      
      if (restaurantOrders.length > 0) {
        const order = restaurantOrders[0];
        return <RestaurantInvoice orderData={order} isEmbedded={true} />;
      }
      
      return (
        <div className="text-center py-8">
          <p className="text-lg font-bold mb-4">No Restaurant Orders</p>
          <p className="text-gray-600">No restaurant orders found for this booking.</p>
        </div>
      );
    }
    if (activeInvoice === 'roomservice') {
      if (loadingServices) {
        return <div className="text-center py-8">Loading room service orders...</div>;
      }
      
      if (roomServiceOrders.length === 0) {
        return (
          <div className="text-center py-8">
            <p className="text-lg font-bold mb-4">No Room Service Orders</p>
            <p className="text-gray-600">No room service orders found for this booking.</p>
          </div>
        );
      }
      
      if (roomServiceOrders.length > 0) {
        const order = roomServiceOrders[0];
        console.log('Room service order:', order);
        console.log('Room service items:', order.items);
        const orderDate = new Date(order.createdAt);
        const billNo = `RS-${order._id?.slice(-6) || 'adf49c'}`;
        const grcNo = order.grcNo || bookingData?.grcNo || 'GRC0001';
        const customerName = order.guestName || order.customerName || bookingData?.name || 'Guest';
        const roomNumber = order.roomNumber || order.roomNo || (bookingData?.roomGuestDetails?.[0]?.roomNumber ? `Room ${bookingData.roomGuestDetails[0].roomNumber}` : 'Room 201');
        const subtotal = order.items?.reduce((sum, item) => sum + (item.totalPrice || 0), 0) || 0;
        
        return (
          <div className="py-4">
            {/* Customer Details Section */}
            <div className="client-details-grid grid grid-cols-1 lg:grid-cols-2 text-xs border border-black mb-4">
              <div className="client-details-left border-r border-black p-2">
                <div className="client-info-grid grid grid-cols-3 gap-x-1 gap-y-1">
                  <p className="col-span-1">Name</p>
                  <p className="col-span-2">: {customerName}</p>
                  <p className="col-span-1">Bill No. & Date</p>
                  <p className="col-span-2">: {billNo} {orderDate.toLocaleDateString('en-GB')}</p>
                  <p className="col-span-1">GRC No.</p>
                  <p className="col-span-2">: {grcNo}</p>
                  <p className="col-span-1">Room</p>
                  <p className="col-span-2">: {roomNumber}</p>
                  <p className="col-span-1">Order Date</p>
                  <p className="col-span-2">: {orderDate.toLocaleDateString('en-GB')}</p>
                  <p className="col-span-1">Order Time</p>
                  <p className="col-span-2">: {orderDate.toLocaleTimeString('en-US', { hour12: true })}</p>
                </div>
              </div>
              <div className="client-details-right p-2">
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-4 overflow-x-auto">
              <table className="w-full text-xs border-collapse border border-black">
                <thead>
                  <tr className="border border-black bg-gray-200">
                    <th className="p-2 border border-black">S.No</th>
                    <th className="p-2 border border-black">Item Name</th>
                    <th className="p-2 border border-black">Qty</th>
                    <th className="p-2 border border-black">Rate</th>
                    <th className="p-2 border border-black">HSN/SAC</th>
                    <th className="p-2 border border-black">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item, index) => (
                    <tr key={index} className="border border-black">
                      <td className="p-2 border border-black text-center">{index + 1}</td>
                      <td className="p-2 border border-black">{item.itemName || item.name}</td>
                      <td className="p-2 border border-black text-center">{item.quantity}</td>
                      <td className="p-2 border border-black text-right">₹{(item.unitPrice || 0).toFixed(2)}</td>
                      <td className="p-2 border border-black text-center">996332</td>
                      <td className="p-2 border border-black text-right">₹{(item.totalPrice || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="border border-black bg-gray-100">
                    <td colSpan="5" className="p-2 text-right font-bold border border-black">SUB TOTAL :</td>
                    <td className="p-2 text-right border border-black font-bold">₹{subtotal.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Net Amount Summary */}
            <div className="mb-4 flex justify-end">
              <div className="w-full lg:w-1/2">
                <p className="font-bold mb-1">Net Amount Summary</p>
                <table className="w-full border-collapse border border-black">
                  <tbody>
                    <tr>
                      <td className="p-1 text-right text-xs font-medium">Subtotal:</td>
                      <td className="p-1 border-l border-black text-right text-xs">₹{subtotal.toFixed(2)}</td>
                    </tr>
                    <tr className="bg-gray-200">
                      <td className="p-1 font-bold text-right text-xs">NET AMOUNT:</td>
                      <td className="p-1 border-l border-black text-right font-bold text-xs">₹{subtotal.toFixed(2)}</td>
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
        <div className="text-center py-8">
          <p className="text-lg font-bold mb-4">No Room Service Orders</p>
          <p className="text-gray-600">No room service orders found for this booking.</p>
        </div>
      );
    }
    if (activeInvoice === 'laundry') {
      if (loadingServices) {
        return <div className="text-center py-8">Loading laundry orders...</div>;
      }
      
      if (laundryOrders.length === 0) {
        return (
          <div className="text-center py-8">
            <p className="text-lg font-bold mb-4">No Laundry Orders</p>
            <p className="text-gray-600">No laundry orders found for this booking.</p>
          </div>
        );
      }
      
      if (laundryOrders.length > 0) {
        // Combine all laundry orders into one invoice
        const combinedOrder = {
          ...laundryOrders[0],
          items: laundryOrders.flatMap(order => order.items || []),
          totalAmount: laundryOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
        };
        return <LaundryInvoice orderData={combinedOrder} isEmbedded={true} />;
      }
    }
    // Default hotel invoice content
    return (
      <>
        <div className="client-details-grid grid grid-cols-1 lg:grid-cols-2 text-xs border border-black mb-2">
          <div className="client-details-left border-r border-black p-2">
            {(bookingData?.companyGSTIN && bookingData.companyGSTIN.trim() !== '') && (
              <p><span className="font-bold">GSTIN No. : </span>
                {bookingData.companyGSTIN}
              </p>
            )}
            <div className="client-info-grid grid grid-cols-3 gap-x-1 gap-y-1">
              <p className="col-span-1">Name</p>
              <p className="col-span-2">: {bookingData?.name || invoiceData.clientDetails?.name}</p>
              <p className="col-span-1">Address</p>
              <p className="col-span-2">: {bookingData?.address || invoiceData.clientDetails?.address}</p>
              <p className="col-span-1">City</p>
              <p className="col-span-2">: {bookingData?.city || invoiceData.clientDetails?.city}</p>
              {(bookingData?.companyName && bookingData.companyName.trim() !== '') && (
                <>
                  <p className="col-span-1">Company</p>
                  <p className="col-span-2">: {bookingData.companyName}</p>
                </>
              )}
              <p className="col-span-1">Mobile No.</p>
              <p className="col-span-2">: {bookingData?.mobileNo || invoiceData.clientDetails?.mobileNo}</p>
            </div>
          </div>

          <div className="client-details-right p-2">
            <div className="invoice-info-grid grid grid-cols-2 gap-y-1">
              <p className="font-bold">Invoice No. & Date</p>
              <p className="font-medium">: {invoiceData.invoiceDetails?.billNo} {invoiceData.invoiceDetails?.billDate}</p>
              <p className="font-bold">GRC No.</p>
              <p className="font-medium">: {invoiceData.invoiceDetails?.grcNo}</p>
              <p className="font-bold">Room No.</p>
              <p className="font-medium">: {bookingData?.roomNumber || invoiceData.invoiceDetails?.roomNo}</p>
              <p className="font-bold">Room Type</p>
              <p className="font-medium">: {invoiceData.invoiceDetails?.roomType}</p>
              {showPaxDetails && (
                <>
                  <p className="font-bold">PAX</p>
                  <p className="font-medium">
                    {bookingData?.roomGuestDetails && bookingData.roomGuestDetails.length > 0 ? (
                      <>
                        : {bookingData.roomGuestDetails.reduce((sum, room) => sum + room.adults + room.children, 0)} Adult: {bookingData.roomGuestDetails.reduce((sum, room) => sum + room.adults, 0)} Children: {bookingData.roomGuestDetails.reduce((sum, room) => sum + room.children, 0)}
                      </>
                    ) : (
                      `: ${invoiceData.invoiceDetails?.pax} Adult: ${invoiceData.invoiceDetails?.adult}`
                    )}
                  </p>
                </>
              )}

              <p className="font-bold">CheckIn Date</p>
              <p className="font-medium">: {bookingData?.checkInDate ? formatDate(bookingData.checkInDate) : (invoiceData.invoiceDetails?.checkInDate && invoiceData.invoiceDetails.checkInDate !== 'N/A' ? invoiceData.invoiceDetails.checkInDate : formatDate())}</p>
              <p className="font-bold">CheckOut Date</p>
              <p className="font-medium">: {bookingData?.checkOutDate ? formatDate(bookingData.checkOutDate) : (invoiceData.invoiceDetails?.checkOutDate && invoiceData.invoiceDetails.checkOutDate !== 'N/A' ? invoiceData.invoiceDetails.checkOutDate : formatDate())}</p>
              {bookingData?.planPackage && (
                <>
                  <p className="font-bold">Package Plan</p>
                  <p className="font-medium">: {(() => {
                    const planMap = {
                      'EP': 'EP – Room Only',
                      'CP': 'CP – Room + Breakfast',
                      'MAP': 'MAP – Room + Breakfast + Lunch/Dinner',
                      'AP': 'AP – Room + All Meals',
                      'AI': 'AI – All Inclusive'
                    };
                    return planMap[bookingData.planPackage] || bookingData.planPackage;
                  })()}</p>
                </>
              )}
              {bookingData?.amendmentHistory && bookingData.amendmentHistory.length > 0 && (
                <>
                  <p className="font-bold">Amended</p>
                  <p className="font-medium">: {bookingData.amendmentHistory.length} time(s)</p>
                </>
              )}
              {bookingData?.advancePayments && bookingData.advancePayments.length > 0 && (
                <>
                  <p className="font-bold">Total Advance Paid</p>
                  <p className="font-medium">: ₹{bookingData.advancePayments.reduce((sum, payment) => sum + (payment.amount || 0), 0).toFixed(2)}</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mb-4 overflow-x-auto">
          <table className="items-table w-full text-xs border-collapse">
            <thead>
              <tr className="border border-black bg-gray-200">
                <th className="p-1 border border-black whitespace-nowrap">Date</th>
                <th className="p-1 border border-black whitespace-nowrap">Particulars</th>
                <th className="p-1 border border-black text-right whitespace-nowrap">Declared Rate</th>
                <th className="p-1 border border-black text-center whitespace-nowrap">HSN/SAC Code</th>
                <th className="p-1 border border-black text-right whitespace-nowrap">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.items?.map((item, index) => (
                <tr key={index} className="border border-black">
                  <td className="p-1 border border-black">{typeof item === 'object' ? (item.date || 'N/A') : 'N/A'}</td>
                  <td className="p-1 border border-black">{typeof item === 'object' ? (item.particulars || 'N/A') : String(item)}</td>
                  <td className="p-1 border border-black text-right">
                    {item.isFree ? (
                      <div>
                        <span className="line-through text-gray-400">₹{typeof item === 'object' ? (item.declaredRate?.toFixed(2) || '0.00') : '0.00'}</span>
                        <div className="text-green-600 font-bold text-xs">FREE</div>
                      </div>
                    ) : (
                      <span>₹{typeof item === 'object' ? (item.declaredRate?.toFixed(2) || '0.00') : '0.00'}</span>
                    )}
                  </td>
                  <td className="p-1 border border-black text-center">{(() => {
                    if (typeof item === 'object' && item.particulars) {
                      const particulars = item.particulars.toLowerCase();
                      if (particulars.includes('room') && !particulars.includes('service') && !particulars.includes('dining')) return '996311';
                      if (particulars.includes('room service') || particulars.includes('dining') || particulars.includes('restaurant')) return '996332';
                      if (particulars.includes('banquet') || particulars.includes('hall')) return '996334';
                      if (particulars.includes('mini bar') || particulars.includes('minibar')) return '996331';
                      if (particulars.includes('laundry') || particulars.includes('laundary')) return '996337';
                      return item.hsn || '996311';
                    }
                    return 'N/A';
                  })()}</td>
                  <td className="p-1 border border-black text-right font-bold">
                    {item.isFree ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      <span>₹{typeof item === 'object' ? (item.amount?.toFixed(2) || '0.00') : '0.00'}</span>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="border border-black bg-gray-100">
                <td colSpan="2" className="p-1 text-right font-bold border border-black">SUB TOTAL :</td>
                <td className="p-1 text-right border border-black font-bold">₹{(() => {
                  if (!invoiceData?.items) return '0.00';
                  const declaredRateTotal = invoiceData.items.reduce((sum, item) => {
                    return sum + (item.isFree ? 0 : (item.declaredRate || 0));
                  }, 0);
                  return declaredRateTotal.toFixed(2);
                })()}</td>
                <td className="p-1 border border-black font-bold"></td>
                <td className="p-1 text-right border border-black font-bold">₹{calculateTotal()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-2">
          <div className="flex flex-col lg:flex-row lg:justify-between text-xs space-y-4 lg:space-y-0">
            <div className="w-full lg:w-3/5 lg:pr-2">
              <p className="font-bold mb-1">Tax Before</p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[400px] text-xs border-collapse border border-black">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="p-0.5 border border-black text-xs whitespace-nowrap">Tax%</th>
                      <th className="p-0.5 border border-black text-xs whitespace-nowrap">Txb.Amt</th>
                      <th className="p-0.5 border border-black text-xs whitespace-nowrap">PayType</th>
                      <th className="p-0.5 border border-black text-xs whitespace-nowrap">Rec.Amt</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-0.5 border border-black text-center text-xs">{bookingData?.cgstRate !== undefined && bookingData?.sgstRate !== undefined ? ((bookingData.cgstRate + bookingData.sgstRate) * 100).toFixed(1) : (gstRates.cgstRate + gstRates.sgstRate).toFixed(1)}</td>
                      <td className="p-0.5 border border-black text-right text-xs">{(() => {
                        if (!invoiceData?.items) return '0.00';
                        const taxableAmount = invoiceData.items.reduce((sum, item) => {
                          return sum + (item.isFree ? 0 : (item.amount || 0));
                        }, 0);
                        return taxableAmount.toFixed(2);
                      })()}</td>
                      <td className="p-0.5 border border-black text-center text-xs">{bookingData?.paymentMode || ''}</td>
                      <td className="p-0.5 border border-black text-right text-xs">{(() => {
                        const totalAdvance = bookingData?.advancePayments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
                        return totalAdvance.toFixed(2);
                      })()}</td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="p-0.5 border border-black font-bold text-right text-xs">Total</td>
                      <td className="p-0.5 border border-black text-right font-bold text-xs">{(() => {
                        const taxableAmount = invoiceData?.items?.reduce((sum, item) => sum + (item.isFree ? 0 : (item.amount || 0)), 0) || 0;
                        const totalAdvance = bookingData?.advancePayments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
                        const balanceAmount = taxableAmount - totalAdvance;
                        return balanceAmount.toFixed(2);
                      })()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="w-full lg:w-2/5 lg:pl-2">
              <div className="mb-2">
                <p className="font-bold mb-1">Net Amount Summary</p>
                <table className="w-full border-collapse border border-black">
                  <tbody>
                    <tr>
                      <td className="p-0.5 text-right text-xs font-medium">Room Amount:</td>
                      <td className="p-0.5 border-l border-black text-right text-xs">₹{(() => {
                        if (!invoiceData?.items) return '0.00';
                        const roomCharges = invoiceData.items.filter(item => 
                          item.particulars && (item.particulars.includes('Room') || item.particulars.includes('ROOM') || item.particulars.includes('Extra Bed')) &&
                          !item.particulars.includes('Service') && !item.particulars.includes('Restaurant') && !item.particulars.includes('DINING')
                        ).reduce((sum, item) => sum + (item.isFree ? 0 : (item.amount || 0)), 0);
                        return roomCharges.toFixed(2);
                      })()}</td>
                    </tr>
                    {(() => {
                      const discountPercent = bookingData?.discountPercent || 0;
                      if (discountPercent > 0) {
                        const roomCharges = invoiceData?.items?.filter(item => 
                          item.particulars && (item.particulars.includes('Room') || item.particulars.includes('ROOM') || item.particulars.includes('Extra Bed'))
                        ).reduce((sum, item) => sum + (item.isFree ? 0 : (item.amount || 0)), 0) || 0;
                        const discountAmount = roomCharges * (discountPercent / 100);
                        return (
                          <tr>
                            <td className="p-0.5 text-right text-xs font-medium">Discount ({discountPercent}%) - Room Only:</td>
                            <td className="p-0.5 border-l border-black text-right text-xs">-₹{discountAmount.toFixed(2)}</td>
                          </tr>
                        );
                      }
                      return null;
                    })()}
                    <tr>
                      <td className="p-0.5 text-right text-xs font-medium">Room After Discount:</td>
                      <td className="p-0.5 border-l border-black text-right text-xs">₹{(() => {
                        if (!invoiceData?.items) return '0.00';
                        const roomCharges = invoiceData.items.filter(item => 
                          item.particulars && (item.particulars.includes('Room') || item.particulars.includes('ROOM') || item.particulars.includes('Extra Bed')) &&
                          !item.particulars.includes('Service') && !item.particulars.includes('Restaurant') && !item.particulars.includes('DINING')
                        ).reduce((sum, item) => sum + (item.isFree ? 0 : (item.amount || 0)), 0);
                        const discountPercent = bookingData?.discountPercent || 0;
                        const discountAmount = roomCharges * (discountPercent / 100);
                        return (roomCharges - discountAmount).toFixed(2);
                      })()}</td>
                    </tr>
                    {(() => {
                      const serviceCharges = invoiceData?.items?.filter(item => 
                        item.particulars && (
                          item.particulars.includes('IN ROOM DINING') || 
                          item.particulars.includes('Room Service Charges') ||
                          (item.particulars.includes('Service') && !item.particulars.includes('Laundry')) ||
                          (item.particulars.includes('Restaurant') && !item.particulars.includes('Laundry')) ||
                          (item.particulars.includes('DINING') && !item.particulars.includes('Laundry'))
                        )
                      ).reduce((sum, item) => sum + (item.isFree ? 0 : (item.amount || 0)), 0) || 0;
                      if (serviceCharges > 0) {
                        return (
                          <tr>
                            <td className="p-0.5 text-right text-xs font-medium">Room Service & Restaurant:</td>
                            <td className="p-0.5 border-l border-black text-right text-xs">₹{serviceCharges.toFixed(2)}</td>
                          </tr>
                        );
                      }
                      return null;
                    })()}
                    {(() => {
                      const laundryCharges = invoiceData?.items?.filter(item => 
                        item.particulars && (item.particulars.includes('Laundry Services') || item.particulars.includes('LAUNDRY'))
                      ).reduce((sum, item) => sum + (item.isFree ? 0 : (item.amount || 0)), 0) || 0;
                      if (laundryCharges > 0) {
                        return (
                          <tr>
                            <td className="p-0.5 text-right text-xs font-medium">Laundry Services:</td>
                            <td className="p-0.5 border-l border-black text-right text-xs">₹{laundryCharges.toFixed(2)}</td>
                          </tr>
                        );
                      }
                      return null;
                    })()}

                    <tr>
                      <td className="p-0.5 text-right text-xs font-medium">Total Taxable Amount:</td>
                      <td className="p-0.5 border-l border-black text-right text-xs">₹{(() => {
                        if (!invoiceData?.items) return '0.00';
                        const roomCharges = invoiceData.items.filter(item => 
                          item.particulars && (item.particulars.includes('Room') || item.particulars.includes('ROOM') || item.particulars.includes('Extra Bed')) &&
                          !item.particulars.includes('Service') && !item.particulars.includes('Restaurant') && !item.particulars.includes('DINING')
                        ).reduce((sum, item) => sum + (item.isFree ? 0 : (item.amount || 0)), 0);
                        const serviceCharges = invoiceData.items.filter(item => 
                          item.particulars && (
                            item.particulars.includes('IN ROOM DINING') || 
                            item.particulars.includes('Room Service Charges') ||
                            (item.particulars.includes('Service') && !item.particulars.includes('Laundry')) ||
                            (item.particulars.includes('Restaurant') && !item.particulars.includes('Laundry')) ||
                            (item.particulars.includes('DINING') && !item.particulars.includes('Laundry'))
                          )
                        ).reduce((sum, item) => sum + (item.isFree ? 0 : (item.amount || 0)), 0);
                        const laundryCharges = invoiceData.items.filter(item => 
                          item.particulars && (item.particulars.includes('Laundry Services') || item.particulars.includes('LAUNDRY'))
                        ).reduce((sum, item) => sum + (item.isFree ? 0 : (item.amount || 0)), 0);
                        const discountPercent = bookingData?.discountPercent || 0;
                        const discountAmount = roomCharges * (discountPercent / 100);
                        const discountedRoomCharges = roomCharges - discountAmount;
                        return (discountedRoomCharges + serviceCharges + laundryCharges).toFixed(2);
                      })()}</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 text-right text-xs font-medium">SGST ({bookingData?.sgstRate !== undefined ? (bookingData.sgstRate * 100).toFixed(1) : gstRates.sgstRate}%):</td>
                      <td className="p-0.5 border-l border-black text-right text-xs">₹{(() => {
                        if (!invoiceData?.items) return '0.00';
                        const roomCharges = invoiceData.items.filter(item => 
                          item.particulars && (item.particulars.includes('Room') || item.particulars.includes('ROOM') || item.particulars.includes('Extra Bed')) &&
                          !item.particulars.includes('Service') && !item.particulars.includes('Restaurant') && !item.particulars.includes('DINING')
                        ).reduce((sum, item) => sum + (item.isFree ? 0 : (item.amount || 0)), 0);
                        const serviceCharges = invoiceData.items.filter(item => 
                          item.particulars && (
                            item.particulars.includes('IN ROOM DINING') || 
                            item.particulars.includes('Room Service Charges') ||
                            (item.particulars.includes('Service') && !item.particulars.includes('Laundry')) ||
                            (item.particulars.includes('Restaurant') && !item.particulars.includes('Laundry')) ||
                            (item.particulars.includes('DINING') && !item.particulars.includes('Laundry'))
                          )
                        ).reduce((sum, item) => sum + (item.isFree ? 0 : (item.amount || 0)), 0);
                        const laundryCharges = invoiceData.items.filter(item => 
                          item.particulars && (item.particulars.includes('Laundry Services') || item.particulars.includes('LAUNDRY'))
                        ).reduce((sum, item) => sum + (item.isFree ? 0 : (item.amount || 0)), 0);
                        const discountPercent = bookingData?.discountPercent || 0;
                        const discountAmount = roomCharges * (discountPercent / 100);
                        const discountedRoomCharges = roomCharges - discountAmount;
                        const totalTaxableAmount = discountedRoomCharges + serviceCharges + laundryCharges;
                        const sgstRate = bookingData?.sgstRate !== undefined ? bookingData.sgstRate : (gstRates.sgstRate / 100);
                        return (totalTaxableAmount * sgstRate).toFixed(2);
                      })()}</td>
                    </tr>
                    <tr>
                      <td className="p-0.5 text-right text-xs font-medium">CGST ({bookingData?.cgstRate !== undefined ? (bookingData.cgstRate * 100).toFixed(1) : gstRates.cgstRate}%):</td>
                      <td className="p-0.5 border-l border-black text-right text-xs">₹{(() => {
                        if (!invoiceData?.items) return '0.00';
                        const roomCharges = invoiceData.items.filter(item => 
                          item.particulars && (item.particulars.includes('Room') || item.particulars.includes('ROOM') || item.particulars.includes('Extra Bed')) &&
                          !item.particulars.includes('Service') && !item.particulars.includes('Restaurant') && !item.particulars.includes('DINING')
                        ).reduce((sum, item) => sum + (item.isFree ? 0 : (item.amount || 0)), 0);
                        const serviceCharges = invoiceData.items.filter(item => 
                          item.particulars && (
                            item.particulars.includes('IN ROOM DINING') || 
                            item.particulars.includes('Room Service Charges') ||
                            (item.particulars.includes('Service') && !item.particulars.includes('Laundry')) ||
                            (item.particulars.includes('Restaurant') && !item.particulars.includes('Laundry')) ||
                            (item.particulars.includes('DINING') && !item.particulars.includes('Laundry'))
                          )
                        ).reduce((sum, item) => sum + (item.isFree ? 0 : (item.amount || 0)), 0);
                        const laundryCharges = invoiceData.items.filter(item => 
                          item.particulars && (item.particulars.includes('Laundry Services') || item.particulars.includes('LAUNDRY'))
                        ).reduce((sum, item) => sum + (item.isFree ? 0 : (item.amount || 0)), 0);
                        const discountPercent = bookingData?.discountPercent || 0;
                        const discountAmount = roomCharges * (discountPercent / 100);
                        const discountedRoomCharges = roomCharges - discountAmount;
                        const totalTaxableAmount = discountedRoomCharges + serviceCharges + laundryCharges;
                        const cgstRate = bookingData?.cgstRate !== undefined ? bookingData.cgstRate : (gstRates.cgstRate / 100);
                        return (totalTaxableAmount * cgstRate).toFixed(2);
                      })()}</td>
                    </tr>


                    
                    {/* Room service charges are already included in taxable amount, no need to show separately */}
                    <tr>
                      <td className="p-0.5 text-right text-xs font-medium">Round Off:</td>
                      <td className="p-0.5 border-l border-black text-right text-xs">{calculateRoundOff() >= 0 ? '+' : ''}{calculateRoundOff().toFixed(2)}</td>
                    </tr>
                    <tr className="bg-gray-200">
                      <td className="p-0.5 font-bold text-right text-xs">NET AMOUNT:</td>
                      <td className="p-0.5 border-l border-black text-right font-bold text-xs">₹{calculateNetTotal()}</td>
                    </tr>
                    {bookingData?.advancePayments && bookingData.advancePayments.length > 0 && (
                      <tr>
                        <td className="p-0.5 text-right text-xs font-medium">Advance Payment:</td>
                        <td className="p-0.5 border-l border-black text-right text-xs">-₹{bookingData.advancePayments.reduce((sum, payment) => sum + (payment.amount || 0), 0).toFixed(2)}</td>
                      </tr>
                    )}
                    <tr className="bg-yellow-100">
                      <td className="p-0.5 font-bold text-right text-xs">GRAND TOTAL:</td>
                      <td className="p-0.5 border-l border-black text-right font-bold text-xs">₹{(() => {
                        const netTotal = parseFloat(calculateNetTotal());
                        const totalAdvance = bookingData?.advancePayments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
                        return (netTotal - totalAdvance).toString();
                      })()}</td>
                    </tr>

                  </tbody>
                </table>
              </div>
              

            </div>
          </div>
        </div>
        
        {/* Amendment History */}
        {bookingData?.amendmentHistory && bookingData.amendmentHistory.length > 0 && (
          <div className="mb-4 text-xs">
            <p className="font-bold mb-2">Amendment History:</p>
            <div className="border border-black">
              <table className="w-full">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="p-1 border border-black text-xs">Date</th>
                    <th className="p-1 border border-black text-xs">Original Dates</th>
                    <th className="p-1 border border-black text-xs">New Dates</th>
                    <th className="p-1 border border-black text-xs">Adjustment</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingData.amendmentHistory.map((amendment, index) => (
                    <tr key={index}>
                      <td className="p-1 border border-black text-xs">
                        {new Date(amendment.amendedOn).toLocaleDateString()}
                      </td>
                      <td className="p-1 border border-black text-xs">
                        {new Date(amendment.originalCheckIn).toLocaleDateString()} - {new Date(amendment.originalCheckOut).toLocaleDateString()}
                      </td>
                      <td className="p-1 border border-black text-xs">
                        {new Date(amendment.newCheckIn).toLocaleDateString()} - {new Date(amendment.newCheckOut).toLocaleDateString()}
                      </td>
                      <td className="p-1 border border-black text-xs text-right">
                        ₹{amendment.totalAdjustment?.toFixed(2) || '0.00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Laundry Orders Details */}
        {laundryOrders.length > 0 && (
          <div className="mb-4 text-xs">
            <p className="font-bold mb-2">Laundry Orders ({laundryOrders.length} order(s)):</p>
            <div className="border border-black">
              <table className="w-full">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="p-1 border border-black text-xs">#</th>
                    <th className="p-1 border border-black text-xs">Date</th>
                    <th className="p-1 border border-black text-xs">Items</th>
                    <th className="p-1 border border-black text-xs">Status</th>
                    <th className="p-1 border border-black text-xs">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {laundryOrders.map((order, index) => (
                    <tr key={order._id || index}>
                      <td className="p-1 border border-black text-xs text-center">{index + 1}</td>
                      <td className="p-1 border border-black text-xs text-center">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="p-1 border border-black text-xs">
                        {order.items?.map((item, itemIndex) => (
                          <div key={itemIndex} className="text-xs">
                            {item.itemName} x{item.quantity}
                            {item.nonChargeable && <span className="text-green-600 ml-1">(NC)</span>}
                            {item.status === 'lost' && <span className="text-orange-600 ml-1">(LOST)</span>}
                          </div>
                        ))}
                      </td>
                      <td className="p-1 border border-black text-xs text-center">{order.laundryStatus}</td>
                      <td className="p-1 border border-black text-xs text-right font-bold">
                        ₹{order.items?.filter(item => !item.nonChargeable && item.status !== 'lost')
                          .reduce((sum, item) => sum + (item.calculatedAmount || 0), 0)?.toFixed(2) || '0.00'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-200">
                    <td colSpan="4" className="p-1 border border-black font-bold text-xs text-right">Total Laundry:</td>
                    <td className="p-1 border border-black text-xs text-right font-bold">
                      ₹{laundryOrders.reduce((sum, order) => {
                        return sum + (order.items?.filter(item => !item.nonChargeable && item.status !== 'lost')
                          .reduce((itemSum, item) => itemSum + (item.calculatedAmount || 0), 0) || 0);
                      }, 0).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Multiple Advance Payments Details */}
        {bookingData?.advancePayments && bookingData.advancePayments.length > 0 && (
          <div className="mb-4 text-xs">
            <p className="font-bold mb-2">Advance Payment Details ({bookingData.advancePayments.length} payment(s)):</p>
            <div className="border border-black">
              <table className="w-full">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="p-1 border border-black text-xs">#</th>
                    <th className="p-1 border border-black text-xs">Amount</th>
                    <th className="p-1 border border-black text-xs">Mode</th>
                    <th className="p-1 border border-black text-xs">Date</th>
                    <th className="p-1 border border-black text-xs">Reference</th>
                    <th className="p-1 border border-black text-xs">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingData.advancePayments.map((payment, index) => (
                    <tr key={index}>
                      <td className="p-1 border border-black text-xs text-center">{index + 1}</td>
                      <td className="p-1 border border-black text-xs text-right font-bold">₹{payment.amount.toFixed(2)}</td>
                      <td className="p-1 border border-black text-xs text-center">{payment.paymentMode}</td>
                      <td className="p-1 border border-black text-xs text-center">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                      <td className="p-1 border border-black text-xs text-center">{payment.reference || '-'}</td>
                      <td className="p-1 border border-black text-xs">{payment.notes || '-'}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-200">
                    <td colSpan="1" className="p-1 border border-black font-bold text-xs text-right">Total:</td>
                    <td className="p-1 border border-black text-xs text-right font-bold">₹{bookingData.advancePayments.reduce((sum, payment) => sum + (payment.amount || 0), 0).toFixed(2)}</td>
                    <td colSpan="4" className="p-1 border border-black text-xs"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Discount Information */}
        {bookingData?.discountPercent > 0 && (
          <div className="mb-4 text-xs">
            <p className="font-bold mb-2">Discount Information:</p>
            <div className="border border-black">
              <table className="w-full">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="p-1 border border-black text-xs">Discount %</th>
                    <th className="p-1 border border-black text-xs">Notes/Reason</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-1 border border-black text-xs text-center font-bold">{bookingData.discountPercent}%</td>
                    <td className="p-1 border border-black text-xs">{bookingData.discountNotes || 'No notes provided'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

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
              <p>I AGREE THAT I AM RESPONSIBLE FOR THE FULL PAYMENT OF THIS BILL IN</p>
              <p>THE EVENTS, IF IT IS NOT PAID (BY THE COMPANY/ORGANISATION OR</p>
              <p>PERSON INDICATED)</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 mt-4 gap-2 sm:gap-0">
            <div className="text-left font-bold">FRONT OFFICE MANAGER</div>
            <div className="text-center font-bold">CASHIER</div>
            <div className="text-right font-bold">Guest Sign.</div>
            <div className="text-left text-xs">Subject to GORAKHPUR Jurisdiction only.</div>
            <div className="text-center text-xs">E. & O.E.</div>
            <div></div>
          </div>
          <p className="mt-4 text-center text-lg font-bold">Thank You, Visit Again</p>
        </div>
      </>
    );
  };

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
            margin: 0.2in; 
            size: A4;
          }
          body { margin: 0; padding: 0; background: white !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          table { border-collapse: collapse !important; }
          table, th, td { border: 1px solid black !important; }
          .client-details-grid { display: grid !important; grid-template-columns: 1fr 1fr !important; }
          .client-details-left { border-right: 1px solid black !important; }
          .client-info-grid { display: grid !important; grid-template-columns: auto auto 1fr !important; }
          .invoice-info-grid { display: grid !important; grid-template-columns: auto 1fr !important; }
          .overflow-x-auto { overflow: visible !important; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          .items-table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 12px !important;
          }
          .items-table th, .items-table td {
            border: 1px solid black !important;
            padding: 6px !important;
            font-size: 12px !important;
          }
          .contact-info {
            position: absolute !important;
            top: 10px !important;
            right: 10px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-end !important;
            font-size: 10px !important;
          }
        }
      `}</style>
      <div className="min-h-screen bg-white p-2 sm:p-4">
        <div ref={invoiceRef} className="max-w-7xl mx-auto border-2 border-black p-2 sm:p-4 print-content relative" style={{
          backgroundImage: `url(${ashokaLogo})`,
          backgroundSize: '40%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}>
          <div className="absolute inset-0 bg-white/80 pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-4 space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24">
                  <img src={ashokaLogo} alt="Havana Logo" className="w-full h-full object-contain" />
                </div>
                <div className="text-xs text-center sm:text-left">
                  <p className="font-bold text-sm sm:text-base">HOTEL HAVANA </p>
                  <p className="text-xs">Deoria Bypass Rd, near LIC Office Gorakhpur</p>
                  <p className="text-xs">Taramandal, Gorakhpur, Uttar Pradesh 273016</p>
                  <p className="text-xs">Website: <a href="https://hotelhavana.com" className="text-blue-600">hotelhavana.com</a></p>
                  <p className="text-xs">contact@hotelhavana.in</p>
                  <p className="text-xs font-semibold">GSTIN: 09ACIFA2416J1ZF</p>
                </div>
              </div>
              <div className="contact-info flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="text-xs flex items-center space-x-2">
                    <RiPhoneFill className="text-lg text-yellow-600" />
                    <span>+91-9451903390</span>
                </div>
                <div className="text-xs flex items-center space-x-2">
                    <RiMailFill className="text-lg text-yellow-600" />
                    <span>contact@hotelhavana.in</span>
                </div>
              </div>
            </div>

            <div className="mb-4 no-print">
              <div className="flex justify-between items-center mb-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveInvoice('hotel')}
                    className={`px-3 py-2 rounded text-sm ${activeInvoice === 'hotel' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    Hotel Invoice
                  </button>
                  <button
                    onClick={() => setActiveInvoice('roomservice')}
                    className={`px-3 py-2 rounded text-sm ${activeInvoice === 'roomservice' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    Room Service
                  </button>
                  <button
                    onClick={() => setActiveInvoice('restaurant')}
                    className={`px-3 py-2 rounded text-sm ${activeInvoice === 'restaurant' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    Restaurant
                  </button>
                  <button
                    onClick={() => setActiveInvoice('laundry')}
                    className={`px-3 py-2 rounded text-sm ${activeInvoice === 'laundry' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    Laundry
                  </button>
                </div>
                <div className="flex gap-2">
                  <BackButton to="/booking" />
                  {activeInvoice === 'hotel' && (
                    <button
                      onClick={() => setShowPaxDetails(!showPaxDetails)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      {showPaxDetails ? 'Hide PAX' : 'Show PAX'}
                    </button>
                  )}
                  <button
                    onClick={shareInvoicePDF}
                    disabled={generatingPdf}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    <FaWhatsapp className="text-lg" />
                    Share on WhatsApp
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    Print
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-2">
              <div className="text-center font-bold text-lg flex-1">
                {activeInvoice === 'hotel' && 'TAX INVOICE'}
                {activeInvoice === 'roomservice' && 'ROOM SERVICE INVOICE'}
                {activeInvoice === 'restaurant' && 'RESTAURANT INVOICE'}
                {activeInvoice === 'laundry' && 'LAUNDRY INVOICE'}
              </div>
            </div>

            {renderInvoiceContent()}
          </div>
        </div>
      </div>
    </>
  );
}