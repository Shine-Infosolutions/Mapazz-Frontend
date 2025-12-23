import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CreateLaundryOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [laundryItems, setLaundryItems] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [formData, setFormData] = useState({
    orderType: 'room_laundry',
    grcNo: '',
    invoiceNumber: '',
    bookingId: '',
    roomNumber: '',
    requestedByName: '',
    serviceType: 'inhouse',
    vendorId: '',
    items: []
  });

  useEffect(() => {
    fetchLaundryItems();
    fetchVendors();
    fetchBookings();
    
    // Auto-fill form if coming from EditBookingForm
    const preSelectedBooking = location.state?.preSelectedBooking;
    if (preSelectedBooking) {
      setFormData(prev => ({
        ...prev,
        bookingId: preSelectedBooking._id,
        grcNo: preSelectedBooking.grcNo || '',
        invoiceNumber: preSelectedBooking.invoiceNumber || '',
        roomNumber: preSelectedBooking.roomNumber || '',
        requestedByName: preSelectedBooking.name || ''
      }));
    }
  }, [location.state]);

  const fetchLaundryItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/laundry-items/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setLaundryItems(data.success ? data.laundryItems : []);
    } catch (error) {
      setLaundryItems([]);
    }
  };

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/vendors/active`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setVendors(data.vendors || []);
    } catch (error) {
      setVendors([]);
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/bookings/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      const allBookings = Array.isArray(data) ? data : (data.bookings || []);
      // Filter for checked-in bookings
      const checkedInBookings = allBookings.filter(booking => 
        booking.status === 'Checked In' || 
        booking.status === 'checked_in' ||
        booking.status === 'CheckedIn'
      );
      setBookings(checkedInBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { rateId: '', quantity: 1, serviceType: '' }]
    });
  };

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const updateItem = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;
    setFormData({ ...formData, items: updatedItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = { ...formData };
      
      // Remove vendorId if empty or serviceType is inhouse
      if (!payload.vendorId || payload.serviceType === 'inhouse') {
        delete payload.vendorId;
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/laundry/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success('Order created successfully');
        navigate('/laundry/orders');
      } else {
        toast.error('Failed to create order');
      }
    } catch (error) {
      toast.error('Failed to create order');
    }
  };

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Create Laundry Order</h1>
        <button onClick={() => navigate('/laundry/orders')} className="text-gray-600 hover:text-gray-800">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Order Type *</label>
              <select value={formData.orderType} onChange={(e) => setFormData({...formData, orderType: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required>
                <option value="room_laundry">Room Laundry</option>
                <option value="hotel_laundry">Hotel Laundry</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Booking (Checked-in only)</label>
              <select value={formData.bookingId} onChange={(e) => {
                const selectedBooking = bookings.find(b => b._id === e.target.value);
                if (selectedBooking) {
                  setFormData({
                    ...formData, 
                    bookingId: e.target.value, 
                    grcNo: selectedBooking.grcNo || '',
                    invoiceNumber: selectedBooking.invoiceNumber || '',
                    roomNumber: selectedBooking.roomNumber || '',
                    requestedByName: selectedBooking.guestName || selectedBooking.name || ''
                  });
                } else {
                  setFormData({...formData, bookingId: e.target.value});
                }
              }} className="w-full px-3 py-2 border rounded-lg">
                <option value="">Select Booking</option>
                {bookings.map(b => <option key={b._id} value={b._id}>{b.grcNo} - {b.guestName || b.name} (Room: {b.roomNumber})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">GRC No</label>
              <input type="text" value={formData.grcNo} onChange={(e) => setFormData({...formData, grcNo: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Invoice Number</label>
              <input type="text" value={formData.invoiceNumber} onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Room Number *</label>
              <input type="text" value={formData.roomNumber} onChange={(e) => setFormData({...formData, roomNumber: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Guest Name</label>
              <input type="text" value={formData.requestedByName} onChange={(e) => setFormData({...formData, requestedByName: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Service Type *</label>
              <select value={formData.serviceType} onChange={(e) => setFormData({...formData, serviceType: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required>
                <option value="inhouse">In-House</option>
                <option value="vendor">Vendor</option>
              </select>
            </div>
            {formData.serviceType === 'vendor' && (
              <div>
                <label className="block text-sm font-medium mb-1">Vendor *</label>
                <select value={formData.vendorId} onChange={(e) => setFormData({...formData, vendorId: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required>
                  <option value="">Select Vendor</option>
                  {vendors.map(v => <option key={v._id} value={v._id}>{v.vendorName}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Items</h2>
            <button type="button" onClick={addItem} className="text-white px-3 py-1 rounded text-sm" style={{background: 'linear-gradient(to bottom, hsl(45, 43%, 58%), hsl(45, 32%, 46%))'}}>
              <Plus size={16} className="inline mr-1" /> Add Item
            </button>
          </div>
          <div className="space-y-3">
            {formData.items.map((item, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium mb-1">Item *</label>
                    <select value={item.rateId} onChange={(e) => updateItem(index, 'rateId', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" required>
                      <option value="">Select Item</option>
                      {laundryItems.map(li => <option key={li._id} value={li._id}>{li.itemName} - ₹{li.rate}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Service Type *</label>
                    <input type="text" value={item.serviceType} onChange={(e) => updateItem(index, 'serviceType', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Wash, Iron" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantity *</label>
                    <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" required />
                  </div>
                  <div className="flex items-end">
                    <button type="button" onClick={() => removeItem(index)} className="w-full px-3 py-2 text-red-600 border border-red-600 rounded-lg text-sm">
                      <Trash2 size={16} className="inline" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>



        {/* Submit */}
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/laundry/orders')} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
          <button type="submit" className="flex-1 px-4 py-2 text-white rounded-lg" style={{background: 'linear-gradient(to bottom, hsl(45, 43%, 58%), hsl(45, 32%, 46%))'}}>Create Order</button>
        </div>
      </form>
    </div>
  );
};

export default CreateLaundryOrder;
