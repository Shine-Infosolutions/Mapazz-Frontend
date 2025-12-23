
// import { useState, useEffect } from "react";
// import toast, { Toaster } from "react-hot-toast";
// import { Link, useNavigate, useLocation } from "react-router-dom";
// import axios from "axios";
// import { useAppContext } from "../../../../context/AppContext";
// import MenuSelector from "../Menu/MenuSelector";
// import {
//   FaUser,
//   FaArrowLeft,
//   FaMoneyBillWave,
//   FaPhone,
//   FaStickyNote,
//   FaRegCalendarAlt,
//   FaEnvelope,
//   FaUsers,
//   FaUtensils,
//   FaRupeeSign,
//   FaCheckCircle,
// } from "react-icons/fa";

// // Rate configuration
// const RATE_CONFIG = {
//   Veg: {
//     Silver: {
//       basePrice: 1050,
//       taxPercent: 18,
//     },
//     Gold: {
//       basePrice: 1250,
//       taxPercent: 18,
//     },
//     Platinum: {
//       basePrice: 1899,
//       taxPercent: 18,
//     },
//   },
//   "Non-Veg": {
//     Silver: {
//       basePrice: 1050,
//       taxPercent: 18,
//     },
//     Gold: {
//       basePrice: 1250,
//       taxPercent: 18,
//     },
//     Platinum: {
//       basePrice: 2299,
//       taxPercent: 18,
//     },
//   },
// };

// const requiredFields = [
//   "name",
//   "number",
//   "startDate",
//   "pax",
//   "ratePlan",
//   "foodType",
// ];

// const AddBooking = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
  
//   // Helper function to check if user is admin
//   const isAdmin = () => {
//     const role = localStorage.getItem("role");
//     return role?.toLowerCase() === "admin";
//   };
//   const selectedDateFromCalendar = location.state?.selectedDate || "";
//   const [loading, setLoading] = useState(false);
//   const [showMenuSelector, setShowMenuSelector] = useState(false);
//   const [errors, setErrors] = useState({});
//   const [progress, setProgress] = useState(0); // For progress bar
//   const [submitSuccess, setSubmitSuccess] = useState(false); // For button animation
//   const [submitError, setSubmitError] = useState(false); // For button shake

//   const [form, setForm] = useState({
//     name: "",
//     email: "",
//     number: "",
//     whatsapp: "",
//     pax: "",
//     startDate: selectedDateFromCalendar,
//     hall: "",
//     time: "",
//     bookingStatus: "Enquiry", // Default status

//     // Initialize statusHistory with the default status and timestamp
//     statusHistory: [
//       {
//         status: "Enquiry",
//         type: false,
//         changedAt: new Date().toISOString(),
//       },
//     ],

//     ratePlan: "",
//     roomOption: "complimentary",
//     complimentaryRooms: 2,
//     advance: "",
//     gst: "", // GST input (manual)
//     total: "",
//     balance: "",
//     foodType: "Veg",
//     ratePerPax: "",
//     notes: "",
//     menuItems: "",
//     isConfirmed: false,
//     categorizedMenu: {},
//     discount: "",
//     decorationCharge: "",
//     musicCharge: "",
//     hasDecoration: false,
//     hasMusic: false,
//     staffEditCount: 0, // Add this field for new bookings
//     useCustomPrice: false, // Admin can override calculated price
//     customPlatePrice: "" // Custom price per plate
//   });

//   // Calculate total when pax, ratePlan, foodType, gst, discount, decoration, or music charges change
//   useEffect(() => {
//     if (form.pax && (form.useCustomPrice ? form.customPlatePrice : (form.ratePlan && form.foodType))) {
//       const paxNum = parseInt(form.pax) || 0;
//       const gstPercent = parseFloat(form.gst) || 0;
      
//       let basePrice;
//       if (form.useCustomPrice) {
//         basePrice = parseFloat(form.customPlatePrice) || 0;
//       } else {
//         const rateInfo = RATE_CONFIG[form.foodType][form.ratePlan];
//         if (!rateInfo) return;
//         basePrice = rateInfo.basePrice;
//       }
      
//       // Discount logic: apply discount to base price per pax only
//       const discount = parseFloat(form.discount) || 0;
//       const discountedBase = basePrice - discount;
//       const gstAmount = (discountedBase * gstPercent) / 100;
//       const rateWithGST = discountedBase + gstAmount;
//       const foodTotal = rateWithGST * paxNum;
      
//       // Add decoration and music charges
//       const decorationCharge = form.hasDecoration ? (parseFloat(form.decorationCharge) || 0) : 0;
//       const musicCharge = form.hasMusic ? (parseFloat(form.musicCharge) || 0) : 0;
//       const total = foodTotal + decorationCharge + musicCharge;
      
//       setForm((prev) => ({
//         ...prev,
//         total: total ? total.toFixed(2) : "",
//         ratePerPax: rateWithGST.toFixed(2),
//       }));
//     }
//   }, [form.pax, form.ratePlan, form.foodType, form.gst, form.discount, form.decorationCharge, form.musicCharge, form.hasDecoration, form.hasMusic, form.useCustomPrice, form.customPlatePrice]);

//   // Remove this useEffect for balance calculation
//   useEffect(() => {
//     const advance = parseFloat(form.advance) || 0;
//     const total = parseFloat(form.total) || 0;
//     const balance = total - advance;
//     setForm((prev) => ({ ...prev, balance: balance.toFixed(2) }));
//   }, [form.advance, form.total]);

//   // Auto-update bookingStatus based on advance payment
//   useEffect(() => {
//     const advance = parseFloat(form.advance) || 0;
//     const total = parseFloat(form.total) || 0;
//     let newStatus = form.bookingStatus;
//     if (advance > 0) {
//       newStatus = "Confirmed";
//     } else {
//       newStatus = "Enquiry";
//     }
//     if (newStatus !== form.bookingStatus) {
//       setForm((prev) => ({
//         ...prev,
//         bookingStatus: newStatus,
//       }));
//     }
//   }, [form.advance, form.total]);

//   useEffect(() => {
//     // Calculate progress
//     const filled = requiredFields.filter((f) => form[f]);
//     setProgress(Math.round((filled.length / requiredFields.length) * 100));
//   }, [form]);

//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     let val = type === "checkbox" ? checked : value;
    
//     // Reset charges when unchecking
//     if (name === "hasDecoration" && !checked) {
//       setForm(prev => ({ ...prev, hasDecoration: false, decorationCharge: "" }));
//       return;
//     }
//     if (name === "hasMusic" && !checked) {
//       setForm(prev => ({ ...prev, hasMusic: false, musicCharge: "" }));
//       return;
//     }
    
//     // Handle custom price toggle
//     if (name === "useCustomPrice") {
//       setForm(prev => ({ 
//         ...prev, 
//         useCustomPrice: checked, 
//         customPlatePrice: checked ? "" : prev.customPlatePrice 
//       }));
//       return;
//     }
    
//     // Handle rate plan change - auto set food type for Silver
//     if (name === "ratePlan") {
//       if (val === "Silver") {
//         setForm(prev => ({ ...prev, [name]: val, foodType: "Veg" }));
//         return;
//       } else if (form.ratePlan === "Silver" && val !== "Silver") {
//         // Reset food type when switching away from Silver
//         setForm(prev => ({ ...prev, [name]: val, foodType: "" }));
//         return;
//       }
//     }
//     // Discount validation
//     if (name === "discount") {
//       let maxDiscount = Infinity;
//       if (!isAdmin()) {
//         // Staff discount limits by rate plan
//         if (form.ratePlan === "Silver") maxDiscount = 100;
//         else if (form.ratePlan === "Gold") maxDiscount = 150;
//         else if (form.ratePlan === "Platinum") maxDiscount = 200;
//         else maxDiscount = 0;
//       }
//       if (parseFloat(val) > maxDiscount) val = maxDiscount;
//       if (parseFloat(val) < 0) val = 0;
//     }
//     // If bookingStatus is changed, set statusChangedAt
//     if (name === "bookingStatus" && value !== form.bookingStatus) {
//       // Add status history tracking and update booleans
//       setForm((prev) => {
//         let isConfirmed = prev.isConfirmed || false;
//         let isEnquiry = prev.isEnquiry || false;
//         let isTentative = prev.isTentative || false;
//         isConfirmed = prev.isConfirmed || val === "Confirmed";
//         isEnquiry = prev.isEnquiry || val === "Enquiry";
//         isTentative = prev.isTentative || val === "Tentative";
//         return {
//           ...prev,
//           [name]: val,
//           isConfirmed,
//           isEnquiry,
//           isTentative,
//           statusChangedAt: new Date().toISOString(),
//           statusHistory: [
//             ...(prev.statusHistory || []),
//             {
//               status: val,
//               changedAt: new Date().toISOString(),
//             },
//           ],
//         };
//       });
//     } else {
//       setForm({ ...form, [name]: val });
//     }
//   };

//   const handleSaveMenu = async (selectedItems, categorizedMenu) => {
//     try {
//       // Direct mapping - MenuSelector already sends correct format
//       setForm((prev) => ({
//         ...prev,
//         menuItems: selectedItems.join(", "),
//         categorizedMenu: categorizedMenu,
//       }));
//     } catch (error) {
//       toast.error("Error processing menu selection");
//       console.error("Menu save error:", error);
//     }
//   };

//   const validateForm = () => {
//     const newErrors = {};
//     if (!form.name) newErrors.name = "Name is required";
//     if (!form.number) newErrors.number = "Mobile number is required";
//     if (!form.startDate) newErrors.startDate = "Booking date is required";
//     if (!form.pax) newErrors.pax = "Number of pax is required";
//     if (!form.ratePlan) newErrors.ratePlan = "Rate plan is required";
//     if (!form.foodType) newErrors.foodType = "Food type is required";
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const addBooking = async () => {
//     setLoading(true);
//     setSubmitError(false);
//     setSubmitSuccess(false);
//     if (!validateForm()) {
//       toast.error("Please fill all required fields");
//       setLoading(false);
//       setSubmitError(true);
//       setTimeout(() => setSubmitError(false), 600);
//       return;
//     }

//     try {
//       // Compute booleans from statusHistory
//       function computeStatusBooleans(statusHistory) {
//         let isEnquiry = false,
//           isTentative = false,
//           isConfirmed = false;
//         for (const entry of statusHistory) {
//           if (entry.status === "Enquiry") isEnquiry = true;
//           if (entry.status === "Tentative") isTentative = true;
//           if (entry.status === "Confirmed") isConfirmed = true;
//         }
//         return { isEnquiry, isTentative, isConfirmed };
//       }
//       // Prepare the payload - explicitly structure the data
//       const payload = {
//         ...form,
//         complimentaryRooms:
//           form.complimentaryRooms === "" ? 0 : Number(form.complimentaryRooms),
//         decorationCharge: form.hasDecoration ? (parseFloat(form.decorationCharge) || 0) : 0,
//         musicCharge: form.hasMusic ? (parseFloat(form.musicCharge) || 0) : 0,
//         statusHistory: [
//           {
//             status: form.bookingStatus,
//             changedAt: new Date().toISOString(),
//           },
//         ],
//         menuItems: undefined,
//         categorizedMenu: form.categorizedMenu || {},
//         ...(form.statusChangedAt
//           ? { statusChangedAt: form.statusChangedAt }
//           : {}),
//         staffEditCount: form.staffEditCount,
//       };
//       const statusBooleans = computeStatusBooleans(payload.statusHistory || []);
//       Object.assign(payload, statusBooleans);

//       const response = await axios.post(
//         "https://ashoka-api.shineinfosolutions.in/api/bookings/create",
//         payload
//       );

//       toast.success("Booking created successfully!");
//       const bookingId = response.data._id || response.data.id;
//       setTimeout(() => {
//         if (bookingId) {
//           navigate(`/banquet/invoice/${bookingId}`);
//         } else {
//           navigate("/banquet/list-booking");
//         }
//       }, 600);
//       setSubmitSuccess(true);
//       setTimeout(() => setSubmitSuccess(false), 1200);
//     } catch (err) {
//       console.error("Error:", err.response?.data || err.message);
//       toast.error(err.response?.data?.message || "Something went wrong");
//       setSubmitError(true);
//       setTimeout(() => setSubmitError(false), 600);
//     } finally {
//       setLoading(false);
//     }
//   };
//   // Get the current rate information for display
//   const getCurrentRateInfo = () => {
//     if (!form.ratePlan || !form.foodType) return null;
//     return RATE_CONFIG[form.foodType][form.ratePlan];
//   };

//   const currentRate = getCurrentRateInfo();

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <Toaster position="top-center" />

//       {/* Header */}
//       <header className="bg-white shadow-sm">
//         <div className="container mx-auto px-4 py-4 flex items-center justify-between">
//           <Link
//             to="/banquet/list-booking"
//             className="flex items-center text-[#c3ad6b] hover:text-[#b39b5a]"
//           >
//             <FaArrowLeft className="mr-2" /> Back
//           </Link>
//           <h1 className="text-2xl font-bold text-gray-800">New Booking</h1>
//           <div className="w-8"></div> {/* Spacer for balance */}
//         </div>
//       </header>

//       {/* Progress Bar */}
//       <div className="container mx-auto px-4 mt-6">
//         <div className="mb-6">
//           <div className="flex justify-between mb-1">
//             <span className="text-sm font-medium text-[#c3ad6b]">Progress</span>
//             <span className="text-sm font-medium text-[#c3ad6b]">
//               {progress}%
//             </span>
//           </div>
//           <div className="w-full bg-gray-200 rounded-full h-2.5">
//             <div
//               className="bg-[#c3ad6b] h-2.5 rounded-full transition-all duration-500 ease-out"
//               style={{ width: `${progress}%` }}
//             ></div>
//           </div>
//         </div>
//       </div>

//       {/* Main Form */}
//       <main className="container mx-auto px-4 py-6">
//         <div className="bg-white rounded-xl shadow-md overflow-hidden">
//           {/* Form Sections */}
//           <div className="p-6 space-y-8">
//             {/* Guest Information Section */}
//             <section className="space-y-4">
//               <div className="flex items-center space-x-3">
//                 <div className="bg-[#c3ad6b]/20 p-2 rounded-full">
//                   <FaUser className="text-[#c3ad6b] text-lg" />
//                 </div>
//                 <h2 className="text-xl font-semibold text-gray-800">
//                   Guest Information
//                 </h2>
//               </div>

//               <div className="grid md:grid-cols-2 gap-6">
//                 {/* Name */}
//                 <div className="space-y-1">
//                   <label className="block text-sm font-medium text-gray-700">
//                     Full Name *
//                   </label>
//                   <div className="relative">
//                     <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                     <input
//                       type="text"
//                       name="name"
//                       className={`pl-10 w-full rounded-lg border ${
//                         errors.name ? "border-red-500" : "border-gray-300"
//                       } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3`}
//                       onChange={handleChange}
//                       value={form.name}
//                       required
//                     />
//                   </div>
//                   {errors.name && (
//                     <p className="text-red-500 text-xs mt-1">{errors.name}</p>
//                   )}
//                 </div>

//                 {/* Email */}
//                 <div className="space-y-1">
//                   <label className="block text-sm font-medium text-gray-700">
//                     Email
//                   </label>
//                   <div className="relative">
//                     <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                     <input
//                       type="email"
//                       name="email"
//                       className="pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3"
//                       onChange={handleChange}
//                       value={form.email}
//                     />
//                   </div>
//                 </div>

//                 {/* Phone */}
//                 <div className="space-y-1">
//                   <label className="block text-sm font-medium text-gray-700">
//                     Mobile Number *
//                   </label>
//                   <div className="relative">
//                     <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                     <input
//                       type="tel"
//                       name="number"
//                       maxLength={10}
//                       className={`pl-10 w-full rounded-lg border ${
//                         errors.number ? "border-red-500" : "border-gray-300"
//                       } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3`}
//                       onChange={handleChange}
//                       value={form.number}
//                       required
//                     />
//                   </div>
//                   {errors.number && (
//                     <p className="text-red-500 text-xs mt-1">{errors.number}</p>
//                   )}
//                 </div>

//                 {/* WhatsApp */}
//                 <div className="space-y-1">
//                   <label className="block text-sm font-medium text-gray-700">
//                     WhatsApp Number
//                   </label>
//                   <div className="relative">
//                     <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                     <input
//                       type="tel"
//                       name="whatsapp"
//                       maxLength={10}
//                       className="pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3"
//                       onChange={handleChange}
//                       value={form.whatsapp}
//                     />
//                   </div>
//                 </div>
//               </div>
//             </section>

//             <div className="border-t border-gray-200"></div>

//             {/* Booking Details Section */}
//             <section className="space-y-4">
//               <div className="flex items-center space-x-3">
//                 <div className="bg-[#c3ad6b]/20 p-2 rounded-full">
//                   <FaRegCalendarAlt className="text-[#c3ad6b] text-lg" />
//                 </div>
//                 <h2 className="text-xl font-semibold text-gray-800">
//                   Booking Details
//                 </h2>
//               </div>

//               <div className="grid md:grid-cols-2 gap-6">
//                 {/* Pax */}
//                 <div className="space-y-1">
//                   <label className="block text-sm font-medium text-gray-700">
//                     Number of Pax *
//                   </label>
//                   <div className="relative">
//                     <FaUsers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                     <input
//                       type="number"
//                       name="pax"
//                       className={`pl-10 w-full rounded-lg border ${
//                         errors.pax ? "border-red-500" : "border-gray-300"
//                       } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3`}
//                       onChange={handleChange}
//                       value={form.pax}
//                       required
//                     />
//                   </div>
//                   {errors.pax && (
//                     <p className="text-red-500 text-xs mt-1">{errors.pax}</p>
//                   )}
//                 </div>

//                 {/* Date */}
//                 <div className="space-y-1">
//                   <label className="block text-sm font-medium text-gray-700">
//                     Booking Date *
//                   </label>
//                   <div className="relative">
//                     <FaRegCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                     <input
//                       type="date"
//                       name="startDate"
//                       className={`pl-10 w-full rounded-lg border ${
//                         errors.startDate ? "border-red-500" : "border-gray-300"
//                       } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3`}
//                       onChange={handleChange}
//                       value={form.startDate}
//                       required
//                     />
//                   </div>
//                   {errors.startDate && (
//                     <p className="text-red-500 text-xs mt-1">
//                       {errors.startDate}
//                     </p>
//                   )}
//                 </div>

//                 {/* Time */}
//                 <div className="space-y-1">
//                   <label className="block text-sm font-medium text-gray-700">
//                     Time *
//                   </label>
//                   <div className="relative">
//                     <FaRegCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                     <input
//                       type="time"
//                       name="time"
//                       className={`pl-10 w-full rounded-lg border ${
//                         errors.time ? "border-red-500" : "border-gray-300"
//                       } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3`}
//                       onChange={handleChange}
//                       value={form.time}
//                       required
//                     />
//                   </div>
//                   {errors.time && (
//                     <p className="text-red-500 text-xs mt-1">{errors.time}</p>
//                   )}
//                 </div>

//                 {/* Hall */}
//                 <div className="space-y-1">
//                   <label className="block text-sm font-medium text-gray-700">
//                     Hall Type *
//                   </label>
//                   <select
//                     name="hall"
//                     className={`w-full rounded-lg border ${
//                       errors.hall ? "border-red-500" : "border-gray-300"
//                     } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3`}
//                     onChange={handleChange}
//                     value={form.hall || ""}
//                     required
//                   >
//                     <option value="">Select Hall Type</option>
//                     <option value="Kitty Hall">Kitty Hall</option>
//                     <option value="Banquet Hall">Banquet Hall</option>
//                     <option value="Rooftop Hall">Rooftop Hall</option>
//                     <option value="Flamingo Rooftop">Flamingo Rooftop</option>
//                   </select>
//                   {errors.hall && (
//                     <p className="text-red-500 text-xs mt-1">{errors.hall}</p>
//                   )}
//                 </div>

//                 {/* Room Options - Only show if hall is selected */}
//                 {form.hall && (
//                   <div className="space-y-1">
//                     <label className="block text-sm font-medium text-gray-700">
//                       Room Option
//                     </label>
//                     <select
//                       name="roomOption"
//                       className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3"
//                       onChange={handleChange}
//                       value={form.roomOption}
//                     >
//                       <option value="complimentary">
//                         Complimentary Free Room
//                       </option>
//                       <option value="additional">Additional Room</option>
//                       <option value="both">
//                         Complimentary + Additional Room
//                       </option>
//                     </select>
//                   </div>
//                 )}

//                 {/* Complimentary Rooms - Show only for complimentary or both options */}
//                 {form.hall &&
//                   (form.roomOption === "complimentary" ||
//                     form.roomOption === "both") && (
//                     <div className="space-y-1">
//                       <label className="block text-sm font-medium text-gray-700">
//                         Complimentary Rooms
//                       </label>
//                       <input
//                         type="number"
//                         name="complimentaryRooms"
//                         min={0}
//                         className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 px-3"
//                         value={
//                           form.complimentaryRooms === ""
//                             ? ""
//                             : form.complimentaryRooms
//                         }
//                         onChange={(e) =>
//                           setForm({
//                             ...form,
//                             complimentaryRooms:
//                               e.target.value === ""
//                                 ? ""
//                                 : Number(e.target.value),
//                           })
//                         }
//                       />
//                       <div className="text-green-600 font-medium">FREE</div>
//                     </div>
//                   )}

//                 {/* Additional Rooms - Show only for additional or both options */}
//                 {form.hall &&
//                   (form.roomOption === "additional" ||
//                     form.roomOption === "both") && (
//                     <div className="space-y-1">
//                       <label className="block text-sm font-medium text-gray-700">
//                         Additional Rooms
//                       </label>
//                       <input
//                         type="number"
//                         name="extraRooms"
//                         className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3"
//                         onChange={(e) => {
//                           const value = e.target.value;
//                           const extraRoomsNum =
//                             value === "" ? 0 : parseInt(value, 10);
//                           const pricePerRoomNum =
//                             form.roomPricePerUnit === ""
//                               ? 0
//                               : parseFloat(form.roomPricePerUnit);
//                           const extraRoomTotalPrice =
//                             pricePerRoomNum * extraRoomsNum;

//                           setForm({
//                             ...form,
//                             extraRooms: value, // keep as string for input
//                             rooms:
//                               form.roomOption === "both"
//                                 ? (2 + extraRoomsNum).toString()
//                                 : value,
//                             extraRoomTotalPrice: extraRoomTotalPrice,
//                           });
//                         }}
//                         value={form.extraRooms}
//                       />
//                     </div>
//                   )}

//                 {/* Room Price - only shown when extra rooms are added */}
//                 {form.hall &&
//                   (form.roomOption === "additional" ||
//                     form.roomOption === "both") &&
//                   form.extraRooms > 0 && (
//                     <div className="space-y-1">
//                       <label className="block text-sm font-medium text-gray-700">
//                         Room Price (per room)
//                       </label>
//                       <div className="relative">
//                         <FaRupeeSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                         <input
//                           type="number"
//                           name="roomPricePerUnit"
//                           className="pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3"
//                           onChange={(e) => {
//                             const value = e.target.value;
//                             const pricePerRoomNum =
//                               value === "" ? 0 : parseFloat(value);
//                             const extraRoomsNum =
//                               form.extraRooms === ""
//                                 ? 0
//                                 : parseInt(form.extraRooms, 10);
//                             const extraRoomTotalPrice =
//                               pricePerRoomNum * extraRoomsNum;

//                             setForm({
//                               ...form,
//                               roomPricePerUnit: value, // keep as string for input
//                               extraRoomTotalPrice: extraRoomTotalPrice,
//                             });
//                           }}
//                           value={form.roomPricePerUnit}
//                         />
//                       </div>
//                       <p className="text-sm font-medium text-[#c3ad6b] mt-1">
//                         Total: ₹
//                         {(() => {
//                           const extraRoomsNum =
//                             form.extraRooms === ""
//                               ? 0
//                               : parseInt(form.extraRooms, 10);
//                           const pricePerRoomNum =
//                             form.roomPricePerUnit === ""
//                               ? 0
//                               : parseFloat(form.roomPricePerUnit);
//                           return pricePerRoomNum * extraRoomsNum;
//                         })()}
//                       </p>
//                     </div>
//                   )}

//                 {/* Status */}
//                 <div className="space-y-1">
//                   {/* Booking Status is now managed automatically. No dropdown shown. */}
//                   <label className="block text-sm font-medium text-gray-700">
//                     Booking Status
//                   </label>
//                   <div className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-gray-700">
//                     {form.bookingStatus}
//                   </div>
//                 </div>

//                 {/* Rate Plan */}
//                 <div className="space-y-1">
//                   <label className="block text-sm font-medium text-gray-700">
//                     Rate Plan *
//                   </label>
//                   <select
//                     name="ratePlan"
//                     className={`w-full rounded-lg border ${
//                       errors.ratePlan ? "border-red-500" : "border-gray-300"
//                     } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3`}
//                     onChange={handleChange}
//                     value={form.ratePlan || ""}
//                     required
//                     disabled={form.useCustomPrice}
//                   >
//                     <option value="">Select Rate Plan</option>
//                     <option value="Silver">Silver</option>
//                     <option value="Gold">Gold</option>
//                     {/* <option value="Platinum">Platinum</option> */}
//                   </select>
//                   {errors.ratePlan && (
//                     <p className="text-red-500 text-xs mt-1">
//                       {errors.ratePlan}
//                     </p>
//                   )}
//                 </div>

//                 {/* Food Type */}
//                 <div className="space-y-1">
//                   <label className="block text-sm font-medium text-gray-700">
//                     Food Type *
//                   </label>
//                   <select
//                     name="foodType"
//                     className={`w-full rounded-lg border ${
//                       errors.foodType ? "border-red-500" : "border-gray-300"
//                     } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3`}
//                     onChange={handleChange}
//                     value={form.foodType || ""}
//                     required
//                     disabled={form.useCustomPrice}
//                   >
//                     <option value="">Select Food Type</option>
//                     <option value="Veg">Veg</option>
//                     {form.ratePlan !== "Silver" && (
//                       <option value="Non-Veg">Non-Veg</option>
//                     )}
//                   </select>
//                   {errors.foodType && (
//                     <p className="text-red-500 text-xs mt-1">
//                       {errors.foodType}
//                     </p>
//                   )}
//                 </div>

//                 {/* Custom Plate Price - Admin Only */}
//                 {isAdmin() && (
//                   <div className="space-y-1">
//                     <div className="flex items-center space-x-2 mb-2">
//                       <input
//                         type="checkbox"
//                         name="useCustomPrice"
//                         checked={form.useCustomPrice}
//                         onChange={handleChange}
//                         className="rounded border-gray-300 text-[#c3ad6b] focus:ring-[#c3ad6b]"
//                       />
//                       <label className="text-sm font-medium text-gray-700">
//                         Set Custom Plate Price
//                       </label>
//                     </div>
//                     {form.useCustomPrice && (
//                       <div className="relative">
//                         <FaRupeeSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                         <input
//                           type="number"
//                           name="customPlatePrice"
//                           className="pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3"
//                           onChange={handleChange}
//                           value={form.customPlatePrice}
//                           placeholder="Enter price per plate"
//                           min="0"
//                         />
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </div>
//             </section>

//             <div className="border-t border-gray-200"></div>

//             {/* Payment Section */}
//             <section className="space-y-4">
//               <div className="flex items-center space-x-3">
//                 <div className="bg-[#c3ad6b]/20 p-2 rounded-full">
//                   <FaMoneyBillWave className="text-[#c3ad6b] text-lg" />
//                 </div>
//                 <h2 className="text-xl font-semibold text-gray-800">
//                   Payment Information
//                 </h2>
//               </div>

//               <div className="grid md:grid-cols-3 gap-6">
//                 {/* Decoration */}
//                 <div className="space-y-2">
//                   <div className="flex items-center space-x-2">
//                     <input
//                       type="checkbox"
//                       name="hasDecoration"
//                       checked={form.hasDecoration}
//                       onChange={handleChange}
//                       className="rounded border-gray-300 text-[#c3ad6b] focus:ring-[#c3ad6b]"
//                     />
//                     <label className="text-sm font-medium text-gray-700">
//                       Decoration Charge
//                     </label>
//                   </div>
//                   {form.hasDecoration && (
//                     <div className="relative">
//                       <FaRupeeSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                       <input
//                         type="number"
//                         name="decorationCharge"
//                         className="pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3"
//                         onChange={handleChange}
//                         value={form.decorationCharge}
//                         placeholder="Enter amount"
//                       />
//                     </div>
//                   )}
//                 </div>

//                 {/* Music */}
//                 <div className="space-y-2">
//                   <div className="flex items-center space-x-2">
//                     <input
//                       type="checkbox"
//                       name="hasMusic"
//                       checked={form.hasMusic}
//                       onChange={handleChange}
//                       className="rounded border-gray-300 text-[#c3ad6b] focus:ring-[#c3ad6b]"
//                     />
//                     <label className="text-sm font-medium text-gray-700">
//                       Music Charge
//                     </label>
//                   </div>
//                   {form.hasMusic && (
//                     <div className="relative">
//                       <FaRupeeSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                       <input
//                         type="number"
//                         name="musicCharge"
//                         className="pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3"
//                         onChange={handleChange}
//                         value={form.musicCharge}
//                         placeholder="Enter amount"
//                       />
//                     </div>
//                   )}
//                 </div>

//                 {/* GST (manual input) */}
//                 <div className="space-y-1">
//                   <label className="block text-sm font-medium text-gray-700">
//                     GST In Percentage (%)
//                   </label>
//                   <div className="relative">
//                     <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">%</span>
//                     <input
//                       type="number"
//                       name="gst"
//                       className="pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3"
//                       onChange={handleChange}
//                       value={form.gst}
//                       placeholder="Enter GST % if applicable"
//                       min="0"
//                       max="100"
//                     />
//                   </div>
//                   {/* <p className="text-xs text-gray-500">Leave empty if no GST applicable</p> */}
//                 </div>
//               </div>

//               <div className="grid md:grid-cols-3 gap-6 mt-4">
//                 {/* Advance */}
//                 <div className="space-y-1">
//                   <label className="block text-sm font-medium text-gray-700">
//                     Advance Payment
//                   </label>
//                   <div className="relative">
//                     <FaRupeeSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                     <input
//                       type="number"
//                       name="advance"
//                       className="pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3"
//                       onChange={handleChange}
//                       value={form.advance}
//                     />
//                   </div>
//                 </div>

//                 {/* Total */}
//                 <div className="space-y-1">
//                   <label className="block text-sm font-medium text-gray-700">
//                     Total Amount
//                   </label>
//                   <div className="relative">
//                     <FaRupeeSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                     <input
//                       type="number"
//                       name="total"
//                       className="pl-10 w-full rounded-lg border border-gray-300 py-2 px-3"
//                       value={form.total}
//                       onChange={handleChange}
//                     />
//                   </div>
//                 </div>

//                 {/* Balance */}
//                 <div className="space-y-1">
//                   <label className="block text-sm font-medium text-gray-700">
//                     Balance
//                   </label>
//                   <div className="relative">
//                     <FaRupeeSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                     <input
//                       type="number"
//                       name="balance"
//                       className="pl-10 w-full rounded-lg border border-gray-300 py-2 px-3"
//                       value={form.balance}
//                       onChange={handleChange}
//                     />
//                   </div>
//                 </div>
//               </div>
//             </section>

//             {/* Rate Plan Summary Section */}
//             <section className="space-y-4">
//               <div className="flex items-center space-x-3">
//                 <div className="bg-[#c3ad6b]/20 p-2 rounded-full">
//                   <FaMoneyBillWave className="text-[#c3ad6b] text-lg" />
//                 </div>
//                 <h2 className="text-xl font-semibold text-gray-800">
//                   Rate Plan Summary
//                 </h2>
//               </div>
//               {/* Modern Card Layout */}
//               <div className="bg-white shadow-lg rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:space-x-8 space-y-4 md:space-y-0 border border-[#f3e9d1]">
//                 {/* Rate Plan & Food Type */}
//                 <div className="flex-1 flex flex-col items-center md:items-start">
//                   <div className="flex items-center space-x-2 mb-1">
//                     <FaUtensils className="text-[#c3ad6b] text-xl" />
//                     <span className="font-semibold text-gray-700 text-lg">
//                       {form.ratePlan || (
//                         <span className="text-gray-400">N/A</span>
//                       )}
//                     </span>
//                   </div>
//                   <span className="text-xs text-gray-500">Rate Plan</span>
//                   {form.foodType &&
//                     form.ratePlan &&
//                     RATE_CONFIG[form.foodType] &&
//                     RATE_CONFIG[form.foodType][form.ratePlan] && (
//                       <div className="text-xs text-gray-500 mt-1">
//                         {(() => {
//                           if (form.useCustomPrice) {
//                             const customPrice = parseFloat(form.customPlatePrice) || 0;
//                             const discount = parseFloat(form.discount) || 0;
//                             const displayPrice = customPrice - discount;
//                             return (
//                               <>
//                                 Custom Rate:{" "}
//                                 <span className="font-bold text-blue-600">
//                                   ₹{displayPrice}
//                                 </span>
//                                 {discount > 0 && (
//                                   <span className="ml-2 text-green-600">
//                                     (Discounted)
//                                   </span>
//                                 )}
//                               </>
//                             );
//                           } else {
//                             const base =
//                               RATE_CONFIG[form.foodType][form.ratePlan].basePrice;
//                             const discount = parseFloat(form.discount) || 0;
//                             let displayBase = base;
//                             if (discount > 0) {
//                               displayBase = base - discount;
//                             }
//                             return (
//                               <>
//                                 {form.ratePlan} Rate:{" "}
//                                 <span className="font-bold text-[#c3ad6b]">
//                                   ₹{displayBase}
//                                 </span>
//                                 {discount > 0 && (
//                                   <span className="ml-2 text-green-600">
//                                     (Discounted)
//                                   </span>
//                                 )}
//                               </>
//                             );
//                           }
//                         })()}
//                       </div>
//                     )}
//                 </div>
//                 {/* Food Type */}
//                 <div className="flex-1 flex flex-col items-center md:items-start">
//                   <div className="flex items-center space-x-2 mb-1">
//                     <FaUsers className="text-[#c3ad6b] text-xl" />
//                     <span className="font-semibold text-gray-700 text-lg">
//                       {form.foodType || (
//                         <span className="text-gray-400">N/A</span>
//                       )}
//                     </span>
//                   </div>
//                   <span className="text-xs text-gray-500">Food Type</span>
//                 </div>
//                 {/* Calculation */}
//                 <div className="flex-1 flex flex-col items-center md:items-start">
//                   <div className="flex items-center space-x-2 mb-1">
//                     <FaRupeeSign className="text-[#c3ad6b] text-xl" />
//                     <span className="font-semibold text-gray-700 text-lg">
//                       Calculation
//                     </span>
//                   </div>
//                   {(form.useCustomPrice ? (form.pax && form.customPlatePrice) : (form.ratePlan && form.foodType && form.pax)) ? (
//                     <>
//                       {(() => {
//                         let base;
//                         if (form.useCustomPrice) {
//                           base = parseFloat(form.customPlatePrice) || 0;
//                         } else {
//                           const rateInfo = RATE_CONFIG[form.foodType][form.ratePlan];
//                           if (!rateInfo) return null;
//                           base = rateInfo.basePrice;
//                         }
                        
//                         const discount = parseFloat(form.discount) || 0;
//                         const discountedBase = discount > 0 ? base - discount : base;
//                         const gstPercent = parseFloat(form.gst) || 0;
//                         const gstAmount = (discountedBase * gstPercent) / 100;
//                         const rateWithGST = discountedBase + gstAmount;
//                         const pax = parseInt(form.pax) || 0;
//                         const foodTotal = (rateWithGST * pax);
//                         const decorationCharge = form.hasDecoration ? (parseFloat(form.decorationCharge) || 0) : 0;
//                         const musicCharge = form.hasMusic ? (parseFloat(form.musicCharge) || 0) : 0;
//                         const grandTotal = foodTotal + decorationCharge + musicCharge;
//                         return (
//                           <>
//                             <div className="text-sm text-gray-600">
//                               Food: ₹{rateWithGST.toFixed(2)} x {pax} = ₹{foodTotal.toFixed(2)}
//                               {form.useCustomPrice && <span className="text-blue-600 ml-1">(Custom)</span>}
//                             </div>
//                             {decorationCharge > 0 && (
//                               <div className="text-sm text-gray-600">
//                                 Decoration: ₹{decorationCharge}
//                               </div>
//                             )}
//                             {musicCharge > 0 && (
//                               <div className="text-sm text-gray-600">
//                                 Music: ₹{musicCharge}
//                               </div>
//                             )}
//                             <div className="text-lg font-bold text-[#c3ad6b] mt-1">
//                               Total: ₹{grandTotal.toFixed(2)}
//                             </div>
//                             <div className="text-xs text-gray-500 mt-1">
//                               Rate per pax: ₹{discountedBase} + ₹
//                               {gstAmount.toFixed(2)} (GST) = ₹
//                               {rateWithGST.toFixed(2)}
//                             </div>
//                           </>
//                         );
//                       })()}
//                     </>
//                   ) : (
//                     <span className="text-gray-400">N/A</span>
//                   )}
//                 </div>
//                 {/* Total Amount */}
//                 <div className="flex-1 flex flex-col items-center md:items-start">
//                   <div className="flex items-center space-x-2 mb-1">
//                     <FaMoneyBillWave className="text-[#c3ad6b] text-xl" />
//                     <span className="font-semibold text-gray-700 text-lg">
//                       Total
//                     </span>
//                   </div>
//                   <span className="text-2xl font-extrabold text-[#c3ad6b]">
//                     {form.total || <span className="text-gray-400">N/A</span>}
//                   </span>
//                   <span className="text-xs text-gray-500">Total Amount</span>
//                 </div>
//               </div>
//               {/* Discount Input Section */}
//               <div className="mt-4 flex flex-col md:flex-row md:items-center md:space-x-8 space-y-2 md:space-y-0">
//                 <div className="flex-1">
//                   <label className="block text-sm font-medium text-gray-700">
//                     Discount{" "}
//                     {isAdmin() ? "(unlimited)" : ""}
//                   </label>
//                   <input
//                     type="number"
//                     name="discount"
//                     className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3"
//                     onChange={handleChange}
//                     value={form.discount}
//                     min={0}
//                     max={
//                       isAdmin() ? undefined
//                         : form.ratePlan === "Silver"
//                         ? 100
//                         : form.ratePlan === "Gold"
//                         ? 150
//                         : form.ratePlan === "Platinum"
//                         ? 200
//                         : 0
//                     }
//                     placeholder="Enter discount"
//                     disabled={!form.ratePlan}
//                   />
//                   <div className="text-xs text-gray-500 mt-1">
//                     {form.ratePlan
//                       ? isAdmin()
//                         ? "No discount limit for Admin"
//                         : form.ratePlan === "Silver"
//                         ? "Maximum discount allowed: ₹100"
//                         : form.ratePlan === "Gold"
//                         ? "Maximum discount allowed: ₹150"
//                         : form.ratePlan === "Platinum"
//                         ? "Maximum discount allowed: ₹200"
//                         : "Select a Rate Plan to enable discount"
//                       : "Select a Rate Plan to enable discount"}
//                   </div>
//                 </div>
//               </div>
//             </section>

//             <div className="border-t border-gray-200"></div>

//             {/* Notes & Menu Section */}
//             <section className="space-y-4">
//               <div className="flex items-center space-x-3">
//                 <div className="bg-[#c3ad6b]/20 p-2 rounded-full">
//                   <FaStickyNote className="text-[#c3ad6b] text-lg" />
//                 </div>
//                 <h2 className="text-xl font-semibold text-gray-800">
//                   Notes & Menu
//                 </h2>
//               </div>

//               <div className="grid md:grid-cols-2 gap-6">
//                 {/* Notes */}
//                 <div className="space-y-1">
//                   <label className="block text-sm font-medium text-gray-700">
//                     Additional Notes
//                   </label>
//                   <textarea
//                     name="notes"
//                     className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3 h-32"
//                     onChange={handleChange}
//                     value={form.notes}
//                     placeholder="Special requests, allergies, etc."
//                   />
//                 </div>

//                 {/* Menu */}
//                 <div className="space-y-1">
//                   <label className="block text-sm font-medium text-gray-700">
//                     Selected Menu Items
//                   </label>
//                   <textarea
//                     name="menuItems"
//                     className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 px-3 h-24"
//                     value={form.menuItems}
//                     readOnly
//                     placeholder="No menu items selected yet"
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowMenuSelector(true)}
//                     className="mt-2 w-full md:w-auto flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#c3ad6b] hover:bg-[#b39b5a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c3ad6b]"
//                   >
//                     <FaUtensils className="mr-2" /> Select Menu Items
//                   </button>
//                 </div>
//               </div>
//             </section>

