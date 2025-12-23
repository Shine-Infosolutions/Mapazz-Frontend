import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../utils/toaster';
import RoomServiceOrders from './RoomServiceOrders';
import RestaurantOrders from './RestaurantOrders';
import BackButton from '../common/BackButton';
import {
  FaUser,
  FaPhone,
  FaCity,
  FaMapMarkedAlt,
  FaBuilding,
  FaGlobe,
  FaRegAddressCard,
  FaMobileAlt,
  FaEnvelope,
  FaMoneyCheckAlt,
  FaCalendarAlt,
  FaClock,
  FaDoorOpen,
  FaUsers,
  FaConciergeBell,
  FaInfoCircle,
  FaSuitcase,
  FaComments,
  FaFileInvoiceDollar,
  FaCheckCircle,
  FaSignInAlt,
  FaPassport,
  FaIdCard,
  FaCreditCard,
  FaCashRegister,
  FaAddressBook,
  FaRegListAlt,
  FaRegUser,
  FaRegCalendarPlus,
  FaRegCheckCircle,
  FaRegTimesCircle,
  FaRegUserCircle,
  FaRegCreditCard,
  FaRegStar,
  FaRegFlag,
  FaRegEdit,
  FaRegClone,
  FaRegCommentDots,
  FaRegFileAlt,
  FaRegCalendarCheck,
  FaRegCalendarTimes,
  FaRegMap,
  FaHotel,
  FaTimes,
} from "react-icons/fa";

// Apply golden theme
const themeStyles = `
  :root {
    --color-primary: hsl(45, 70%, 50%);
    --color-secondary: hsl(45, 71%, 69%);
    --color-accent: hsl(45, 100%, 80%);
    --color-background: hsl(45, 100%, 95%);
    --color-text: hsl(45, 100%, 20%);
    --color-border: hsl(45, 100%, 85%);
    --color-hover: hsl(45, 80%, 40%);
  }
`;

// Inject theme styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = themeStyles;
  document.head.appendChild(styleElement);
}

// Shadcn-like components
const Button = ({
  children,
  onClick,
  className = "",
  disabled,
  type = "button",
  variant = "default",
}) => {
  const baseClasses =
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2";
  const variants = {
    default: "bg-[hsl(45,43%,58%)] text-white border border-[hsl(45,43%,58%)] shadow hover:bg-[hsl(45,32%,46%)]",
    outline:
      "border border-[hsl(45,100%,85%)] bg-transparent hover:bg-[hsl(45,100%,95%)] hover:text-[hsl(45,100%,20%)]",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({
  type,
  placeholder,
  value,
  onChange,
  className = "",
  ...props
}) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value || ""}
    onChange={onChange}
    className={`flex h-9 w-full rounded-md border border-gray-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 min-w-0 ${className}`}
    {...props}
  />
);

const Label = ({ children, htmlFor, className = "" }) => (
  <label
    htmlFor={htmlFor}
    className={`block text-sm font-medium text-gray-700 ${className}`}
  >
    {children}
  </label>
);

const Select = ({
  value,
  onChange,
  children,
  className = "",
  name,
  ...props
}) => (
  <select
    value={value}
    onChange={onChange}
    name={name}
    className={`flex h-9 w-full items-center justify-between rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 truncate ${className}`}
    {...props}
  >
    {children}
  </select>
);