//             {/* Submit Button */}
//             <div className="pt-6">
//               <button
//                 disabled={loading}
//                 onClick={addBooking}
//                 className={`w-full md:w-1/2 mx-auto flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white ${
//                   submitSuccess
//                     ? "bg-green-600 hover:bg-green-700"
//                     : "bg-[#c3ad6b] hover:bg-[#b39b5a]"
//                 } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c3ad6b] transition-colors duration-300 ${
//                   submitError ? "animate-shake" : ""
//                 }`}
//               >
//                 {submitSuccess ? (
//                   <>
//                     <FaCheckCircle className="mr-2 animate-bounce" /> Booking
//                     Created!
//                   </>
//                 ) : loading ? (
//                   <>
//                     <svg
//                       className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
//                       xmlns="http://www.w3.org/2000/svg"
//                       fill="none"
//                       viewBox="0 0 24 24"
//                     >
//                       <circle
//                         className="opacity-25"
//                         cx="12"
//                         cy="12"
//                         r="10"
//                         stroke="currentColor"
//                         strokeWidth="4"
//                       ></circle>
//                       <path
//                         className="opacity-75"
//                         fill="currentColor"
//                         d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                       ></path>
//                     </svg>
//                     Processing...
//                   </>
//                 ) : (
//                   "Create Booking"
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       </main>

//       {/* Menu Selector Modal */}
//       {showMenuSelector && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
//           <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden animate-scale-in">
//             <div className="p-4 border-b border-gray-200 flex justify-between items-center">
//               <h3 className="text-lg font-semibold text-gray-800">
//                 Select Menu Items
//               </h3>
//               <button
//                 onClick={() => setShowMenuSelector(false)}
//                 className="text-gray-500 hover:text-gray-700 focus:outline-none"
//               >
//                 <svg
//                   className="h-6 w-6"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   stroke="currentColor"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M6 18L18 6M6 6l12 12"
//                   />
//                 </svg>
//               </button>
//             </div>
//             <div
//               className="p-6 overflow-y-auto"
//               style={{ maxHeight: "calc(90vh - 68px)" }}
//             >
//               <MenuSelector
//                 onSave={handleSaveMenu}
//                 initialItems={form.menuItems ? form.menuItems.split(", ") : []}
//                 onClose={() => setShowMenuSelector(false)}
//                 foodType={form.foodType}
//                 ratePlan={form.ratePlan}
//               />
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AddBooking;
import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAppContext } from "../../../../context/AppContext";
import MenuSelector from "../Menu/MenuSelector";
import DashboardLoader from "../../../DashboardLoader";
import {
  FaUser,
  FaArrowLeft,
  FaMoneyBillWave,
  FaPhone,
  FaStickyNote,
  FaRegCalendarAlt,
  FaEnvelope,
  FaUsers,
  FaUtensils,
  FaRupeeSign,
  FaCheckCircle,
} from "react-icons/fa";

// Rate configuration
const RATE_CONFIG = {
  Veg: {
    Silver: {
      basePrice: 1050,
      taxPercent: 18,
    },
    Gold: {
      basePrice: 1250,
      taxPercent: 18,
    },
    Platinum: {
      basePrice: 1899,
      taxPercent: 18,
    },
  },
  "Non-Veg": {
    Silver: {
      basePrice: 1050,
      taxPercent: 18,
    },
    Gold: {
      basePrice: 1250,
      taxPercent: 18,
    },
    Platinum: {
      basePrice: 2299,
      taxPercent: 18,
    },
  },
};

const requiredFields = [
  "name",
  "number",
  "startDate",
  "pax",
  "ratePlan",
  "foodType",
];

const AddBooking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Helper function to check if user is admin
  const isAdmin = () => {
    const role = localStorage.getItem("role");
    return role?.toLowerCase() === "admin";
  };
  const selectedDateFromCalendar = location.state?.selectedDate || "";
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [showMenuSelector, setShowMenuSelector] = useState(false);
  const [errors, setErrors] = useState({});
  const [progress, setProgress] = useState(0); // For progress bar
  const [submitSuccess, setSubmitSuccess] = useState(false); // For button animation
  const [submitError, setSubmitError] = useState(false); // For button shake

  // WebSocket removed
  const sendMessage = () => {};

  const [form, setForm] = useState({
    name: "",
    email: "",
    number: "",
    whatsapp: "",
    pax: "",
    startDate: selectedDateFromCalendar,
    hall: "",
    time: "",
    bookingStatus: "Enquiry", // Default status

    // Initialize statusHistory with the default status and timestamp
    statusHistory: [
      {
        status: "Enquiry",
        type: false,
        changedAt: new Date().toISOString(),
      },
    ],

    ratePlan: "",
    roomOption: "complimentary",
    complimentaryRooms: "",
    advance: [],
    gst: "", // GST input (manual)
    total: "",
    balance: "",
    foodType: "Veg",
    ratePerPax: "",
    notes: "",
    menuItems: "",
    isConfirmed: false,
    categorizedMenu: {},
    discount: "",
    decorationCharge: "",
    musicCharge: "",
    hasDecoration: false,
    hasMusic: false,
    staffEditCount: 0, // Add this field for new bookings
    useCustomPrice: false, // Admin can override calculated price
    customPlatePrice: "", // Custom price per plate
    paymentMethod: "cash", // Payment method
    transactionId: "", // Transaction ID for online payments
    mealPlan: "Without Breakfast" // Meal plan option
  });

  // Calculate total when pax, ratePlan, foodType, gst, discount, decoration, or music charges change
  useEffect(() => {
    if (form.pax && (form.useCustomPrice ? form.customPlatePrice : (form.ratePlan && form.foodType))) {
      const paxNum = parseInt(form.pax) || 0;
      const gstPercent = parseFloat(form.gst) || 0;
      const discountPercent = parseFloat(form.discount) || 0;
      
      let basePrice;
      if (form.useCustomPrice) {
        basePrice = parseFloat(form.customPlatePrice) || 0;
      } else {
        const rateInfo = RATE_CONFIG[form.foodType][form.ratePlan];
        if (!rateInfo) return;
        basePrice = rateInfo.basePrice;
      }
      
      const discountAmount = (basePrice * discountPercent) / 100;
      const discountedPrice = basePrice - discountAmount;
      const gstAmount = (discountedPrice * gstPercent) / 100;
      const rateWithGST = discountedPrice + gstAmount;
      const foodTotal = rateWithGST * paxNum;
      
      // Add decoration and music charges
      const decorationCharge = form.hasDecoration ? (parseFloat(form.decorationCharge) || 0) : 0;
      const musicCharge = form.hasMusic ? (parseFloat(form.musicCharge) || 0) : 0;
      const total = foodTotal + decorationCharge + musicCharge;
      
      setForm((prev) => ({
        ...prev,
        total: total ? total.toFixed(2) : "",
        ratePerPax: rateWithGST.toFixed(2),
      }));
    }
  }, [form.pax, form.ratePlan, form.foodType, form.gst, form.discount, form.decorationCharge, form.musicCharge, form.hasDecoration, form.hasMusic, form.useCustomPrice, form.customPlatePrice]);

  // Balance calculation with advance array
  useEffect(() => {
    const totalAdvance = form.advance.reduce((sum, adv) => sum + (parseFloat(adv.amount) || 0), 0);
    const total = parseFloat(form.total) || 0;
    const balance = total - totalAdvance;
    setForm((prev) => ({ ...prev, balance: balance.toFixed(2) }));
  }, [form.advance, form.total]);

  // Auto-update bookingStatus based on advance payment
  useEffect(() => {
    const totalAdvance = form.advance.reduce((sum, adv) => sum + (parseFloat(adv.amount) || 0), 0);
    let newStatus = form.bookingStatus;
    if (totalAdvance > 0) {
      newStatus = "Confirmed";
    } else {
      newStatus = "Enquiry";
    }
    if (newStatus !== form.bookingStatus) {
      setForm((prev) => ({
        ...prev,
        bookingStatus: newStatus,
      }));
    }
  }, [form.advance, form.total]);

  // Add advance payment
  const addAdvancePayment = () => {
    setForm(prev => ({
      ...prev,
      advance: [...prev.advance, {
        amount: 0,
        date: new Date(),
        method: "cash",
        remarks: ""
      }]
    }));
  };

  // Update advance payment
  const updateAdvancePayment = (index, field, value) => {
    setForm(prev => ({
      ...prev,
      advance: prev.advance.map((adv, i) => 
        i === index ? { ...adv, [field]: value } : adv
      )
    }));
  };

  // Remove advance payment
  const removeAdvancePayment = (index) => {
    setForm(prev => ({
      ...prev,
      advance: prev.advance.filter((_, i) => i !== index)
    }));
  };



  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Calculate progress
    const filled = requiredFields.filter((f) => form[f]);
    setProgress(Math.round((filled.length / requiredFields.length) * 100));
  }, [form]);

  if (pageLoading) {
    return <DashboardLoader pageName="Add Booking" />;
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let val = type === "checkbox" ? checked : value;
    
    // Reset charges when unchecking
    if (name === "hasDecoration" && !checked) {
      setForm(prev => ({ ...prev, hasDecoration: false, decorationCharge: "" }));
      return;
    }
    if (name === "hasMusic" && !checked) {
      setForm(prev => ({ ...prev, hasMusic: false, musicCharge: "" }));
      return;
    }
    
    // Handle custom price toggle
    if (name === "useCustomPrice") {
      setForm(prev => ({ 
        ...prev, 
        useCustomPrice: checked, 
        customPlatePrice: checked ? "" : prev.customPlatePrice 
      }));
      return;
    }
    
    // Handle rate plan change - auto set food type for Silver
    if (name === "ratePlan") {
      if (val === "Silver") {
        setForm(prev => ({ ...prev, [name]: val, foodType: "Veg" }));
        return;
      } else if (form.ratePlan === "Silver" && val !== "Silver") {
        // Reset food type when switching away from Silver
        setForm(prev => ({ ...prev, [name]: val, foodType: "" }));
        return;
      }
    }

    // Capitalize name field - make all letters uppercase
    if (name === "name") {
      val = val.toUpperCase();
    }
    
    // Discount validation - limit to 10%
    if (name === "discount") {
      if (parseFloat(val) > 10) val = "10";
      if (parseFloat(val) < 0) val = "0";
    }
    
    // If bookingStatus is changed, set statusChangedAt
    if (name === "bookingStatus" && value !== form.bookingStatus) {
      // Add status history tracking and update booleans
      setForm((prev) => {
        let isConfirmed = prev.isConfirmed || false;
        let isEnquiry = prev.isEnquiry || false;
        let isTentative = prev.isTentative || false;
        isConfirmed = prev.isConfirmed || val === "Confirmed";
        isEnquiry = prev.isEnquiry || val === "Enquiry";
        isTentative = prev.isTentative || val === "Tentative";
        return {
          ...prev,
          [name]: val,
          isConfirmed,
          isEnquiry,
          isTentative,
          statusChangedAt: new Date().toISOString(),
          statusHistory: [
            ...(prev.statusHistory || []),
            {
              status: val,
              changedAt: new Date().toISOString(),
            },
          ],
        };
      });
    } else {
      setForm({ ...form, [name]: val });
    }
  };

  const handleSaveMenu = async (selectedItems, categorizedMenu) => {
    try {
      setForm((prev) => ({
        ...prev,
        menuItems: selectedItems.join(", "),
        categorizedMenu: categorizedMenu,
      }));
    } catch (error) {
      toast.error("Error processing menu selection");
      console.error("Menu save error:", error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.name) newErrors.name = "Name is required";
    if (!form.number) newErrors.number = "Mobile number is required";
    if (!form.startDate) newErrors.startDate = "Booking date is required";
    if (!form.pax) newErrors.pax = "Number of pax is required";
    if (!form.ratePlan) newErrors.ratePlan = "Rate plan is required";
    if (!form.foodType) newErrors.foodType = "Food type is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addBooking = async () => {
    setLoading(true);
    setSubmitError(false);
    setSubmitSuccess(false);
    if (!validateForm()) {
      toast.error("Please fill all required fields");
      setLoading(false);
      setSubmitError(true);
      setTimeout(() => setSubmitError(false), 600);
      return;
    }

    try {
      // Compute booleans from statusHistory
      function computeStatusBooleans(statusHistory) {
        let isEnquiry = false,
          isTentative = false,
          isConfirmed = false;
        for (const entry of statusHistory) {
          if (entry.status === "Enquiry") isEnquiry = true;
          if (entry.status === "Tentative") isTentative = true;
          if (entry.status === "Confirmed") isConfirmed = true;
        }
        return { isEnquiry, isTentative, isConfirmed };
      }
      // Prepare the payload - explicitly structure the data
      const payload = {
        ...form,
        complimentaryRooms:
          form.complimentaryRooms === "" ? 0 : Number(form.complimentaryRooms),
        decorationCharge: form.hasDecoration ? (parseFloat(form.decorationCharge) || 0) : 0,
        musicCharge: form.hasMusic ? (parseFloat(form.musicCharge) || 0) : 0,
        statusHistory: [
          {
            status: form.bookingStatus,
            changedAt: new Date().toISOString(),
          },
        ],
        menuItems: form.menuItems || "",
        categorizedMenu: form.categorizedMenu || {},
        ...(form.statusChangedAt
          ? { statusChangedAt: form.statusChangedAt }
          : {}),
        staffEditCount: form.staffEditCount,
      };
      const statusBooleans = computeStatusBooleans(payload.statusHistory || []);
      Object.assign(payload, statusBooleans);

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/banquet-bookings/create`,
        payload
      );

      // Send WebSocket notification for real-time update
      sendMessage({
        type: 'BOOKING_CREATED',
        data: {
          id: response.data._id || response.data.id,
          name: payload.name,
          bookingStatus: payload.bookingStatus
        }
      });

      toast.success("Booking created successfully!");
      const bookingId = response.data._id || response.data.id;
      setTimeout(() => {
        if (bookingId) {
          navigate(`/banquet/invoice/${bookingId}`);
        } else {
          navigate("/banquet/list-booking");
        }
      }, 600);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 1200);
    } catch (err) {
      console.error("Error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Something went wrong");
      setSubmitError(true);
      setTimeout(() => setSubmitError(false), 600);
    } finally {
      setLoading(false);
    }
  };
  // Get the current rate information for display
  const getCurrentRateInfo = () => {
    if (!form.ratePlan || !form.foodType) return null;
    return RATE_CONFIG[form.foodType][form.ratePlan];
  };

  const currentRate = getCurrentRateInfo();

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to="/banquet/list-booking"
            className="flex items-center text-[#c3ad6b] hover:text-[#b39b5a]"
          >
            <FaArrowLeft className="mr-2" /> Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">New Booking</h1>
          <div className="w-8"></div> {/* Spacer for balance */}
        </div>
      </header>

      {/* Progress Bar */}
      <div className="container mx-auto px-4 mt-6">
        <div className="mb-6">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-[#c3ad6b]">Progress</span>
            <span className="text-sm font-medium text-[#c3ad6b]">
              {progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-[#c3ad6b] h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <main className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Form Sections */}
          <div className="p-6 space-y-8">
            {/* Guest Information Section */}
            <section className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-[#c3ad6b]/20 p-2 rounded-full">
                  <FaUser className="text-[#c3ad6b] text-lg" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Guest Information
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      className={`pl-10 w-full rounded-lg border ${
                        errors.name ? "border-red-500" : "border-gray-300"
                      } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3`}
                      onChange={handleChange}
                      value={form.name}
                      required
                    />
                  </div>
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      className="pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3"
                      onChange={handleChange}
                      value={form.email}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      name="number"
                      maxLength={10}
                      className={`pl-10 w-full rounded-lg border ${
                        errors.number ? "border-red-500" : "border-gray-300"
                      } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3`}
                      onChange={handleChange}
                      value={form.number}
                      required
                    />
                  </div>
                  {errors.number && (
                    <p className="text-red-500 text-xs mt-1">{errors.number}</p>
                  )}
                </div>

                {/* WhatsApp */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    WhatsApp Number
                  </label>
                  <div className="relative">
                    <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      name="whatsapp"
                      maxLength={10}
                      className="pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3"
                      onChange={handleChange}
                      value={form.whatsapp}
                    />
                  </div>
                </div>
              </div>
            </section>

            <div className="border-t border-gray-200"></div>

            {/* Booking Details Section */}
            <section className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-[#c3ad6b]/20 p-2 rounded-full">
                  <FaRegCalendarAlt className="text-[#c3ad6b] text-lg" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Booking Details
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Pax */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Number of Pax <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaUsers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      name="pax"
                      className={`pl-10 w-full rounded-lg border ${
                        errors.pax ? "border-red-500" : "border-gray-300"
                      } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3`}
                      onChange={handleChange}
                      value={form.pax}
                      required
                    />
                  </div>
                  {errors.pax && (
                    <p className="text-red-500 text-xs mt-1">{errors.pax}</p>
                  )}
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Booking Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaRegCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      name="startDate"
                      className={`pl-10 w-full rounded-lg border ${
                        errors.startDate ? "border-red-500" : "border-gray-300"
                      } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3`}
                      onChange={handleChange}
                      value={form.startDate}
                      required
                    />
                  </div>
                  {errors.startDate && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.startDate}
                    </p>
                  )}
                </div>

                {/* Time */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Time <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FaRegCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="time"
                      name="time"
                      className={`pl-10 w-full rounded-lg border ${
                        errors.time ? "border-red-500" : "border-gray-300"
                      } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3`}
                      onChange={handleChange}
                      value={form.time}
                      required
                    />
                  </div>
                  {errors.time && (
                    <p className="text-red-500 text-xs mt-1">{errors.time}</p>
                  )}
                </div>

                {/* Hall */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Hall Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="hall"
                    className={`w-full rounded-lg border ${
                      errors.hall ? "border-red-500" : "border-gray-300"
                    } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3`}
                    onChange={handleChange}
                    value={form.hall || ""}
                    required
                  >
                    <option value="">Select Hall Type</option>
                    <option value="Kitty Hall">Kitty Hall</option>
                    <option value="Banquet Hall">Banquet Hall</option>
                    <option value="Rooftop Hall">Rooftop Hall</option>
                    <option value="Flamingo Rooftop">Flamingo Rooftop</option>
                  </select>
                  {errors.hall && (
                    <p className="text-red-500 text-xs mt-1">{errors.hall}</p>
                  )}
                </div>

                {/* Room Options - Only show if hall is selected */}
                {form.hall && (
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Room Option
                    </label>
                    <select
                      name="roomOption"
                      className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3"
                      onChange={handleChange}
                      value={form.roomOption}
                    >
                      <option value="complimentary">
                        Complimentary Free Room
                      </option>
                      <option value="additional">Additional Room</option>
                      <option value="both">
                        Complimentary + Additional Room
                      </option>
                    </select>
                  </div>
                )}

                {/* Complimentary Rooms - Show only for complimentary or both options */}
                {form.hall &&
                  (form.roomOption === "complimentary" ||
                    form.roomOption === "both") && (
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Complimentary Rooms
                      </label>
                      <input
                        type="number"
                        name="complimentaryRooms"
                        min={0}
                        className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 px-3"
                        value={
                          form.complimentaryRooms === ""
                            ? ""
                            : form.complimentaryRooms
                        }
                        onChange={(e) =>
                          setForm({
                            ...form,
                            complimentaryRooms:
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value),
                          })
                        }
                      />
                      <div className="text-green-600 font-medium">FREE</div>
                    </div>
                  )}

                {/* Additional Rooms - Show only for additional or both options */}
                {form.hall &&
                  (form.roomOption === "additional" ||
                    form.roomOption === "both") && (
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Additional Rooms
                      </label>
                      <input
                        type="number"
                        name="extraRooms"
                        className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3"
                        onChange={(e) => {
                          const value = e.target.value;
                          const extraRoomsNum =
                            value === "" ? 0 : parseInt(value, 10);
                          const pricePerRoomNum =
                            form.roomPricePerUnit === ""
                              ? 0
                              : parseFloat(form.roomPricePerUnit);
                          const extraRoomTotalPrice =
                            pricePerRoomNum * extraRoomsNum;

                          setForm({
                            ...form,
                            extraRooms: value, // keep as string for input
                            rooms:
                              form.roomOption === "both"
                                ? (2 + extraRoomsNum).toString()
                                : value,
                            extraRoomTotalPrice: extraRoomTotalPrice,
                          });
                        }}
                        value={form.extraRooms}
                      />
                    </div>
                  )}

                {/* Room Price - only shown when extra rooms are added */}
                {form.hall &&
                  (form.roomOption === "additional" ||
                    form.roomOption === "both") &&
                  form.extraRooms > 0 && (
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Room Price (per room)
                      </label>
                      <div className="relative">
                        <FaRupeeSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="number"
                          name="roomPricePerUnit"
                          className="pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3"
                          onChange={(e) => {
                            const value = e.target.value;
                            const pricePerRoomNum =
                              value === "" ? 0 : parseFloat(value);
                            const extraRoomsNum =
                              form.extraRooms === ""
                                ? 0
                                : parseInt(form.extraRooms, 10);
                            const extraRoomTotalPrice =
                              pricePerRoomNum * extraRoomsNum;

                            setForm({
                              ...form,
                              roomPricePerUnit: value, // keep as string for input
                              extraRoomTotalPrice: extraRoomTotalPrice,
                            });
                          }}
                          value={form.roomPricePerUnit}
                        />
                      </div>
                      <p className="text-sm font-medium text-[#c3ad6b] mt-1">
                        Total: ₹
                        {(() => {
                          const extraRoomsNum =
                            form.extraRooms === ""
                              ? 0
                              : parseInt(form.extraRooms, 10);
                          const pricePerRoomNum =
                            form.roomPricePerUnit === ""
                              ? 0
                              : parseFloat(form.roomPricePerUnit);
                          return pricePerRoomNum * extraRoomsNum;
                        })()}
                      </p>
                    </div>
                  )}

                {/* Status */}
                <div className="space-y-1">
                  {/* Booking Status is now managed automatically. No dropdown shown. */}
                  <label className="block text-sm font-medium text-gray-700">
                    Booking Status
                  </label>
                  <div className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-gray-700">
                    {form.bookingStatus}
                  </div>
                </div>

                {/* Rate Plan */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Rate Plan <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="ratePlan"
                    className={`w-full rounded-lg border ${
                      errors.ratePlan ? "border-red-500" : "border-gray-300"
                    } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3`}
                    onChange={handleChange}
                    value={form.ratePlan || ""}
                    required
                  >
                    <option value="">Select Rate Plan</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    {/* <option value="Platinum">Platinum</option> */}
                  </select>
                  {errors.ratePlan && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.ratePlan}
                    </p>
                  )}
                </div>

                {/* Food Type */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Food Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="foodType"
                    className={`w-full rounded-lg border ${
                      errors.foodType ? "border-red-500" : "border-gray-300"
                    } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3`}
                    onChange={handleChange}
                    value={form.foodType || ""}
                    required
                  >
                    <option value="">Select Food Type</option>
                    <option value="Veg">Veg</option>
                    {form.ratePlan !== "Silver" && (
                      <option value="Non-Veg">Non-Veg</option>
                    )}
                  </select>
                  {errors.foodType && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.foodType}
                    </p>
                  )}
                </div>

                {/* Meal Plan */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="mealPlan"
                      checked={form.mealPlan === "With Breakfast"}
                      onChange={(e) => {
                        setForm(prev => ({
                          ...prev,
                          mealPlan: e.target.checked ? "With Breakfast" : "Without Breakfast"
                        }));
                      }}
                      className="rounded border-gray-300 text-[#c3ad6b] focus:ring-[#c3ad6b]"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      With Breakfast
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    {form.mealPlan === "With Breakfast" ? "Breakfast included" : "Without breakfast"}
                  </p>
                </div>

                {/* Custom Plate Price - Admin Only */}
                {isAdmin() && (
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <input
                        type="checkbox"
                        name="useCustomPrice"
                        checked={form.useCustomPrice}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-[#c3ad6b] focus:ring-[#c3ad6b]"
                      />
                      <label 
                        className="text-sm font-medium text-gray-700 cursor-pointer"
                        onClick={() => handleChange({ target: { name: 'useCustomPrice', type: 'checkbox', checked: !form.useCustomPrice } })}
                      >
                        Set Custom Plate Price
                      </label>
                    </div>
                    {form.useCustomPrice && (
                      <div className="relative">
                        <FaRupeeSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="number"
                          name="customPlatePrice"
                          className="pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3"
                          onChange={handleChange}
                          value={form.customPlatePrice}
                          placeholder="Enter price per plate"
                          min="0"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            <div className="border-t border-gray-200"></div>

            {/* Payment Section */}
            <section className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-[#c3ad6b]/20 p-2 rounded-full">
                  <FaMoneyBillWave className="text-[#c3ad6b] text-lg" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Payment Information
                </h2>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Decoration */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="hasDecoration"
                      checked={form.hasDecoration}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-[#c3ad6b] focus:ring-[#c3ad6b]"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Decoration Charge
                    </label>
                  </div>
                  {form.hasDecoration && (
                    <div className="relative">
                      <FaRupeeSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        name="decorationCharge"
                        className="pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3"
                        onChange={handleChange}
                        value={form.decorationCharge}
                        placeholder="Enter amount"
                      />
                    </div>
                  )}
                </div>

                {/* Music */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="hasMusic"
                      checked={form.hasMusic}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-[#c3ad6b] focus:ring-[#c3ad6b]"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Music Charge
                    </label>
                  </div>
                  {form.hasMusic && (
                    <div className="relative">
                      <FaRupeeSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        name="musicCharge"
                        className="pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3"
                        onChange={handleChange}
                        value={form.musicCharge}
                        placeholder="Enter amount"
                      />
                    </div>
                  )}
                </div>

                {/* Discount */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Discount (%)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">%</span>
                    <input
                      type="number"
                      name="discount"
                      className="pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3"
                      onChange={handleChange}
                      value={form.discount}
                      placeholder="0-10%"
                      min="0"
                      max="10"
                      step="0.1"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Maximum 10% discount allowed</p>
                </div>

                {/* GST (optional) */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    GST In Percentage (%) <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">%</span>
                    <input
                      type="number"
                      name="gst"
                      className="pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3"
                      onChange={handleChange}
                      value={form.gst}
                      placeholder="Enter GST % if applicable"
                      min="0"
                      max="100"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Leave empty if no GST applicable</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mt-4">
                {/* Advance Payments */}
                <div className="space-y-3 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Advance Payments
                    </label>
                    <button
                      type="button"
                      onClick={addAdvancePayment}
                      className="px-3 py-1 bg-[#c3ad6b] text-white rounded-md text-sm hover:bg-[#b39b5a]"
                    >
                      Add Payment
                    </button>
                  </div>
                  {form.advance.map((payment, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Amount
                          </label>
                          <input
                            type="number"
                            value={payment.amount}
                            onChange={(e) => updateAdvancePayment(index, 'amount', parseFloat(e.target.value) || 0)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Date
                          </label>
                          <input
                            type="date"
                            value={payment.date ? new Date(payment.date).toISOString().split('T')[0] : ''}
                            onChange={(e) => updateAdvancePayment(index, 'date', new Date(e.target.value))}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Method
                          </label>
                          <select
                            value={payment.method}
                            onChange={(e) => updateAdvancePayment(index, 'method', e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                          >
                            <option value="cash">Cash</option>
                            <option value="card">Card</option>
                            <option value="upi">UPI</option>
                            <option value="wallet">Wallet</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removeAdvancePayment(index)}
                            className="px-3 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Remarks
                        </label>
                        <input
                          type="text"
                          value={payment.remarks}
                          onChange={(e) => updateAdvancePayment(index, 'remarks', e.target.value)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                          placeholder="Payment remarks"
                        />
                      </div>
                    </div>
                  ))}
                  {form.advance.length === 0 && (
                    <p className="text-gray-500 text-sm italic">No advance payments added</p>
                  )}
                </div>

                {/* Payment Method */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Payment Method
                  </label>
                  <select
                    name="paymentMethod"
                    className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3"
                    onChange={handleChange}
                    value={form.paymentMethod}
                  >
                    <option value="cash">Cash</option>
                    <option value="online">Online</option>
                    <option value="card">Card</option>
                  </select>
                </div>

                {/* Transaction ID - Only show for online and card payments */}
                {(form.paymentMethod === "online" || form.paymentMethod === "card") && (
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Transaction ID
                    </label>
                    <input
                      type="text"
                      name="transactionId"
                      className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3"
                      onChange={handleChange}
                      value={form.transactionId}
                      placeholder="Enter transaction ID"
                    />
                  </div>
                )}

                {/* Total */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Total Amount
                  </label>
                  <div className="relative">
                    <FaRupeeSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      name="total"
                      className="pl-10 w-full rounded-lg border border-gray-300 py-2 px-3"
                      value={form.total}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Balance */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Balance
                  </label>
                  <div className="relative">
                    <FaRupeeSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      name="balance"
                      className="pl-10 w-full rounded-lg border border-gray-300 py-2 px-3"
                      value={form.balance}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Rate Plan Summary Section */}
            <section className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-[#c3ad6b]/20 p-2 rounded-full">
                  <FaMoneyBillWave className="text-[#c3ad6b] text-lg" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Rate Plan Summary
                </h2>
              </div>
              {/* Modern Card Layout */}
              <div className="bg-white shadow-lg rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:space-x-8 space-y-4 md:space-y-0 border border-[#f3e9d1]">
                {/* Rate Plan & Food Type */}
                <div className="flex-1 flex flex-col items-center md:items-start">
                  <div className="flex items-center space-x-2 mb-1">
                    <FaUtensils className="text-[#c3ad6b] text-xl" />
                    <span className="font-semibold text-gray-700 text-lg">
                      {form.ratePlan || (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">Rate Plan</span>
                  {form.foodType &&
                    form.ratePlan &&
                    RATE_CONFIG[form.foodType] &&
                    RATE_CONFIG[form.foodType][form.ratePlan] && (
                      <div className="text-xs text-gray-500 mt-1">
                        {(() => {
                          if (form.useCustomPrice) {
                            const customPrice = parseFloat(form.customPlatePrice) || 0;
                            return (
                              <>
                                Custom Rate:{" "}
                                <span className="font-bold text-blue-600">
                                  ₹{customPrice}
                                </span>
                              </>
                            );
                          } else {
                            const base =
                              RATE_CONFIG[form.foodType][form.ratePlan].basePrice;
                            return (
                              <>
                                {form.ratePlan} Rate:{" "}
                                <span className="font-bold text-[#c3ad6b]">
                                  ₹{base}
                                </span>
                              </>
                            );
                          }
                        })()}
                      </div>
                    )}
                </div>
                {/* Food Type */}
                <div className="flex-1 flex flex-col items-center md:items-start">
                  <div className="flex items-center space-x-2 mb-1">
                    <FaUsers className="text-[#c3ad6b] text-xl" />
                    <span className="font-semibold text-gray-700 text-lg">
                      {form.foodType || (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">Food Type</span>
                </div>
                {/* Calculation */}
                <div className="flex-1 flex flex-col items-center md:items-start">
                  <div className="flex items-center space-x-2 mb-1">
                    <FaRupeeSign className="text-[#c3ad6b] text-xl" />
                    <span className="font-semibold text-gray-700 text-lg">
                      Calculation
                    </span>
                  </div>
                  {(form.useCustomPrice ? (form.pax && form.customPlatePrice) : (form.ratePlan && form.foodType && form.pax)) ? (
                    <>
                      {(() => {
                        let base;
                        if (form.useCustomPrice) {
                          base = parseFloat(form.customPlatePrice) || 0;
                        } else {
                          const rateInfo = RATE_CONFIG[form.foodType][form.ratePlan];
                          if (!rateInfo) return null;
                          base = rateInfo.basePrice;
                        }
                        
                        const discountPercent = parseFloat(form.discount) || 0;
                        const discountAmount = (base * discountPercent) / 100;
                        const discountedPrice = base - discountAmount;
                        const gstPercent = parseFloat(form.gst) || 0;
                        const gstAmount = (discountedPrice * gstPercent) / 100;
                        const rateWithGST = discountedPrice + gstAmount;
                        const pax = parseInt(form.pax) || 0;
                        const foodTotal = (rateWithGST * pax);
                        const decorationCharge = form.hasDecoration ? (parseFloat(form.decorationCharge) || 0) : 0;
                        const musicCharge = form.hasMusic ? (parseFloat(form.musicCharge) || 0) : 0;
                        const grandTotal = foodTotal + decorationCharge + musicCharge;
                        return (
                          <>
                            <span className="text-lg font-bold text-[#c3ad6b]">
                              ₹{rateWithGST.toFixed(2)}
                            </span>
                            <span className="text-gray-700"> x {pax} = </span>
                            <span className="text-lg font-bold text-[#c3ad6b]">
                              ₹{foodTotal.toFixed(2)}
                            </span>
                            {(decorationCharge > 0 || musicCharge > 0) && (
                              <div className="text-xs text-gray-600 mt-1">
                                {decorationCharge > 0 && <div>+ Decoration: ₹{decorationCharge}</div>}
                                {musicCharge > 0 && <div>+ Music: ₹{musicCharge}</div>}
                                <div className="font-semibold">= ₹{grandTotal.toFixed(2)}</div>
                              </div>
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                              Rate per pax: ₹{base}
                              {discountAmount > 0 && (
                                <span className="text-green-600"> - ₹{discountAmount.toFixed(2)} ({discountPercent}%)</span>
                              )}
                              {gstAmount > 0 && (
                                <span> + ₹{gstAmount.toFixed(2)} (GST)</span>
                              )}
                              <span> = ₹{rateWithGST.toFixed(2)}</span>
                            </div>
                          </>
                        );
                      })()}
                    </>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </div>
                {/* Total Amount */}
                <div className="flex-1 flex flex-col items-center md:items-start">
                  <div className="flex items-center space-x-2 mb-1">
                    <FaMoneyBillWave className="text-[#c3ad6b] text-xl" />
                    <span className="font-semibold text-gray-700 text-lg">
                      Total
                    </span>
                  </div>
                  <span className="text-2xl font-extrabold text-[#c3ad6b]">
                    {form.total || <span className="text-gray-400">N/A</span>}
                  </span>
                  <span className="text-xs text-gray-500">Total Amount</span>
                </div>
              </div>

            </section>

            <div className="border-t border-gray-200"></div>

            {/* Notes & Menu Section */}
            <section className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-[#c3ad6b]/20 p-2 rounded-full">
                  <FaStickyNote className="text-[#c3ad6b] text-lg" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Notes & Menu
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Notes */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Additional Notes
                  </label>
                  <textarea
                    name="notes"
                    className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-2 px-3 h-32"
                    onChange={handleChange}
                    value={form.notes}
                    placeholder="Special requests, allergies, etc."
                  />
                </div>

                {/* Menu */}
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Selected Menu Items
                  </label>
                  <textarea
                    name="menuItems"
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 px-3 h-24"
                    value={form.menuItems}
                    readOnly
                    placeholder="No menu items selected yet"
                  />

                  <button
                    type="button"
                    onClick={() => setShowMenuSelector(true)}
                    className="mt-2 w-full md:w-auto flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#c3ad6b] hover:bg-[#b39b5a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c3ad6b]"
                  >
                    <FaUtensils className="mr-2" /> Select Menu Items
                  </button>
                </div>
              </div>
            </section>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                disabled={loading}
                onClick={addBooking}
                className={`w-full md:w-1/2 mx-auto flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white ${
                  submitSuccess
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-[#c3ad6b] hover:bg-[#b39b5a]"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c3ad6b] transition-colors duration-300 ${
                  submitError ? "animate-shake" : ""
                }`}
              >
                {submitSuccess ? (
                  <>
                    <FaCheckCircle className="mr-2 animate-bounce" /> Booking
                    Created!
                  </>
                ) : loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  "Create Booking"
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Menu Selector Modal */}
      {showMenuSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden animate-scale-in">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                Select Menu Items
              </h3>
              <button
                onClick={() => setShowMenuSelector(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div
              className="p-6 overflow-y-auto"
              style={{ maxHeight: "calc(90vh - 68px)" }}
            >
              <MenuSelector
                onSave={handleSaveMenu}
                initialItems={form.menuItems ? form.menuItems.split(", ") : []}
                onClose={() => setShowMenuSelector(false)}
                foodType={form.foodType}
                ratePlan={form.ratePlan}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddBooking;