const Checkbox = ({ id, checked, onChange, className = "" }) => (
  <input
    type="checkbox"
    id={id}
    checked={checked}
    onChange={onChange}
    className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${className}`}
  />
);

const EditBookingForm = () => {
  const { axios } = useAppContext();
  const { hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const [editBooking, setEditBooking] = useState(location.state?.editBooking || null);

  const [allCategories, setAllCategories] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [hasCheckedAvailability, setHasCheckedAvailability] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAmendModal, setShowAmendModal] = useState(false);
  const [amendmentData, setAmendmentData] = useState({
    newCheckOutDate: '',
    reason: ''
  });
  const [amendingStay, setAmendingStay] = useState(false);
  const [showCompanyDetails, setShowCompanyDetails] = useState(false);
  const [roomServiceOrders, setRoomServiceOrders] = useState([]);
  const [restaurantOrders, setRestaurantOrders] = useState([]);
  const [laundryOrders, setLaundryOrders] = useState([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [formInitialized, setFormInitialized] = useState(false);


  const [formData, setFormData] = useState({
    grcNo: '',
    invoiceNumber: '',
    reservationId: '',
    categoryId: '',
    bookingDate: new Date().toISOString().split('T')[0],
    numberOfRooms: 1,
    isActive: true,
    checkInDate: '',
    checkOutDate: '',
    days: 0,
    timeIn: '12:00',
    timeOut: '12:00',
    salutation: 'mr.',
    name: '',
    age: '',
    gender: '',
    address: '',
    city: '',
    nationality: '',
    mobileNo: '',
    email: '',
    phoneNo: '',
    birthDate: '',
    anniversary: '',
    companyName: '',
    companyGSTIN: '',
    idProofType: '',
    idProofNumber: '',
    idProofImageUrl: '',
    idProofImageUrl2: '',
    photoUrl: '',
    roomNumber: '',
    planPackage: '',
    noOfAdults: 1,
    noOfChildren: 0,
    roomGuestDetails: [],
    rate: 0,
    cgstRate: 0,
    sgstRate: 0,
    taxIncluded: false,
    serviceCharge: false,
    arrivedFrom: '',
    destination: '',
    remark: '',
    businessSource: '',
    marketSegment: '',
    purposeOfVisit: '',
    discountPercent: 0,
    discountRoomSource: 0,
    discountNotes: '',
    nonChargeable: false,
    paymentMode: '',
    paymentStatus: false,
    transactionId: '',
    bookingRefNo: '',
    mgmtBlock: 'No',
    billingInstruction: '',
    temperature: '',
    fromCSV: false,
    epabx: false,
    vip: false,
    status: 'Booked',
    advancePayments: [],
    totalAdvanceAmount: 0,
    balanceAmount: 0
  });

  useEffect(() => {
    if (!editBooking) {
      navigate('/booking');
    }
  }, [editBooking, navigate]);

  useEffect(() => {
    if (editBooking && !formInitialized) {
      // Extract category ID properly
      const categoryId = typeof editBooking.categoryId === 'object' 
        ? editBooking.categoryId._id || editBooking.categoryId.id
        : editBooking.categoryId;
      
      // Initialize selectedRooms with existing booked rooms
      if (editBooking.roomNumber) {
        const existingRoomNumbers = editBooking.roomNumber.split(',').map(num => num.trim());
        // Create mock room objects for existing rooms
        const existingRooms = existingRoomNumbers.map(roomNum => ({
          _id: `existing_${roomNum}`,
          room_number: roomNum,
          title: 'Existing Room',
          price: 0, // Will be updated when real rooms are loaded
          category: { _id: categoryId }
        }));
        setSelectedRooms(existingRooms);
      }
      
      // Set company details visibility
      if (editBooking.companyName || editBooking.companyGSTIN) {
        setShowCompanyDetails(true);
      }
      
      setFormData({
        grcNo: editBooking.grcNo || '',
        invoiceNumber: editBooking.invoiceNumber || '',
        reservationId: editBooking.reservationId || '',
        categoryId: categoryId || '',
        bookingDate: editBooking.bookingDate ? new Date(editBooking.bookingDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        numberOfRooms: editBooking.numberOfRooms || 1,
        isActive: editBooking.isActive !== undefined ? editBooking.isActive : true,
        checkInDate: editBooking.checkInDate ? new Date(editBooking.checkInDate).toISOString().split('T')[0] : '',
        checkOutDate: editBooking.checkOutDate ? new Date(editBooking.checkOutDate).toISOString().split('T')[0] : '',
        days: editBooking.days || 0,
        timeIn: editBooking.timeIn || '12:00',
        timeOut: editBooking.timeOut || '12:00',
        salutation: editBooking.salutation || 'mr.',
        name: editBooking.name || '',
        age: editBooking.age || '',
        gender: editBooking.gender || '',
        address: editBooking.address || '',
        city: editBooking.city || '',
        nationality: editBooking.nationality || '',
        mobileNo: editBooking.mobileNo || '',
        email: editBooking.email || '',
        phoneNo: editBooking.phoneNo || '',
        birthDate: editBooking.birthDate ? new Date(editBooking.birthDate).toISOString().split('T')[0] : '',
        anniversary: editBooking.anniversary ? new Date(editBooking.anniversary).toISOString().split('T')[0] : '',
        companyName: editBooking.companyName || '',
        companyGSTIN: editBooking.companyGSTIN || '',
        idProofType: editBooking.idProofType || '',
        idProofNumber: editBooking.idProofNumber || '',
        idProofImageUrl: editBooking.idProofImageUrl || '',
        idProofImageUrl2: editBooking.idProofImageUrl2 || '',
        photoUrl: editBooking.photoUrl || '',
        roomNumber: editBooking.roomNumber || '',
        planPackage: editBooking.planPackage || '',
        noOfAdults: editBooking.noOfAdults || 1,
        noOfChildren: editBooking.noOfChildren || 0,
        roomGuestDetails: editBooking.roomGuestDetails || [],
        extraBedCharge: editBooking.extraBedCharge || 500,
        rate: editBooking.taxableAmount || editBooking.rate || 0,
        cgstRate: editBooking.cgstRate !== undefined ? (editBooking.cgstRate * 100) : 0,
        sgstRate: editBooking.sgstRate !== undefined ? (editBooking.sgstRate * 100) : 0,
        taxIncluded: editBooking.taxIncluded || false,
        serviceCharge: editBooking.serviceCharge || false,
        arrivedFrom: editBooking.arrivedFrom || '',
        destination: editBooking.destination || '',
        remark: editBooking.remark || '',
        businessSource: editBooking.businessSource || '',
        marketSegment: editBooking.marketSegment || '',
        purposeOfVisit: editBooking.purposeOfVisit || '',
        discountPercent: editBooking.discountPercent || 0,
        discountRoomSource: editBooking.discountRoomSource || 0,
        discountNotes: editBooking.discountNotes || '',
        nonChargeable: editBooking.nonChargeable || false,
        paymentMode: editBooking.paymentMode || '',
        paymentStatus: editBooking.paymentStatus || false,
        transactionId: editBooking.transactionId || '',
        bookingRefNo: editBooking.bookingRefNo || '',
        mgmtBlock: editBooking.mgmtBlock || 'No',
        billingInstruction: editBooking.billingInstruction || '',
        temperature: editBooking.temperature || '',
        fromCSV: editBooking.fromCSV || false,
        epabx: editBooking.epabx || false,
        vip: editBooking.vip || false,
        status: editBooking.status || 'Booked',
        advancePayments: editBooking.advancePayments || [],
        totalAdvanceAmount: editBooking.totalAdvanceAmount || 0,
        balanceAmount: editBooking.balanceAmount || 0
      });
      setFormInitialized(true);
    }
  }, [editBooking, navigate, formInitialized]);

  const fetchAllData = async () => {
    try {
      const [catRes, roomRes] = await Promise.all([
        axios.get('/api/categories/all'),
        axios.get('/api/rooms/all'),
      ]);

      const categories = Array.isArray(catRes.data) ? catRes.data : [];
      const rooms = Array.isArray(roomRes.data) ? roomRes.data : [];

      setAllRooms(rooms);
      
      const categoriesWithCounts = categories.map(category => ({
        ...category,
        totalRooms: rooms.filter(room => {
          return room.category?._id === category._id;
        }).length,
        availableRoomsCount: 0,
      }));
      setAllCategories(categoriesWithCounts);

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleCheckAvailability = async () => {
    if (!formData.checkInDate || !formData.checkOutDate) {
      showToast.error('Please select both check-in and check-out dates.');
      return;
    }
    setLoading(true);
    setHasCheckedAvailability(true);
    try {
      const [availabilityResponse, allRoomsResponse] = await Promise.all([
        axios.get(`/api/rooms/available?checkInDate=${formData.checkInDate}&checkOutDate=${formData.checkOutDate}`),
        axios.get('/api/rooms/all')
      ]);
      
      const availableCategoriesData = availabilityResponse.data.availableRooms || [];
      const allRoomsData = allRoomsResponse.data || [];

      const trulyAvailableRooms = [];
      availableCategoriesData.forEach(cat => {
        if (cat.rooms && Array.isArray(cat.rooms)) {
          cat.rooms.forEach(room => {
            trulyAvailableRooms.push({
              ...room,
              category: { _id: cat.category, name: cat.categoryName },
              categoryId: cat.category
            });
          });
        }
      });

      const categoryRoomCounts = {};
      availableCategoriesData.forEach(cat => {
        categoryRoomCounts[cat.category] = cat.rooms ? cat.rooms.length : 0;
      });

      const updatedCategories = allCategories.map(cat => ({
        ...cat,
        availableRoomsCount: categoryRoomCounts[cat._id] || 0
      }));
      setAllCategories(updatedCategories);

      setAllRooms(trulyAvailableRooms);

      if (trulyAvailableRooms.length === 0) {
        showToast.error('No rooms available for the selected dates.');
      } else {
        showToast.success(`Found ${trulyAvailableRooms.length} available rooms.`);
      }

    } catch (error) {
      console.error('Availability check error:', error);
      showToast.error(`Failed to check availability: ${error.message}`);
      setAllRooms([]);
      const resetCategories = allCategories.map(cat => ({ ...cat, availableRoomsCount: 0 }));
      setAllCategories(resetCategories);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryCardClick = (categoryId) => {
    setFormData(prev => ({ ...prev, categoryId }));
    setSelectedRooms([]);
  };

  const handleRoomSelection = (room) => {
    setSelectedRooms((prev) => {
      const isSelected = prev.some((r) => r._id === room._id);
      let newSelectedRooms;
      if (isSelected) {
        newSelectedRooms = prev.filter((r) => r._id !== room._id);
      } else {
        newSelectedRooms = [...prev, room];
      }
      
      const totalRoomRate = newSelectedRooms.reduce((sum, selectedRoom) => {
        const rate = selectedRoom.customPrice !== undefined && selectedRoom.customPrice !== '' 
          ? Number(selectedRoom.customPrice) 
          : (selectedRoom.price || 0);
        return sum + rate;
      }, 0);
      
      const days = formData.days || 1;
      const roomRate = totalRoomRate * days;
      
      // Add extra bed charges if applicable
      const extraBedCharge = formData.extraBed ? Number(formData.extraBedCharge || 0) : 0;
      const subtotal = roomRate + extraBedCharge;
      
      // Apply discount to get the final taxable amount
      const discountAmount = subtotal * (Number(formData.discountPercent || 0) / 100);
      const finalTaxableAmount = subtotal - discountAmount;
      
      setFormData(prevForm => ({
        ...prevForm,
        rate: finalTaxableAmount, // Store taxable amount in rate field
        roomNumber: newSelectedRooms.map(r => r.room_number).join(','),
        numberOfRooms: newSelectedRooms.length
      }));
      
      return newSelectedRooms;
    });
  };

  const handleRoomGuestChange = (roomNumber, field, value) => {
    setFormData(prev => {
      const updatedRoomGuestDetails = prev.roomGuestDetails.map(room => 
        room.roomNumber === roomNumber 
          ? { ...room, [field]: Math.max(0, parseInt(value) || 0) }
          : room
      );
      
      // Recalculate totals
      const totalAdults = updatedRoomGuestDetails.reduce((sum, room) => sum + room.adults, 0);
      const totalChildren = updatedRoomGuestDetails.reduce((sum, room) => sum + room.children, 0);
      
      return {
        ...prev,
        roomGuestDetails: updatedRoomGuestDetails,
        noOfAdults: totalAdults,
        noOfChildren: totalChildren
      };
    });
  };

  const roomsForSelectedCategory = allRooms.filter(room => {
    if (!formData.categoryId) return false;
    const roomCategoryId = room.category?._id || room.categoryId;
    const categoryMatch = roomCategoryId === formData.categoryId;
    const isAvailable = room.status === 'available';
    const notReserved = !room.is_reserved;
    return categoryMatch && isAvailable && notReserved;
  });

  const getCategoryName = (categoryId) => {
    const category = allCategories.find(cat => cat._id === categoryId);
    return category && category.name ? category.name : 'Unknown Category';
  };

  useEffect(() => {
    if (editBooking) {
      fetchAllData();
      fetchRoomServiceOrders();
    }
  }, [editBooking]);







  const fetchRoomServiceOrders = async () => {
    if (!editBooking?._id) return;
    
    try {
      const token = localStorage.getItem('token');
      
      // Fetch room service orders by booking ID
      const roomServiceResponse = await axios.get('/api/room-service/all', {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { bookingId: editBooking._id }
      });
      
      // Fetch restaurant orders by booking ID and booking number
      const restaurantResponse = await axios.get('/api/restaurant-orders/all', {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { 
          bookingId: editBooking._id,
          bookingNumber: editBooking.grcNo
        }
      });
      
      const roomServiceData = roomServiceResponse.data.orders || [];
      const restaurantData = restaurantResponse.data || [];
      
      // Filter out cancelled room service orders for edit booking form
      const filteredRoomService = roomServiceData.filter(order => 
        order.status !== 'cancelled' && order.status !== 'canceled'
      );
      
      // Filter restaurant orders by booking ID, booking number, or room number
      const roomNumbers = editBooking.roomNumber ? editBooking.roomNumber.split(',').map(num => num.trim()) : [];
      const filteredRestaurant = restaurantData.filter(order => {
        // Match only by booking ID or booking number
        const matchesBookingId = (order.bookingId && order.bookingId._id === editBooking._id) || order.bookingId === editBooking._id;
        const matchesBookingNumber = order.bookingNumber === editBooking.grcNo;
        
        const isForThisBooking = matchesBookingId || matchesBookingNumber;
        const isNotCancelled = order.status !== 'cancelled' && order.status !== 'canceled';
        
        return isForThisBooking && isNotCancelled;
      });
      
      // Fetch laundry orders by room number and GRC
      const laundryResponse = await axios.get('/api/laundry/all', {
        headers: { 'Authorization': `Bearer ${token}` },
        params: {
          search: editBooking.roomNumber || editBooking.grcNo
        }
      });
      
      // Filter laundry orders by room number or GRC
      const allLaundryOrders = laundryResponse.data.orders || laundryResponse.data || [];
      const filteredLaundry = allLaundryOrders.filter(order => {
        const matchesRoom = roomNumbers.some(roomNum => order.roomNumber === roomNum);
        const matchesGRC = order.grcNo === editBooking.grcNo;
        const matchesBooking = order.bookingId === editBooking._id;
        const isNotCancelled = order.laundryStatus !== 'cancelled' && order.laundryStatus !== 'canceled';
        
        return (matchesRoom || matchesGRC || matchesBooking) && isNotCancelled;
      });
      
      setRoomServiceOrders(filteredRoomService);
      setRestaurantOrders(filteredRestaurant);
      setLaundryOrders(filteredLaundry);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  // Update selectedRooms with real room data when allRooms is loaded
  useEffect(() => {
    if (allRooms.length > 0 && editBooking?.roomNumber && formInitialized) {
      const existingRoomNumbers = editBooking.roomNumber.split(',').map(num => num.trim());
      const realSelectedRooms = allRooms.filter(room => 
        existingRoomNumbers.includes(room.room_number.toString())
      );
      if (realSelectedRooms.length > 0) {
        setSelectedRooms(realSelectedRooms);
        
        // Initialize room guest details if not already present
        if (!formData.roomGuestDetails || formData.roomGuestDetails.length === 0) {
          const roomGuestDetails = existingRoomNumbers.map(roomNum => ({
            roomNumber: roomNum,
            adults: 1,
            children: 0
          }));
          
          setFormData(prev => ({
            ...prev,
            roomGuestDetails: roomGuestDetails,
            noOfAdults: roomGuestDetails.reduce((sum, room) => sum + room.adults, 0),
            noOfChildren: roomGuestDetails.reduce((sum, room) => sum + room.children, 0)
          }));
        }
        
        // Set custom prices and extra bed info from booking data
        const updatedRooms = realSelectedRooms.map(room => {
          let roomData = { ...room };
          
          // Set custom price from roomRates if available
          if (editBooking?.roomRates && Array.isArray(editBooking.roomRates)) {
            const roomRate = editBooking.roomRates.find(r => 
              r.roomNumber === room.room_number.toString() || 
              r.roomNumber === room.room_number
            );
            if (roomRate) {
              roomData.customPrice = roomRate.customRate;
              roomData.extraBed = Boolean(roomRate.extraBed);
              roomData.extraBedStartDate = roomRate.extraBed && roomRate.extraBedStartDate ? new Date(roomRate.extraBedStartDate).toISOString().split('T')[0] : '';
            }
          }
          
          // Always check extraBedRooms array as primary source
          if (editBooking?.extraBedRooms && Array.isArray(editBooking.extraBedRooms)) {
            const isInExtraBedRooms = editBooking.extraBedRooms.includes(room.room_number.toString()) || 
                                     editBooking.extraBedRooms.includes(room.room_number);
            if (isInExtraBedRooms && !roomData.extraBedStartDate) {
              roomData.extraBed = true;
              roomData.extraBedStartDate = '';
            }
          }
          
          // Default to false if still undefined
          if (roomData.extraBed === undefined) {
            roomData.extraBed = false;
          }
          
          return roomData;
        });
        
        console.log('Updated rooms with extra bed info:', updatedRooms);
        setSelectedRooms(updatedRooms);
      }
    }
  }, [allRooms, editBooking]);

  useEffect(() => {
    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);

    if (!isNaN(checkIn.getTime()) && !isNaN(checkOut.getTime()) && checkOut > checkIn) {
      const diffTime = Math.abs(checkOut - checkIn);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      setFormData(prev => ({ 
        ...prev, 
        days: diffDays
      }));
    } else {
      setFormData(prev => ({ ...prev, days: 0 }));
    }
  }, [formData.checkInDate, formData.checkOutDate]);

  // Recalculate rate when extra bed changes
  useEffect(() => {
    if (selectedRooms.length > 0 && formData.days > 0) {
      // If non-chargeable, set rate to 0
      if (formData.nonChargeable) {
        setFormData(prev => ({ 
          ...prev, 
          rate: 0
        }));
        return;
      }
      
      const totalRoomRate = selectedRooms.reduce((sum, room) => {
        const rate = room.customPrice !== undefined && room.customPrice !== '' && room.customPrice !== null
          ? Number(room.customPrice) 
          : (room.price || 0);
        return sum + rate;
      }, 0);
      
      const roomRate = totalRoomRate * formData.days;
      const extraBedCharge = selectedRooms.reduce((sum, room) => {
        if (!room.extraBed) return sum;
        
        // Calculate extra bed days properly
        const startDate = new Date(room.extraBedStartDate || new Date().toISOString().split('T')[0]);
        const endDate = new Date(formData.checkOutDate);
        
        // If start date is same or after checkout, no extra bed charge
        if (startDate >= endDate) return sum;
        
        const timeDiff = endDate.getTime() - startDate.getTime();
        const extraBedDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        
        return sum + ((formData.extraBedCharge || 0) * Math.max(0, extraBedDays));
      }, 0);
      const roomSubtotal = roomRate + extraBedCharge;
      
      // Store the room subtotal (before discount) in rate field
      setFormData(prev => ({ 
        ...prev, 
        rate: roomSubtotal
      }));
    }
  }, [selectedRooms.map(r => `${r.customPrice}-${r.extraBed}-${r.extraBedStartDate}`).join(','), formData.days, formData.extraBedCharge, formData.checkInDate, formData.checkOutDate, formData.nonChargeable, formData.discountPercent]);

  // Recalculate rate when discount changes
  useEffect(() => {
    if (selectedRooms.length > 0 && formData.days > 0) {
      const totalRoomRate = selectedRooms.reduce((sum, room) => {
        const rate = room.customPrice !== undefined && room.customPrice !== '' && room.customPrice !== null
          ? Number(room.customPrice) 
          : (room.price || 0);
        return sum + rate;
      }, 0);
      
      const roomRate = totalRoomRate * formData.days;
      const extraBedCharge = selectedRooms.reduce((sum, room) => {
        if (!room.extraBed) return sum;
        const startDate = new Date(room.extraBedStartDate || new Date().toISOString().split('T')[0]);
        const endDate = new Date(formData.checkOutDate);
        if (startDate >= endDate) return sum;
        const timeDiff = endDate.getTime() - startDate.getTime();
        const extraBedDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        return sum + ((formData.extraBedCharge || 0) * Math.max(0, extraBedDays));
      }, 0);
      const roomSubtotal = roomRate + extraBedCharge;
      // Store the room subtotal (before discount) in rate field
      setFormData(prev => ({ ...prev, rate: roomSubtotal }));
    }
  }, [formData.discountPercent]);

  // Recalculate totals when tax rates change
  useEffect(() => {
    if (selectedRooms.length > 0 && formData.days > 0) {
      const totalRoomRate = selectedRooms.reduce((sum, room) => {
        const rate = room.customPrice !== undefined && room.customPrice !== '' && room.customPrice !== null
          ? Number(room.customPrice) 
          : (room.price || 0);
        return sum + rate;
      }, 0);
      
      const roomRate = totalRoomRate * formData.days;
      const extraBedCharge = selectedRooms.reduce((sum, room) => {
        return sum + (room.extraBed ? (formData.extraBedCharge || 0) * formData.days : 0);
      }, 0);
      const roomSubtotal = roomRate + extraBedCharge;
      
      // Store the room subtotal (before discount) in rate field
      setFormData(prev => ({ 
        ...prev, 
        rate: roomSubtotal
      }));
    }
  }, [formData.cgstRate, formData.sgstRate, formData.discountPercent]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = async (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      
      // Convert file to base64 for storage
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [name]: reader.result }));
        showToast.success(`${name === 'idProofImageUrl' ? 'ID Proof Image 1' : 'ID Proof Image 2'} uploaded successfully`);
      };
      reader.onerror = () => {
        showToast.error('Failed to upload image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAmendStay = async () => {
    if (!amendmentData.newCheckOutDate) {
      showToast.error('Please select new check-out date');
      return;
    }

    if (new Date(formData.checkInDate) >= new Date(amendmentData.newCheckOutDate)) {
      showToast.error('Check-out date must be after original check-in date');
      return;
    }

    // Check amendment limits
    const amendmentCount = editBooking?.amendmentHistory?.length || 0;
    if (amendmentCount >= 3) {
      showToast.error('Maximum 3 amendments allowed per booking');
      return;
    }

    // Check time restriction (24 hours before checkout)
    const currentTime = new Date();
    const originalCheckOut = new Date(formData.checkOutDate);
    const timeDiffHours = (originalCheckOut - currentTime) / (1000 * 60 * 60);
    
    if (timeDiffHours < 24) {
      showToast.error('Cannot amend booking within 24 hours of checkout');
      return;
    }

    setAmendingStay(true);
    try {
      const response = await axios.post(`/api/bookings/amend/${editBooking._id}`, amendmentData);
      showToast.success('Booking stay amended successfully!');
      setShowAmendModal(false);
      
      // Update form data with new checkout date only
      const newCheckOut = new Date(amendmentData.newCheckOutDate).toISOString().split('T')[0];
      const timeDiff = new Date(newCheckOut).getTime() - new Date(formData.checkInDate).getTime();
      const newDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      setFormData(prev => ({
        ...prev,
        checkOutDate: newCheckOut,
        days: newDays,
        rate: response.data.amendment.newTotalAmount
      }));
      
    } catch (error) {
      console.error('Error amending booking:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to amend booking';
      showToast.error(errorMessage);
    } finally {
      setAmendingStay(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (loading || isNavigating || editingOrder) return; // Prevent submission while editing orders
    setLoading(true);
    
    try {
      // Calculate extra bed status
      const hasExtraBed = selectedRooms.some(room => room.extraBed);
      const totalExtraBedCharge = selectedRooms.reduce((sum, room) => {
        if (!room.extraBed) return sum;
        const startDate = new Date(room.extraBedStartDate || formData.checkInDate);
        const endDate = new Date(formData.checkOutDate);
        const days = Math.max(0, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
        return sum + ((formData.extraBedCharge || 0) * days);
      }, 0);
      
      // Calculate taxable amount and tax amounts
      const roomRate = selectedRooms.reduce((sum, room) => {
        const rate = room.customPrice !== undefined && room.customPrice !== '' && room.customPrice !== null
          ? Number(room.customPrice) 
          : (room.price || 0);
        return sum + rate;
      }, 0) * (formData.days || 1);
      
      const taxableAmount = roomRate + totalExtraBedCharge;
      const cgstAmount = taxableAmount * (formData.cgstRate / 100);
      const sgstAmount = taxableAmount * (formData.sgstRate / 100);
      const totalWithTax = taxableAmount + cgstAmount + sgstAmount;
      
      const updateData = {
        ...formData,
        cgstRate: formData.cgstRate,
        sgstRate: formData.sgstRate,
        extraBed: hasExtraBed,
        extraBedCharge: formData.extraBedCharge || 0,
        taxableAmount: taxableAmount,
        cgstAmount: cgstAmount,
        sgstAmount: sgstAmount,
        rate: totalWithTax,
        selectedRooms: selectedRooms,
        roomGuestDetails: formData.roomGuestDetails,
        roomRates: selectedRooms.map(room => ({
          roomNumber: room.room_number,
          customRate: room.customPrice !== undefined ? room.customPrice : room.price,
          extraBed: room.extraBed || false,
          extraBedStartDate: room.extraBedStartDate || null
        })),
        extraBedRooms: selectedRooms.filter(room => room.extraBed).map(room => room.room_number)
      };

      console.log('Sending update data:', updateData);
      const response = await axios.put(`/api/bookings/update/${editBooking._id}`, updateData);
      console.log('Update response:', response.data);
      showToast.success('Booking updated successfully!');
      // Navigate immediately after showing toast
      setTimeout(() => {
        navigate('/booking');
      }, 1000);
    } catch (error) {
      console.error('Error updating booking:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update booking';
      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const calculateTaxBreakdown = () => {
    const taxableAmount = Number(formData.rate) || 0; // Rate is the taxable amount
    const cgstAmount = taxableAmount * (Number(formData.cgstRate) / 100);
    const sgstAmount = taxableAmount * (Number(formData.sgstRate) / 100);
    const totalWithTax = taxableAmount + cgstAmount + sgstAmount;
    
    return { taxableAmount, cgstAmount, sgstAmount, totalWithTax };
  };

  const { taxableAmount, cgstAmount, sgstAmount, totalWithTax } = calculateTaxBreakdown();

  return (
    <div className="min-h-screen" style={{backgroundColor: 'hsl(45, 100%, 95%)'}}>
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton to="/booking" />
            <h1 className="text-2xl font-bold" style={{color: 'hsl(45, 100%, 20%)'}}>
              Edit Booking - {formData.name}
            </h1>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 space-y-8">
            <form onSubmit={(e) => {
              if (editingOrder) {
                e.preventDefault();
                return false;
              }
              handleSubmit(e);
            }} className="space-y-8" noValidate>
              {/* Guest Details Section */}
              <section className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full" style={{backgroundColor: 'hsl(45, 100%, 85%)'}}>
                    <FaUser className="text-lg" style={{color: 'hsl(45, 43%, 58%)'}} />
                  </div>
                  <h2 className="text-xl font-semibold" style={{color: 'hsl(45, 100%, 20%)'}}>
                    Guest Details
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grcNo">GRC No.</Label>
                    <Input
                      id="grcNo"
                      name="grcNo"
                      value={formData.grcNo}
                      readOnly
                      className="bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoiceNumber">Invoice No.</Label>
                    <Input
                      id="invoiceNumber"
                      name="invoiceNumber"
                      value={formData.invoiceNumber}
                      readOnly
                      className="bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salutation">Salutation</Label>
                    <Select
                      id="salutation"
                      name="salutation"
                      value={formData.salutation}
                      onChange={handleChange}
                    >
                      <option value="mr.">Mr.</option>
                      <option value="mrs.">Mrs.</option>
                      <option value="ms.">Ms.</option>
                      <option value="dr.">Dr.</option>
                      <option value="other">Other</option>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="name">
                      Guest Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      name="age"
                      type="number"
                      value={formData.age}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobileNo">Mobile No</Label>
                    <Input
                      id="mobileNo"
                      name="mobileNo"
                      type="tel"
                      value={formData.mobileNo}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNo">Whatsapp No</Label>
                    <Input
                      id="phoneNo"
                      name="phoneNo"
                      type="tel"
                      value={formData.phoneNo}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Date of Birth</Label>
                    <Input
                      id="birthDate"
                      name="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="anniversary">Anniversary Date</Label>
                    <Input
                      id="anniversary"
                      name="anniversary"
                      type="date"
                      value={formData.anniversary}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2 flex items-center gap-2 sm:col-span-2 lg:col-span-3">
                    <Checkbox
                      id="showCompanyDetails"
                      checked={showCompanyDetails}
                      onChange={(e) => {
                        setShowCompanyDetails(e.target.checked);
                        if (!e.target.checked) {
                          setFormData(prev => ({ ...prev, companyName: '', companyGSTIN: '' }));
                        }
                      }}
                    />
                    <Label htmlFor="showCompanyDetails">Company Details</Label>
                  </div>
                  {showCompanyDetails && (
                    <>
                      <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input
                          id="companyName"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="companyGSTIN">Company GSTIN</Label>
                        <Input
                          id="companyGSTIN"
                          name="companyGSTIN"
                          value={formData.companyGSTIN}
                          onChange={handleChange}
                        />
                      </div>
                    </>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="idProofType">ID Proof Type</Label>
                    <Select
                      id="idProofType"
                      name="idProofType"
                      value={formData.idProofType}
                      onChange={handleChange}
                    >
                      <option value="">Select ID Proof Type</option>
                      <option value="Aadhaar">Aadhaar</option>
                      <option value="PAN">PAN</option>
                      <option value="Voter ID">Voter ID</option>
                      <option value="Passport">Passport</option>
                      <option value="Driving License">Driving License</option>
                      <option value="Other">Other</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idProofNumber">ID Proof Number</Label>
                    <Input
                      id="idProofNumber"
                      name="idProofNumber"
                      value={formData.idProofNumber}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idProofImageUrl">ID Proof Image 1 (Optional)</Label>
                    <p className="text-xs text-gray-500">Images are optional - you can update booking without uploading ID proof images</p>
                    <div className="flex gap-2">
                      <Input 
                        id="idProofImageUrl" 
                        name="idProofImageUrl" 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          const canvas = document.createElement('canvas');
                          const video = document.createElement('video');
                          navigator.mediaDevices.getUserMedia({ video: true })
                            .then(stream => {
                              video.srcObject = stream;
                              video.play();
                              const modal = document.createElement('div');
                              modal.className = 'fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center';
                              modal.innerHTML = `
                                <div class="bg-white p-4 rounded-lg">
                                  <video autoplay style="width: 300px; height: 200px;"></video>
                                  <div class="flex gap-2 mt-2">
                                    <button class="capture-btn bg-blue-500 text-white px-4 py-2 rounded">Capture</button>
                                    <button class="close-btn bg-gray-500 text-white px-4 py-2 rounded">Close</button>
                                  </div>
                                </div>
                              `;
                              document.body.appendChild(modal);
                              const modalVideo = modal.querySelector('video');
                              modalVideo.srcObject = stream;
                              modal.querySelector('.capture-btn').onclick = () => {
                                canvas.width = modalVideo.videoWidth;
                                canvas.height = modalVideo.videoHeight;
                                canvas.getContext('2d').drawImage(modalVideo, 0, 0);
                                const imageData = canvas.toDataURL('image/jpeg');
                                setFormData(prev => ({ ...prev, idProofImageUrl: imageData }));
                                showToast.success('ID Proof Image 1 captured successfully');
                                stream.getTracks().forEach(track => track.stop());
                                document.body.removeChild(modal);
                              };
                              modal.querySelector('.close-btn').onclick = () => {
                                stream.getTracks().forEach(track => track.stop());
                                document.body.removeChild(modal);
                              };
                            })
                            .catch(() => showToast.error('Camera access denied'));
                        }}
                        className="px-3 py-1 text-sm"
                      >
                        📷
                      </Button>
                    </div>
                    {formData.idProofImageUrl && (
                      <div className="mt-2">
                        <img 
                          src={formData.idProofImageUrl} 
                          alt="ID Proof 1" 
                          className="w-20 h-20 object-cover rounded border"
                        />
                        <p className="text-xs text-green-600 mt-1">✓ Image uploaded</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idProofImageUrl2">ID Proof Image 2 (Optional)</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="idProofImageUrl2" 
                        name="idProofImageUrl2" 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          const canvas = document.createElement('canvas');
                          const video = document.createElement('video');
                          navigator.mediaDevices.getUserMedia({ video: true })
                            .then(stream => {
                              video.srcObject = stream;
                              video.play();
                              const modal = document.createElement('div');
                              modal.className = 'fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center';
                              modal.innerHTML = `
                                <div class="bg-white p-4 rounded-lg">
                                  <video autoplay style="width: 300px; height: 200px;"></video>
                                  <div class="flex gap-2 mt-2">
                                    <button class="capture-btn bg-blue-500 text-white px-4 py-2 rounded">Capture</button>
                                    <button class="close-btn bg-gray-500 text-white px-4 py-2 rounded">Close</button>
                                  </div>
                                </div>
                              `;
                              document.body.appendChild(modal);
                              const modalVideo = modal.querySelector('video');
                              modalVideo.srcObject = stream;
                              modal.querySelector('.capture-btn').onclick = () => {
                                canvas.width = modalVideo.videoWidth;
                                canvas.height = modalVideo.videoHeight;
                                canvas.getContext('2d').drawImage(modalVideo, 0, 0);
                                const imageData = canvas.toDataURL('image/jpeg');
                                setFormData(prev => ({ ...prev, idProofImageUrl2: imageData }));
                                showToast.success('ID Proof Image 2 captured successfully');
                                stream.getTracks().forEach(track => track.stop());
                                document.body.removeChild(modal);
                              };
                              modal.querySelector('.close-btn').onclick = () => {
                                stream.getTracks().forEach(track => track.stop());
                                document.body.removeChild(modal);
                              };
                            })
                            .catch(() => showToast.error('Camera access denied'));
                        }}
                        className="px-3 py-1 text-sm"
                      >
                        📷
                      </Button>
                    </div>
                    {formData.idProofImageUrl2 && (
                      <div className="mt-2">
                        <img 
                          src={formData.idProofImageUrl2} 
                          alt="ID Proof 2" 
                          className="w-20 h-20 object-cover rounded border"
                        />
                        <p className="text-xs text-green-600 mt-1">✓ Image uploaded</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input
                      id="nationality"
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2 flex items-center gap-2">
                    <Checkbox
                      id="vip"
                      checked={formData.vip}
                      onChange={(e) => setFormData(prev => ({ ...prev, vip: e.target.checked }))}
                    />
                    <Label htmlFor="vip">VIP Guest</Label>
                  </div>
                </div>
                <hr className="my-6 border-gray-200" />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700">Guest Photo Upload (Optional)</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    💡 Photo upload is completely optional. You can update booking without uploading any images.
                  </p>
                  
                  {/* Photo Upload Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                          <Label htmlFor="photoUpload">Upload Photo from Device (Optional)</Label>
                          <div className="flex gap-2">
                            <Input 
                                id="photoUpload" 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            setFormData(prev => ({ ...prev, photoUrl: reader.result }));
                                            showToast.success('Photo uploaded successfully');
                                        };
                                        reader.onerror = () => {
                                            showToast.error('Failed to upload image');
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                                className="flex-1"
                            />
                            <Button
                              type="button"
                              onClick={() => {
                                const canvas = document.createElement('canvas');
                                const video = document.createElement('video');
                                navigator.mediaDevices.getUserMedia({ video: true })
                                  .then(stream => {
                                    video.srcObject = stream;
                                    video.play();
                                    const modal = document.createElement('div');
                                    modal.className = 'fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center';
                                    modal.innerHTML = `
                                      <div class="bg-white p-4 rounded-lg">
                                        <video autoplay style="width: 300px; height: 200px;"></video>
                                        <div class="flex gap-2 mt-2">
                                          <button class="capture-btn bg-blue-500 text-white px-4 py-2 rounded">Capture</button>
                                          <button class="close-btn bg-gray-500 text-white px-4 py-2 rounded">Close</button>
                                        </div>
                                      </div>
                                    `;
                                    document.body.appendChild(modal);
                                    const modalVideo = modal.querySelector('video');
                                    modalVideo.srcObject = stream;
                                    modal.querySelector('.capture-btn').onclick = () => {
                                      canvas.width = modalVideo.videoWidth;
                                      canvas.height = modalVideo.videoHeight;
                                      canvas.getContext('2d').drawImage(modalVideo, 0, 0);
                                      const imageData = canvas.toDataURL('image/jpeg');
                                      setFormData(prev => ({ ...prev, photoUrl: imageData }));
                                      showToast.success('Guest photo captured successfully');
                                      stream.getTracks().forEach(track => track.stop());
                                      document.body.removeChild(modal);
                                    };
                                    modal.querySelector('.close-btn').onclick = () => {
                                      stream.getTracks().forEach(track => track.stop());
                                      document.body.removeChild(modal);
                                    };
                                  })
                                  .catch(() => showToast.error('Camera access denied'));
                              }}
                              className="px-3 py-1 text-sm"
                            >
                              📷
                            </Button>
                          </div>
                          {formData.photoUrl && (
                            <div className="mt-2">
                              <img 
                                src={formData.photoUrl} 
                                alt="Guest Photo" 
                                className="w-20 h-20 object-cover rounded border"
                              />
                              <p className="text-xs text-green-600 mt-1">✓ Photo uploaded</p>
                            </div>
                          )}
                      </div>
                  </div>
                </div>
              </section>

              {/* Room & Availability Section */}
              <section className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full" style={{backgroundColor: 'hsl(45, 100%, 85%)'}}>
                    <FaHotel className="text-lg" style={{color: 'hsl(45, 43%, 58%)'}} />
                  </div>
                  <h2 className="text-xl font-semibold" style={{color: 'hsl(45, 100%, 20%)'}}>
                    Room & Availability
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="checkInDate">Check-in Date</Label>
                    <Input
                      id="checkInDate"
                      name="checkInDate"
                      type="date"
                      value={formData.checkInDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkOutDate">Check-out Date</Label>
                    <Input
                      id="checkOutDate"
                      name="checkOutDate"
                      type="date"
                      value={formData.checkOutDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="flex items-end md:col-span-2">
                    <Button
                      type="button"
                      onClick={handleCheckAvailability}
                      disabled={!formData.checkInDate || !formData.checkOutDate || new Date(formData.checkInDate) >= new Date(formData.checkOutDate)}
                    >
                      Check Availability
                    </Button>
                  </div>
                </div>

                {hasCheckedAvailability && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2 text-gray-700">Room Categories</h3>
                    {allCategories.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full rounded-xl shadow-sm" style={{ backgroundColor: 'hsl(45, 100%, 95%)', border: '1px solid hsl(45, 100%, 85%)' }}>
                          <thead style={{ backgroundColor: 'hsl(45, 100%, 90%)' }}>
                            <tr>
                              <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(45, 100%, 20%)' }}>Category Name</th>
                              <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(45, 100%, 20%)' }}>Availability</th>
                              <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(45, 100%, 20%)' }}>Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y" style={{ borderColor: 'hsl(45, 100%, 90%)' }}>
                            {allCategories.map(cat => (
                              <tr key={cat._id} className={`${formData.categoryId === cat._id ? 'bg-blue-50' : 'hover:bg-gray-50'} ${cat.availableRoomsCount === 0 ? 'opacity-50' : ''}`}>
                                <td className="py-4 px-6 text-sm font-medium" style={{ color: 'hsl(45, 100%, 20%)' }}>
                                  {cat.name || 'Unknown'}
                                  {cat.availableRoomsCount === 0 && <span className="text-red-500 text-xs ml-2">(No available rooms)</span>}
                                </td>
                                <td className="py-4 px-6 text-sm" style={{ color: 'hsl(45, 100%, 40%)' }}>
                                  {`${cat.availableRoomsCount || 0} of ${cat.totalRooms || 0} available`}
                                </td>
                                <td className="py-4 px-6 text-sm">
                                  <Button
                                    type="button"
                                    onClick={() => handleCategoryCardClick(cat._id)}
                                    disabled={cat.availableRoomsCount === 0}
                                    className="px-3 py-1 rounded-md transition-colors"
                                    variant={formData.categoryId === cat._id ? "default" : "outline"}
                                  >
                                    {cat.availableRoomsCount === 0 ? 'Unavailable' : formData.categoryId === cat._id ? 'Selected' : 'Select'}
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 col-span-full">No categories found. Please check availability first.</p>
                    )}
                  </div>
                )}

                {formData.categoryId && hasCheckedAvailability && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2 text-gray-700">Select Rooms ({getCategoryName(formData.categoryId)})</h3>
                    <p className="text-sm text-gray-500 mb-2">Available rooms: {roomsForSelectedCategory.length}</p>
                    {roomsForSelectedCategory.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full rounded-xl shadow-sm" style={{ backgroundColor: 'hsl(45, 100%, 95%)', border: '1px solid hsl(45, 100%, 85%)' }}>
                          <thead style={{ backgroundColor: 'hsl(45, 100%, 90%)' }}>
                            <tr>
                              <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(45, 100%, 20%)' }}>Action</th>
                              <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(45, 100%, 20%)' }}>Room Number</th>
                              <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(45, 100%, 20%)' }}>Room Name</th>
                              <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(45, 100%, 20%)' }}>Extra Bed</th>
                              <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(45, 100%, 20%)' }}>Price/Night</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y" style={{ borderColor: 'hsl(45, 100%, 90%)' }}>
                            {roomsForSelectedCategory.map(room => (
                              <tr 
                                key={room._id} 
                                className={`cursor-pointer ${selectedRooms.some(r => r._id === room._id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                onClick={() => handleRoomSelection(room)}
                              >
                                <td className="py-4 px-6 text-sm">
                                  <Button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRoomSelection(room);
                                    }}
                                    className="px-3 py-1 rounded-md transition-colors"
                                    style={{
                                      backgroundColor: selectedRooms.some(r => r._id === room._id)
                                        ? 'hsl(0, 60%, 50%)'
                                        : 'hsl(120, 60%, 50%)',
                                      color: 'white'
                                    }}
                                  >
                                    {selectedRooms.some(r => r._id === room._id) ? 'Remove' : 'Add'}
                                  </Button>
                                </td>
                                <td className="py-4 px-6 text-sm font-medium" style={{ color: 'hsl(45, 100%, 20%)' }}>{room.room_number || 'N/A'}</td>
                                <td className="py-4 px-6 text-sm" style={{ color: 'hsl(45, 100%, 40%)' }}>{room.title || 'N/A'}</td>
                                <td className="py-4 px-6 text-sm">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    room.extra_bed 
                                      ? "bg-green-100 text-green-800" 
                                      : "bg-gray-100 text-gray-600"
                                  }`}>
                                    {room.extra_bed ? "Yes" : "No"}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-sm font-semibold" style={{ color: 'hsl(45, 100%, 20%)' }}>₹{room.price || 0}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500">No rooms available for this category.</p>
                    )}
                  </div>
                )}
              </section>

              {/* Stay Information Section */}
              <section className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full" style={{backgroundColor: 'hsl(45, 100%, 85%)'}}>
                    <FaHotel className="text-lg" style={{color: 'hsl(45, 43%, 58%)'}} />
                  </div>
                  <h2 className="text-xl font-semibold" style={{color: 'hsl(45, 100%, 20%)'}}>
                    Stay Information
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numberOfRooms">Number of Rooms</Label>
                    <Input
                      id="numberOfRooms"
                      name="numberOfRooms"
                      type="number"
                      min="1"
                      value={formData.numberOfRooms}
                      onChange={handleChange}
                      readOnly
                      className="bg-gray-200"
                    />
                    {selectedRooms.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          Selected: {selectedRooms.map(r => r.room_number).join(', ')}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedRooms.map(room => (
                            <div key={room._id} className="flex items-center bg-blue-100 px-3 py-1 rounded-full text-sm">
                              <span className="mr-2">Room {room.room_number}</span>
                              <button
                                type="button"
                                onClick={() => handleRoomSelection(room)}
                                className="text-red-600 hover:text-red-800 font-bold"
                                title="Remove room"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Room Rate Editing */}
                    <div className="space-y-2 mt-4">
                      <h4 className="font-medium text-gray-700">Room Rates</h4>
                      <div className="grid gap-3">
                        {selectedRooms.map(room => (
                          <div key={room._id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <span className="font-medium">Room {room.room_number}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">₹</span>
                              <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={room.customPrice !== undefined ? room.customPrice : ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '' || /^\d+$/.test(value)) {
                                    const newPrice = value === '' ? '' : Number(value);
                                    setSelectedRooms(prev => 
                                      prev.map(r => 
                                        r._id === room._id 
                                          ? { ...r, customPrice: newPrice }
                                          : r
                                      )
                                    );
                                  }
                                }}
                                className="w-24 text-sm"
                              />
                              <span className="text-sm text-gray-500">/night</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="extraBedCharge">Extra Bed Charge per Day (₹)</Label>
                    <Input
                      id="extraBedCharge"
                      name="extraBedCharge"
                      type="number"
                      min="0"
                      value={formData.extraBedCharge || 0}
                      onChange={handleChange}
                      placeholder="Enter extra bed charge per day"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="planPackage">Package Plan</Label>
                    <Select
                      id="planPackage"
                      name="planPackage"
                      value={formData.planPackage}
                      onChange={handleChange}
                    >
                      <option value="">Select Package Plan</option>
                      <option value="EP">EP – Room Only</option>
                      <option value="CP">CP – Room + Breakfast</option>
                      <option value="MAP">MAP – Room + Breakfast + Lunch/Dinner</option>
                      <option value="AP">AP – Room + All Meals</option>
                      <option value="AI">AI – All Inclusive</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeIn">Check-in Time</Label>
                    <Input
                      id="timeIn"
                      name="timeIn"
                      type="time"
                      value={formData.timeIn}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeOut">Check-out Time</Label>
                    <Input
                      id="timeOut"
                      name="timeOut"
                      type="time"
                      value={formData.timeOut}
                      onChange={handleChange}
                      disabled
                    />
                  </div>
                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <Label htmlFor="arrivedFrom">Arrival From</Label>
                    <Input
                      id="arrivedFrom"
                      name="arrivedFrom"
                      value={formData.arrivedFrom}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <Label htmlFor="purposeOfVisit">Purpose of Visit</Label>
                    <Input
                      id="purposeOfVisit"
                      name="purposeOfVisit"
                      value={formData.purposeOfVisit}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="Booked">Booked</option>
                      <option value="Checked In">Checked In</option>
                      <option value="Checked Out">Checked Out</option>
                      <option value="Cancelled">Cancelled</option>
                    </Select>
                  </div>
                  {/* Room-specific guest details */}
                  {formData.roomGuestDetails && formData.roomGuestDetails.length > 0 && (
                    <div className="space-y-4 col-span-full">
                      <h3 className="text-lg font-medium text-gray-700">Guest Details per Room</h3>
                      <div className="grid gap-4">
                        {formData.roomGuestDetails.map((roomGuest, index) => (
                          <div key={roomGuest.roomNumber} className="border rounded-lg p-4 bg-gray-50">
                            <h4 className="font-medium text-gray-800 mb-3">Room {roomGuest.roomNumber}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`room-${roomGuest.roomNumber}-adults`}>Adults</Label>
                                <Input
                                  id={`room-${roomGuest.roomNumber}-adults`}
                                  type="number"
                                  min="1"
                                  value={roomGuest.adults}
                                  onChange={(e) => handleRoomGuestChange(roomGuest.roomNumber, 'adults', e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`room-${roomGuest.roomNumber}-children`}>Children</Label>
                                <Input
                                  id={`room-${roomGuest.roomNumber}-children`}
                                  type="number"
                                  min="0"
                                  value={roomGuest.children}
                                  onChange={(e) => handleRoomGuestChange(roomGuest.roomNumber, 'children', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Room Rates */}
                  {selectedRooms.length > 0 && (
                    <div className="space-y-4 col-span-full">
                      <h3 className="text-lg font-medium text-gray-700">Room Rates (Per Night)</h3>
                      <div className="grid gap-4">
                        {selectedRooms.map((room, index) => (
                          <div key={room._id} className="border rounded-lg p-4 bg-blue-50">
                            <h4 className="font-medium text-gray-800 mb-3">Room {room.room_number}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`room-rate-${room.room_number}`}>Rate per Night (₹)</Label>
                                <Input
                                  id={`room-rate-${room.room_number}`}
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  value={room.customPrice !== undefined ? room.customPrice : ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === '' || /^\d+$/.test(value)) {
                                      const newPrice = value === '' ? '' : Number(value);
                                      setSelectedRooms(prev => 
                                        prev.map(r => 
                                          r._id === room._id 
                                            ? { ...r, customPrice: newPrice }
                                            : r
                                        )
                                      );
                                    }
                                  }}
                                  placeholder="Enter rate per night"
                                  className="w-full"
                                />
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 mt-6">
                                  <Checkbox
                                    id={`extraBed-${room._id}`}
                                    checked={room.extraBed || false}
                                    onChange={(e) => {
                                      setSelectedRooms(prev => 
                                        prev.map(r => 
                                          r._id === room._id 
                                            ? { 
                                                ...r, 
                                                extraBed: e.target.checked,
                                                extraBedStartDate: e.target.checked ? '' : null
                                              }
                                            : r
                                        )
                                      );
                                    }}
                                  />
                                  <Label htmlFor={`extraBed-${room._id}`}>Extra Bed (₹{formData.extraBedCharge}/day)</Label>
                                </div>
                                {room.extraBed && (
                                  <div className="bg-yellow-50 p-2 rounded border text-sm space-y-2">
                                    <div>
                                      <Label htmlFor={`extraBedStartDate-${room._id}`}>Extra Bed Start Date</Label>
                                      <Input
                                        id={`extraBedStartDate-${room._id}`}
                                        type="date"
                                        value={room.extraBedStartDate || ''}
                                        min={formData.checkInDate}
                                        max={formData.checkOutDate}
                                        onChange={(e) => {
                                          const newDate = e.target.value;
                                          setSelectedRooms(prev => 
                                            prev.map(r => 
                                              r._id === room._id 
                                                ? { ...r, extraBedStartDate: newDate }
                                                : r
                                            )
                                          );
                                        }}
                                        className="text-xs"
                                      />
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Extra bed cost:</span>
                                      <span>₹{(() => {
                                        const startDate = new Date(room.extraBedStartDate || new Date().toISOString().split('T')[0]);
                                        const endDate = new Date(formData.checkOutDate);
                                        // If start date is same or after checkout, no charge
                                        if (startDate >= endDate) return 0;
                                        const timeDiff = endDate.getTime() - startDate.getTime();
                                        const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                                        return (Number(formData.extraBedCharge || 0) * Math.max(0, days)).toLocaleString();
                                      })()}</span>
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      ₹{Number(formData.extraBedCharge || 0)} × {(() => {
                                        const startDate = new Date(room.extraBedStartDate || new Date().toISOString().split('T')[0]);
                                        const endDate = new Date(formData.checkOutDate);
                                        // If start date is same or after checkout, no days
                                        if (startDate >= endDate) return 0;
                                        const timeDiff = endDate.getTime() - startDate.getTime();
                                        const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                                        return Math.max(0, days);
                                      })()} day(s)
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-2 col-span-full">
                    <Label htmlFor="remark">Remarks</Label>
                    <textarea
                      id="remark"
                      name="remark"
                      value={formData.remark}
                      onChange={handleChange}
                      className="flex w-full rounded-md bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50"
                      style={{ border: '1px solid hsl(45, 100%, 85%)', color: 'hsl(45, 100%, 20%)' }}
                      rows="3"
                    />
                  </div>
                </div>
              </section>

              {/* Room Service Orders Section */}
              <section className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full" style={{backgroundColor: 'hsl(45, 100%, 85%)'}}>
                    <FaConciergeBell className="text-lg" style={{color: 'hsl(45, 43%, 58%)'}} />
                  </div>
                  <h2 className="text-xl font-semibold" style={{color: 'hsl(45, 100%, 20%)'}}>
                    Room Service, Restaurant & Laundry Orders
                  </h2>
                </div>
                
                {/* Room Service Orders */}
                <RoomServiceOrders
                  serviceCharges={roomServiceOrders}
                  editingOrder={editingOrder}
                  editItems={editItems}
                  onEditOrder={(order) => {
                    setEditingOrder({ ...order, type: 'service' });
                    setEditItems([...order.items]);
                  }}
                  onSaveOrder={async (e) => {
                    e?.preventDefault?.();
                    try {
                      const orderId = editingOrder._id || editingOrder.id;
                      if (!orderId) {
                        showToast.error('Order ID not found');
                        return;
                      }
                      
                      if (editItems.length === 0) {
                        await axios.patch(`/api/room-service/${orderId}/status`, {
                          status: 'cancelled'
                        });
                        showToast.success('Order cancelled');
                      } else {
                        const subtotal = editItems.reduce((sum, item) => {
                          const unitPrice = item.unitPrice || item.price || 0;
                          return sum + (item.quantity * unitPrice);
                        }, 0);
                        const totalAmount = subtotal;
                        
                        await axios.put(`/api/room-service/${orderId}`, {
                          items: editItems,
                          subtotal,
                          totalAmount
                        });
                        showToast.success('Order updated successfully');
                      }
                      
                      await fetchRoomServiceOrders();
                      setEditingOrder(null);
                      setEditItems([]);
                    } catch (err) {
                      console.error('Failed to update order:', err);
                      showToast.error('Failed to update order');
                    }
                  }}
                  onCancelEdit={() => {
                    setEditingOrder(null);
                    setEditItems([]);
                  }}
                  onUpdateItemQuantity={(index, quantity) => {
                    const newItems = [...editItems];
                    newItems[index].quantity = Math.max(0, quantity);
                    const unitPrice = newItems[index].unitPrice || newItems[index].price || 0;
                    const calculatedTotal = newItems[index].quantity * unitPrice;
                    newItems[index].totalPrice = calculatedTotal;
                    newItems[index].total = calculatedTotal;
                    setEditItems(newItems);
                  }}
                  onRemoveItem={(itemIndex) => {
                    const newItems = editItems.filter((_, index) => index !== itemIndex);
                    setEditItems(newItems);
                  }}
                  onToggleNC={async (orderId, type, itemIndex) => {
                    try {
                      const order = roomServiceOrders.find(o => o._id === orderId);
                      
                      if (itemIndex !== undefined) {
                        // Toggle item-level NC
                        const newItems = [...order.items];
                        const currentNC = newItems[itemIndex].nonChargeable || newItems[itemIndex].isFree || newItems[itemIndex].nc || false;
                        const newNC = !currentNC;
                        
                        // Update all possible NC properties
                        newItems[itemIndex].nonChargeable = newNC;
                        newItems[itemIndex].isFree = newNC;
                        newItems[itemIndex].nc = newNC;
                        
                        // Recalculate order total excluding NC items
                        const newTotalAmount = newItems.reduce((sum, item) => {
                          const isNC = item.nonChargeable || item.isFree || item.nc;
                          if (isNC) return sum;
                          const unitPrice = item.unitPrice || item.price || 0;
                          return sum + (item.quantity * unitPrice);
                        }, 0);
                        
                        // Optimistic update
                        setRoomServiceOrders(prev => 
                          prev.map(o => 
                            o._id === orderId 
                              ? { ...o, items: newItems, totalAmount: newTotalAmount }
                              : o
                          )
                        );
                        
                        await axios.patch(`/api/room-service/${orderId}`, {
                          items: newItems,
                          totalAmount: newTotalAmount
                        });
                      } else {
                        // Toggle order-level NC
                        const newNCStatus = !order.nonChargeable;
                        
                        setRoomServiceOrders(prev => 
                          prev.map(o => 
                            o._id === orderId 
                              ? { ...o, nonChargeable: newNCStatus }
                              : o
                          )
                        );
                        
                        await axios.patch(`/api/room-service/${orderId}`, {
                          nonChargeable: newNCStatus
                        });
                      }
                      
                      showToast.success('NC status updated');
                    } catch (err) {
                      await fetchRoomServiceOrders();
                      showToast.error('Failed to update NC status');
                    }
                  }}
                />

                {/* Restaurant Orders */}
                <RestaurantOrders
                  restaurantCharges={restaurantOrders}
                  editingOrder={editingOrder}
                  editItems={editItems}
                  onEditOrder={(order) => {
                    setEditingOrder({ ...order, type: 'restaurant' });
                    setEditItems([...order.items]);
                  }}
                  onSaveOrder={async (e) => {
                    e?.preventDefault?.();
                    try {
                      const orderId = editingOrder._id || editingOrder.id;
                      if (!orderId) {
                        showToast.error('Order ID not found');
                        return;
                      }
                      
                      if (editItems.length === 0) {
                        await axios.patch(`/api/restaurant-orders/${orderId}/status`, {
                          status: 'cancelled'
                        });
                        showToast.success('Order cancelled');
                      } else {
                        const subtotal = editItems.reduce((sum, item) => {
                          const unitPrice = item.unitPrice || item.price || 0;
                          return sum + (item.quantity * unitPrice);
                        }, 0);
                        const totalAmount = subtotal;
                        
                        await axios.patch(`/api/restaurant-orders/${orderId}`, {
                          items: editItems,
                          amount: totalAmount
                        });
                        showToast.success('Order updated successfully');
                      }
                      
                      await fetchRoomServiceOrders();
                      setEditingOrder(null);
                      setEditItems([]);
                    } catch (err) {
                      console.error('Failed to update order:', err);
                      showToast.error('Failed to update order');
                    }
                  }}
                  onCancelEdit={() => {
                    setEditingOrder(null);
                    setEditItems([]);
                  }}
                  onUpdateItemQuantity={(index, quantity) => {
                    const newItems = [...editItems];
                    newItems[index].quantity = Math.max(0, quantity);
                    const unitPrice = newItems[index].unitPrice || newItems[index].price || 0;
                    const calculatedTotal = newItems[index].quantity * unitPrice;
                    newItems[index].totalPrice = calculatedTotal;
                    newItems[index].total = calculatedTotal;
                    setEditItems(newItems);
                  }}
                  onRemoveOrder={async (orderId, type) => {
                    if (!confirm('Are you sure you want to remove this order?')) return;
                    try {
                      if (type === 'service') {
                        await axios.delete(`/api/room-service/orders/${orderId}`);
                      } else {
                        await axios.patch(`/api/restaurant-orders/${orderId}/status`, {
                          status: 'cancelled'
                        });
                      }
                      await fetchRoomServiceOrders();
                      showToast.success('Order removed successfully');
                    } catch (err) {
                      console.error('Failed to remove order:', err);
                      showToast.error('Failed to remove order');
                    }
                  }}
                  onRemoveItem={(itemIndex) => {
                    const newItems = editItems.filter((_, index) => index !== itemIndex);
                    setEditItems(newItems);
                  }}
                  onToggleNC={async (orderId, type, itemIndex) => {
                    try {
                      const order = restaurantOrders.find(o => o._id === orderId);
                      
                      if (itemIndex !== undefined) {
                        // Toggle item-level NC
                        const newItems = [...order.items];
                        const currentNC = newItems[itemIndex].nonChargeable || newItems[itemIndex].isFree || newItems[itemIndex].nc || false;
                        const newNC = !currentNC;
                        
                        // Update all possible NC properties
                        newItems[itemIndex].nonChargeable = newNC;
                        newItems[itemIndex].isFree = newNC;
                        newItems[itemIndex].nc = newNC;
                        
                        // Recalculate order total excluding NC items
                        const newAmount = newItems.reduce((sum, item) => {
                          const isNC = item.nonChargeable || item.isFree || item.nc;
                          if (isNC) return sum;
                          const unitPrice = item.unitPrice || item.price || 0;
                          return sum + (item.quantity * unitPrice);
                        }, 0);
                        
                        // Optimistic update
                        setRestaurantOrders(prev => 
                          prev.map(o => 
                            o._id === orderId 
                              ? { ...o, items: newItems, amount: newAmount }
                              : o
                          )
                        );
                        
                        await axios.patch(`/api/restaurant-orders/${orderId}`, {
                          items: newItems,
                          amount: newAmount
                        });
                      } else {
                        // Toggle order-level NC
                        const newNCStatus = !order.nonChargeable;
                        
                        setRestaurantOrders(prev => 
                          prev.map(o => 
                            o._id === orderId 
                              ? { ...o, nonChargeable: newNCStatus }
                              : o
                          )
                        );
                        
                        await axios.patch(`/api/restaurant-orders/${orderId}`, {
                          nonChargeable: newNCStatus
                        });
                      }
                      
                      showToast.success('NC status updated');
                    } catch (err) {
                      await fetchRoomServiceOrders();
                      showToast.error('Failed to update NC status');
                    }
                  }}
                />
                
                {/* Laundry Orders */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Laundry Orders</h3>
                  {laundryOrders.length > 0 ? (
                    <div className="space-y-4">
                      {laundryOrders.map((order, index) => (
                        <div key={order._id || index} className="border rounded-lg p-4 bg-purple-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* Order Header */}
                            <div>
                              <h4 className="font-medium text-purple-800 text-lg mb-2">
                                Laundry Order #{index + 1}
                              </h4>
                              <div className="space-y-1 text-sm">
                                <p className="text-purple-600">
                                  <span className="font-medium">Guest:</span> {order.requestedByName || editBooking.name}
                                </p>
                                <p className="text-purple-600">
                                  <span className="font-medium">Room:</span> {order.roomNumber}
                                </p>
                                <p className="text-purple-600">
                                  <span className="font-medium">GRC No:</span> {order.grcNo}
                                </p>
                                <p className="text-purple-600">
                                  <span className="font-medium">Service:</span> 
                                  <span className="font-medium">{order.serviceType === 'vendor' ? 'External Vendor' : 'In-House'}</span>
                                </p>
                                {order.vendorId && (
                                  <p className="text-purple-600">
                                    <span className="font-medium">Vendor:</span> {order.vendorId.vendorName || 'External Vendor'}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            {/* Order Status & Dates */}
                            <div>
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <p className="text-sm text-purple-600 mb-2">
                                    <span className="font-medium">Status:</span>
                                  </p>
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    order.laundryStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                    order.laundryStatus === 'picked_up' ? 'bg-blue-100 text-blue-700' :
                                    order.laundryStatus === 'ready' ? 'bg-green-100 text-green-700' :
                                    order.laundryStatus === 'delivered' ? 'bg-gray-100 text-gray-700' :
                                    order.laundryStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
                                    'bg-orange-100 text-orange-700'
                                  }`}>
                                    {order.laundryStatus?.toUpperCase()}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-purple-800">
                                    ₹{order.items?.filter(item => !item.nonChargeable && item.status !== 'lost').reduce((sum, item) => sum + (item.calculatedAmount || 0), 0)?.toFixed(2) || '0.00'}
                                  </p>
                                  <p className="text-xs text-purple-600">Chargeable Amount</p>
                                </div>
                              </div>
                              
                              {/* Important Dates */}
                              <div className="space-y-1 text-sm">
                                <p className="text-purple-600">
                                  <span className="font-medium">Created:</span> {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                                </p>
                                {order.pickupDate && (
                                  <p className="text-purple-600">
                                    <span className="font-medium">Pickup:</span> {new Date(order.pickupDate).toLocaleDateString()}
                                  </p>
                                )}
                                {order.deliveryDate && (
                                  <p className="text-purple-600">
                                    <span className="font-medium">Delivery:</span> {new Date(order.deliveryDate).toLocaleDateString()}
                                  </p>
                                )}
                                {order.expectedDelivery && (
                                  <p className="text-purple-600">
                                    <span className="font-medium">Expected:</span> {new Date(order.expectedDelivery).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Items Details */}
                          {order.items && order.items.length > 0 && (
                            <div className="mt-4 border-t border-purple-200 pt-4">
                              <h5 className="font-medium text-purple-700 mb-3 flex items-center justify-between">
                                <span>Items ({order.items.length})</span>
                                <span className="text-sm font-normal">
                                  Total Qty: {order.items.reduce((sum, item) => sum + (item.quantity || 0), 0)}
                                </span>
                              </h5>
                              <div className="grid gap-2">
                                {order.items.map((item, itemIndex) => (
                                  <div key={itemIndex} className="flex justify-between items-center text-sm bg-white p-3 rounded border">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className={`font-medium ${item.status === 'lost' || item.status === 'cancelled' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                          {item.itemName}
                                        </span>
                                        <span className="text-gray-500">×{item.quantity}</span>
                                        {item.category && (
                                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                            {item.category}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                          item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                          item.status === 'picked_up' ? 'bg-blue-100 text-blue-700' :
                                          item.status === 'ready' ? 'bg-green-100 text-green-700' :
                                          item.status === 'delivered' ? 'bg-gray-100 text-gray-700' :
                                          item.status === 'lost' ? 'bg-orange-100 text-orange-700' :
                                          'bg-red-100 text-red-700'
                                        }`}>
                                          {item.status?.toUpperCase()}
                                        </span>
                                        {item.nonChargeable && (
                                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                            NON-CHARGEABLE
                                          </span>
                                        )}
                                        {item.urgentService && (
                                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                                            URGENT
                                          </span>
                                        )}
                                      </div>
                                      {item.notes && (
                                        <p className="text-xs text-gray-600 mt-1 italic">
                                          Note: {item.notes}
                                        </p>
                                      )}
                                    </div>
                                    <div className="text-right ml-4">
                                      <div className="font-medium">
                                        {item.nonChargeable ? (
                                          <span className="text-green-600">NC</span>
                                        ) : item.status === 'lost' ? (
                                          <span className="text-orange-600">LOST</span>
                                        ) : (
                                          <span className="text-gray-800">₹{(item.calculatedAmount || 0).toFixed(2)}</span>
                                        )}
                                      </div>
                                      {!item.nonChargeable && item.status !== 'lost' && item.price && (
                                        <div className="text-xs text-gray-500">
                                          ₹{item.price} × {item.quantity}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              {/* Order Summary */}
                              <div className="mt-3 pt-3 border-t border-purple-200">
                                <div className="flex justify-between text-sm">
                                  <div className="space-y-1">
                                    <p className="text-purple-600">
                                      <span className="font-medium">Total Items:</span> {order.items.length}
                                    </p>
                                    <p className="text-purple-600">
                                      <span className="font-medium">Chargeable Items:</span> {order.items.filter(item => !item.nonChargeable && item.status !== 'lost').length}
                                    </p>
                                    {order.items.some(item => item.nonChargeable) && (
                                      <p className="text-green-600">
                                        <span className="font-medium">Non-Chargeable:</span> {order.items.filter(item => item.nonChargeable).length}
                                      </p>
                                    )}
                                    {order.items.some(item => item.status === 'lost') && (
                                      <p className="text-orange-600">
                                        <span className="font-medium">Lost Items:</span> {order.items.filter(item => item.status === 'lost').length}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p className="text-purple-600 text-sm">
                                      <span className="font-medium">Subtotal:</span> ₹{order.items.reduce((sum, item) => sum + (item.calculatedAmount || 0), 0).toFixed(2)}
                                    </p>
                                    <p className="text-purple-600 text-sm">
                                      <span className="font-medium">Final Total:</span> ₹{order.items.filter(item => !item.nonChargeable && item.status !== 'lost').reduce((sum, item) => sum + (item.calculatedAmount || 0), 0).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Special Instructions or Notes */}
                          {order.specialInstructions && (
                            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                              <p className="text-sm">
                                <span className="font-medium text-blue-800">Special Instructions:</span>
                                <span className="text-blue-700 ml-2">{order.specialInstructions}</span>
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-2">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-lg font-medium">No laundry orders found</p>
                      <p className="text-gray-400 text-sm">No laundry orders have been created for this booking yet.</p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-center gap-4">
                  <Button
                    type="button"
                    onClick={() => {
                      setIsNavigating(true);
                      navigate('/room-service/create', {
                        state: { 
                          preSelectedBooking: editBooking
                        }
                      });
                    }}
                    className="px-6 py-3 rounded-lg font-medium text-white transition-colors"
                    style={{backgroundColor: 'hsl(45, 43%, 58%)'}}
                  >
                    + Create New Room Service Order
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setIsNavigating(true);
                      navigate('/restaurant/create-order', {
                        state: { 
                          preSelectedBooking: editBooking,
                          isDineIn: true,
                          returnToEdit: `/edit-booking/${editBooking._id}`,
                          returnState: { editBooking }
                        }
                      });
                    }}
                    className="px-6 py-3 rounded-lg font-medium text-white transition-colors"
                    style={{backgroundColor: 'hsl(45, 43%, 58%)'}}
                  >
                    + Create New Restaurant Order
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setIsNavigating(true);
                      navigate('/laundry/orders/create', {
                        state: { 
                          preSelectedBooking: editBooking
                        }
                      });
                    }}
                    className="px-6 py-3 rounded-lg font-medium text-white transition-colors"
                    style={{backgroundColor: 'hsl(45, 43%, 58%)'}}
                  >
                    + Create New Laundry Order
                  </Button>
                </div>
              </section>

              {/* Payment Info Section */}
              <section className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full" style={{backgroundColor: 'hsl(45, 100%, 85%)'}}>
                    <FaCreditCard className="text-lg" style={{color: 'hsl(45, 43%, 58%)'}} />
                  </div>
                  <h2 className="text-xl font-semibold" style={{color: 'hsl(45, 100%, 20%)'}}>
                    Payment Details
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="rate">Taxable Amount</Label>
                    <Input
                      id="rate"
                      name="rate"
                      type="number"
                      value={formData.rate}
                      readOnly
                      className="bg-gray-100"
                    />
                    <p className="text-xs text-gray-500">Room cost + extra beds (before tax)</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cgstRate">CGST Rate (%)</Label>
                    <Input
                      id="cgstRate"
                      name="cgstRate"
                      type="number"
                      step="0.1"
                      min="0"
                      max="50"
                      value={formData.cgstRate}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sgstRate">SGST Rate (%)</Label>
                    <Input
                      id="sgstRate"
                      name="sgstRate"
                      type="number"
                      step="0.1"
                      min="0"
                      max="50"
                      value={formData.sgstRate}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2 lg:col-span-3">
                    <Label>Rate Breakdown</Label>
                    <div className="bg-gray-50 p-3 rounded border">
                      <div className="text-sm space-y-1">
                        {(() => {
                          const roomRate = selectedRooms.reduce((sum, room) => {
                            const rate = room.customPrice !== undefined && room.customPrice !== '' && room.customPrice !== null
                              ? Number(room.customPrice) 
                              : (room.price || 0);
                            return sum + rate;
                          }, 0) * (formData.days || 1);
                          const extraBedTotal = selectedRooms.reduce((sum, room) => {
                            if (!room.extraBed) return sum;
                            
                            // Calculate extra bed days properly
                            const startDate = new Date(room.extraBedStartDate || new Date().toISOString().split('T')[0]);
                            const endDate = new Date(formData.checkOutDate);
                            
                            // If start date is same or after checkout, no extra bed charge
                            if (startDate >= endDate) return sum;
                            
                            const timeDiff = endDate.getTime() - startDate.getTime();
                            const extraBedDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                            
                            return sum + ((formData.extraBedCharge || 0) * Math.max(0, extraBedDays));
                          }, 0);
                          // Calculate room service and restaurant charges (exclude cancelled orders, include order-level NC but exclude item-level NC)
                          const activeRoomServiceOrders = roomServiceOrders.filter(order => 
                            order.status !== 'cancelled' && order.status !== 'canceled'
                          );
                          const activeRestaurantOrders = restaurantOrders.filter(order => 
                            order.status !== 'cancelled' && order.status !== 'canceled'
                          );
                          
                          const roomServiceTotal = activeRoomServiceOrders.reduce((sum, order) => {
                            // If entire order is NC, exclude it
                            if (order.nonChargeable) return sum;
                            // Calculate total excluding NC items
                            const orderTotal = order.items.reduce((itemSum, item) => {
                              const isNC = item.nonChargeable || item.isFree || item.nc;
                              if (isNC) return itemSum;
                              const unitPrice = item.unitPrice || item.price || 0;
                              return itemSum + (item.quantity * unitPrice);
                            }, 0);
                            return sum + orderTotal;
                          }, 0);
                          const restaurantTotal = activeRestaurantOrders.reduce((sum, order) => {
                            // If entire order is NC, exclude it
                            if (order.nonChargeable) return sum;
                            // Calculate total excluding NC items
                            const orderTotal = order.items.reduce((itemSum, item) => {
                              const isNC = item.nonChargeable || item.isFree || item.nc;
                              if (isNC) return itemSum;
                              const unitPrice = item.unitPrice || item.price || 0;
                              return itemSum + (item.quantity * unitPrice);
                            }, 0);
                            return sum + orderTotal;
                          }, 0);
                          
                          // Apply discount only to room cost (room rate + extra beds)
                          const roomSubtotal = roomRate + extraBedTotal;
                          const discountAmount = roomSubtotal * (Number(formData.discountPercent || 0) / 100);
                          const discountedRoomSubtotal = roomSubtotal - discountAmount;
                          
                          // Calculate laundry charges (exclude cancelled orders)
                          const activeLaundryOrders = laundryOrders.filter(order => 
                            order.laundryStatus !== 'cancelled' && order.laundryStatus !== 'canceled'
                          );
                          const laundryTotal = activeLaundryOrders.reduce((sum, order) => {
                            return sum + (order.items?.filter(item => !item.nonChargeable && item.status !== 'lost').reduce((itemSum, item) => itemSum + (item.calculatedAmount || 0), 0) || 0);
                          }, 0);
                          
                          const subtotal = discountedRoomSubtotal + roomServiceTotal + restaurantTotal + laundryTotal;
                          
                          // If non-chargeable, all amounts are 0
                          let cgstAmount, sgstAmount, totalWithTax;
                          if (formData.nonChargeable) {
                            cgstAmount = 0;
                            sgstAmount = 0;
                            totalWithTax = 0;
                          } else {
                            cgstAmount = subtotal * (Number(formData.cgstRate || 0) / 100);
                            sgstAmount = subtotal * (Number(formData.sgstRate || 0) / 100);
                            totalWithTax = subtotal + cgstAmount + sgstAmount;
                          }
                          
                          // If non-chargeable, show zero amounts
                          if (formData.nonChargeable) {
                            return (
                              <>
                                <div className="flex justify-between text-green-600 font-medium">
                                  <span>Non-Chargeable Booking:</span>
                                  <span>₹0.00</span>
                                </div>
                                <div className="text-xs text-green-600 mt-1">
                                  This booking has been marked as non-chargeable by authorized personnel.
                                </div>
                              </>
                            );
                          }
                          
                          return (
                            <>
                              <div className="flex justify-between">
                                <span>Room Cost ({formData.days} days):</span>
                                <span>₹{roomRate.toFixed(2)}</span>
                              </div>
                              {extraBedTotal > 0 && (
                                <div className="flex justify-between">
                                  <span>Extra Beds ({selectedRooms.filter(r => r.extraBed).length} beds × variable days × ₹{formData.extraBedCharge || 0}):</span>
                                  <span>₹{extraBedTotal.toFixed(2)}</span>
                                </div>
                              )}
                              {roomServiceTotal > 0 && (
                                <div className="flex justify-between">
                                  <span>Room Service ({activeRoomServiceOrders.length} orders):</span>
                                  <span>₹{roomServiceTotal.toFixed(2)}</span>
                                </div>
                              )}
                              {restaurantTotal > 0 && (
                                <div className="flex justify-between">
                                  <span>Restaurant ({activeRestaurantOrders.length} orders):</span>
                                  <span>₹{restaurantTotal.toFixed(2)}</span>
                                </div>
                              )}
                              {laundryTotal > 0 && (
                                <div className="flex justify-between">
                                  <span>Laundry ({activeLaundryOrders.length} orders):</span>
                                  <span>₹{laundryTotal.toFixed(2)}</span>
                                </div>
                              )}
                              <hr className="my-1" />
                              <div className="flex justify-between font-medium">
                                <span>Room Subtotal:</span>
                                <span>₹{roomSubtotal.toFixed(2)}</span>
                              </div>
                              {discountAmount > 0 && (
                                <div className="flex justify-between text-red-600">
                                  <span>Discount ({Number(formData.discountPercent || 0)}%) - Room Only:</span>
                                  <span>-₹{discountAmount.toFixed(2)}</span>
                                </div>
                              )}
                              {discountAmount > 0 && (
                                <div className="flex justify-between">
                                  <span>Room After Discount:</span>
                                  <span>₹{discountedRoomSubtotal.toFixed(2)}</span>
                                </div>
                              )}
                              <hr className="my-1" />
                              <div className="flex justify-between font-medium">
                                <span>Total Subtotal:</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>CGST ({Number(formData.cgstRate || 0)}%):</span>
                                <span>₹{cgstAmount.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>SGST ({Number(formData.sgstRate || 0)}%):</span>
                                <span>₹{sgstAmount.toFixed(2)}</span>
                              </div>
                              <hr className="my-1" />
                              <div className="flex justify-between font-semibold">
                                <span>Total with Tax:</span>
                                <span>₹{totalWithTax.toFixed(2)}</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentMode">Payment Mode</Label>
                    <Select
                      id="paymentMode"
                      name="paymentMode"
                      value={formData.paymentMode}
                      onChange={handleChange}
                    >
                      <option value="">Select Payment Mode</option>
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="UPI">UPI</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </Select>
                  </div>
                  {formData.paymentMode && formData.paymentMode !== 'Cash' && (
                    <div className="space-y-2">
                      <Label htmlFor="transactionId">Transaction ID</Label>
                      <Input
                        id="transactionId"
                        name="transactionId"
                        value={formData.transactionId || ''}
                        onChange={handleChange}
                        placeholder="Enter transaction ID"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="paymentStatus">Payment Status</Label>
                    <Select
                      id="paymentStatus"
                      name="paymentStatus"
                      value={formData.paymentStatus}
                      onChange={handleChange}
                    >
                      <option value={false}>Pending</option>
                      <option value={true}>Paid</option>
                      <option value="Failed">Failed</option>
                      <option value="Partial">Partial</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discountPercent">Discount (%)</Label>
                    <Input
                      id="discountPercent"
                      name="discountPercent"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discountPercent}
                      onChange={handleChange}
                      disabled={formData.nonChargeable}
                    />
                  </div>

                  {formData.discountPercent > 0 && !formData.nonChargeable && (
                    <div className="space-y-2 col-span-full">
                      <Label htmlFor="discountNotes">
                        Discount Notes <span className="text-red-500">*</span>
                      </Label>
                      <textarea
                        id="discountNotes"
                        name="discountNotes"
                        value={formData.discountNotes || ''}
                        onChange={handleChange}
                        className="flex w-full rounded-md bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ border: '1px solid hsl(45, 100%, 85%)', color: 'hsl(45, 100%, 20%)' }}
                        rows="3"
                        placeholder="Please provide reason for discount (mandatory when discount is applied)"
                        required
                      />
                      <p className="text-xs text-red-600">Note: Discount notes are mandatory when discount is applied</p>
                    </div>
                  )}


                  {/* Multiple Advance Payments Section */}
                  <div className="space-y-4 col-span-full">
                    <div className="flex justify-between items-center border-t pt-4">
                      <h3 className="text-lg font-medium text-gray-700">Advance Payments</h3>
                      <Button
                        type="button"
                        onClick={() => {
                          const newPayment = {
                            amount: 0,
                            paymentMode: '',
                            paymentDate: new Date().toISOString().split('T')[0],
                            reference: '',
                            notes: ''
                          };
                          setFormData(prev => ({
                            ...prev,
                            advancePayments: [...(prev.advancePayments || []), newPayment]
                          }));
                        }}
                        className="px-3 py-1 text-sm"
                      >
                        + Add Payment
                      </Button>
                    </div>
                    
                    {formData.advancePayments && formData.advancePayments.length > 0 && (
                      <div className="space-y-3">
                        {formData.advancePayments.map((payment, index) => (
                          <div key={index} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="font-medium text-gray-800">Payment #{index + 1}</h4>
                              <Button
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    advancePayments: prev.advancePayments.filter((_, i) => i !== index)
                                  }));
                                }}
                                className="px-2 py-1 text-xs bg-red-500 hover:bg-red-600"
                              >
                                Remove
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Amount (₹)</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={payment.amount || 0}
                                  onChange={(e) => {
                                    const newPayments = [...formData.advancePayments];
                                    newPayments[index].amount = Number(e.target.value);
                                    setFormData(prev => ({ ...prev, advancePayments: newPayments }));
                                  }}
                                  placeholder="Enter amount"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Payment Mode</Label>
                                <Select
                                  value={payment.paymentMode || ''}
                                  onChange={(e) => {
                                    const newPayments = [...formData.advancePayments];
                                    newPayments[index].paymentMode = e.target.value;
                                    // Auto-set payment date to today when payment mode is selected
                                    if (e.target.value && !newPayments[index].paymentDate) {
                                      newPayments[index].paymentDate = new Date().toISOString().split('T')[0];
                                    }
                                    setFormData(prev => ({ ...prev, advancePayments: newPayments }));
                                  }}
                                >
                                  <option value="">Select Mode</option>
                                  <option value="Cash">Cash</option>
                                  <option value="Card">Card</option>
                                  <option value="UPI">UPI</option>
                                  <option value="Bank Transfer">Bank Transfer</option>
                                  <option value="Online">Online</option>
                                </Select>
                              </div>
                              {payment.paymentMode && payment.paymentMode !== 'Cash' && (
                                <div className="space-y-2 md:col-span-2">
                                  <Label>Transaction ID</Label>
                                  <Input
                                    value={payment.reference || ''}
                                    onChange={(e) => {
                                      const newPayments = [...formData.advancePayments];
                                      newPayments[index].reference = e.target.value;
                                      setFormData(prev => ({ ...prev, advancePayments: newPayments }));
                                    }}
                                    placeholder="Enter transaction ID"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Payment Summary */}
                    {formData.rate > 0 && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">Payment Summary</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-blue-600">Total Amount:</span>
                            <div className="font-semibold">₹{(() => {
                              if (formData.nonChargeable) return '0.00';
                              
                              // Use same calculation as Rate Breakdown
                              const roomRate = selectedRooms.reduce((sum, room) => {
                                const rate = room.customPrice !== undefined && room.customPrice !== '' && room.customPrice !== null
                                  ? Number(room.customPrice) 
                                  : (room.price || 0);
                                return sum + rate;
                              }, 0) * (formData.days || 1);
                              
                              const extraBedTotal = selectedRooms.reduce((sum, room) => {
                                if (!room.extraBed) return sum;
                                const startDate = new Date(room.extraBedStartDate || new Date().toISOString().split('T')[0]);
                                const endDate = new Date(formData.checkOutDate);
                                if (startDate >= endDate) return sum;
                                const timeDiff = endDate.getTime() - startDate.getTime();
                                const extraBedDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                                return sum + ((formData.extraBedCharge || 0) * Math.max(0, extraBedDays));
                              }, 0);
                              
                              const activeRoomServiceOrders = roomServiceOrders.filter(order => 
                                order.status !== 'cancelled' && order.status !== 'canceled'
                              );
                              const activeRestaurantOrders = restaurantOrders.filter(order => 
                                order.status !== 'cancelled' && order.status !== 'canceled'
                              );
                              
                              const roomServiceTotal = activeRoomServiceOrders.reduce((sum, order) => {
                                if (order.nonChargeable) return sum;
                                const orderTotal = order.items.reduce((itemSum, item) => {
                                  const isNC = item.nonChargeable || item.isFree || item.nc;
                                  if (isNC) return itemSum;
                                  const unitPrice = item.unitPrice || item.price || 0;
                                  return itemSum + (item.quantity * unitPrice);
                                }, 0);
                                return sum + orderTotal;
                              }, 0);
                              
                              const restaurantTotal = activeRestaurantOrders.reduce((sum, order) => {
                                if (order.nonChargeable) return sum;
                                const orderTotal = order.items.reduce((itemSum, item) => {
                                  const isNC = item.nonChargeable || item.isFree || item.nc;
                                  if (isNC) return itemSum;
                                  const unitPrice = item.unitPrice || item.price || 0;
                                  return itemSum + (item.quantity * unitPrice);
                                }, 0);
                                return sum + orderTotal;
                              }, 0);
                              
                              const roomSubtotal = roomRate + extraBedTotal;
                              const discountAmount = roomSubtotal * (Number(formData.discountPercent || 0) / 100);
                              const discountedRoomSubtotal = roomSubtotal - discountAmount;
                              const subtotal = discountedRoomSubtotal + roomServiceTotal + restaurantTotal;
                              
                              const cgstAmount = subtotal * (Number(formData.cgstRate || 0) / 100);
                              const sgstAmount = subtotal * (Number(formData.sgstRate || 0) / 100);
                              const totalWithTax = subtotal + cgstAmount + sgstAmount;
                              
                              return totalWithTax.toFixed(2);
                            })()}</div>
                          </div>
                          <div>
                            <span className="text-green-600">Total Advance Received:</span>
                            <div className="font-semibold text-green-700">₹{(() => {
                              const totalAdvance = (formData.advancePayments || []).reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
                              return totalAdvance.toFixed(2);
                            })()}</div>
                          </div>
                          <div>
                            <span className="text-orange-600">Balance Due:</span>
                            <div className="font-semibold text-orange-700">₹{(() => {
                              if (formData.nonChargeable) return '0.00';
                              
                              // Use same calculation as Rate Breakdown
                              const roomRate = selectedRooms.reduce((sum, room) => {
                                const rate = room.customPrice !== undefined && room.customPrice !== '' && room.customPrice !== null
                                  ? Number(room.customPrice) 
                                  : (room.price || 0);
                                return sum + rate;
                              }, 0) * (formData.days || 1);
                              
                              const extraBedTotal = selectedRooms.reduce((sum, room) => {
                                if (!room.extraBed) return sum;
                                const startDate = new Date(room.extraBedStartDate || new Date().toISOString().split('T')[0]);
                                const endDate = new Date(formData.checkOutDate);
                                if (startDate >= endDate) return sum;
                                const timeDiff = endDate.getTime() - startDate.getTime();
                                const extraBedDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                                return sum + ((formData.extraBedCharge || 0) * Math.max(0, extraBedDays));
                              }, 0);
                              
                              const activeRoomServiceOrders = roomServiceOrders.filter(order => 
                                order.status !== 'cancelled' && order.status !== 'canceled'
                              );
                              const activeRestaurantOrders = restaurantOrders.filter(order => 
                                order.status !== 'cancelled' && order.status !== 'canceled'
                              );
                              
                              const roomServiceTotal = activeRoomServiceOrders.reduce((sum, order) => {
                                if (order.nonChargeable) return sum;
                                const orderTotal = order.items.reduce((itemSum, item) => {
                                  const isNC = item.nonChargeable || item.isFree || item.nc;
                                  if (isNC) return itemSum;
                                  const unitPrice = item.unitPrice || item.price || 0;
                                  return itemSum + (item.quantity * unitPrice);
                                }, 0);
                                return sum + orderTotal;
                              }, 0);
                              
                              const restaurantTotal = activeRestaurantOrders.reduce((sum, order) => {
                                if (order.nonChargeable) return sum;
                                const orderTotal = order.items.reduce((itemSum, item) => {
                                  const isNC = item.nonChargeable || item.isFree || item.nc;
                                  if (isNC) return itemSum;
                                  const unitPrice = item.unitPrice || item.price || 0;
                                  return itemSum + (item.quantity * unitPrice);
                                }, 0);
                                return sum + orderTotal;
                              }, 0);
                              
                              const roomSubtotal = roomRate + extraBedTotal;
                              const discountAmount = roomSubtotal * (Number(formData.discountPercent || 0) / 100);
                              const discountedRoomSubtotal = roomSubtotal - discountAmount;
                              const subtotal = discountedRoomSubtotal + roomServiceTotal + restaurantTotal;
                              
                              const cgstAmount = subtotal * (Number(formData.cgstRate || 0) / 100);
                              const sgstAmount = subtotal * (Number(formData.sgstRate || 0) / 100);
                              const totalAmount = subtotal + cgstAmount + sgstAmount;
                              
                              const totalAdvance = (formData.advancePayments || []).reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
                              const balance = totalAmount - totalAdvance;
                              return Math.max(0, balance).toFixed(2);
                            })()}</div>
                          </div>
                        </div>
                        {formData.advancePayments && formData.advancePayments.length > 0 && (
                          <div className="mt-3 text-xs text-gray-600">
                            <span className="font-medium">Payments: </span>
                            {formData.advancePayments.map((payment, index) => (
                              <span key={index}>
                                ₹{(Number(payment.amount) || 0).toFixed(2)} ({payment.paymentMode}){index < formData.advancePayments.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 col-span-full">
                    <Label htmlFor="billingInstruction">Billing Instruction</Label>
                    <textarea
                      id="billingInstruction"
                      name="billingInstruction"
                      value={formData.billingInstruction}
                      onChange={handleChange}
                      className="flex w-full rounded-md bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50"
                      style={{ border: '1px solid hsl(45, 100%, 85%)', color: 'hsl(45, 100%, 20%)' }}
                      rows="3"
                    />
                  </div>
                </div>
              </section>

              <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  type="button"
                  onClick={() => {
                    setIsNavigating(true);
                    navigate('/booking');
                  }}
                  variant="outline"
                  className="px-8 py-3 font-semibold rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowAmendModal(true)}
                  disabled={(editBooking?.amendmentHistory?.length || 0) >= 3 || 
                           (new Date(formData.checkOutDate) - new Date()) / (1000 * 60 * 60) < 24}
                  className={`px-8 py-3 font-semibold rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 w-full sm:w-auto ${
                    (editBooking?.amendmentHistory?.length || 0) >= 3 || 
                    (new Date(formData.checkOutDate) - new Date()) / (1000 * 60 * 60) < 24
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                  title={(editBooking?.amendmentHistory?.length || 0) >= 3 
                    ? 'Maximum amendments reached' 
                    : (new Date(formData.checkOutDate) - new Date()) / (1000 * 60 * 60) < 24
                    ? 'Cannot amend within 24 hours of checkout'
                    : 'Amend Stay'}
                >
                  Amend Stay
                </Button>
                <Button
                  type="submit"
                  disabled={loading || isNavigating || editingOrder}
                  className="px-8 py-3 font-semibold rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 w-full sm:w-auto"
                >
                  {loading ? 'Updating...' : 'Update Booking'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Amendment Modal */}
      {showAmendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Amend Booking Stay</h3>
              <button
                onClick={() => setShowAmendModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Current Stay:</strong><br />
                  Check-in: {new Date(formData.checkInDate).toLocaleDateString()} (Fixed)<br />
                  Check-out: {new Date(formData.checkOutDate).toLocaleDateString()}<br />
                  Duration: {formData.days} days<br />
                  <span className="text-xs">Amendments made: {editBooking?.amendmentHistory?.length || 0}/3</span>
                </p>
              </div>
              
              {editBooking?.amendmentHistory && editBooking.amendmentHistory.length > 0 && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm text-yellow-800 font-medium mb-2">Previous Amendments:</p>
                  {editBooking.amendmentHistory.slice(-2).map((amendment, index) => (
                    <div key={index} className="text-xs text-yellow-700 mb-1">
                      {new Date(amendment.amendedOn).toLocaleDateString()}: Extended to {new Date(amendment.newCheckOut).toLocaleDateString()}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="newCheckOutDate">New Check-out Date</Label>
                <Input
                  id="newCheckOutDate"
                  type="date"
                  value={amendmentData.newCheckOutDate}
                  onChange={(e) => setAmendmentData(prev => ({ ...prev, newCheckOutDate: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amendReason">Reason for Amendment</Label>
                <textarea
                  id="amendReason"
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
                    Check-in: {new Date(formData.checkInDate).toLocaleDateString()} (Same)<br />
                    Check-out: {new Date(amendmentData.newCheckOutDate).toLocaleDateString()}<br />
                    Duration: {Math.ceil((new Date(amendmentData.newCheckOutDate) - new Date(formData.checkInDate)) / (1000 * 60 * 60 * 24))} days
                  </p>
                  <div className="mt-2 pt-2 border-t border-green-200">
                    <p className="text-xs text-green-700">
                      <strong>Amendment Summary:</strong><br />
                      Days change: {Math.ceil((new Date(amendmentData.newCheckOutDate) - new Date(formData.checkInDate)) / (1000 * 60 * 60 * 24)) - formData.days}<br />
                      Amendment count: {editBooking?.amendmentHistory?.length || 0}<br />
                      {(editBooking?.amendmentHistory?.length || 0) > 0 && <span className="text-orange-600">Amendment fee: ₹500</span>}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                onClick={() => setShowAmendModal(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAmendStay}
                disabled={amendingStay}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {amendingStay ? 'Amending...' : 'Amend Stay'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditBookingForm;