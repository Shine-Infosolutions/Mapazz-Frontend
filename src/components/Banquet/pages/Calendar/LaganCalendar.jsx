import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaUser,
  FaPhone,
  FaStickyNote,
  FaRegCalendarAlt,
} from "react-icons/fa";
import { useAppContext } from '../../../../context/AppContext';
import DashboardLoader from '../../../DashboardLoader';
import BookingCalendar from '../../../BookingCalendar';

function LaganCalendar() {
  const { axios } = useAppContext();
  const [pageLoading, setPageLoading] = useState(true);
  // Detect mobile view
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 600 : false
  );
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);
  // Get user role from localStorage
  const userRole = localStorage.getItem("role") || "Staff";
  const [hoveredDate, setHoveredDate] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    notes: "",
  });
  const [bookings, setBookings] = useState({});
  const [showBookingCalendar, setShowBookingCalendar] = useState(false);
  const calendarRef = useRef(null);
  const [selectedRange, setSelectedRange] = useState({
    start: null,
    end: null,
  });
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setHoveredDate(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch bookings from backend and group by startDate
  useEffect(() => {
    fetchBookings();
  }, [month, year]);

  const handleBooking = () => {
    if (selectedDate) {
      setShowModal(true);
    } else {
      alert("Please select a date first.");
    }
  };

  const handleViewBookingCalendar = () => {
    setShowBookingCalendar(true);
  };

  const format = (y, m, d) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const getAuspiciousDates = (year) => {
    const format = (m, d) =>
      `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return [
      format(1, 16),
      format(1, 17),
      format(1, 18),
      format(1, 19),
      format(1, 21),
      format(1, 22),
      format(1, 24),
      format(1, 25),
      format(1, 30),
      format(2, 3),
      format(2, 4),
      format(2, 6),
      format(2, 7),
      format(2, 13),
      format(2, 14),
      format(2, 15),
      format(2, 18),
      format(2, 19),
      format(2, 20),
      format(2, 21),
      format(2, 25),
      format(3, 1),
      format(3, 2),
      format(3, 3),
      format(3, 5),
      format(3, 6),
      format(4, 14),
      format(4, 16),
      format(4, 17),
      format(4, 18),
      format(4, 19),
      format(4, 20),
      format(4, 21),
      format(4, 22),
      format(4, 23),
      format(4, 25),
      format(4, 29),
      format(4, 30),
      format(5, 1),
      format(5, 5),
      format(5, 6),
      format(5, 7),
      format(5, 8),
      format(5, 10),
      format(5, 15),
      format(5, 17),
      format(5, 18),
      format(5, 19),
      format(5, 24),
      format(5, 28),
      format(6, 2),
      format(6, 4),
      format(6, 7),
      format(6, 8),
      format(7, 11),
      format(7, 12),
      format(7, 13),
      format(7, 17),
      format(7, 20),
      format(7, 21),
      format(7, 22),
      format(7, 26),
      format(7, 28),
      format(7, 29),
      format(7, 31),
      format(8, 1),
      format(8, 3),
      format(8, 4),
      format(8, 7),
      format(8, 8),
      format(8, 9),
      format(8, 13),
      format(8, 14),
      format(8, 17),
      format(8, 24),
      format(8, 25),
      format(8, 28),
      format(8, 29),
      format(8, 30),
      format(8, 31),
      format(9, 1),
      format(9, 2),
      format(9, 3),
      format(9, 4),
      format(9, 5),
      format(9, 26),
      format(9, 27),
      format(9, 28),
      format(10, 1),
      format(10, 2),
      format(10, 3),
      format(10, 4),
      format(10, 7),
      format(10, 8),
      format(10, 10),
      format(10, 11),
      format(10, 12),
      format(10, 22),
      format(10, 23),
      format(10, 24),
      format(10, 25),
      format(10, 26),
      format(10, 27),
      format(10, 28),
      format(10, 29),
      format(10, 30),
      format(10, 31),
      format(11, 2),
      format(11, 3),
      format(11, 4),
      format(11, 7),
      format(11, 8),
      format(11, 12),
      format(11, 13),
      format(11, 22),
      format(11, 23),
      format(11, 24),
      format(11, 25),
      format(11, 26),
      format(11, 27),
      format(11, 29),
      format(11, 30),
      format(12, 4),
      format(12, 5),
      format(12, 6),
    ];
  };

  const auspiciousDates = new Set(getAuspiciousDates(year));

  const getDateCategory = (date) => {
    const heavyDates = new Set(
      Array.from(auspiciousDates).filter((d) =>
        [1, 5, 10, 15, 20, 25, 30].includes(parseInt(d.split("-")[2]))
      )
    );
    const mediumDates = new Set(
      Array.from(auspiciousDates).filter((d) =>
        [2, 4, 7, 9, 17, 22, 27].includes(parseInt(d.split("-")[2]))
      )
    );
    if (heavyDates.has(date)) return "heavy";
    if (mediumDates.has(date)) return "medium";
    if (auspiciousDates.has(date)) return "light";
    return null;
  };

  const getTooltipText = (category) => {
    if (category === "heavy") return "Heavy Booking";
    if (category === "medium") return "Medium Booking";
    if (category === "light") return "Light Booking";
    return "";
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setBookings((prev) => {
      const dateBookings = prev[selectedDate] || [];
      return {
        ...prev,
        [selectedDate]: [...dateBookings, { ...formData }],
      };
    });
    setShowModal(false);
    setFormData({ name: "", contact: "", notes: "" });
  };

  const dateTemplate = ({ year, month, day }) => {
    const currentDate = format(year, month, day);
    const dayBookings = bookings[currentDate] || [];
    const bookingCount = dayBookings.length;
    
    // Determine fill position based on booking time
    let fillPosition = 'none'; // 'upper', 'lower', 'full', 'none'
    
    if (bookingCount === 1) {
      const booking = dayBookings[0];
      console.log('Booking data:', booking);
      const timeValue = booking.startTime || booking.timeSlot || booking.time || booking.slot;
      console.log('Available fields:', Object.keys(booking));
      if (timeValue) {
        const startHour = parseInt(timeValue.split(':')[0]);
        console.log('Time value:', timeValue, 'Start hour:', startHour);
        fillPosition = startHour < 16 ? 'upper' : 'lower';
        console.log('Fill position:', fillPosition);
      } else {
        console.log('No time found in any field, defaulting to upper');
        fillPosition = 'upper';
      }
    } else if (bookingCount >= 2) {
      fillPosition = 'full';
    }
    
    const isSelected = selectedDate === currentDate;
    const highlightClass = isSelected
      ? "border-4 shadow-lg scale-105 ring-2"
      : "border border-amber-200";
    
    return (
      <div
        className={`w-10 h-12 md:w-14 md:h-14 relative rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 ${highlightClass} hover:shadow-md hover:transform hover:scale-110 overflow-hidden`}
        style={{ 
          backgroundColor: '#f9fafb',
          ...(isSelected && { borderColor: '#FFB300', '--tw-ring-color': '#5D4037' })
        }}
        onClick={() => {
          setSelectedDate(currentDate);
        }}
        onMouseEnter={() => setHoveredDate(currentDate)}
        onMouseLeave={() => setHoveredDate(null)}
        title={bookingCount > 0 ? `${bookingCount} booking${bookingCount > 1 ? 's' : ''} (${fillPosition === 'upper' ? 'First Half' : fillPosition === 'lower' ? 'Second Half' : 'Full Day'})` : ''}
      >
        {/* Fill based on booking time */}
        {fillPosition === 'upper' && (
          <div className="absolute top-0 left-0 right-0 bg-red-600 transition-all duration-300" style={{ height: '50%' }} />
        )}
        {fillPosition === 'lower' && (
          <div className="absolute bottom-0 left-0 right-0 bg-red-600 transition-all duration-300" style={{ height: '50%' }} />
        )}
        {fillPosition === 'full' && (
          <div className="absolute top-0 left-0 right-0 bottom-0 bg-red-600 transition-all duration-300" />
        )}
        <span className={`text-base md:text-lg font-semibold select-none relative z-10 ${bookingCount > 2 ? 'text-white' : 'text-gray-800'}`}>
          {day}
        </span>
      </div>
    );
  };

  const renderCalendar = () => {
    const weeks = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    let day = 1;
    for (let week = 0; week < 6; week++) {
      const days = [];
      for (let i = 0; i < 7; i++) {
        const cellIndex = week * 7 + i;
        if (cellIndex < firstDay || day > daysInMonth) {
          days.push(
            <td key={i} className="h-16 align-top text-center bg-white"></td>
          );
        } else {
          const cellContent = dateTemplate({ year, month, day });
          days.push(
            <td key={i} className="h-16 p-1 bg-white">
              <div className="h-full flex items-center justify-center">
                {cellContent}
              </div>
            </td>
          );
          day++;
        }
      }
      const isRowEmpty = days.every(
        (cell) =>
          !cell.props.children || cell.props.children.props === undefined
      );
      if (!isRowEmpty) {
        weeks.push(<tr key={week}>{days}</tr>);
      }
    }
    return weeks;
  };

  const handlePrev = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNext = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Booking status filter state
  const [statusFilter, setStatusFilter] = useState("All");

  // Search bar state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState(null); // null = no search, [] = no results
  const [searchLoading, setSearchLoading] = useState(false);



  // Extract fetchBookings function to be reusable
  const fetchBookings = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/banquet-bookings/`
      );
      const grouped = {};
      res.data.forEach((b) => {
        // Use only the date part (before 'T') for grouping
        const dateKey = b.startDate.split("T")[0];
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(b);
      });
      setBookings(grouped);
      console.log("Fetched bookings:", res.data);
      console.log("Grouped bookings:", grouped);
    } catch (err) {
      console.error("Failed to fetch bookings", err);
    }
  };

  // Get bookings for the selected date
  const bookingsForDate = bookings[selectedDate] || [];
  // Filter bookings by status if filter is not 'All'
  const filteredBookingsForDate =
    statusFilter === "All"
      ? bookingsForDate
      : bookingsForDate.filter(
          (b) =>
            (b.bookingStatus || "").toLowerCase() === statusFilter.toLowerCase()
        );

  // Final list to display: search results if searching, else filteredBookingsForDate
  const displayBookings =
    searchTerm.trim() && searchResults !== null
      ? searchResults
      : filteredBookingsForDate;

  if (pageLoading) {
    return <DashboardLoader pageName="Event Calendar" />;
  }

  return (
    <div
      ref={calendarRef}
      className="p-4 md:p-8 text-center max-w-full overflow-x-auto font-sans min-h-screen"
      style={{backgroundColor: 'hsl(45, 100%, 95%)'}}
    >
      {/* Header */}
      <header className="bg-white shadow-sm rounded-xl mb-6" style={{border: '1px solid hsl(45, 100%, 85%)'}}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{color: 'hsl(45, 100%, 20%)'}}>
            Event Calendar
          </h1>
          {!isMobile && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-semibold text-sm shadow" style={{ backgroundColor: 'hsl(45, 100%, 90%)', color: 'hsl(45, 100%, 20%)' }}>
              {userRole === "Admin" ? "👑 Admin" : "👤 Staff"}
            </span>
          )}
        </div>
      </header>
      
      {/* Navigation */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={handlePrev}
          className="text-white px-6 py-3 rounded-lg shadow-md font-semibold transition-all duration-200 transform hover:scale-105"
          style={{ backgroundColor: 'hsl(45, 43%, 58%)' }}
        >
          ← Previous
        </button>
        <h2 className="text-xl md:text-2xl font-bold mx-2" style={{ color: 'hsl(45, 100%, 20%)' }}>
          {`${monthNames[month]} ${year}`}
        </h2>
        <button
          onClick={handleNext}
          className="text-white px-6 py-3 rounded-lg shadow-md font-semibold transition-all duration-200 transform hover:scale-105"
          style={{ backgroundColor: 'hsl(45, 43%, 58%)' }}
        >
          Next →
        </button>
      </div>
      
      {/* Calendar */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-xl" style={{ border: '2px solid hsl(45, 100%, 85%)' }}>
        <table className="w-full max-w-full border-collapse">
          <thead>
            <tr style={{ backgroundColor: 'hsl(45, 100%, 90%)' }}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <th
                  key={day}
                  className="h-12 text-sm md:text-base font-bold border-b-2"
                  style={{ color: 'hsl(45, 100%, 20%)', borderBottomColor: 'hsl(45, 100%, 85%)' }}
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="align-top">{renderCalendar()}</tbody>
        </table>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-center mt-6">
        <Link
          to="/banquet/add-booking"
          state={{ selectedDate }}
          className="text-[#c3ad6b] hover:underline"
        >
          <button
            className={`py-3 px-12 rounded-xl text-lg font-bold shadow-lg transition-all duration-200 transform ${
              selectedDate
                ? "hover:scale-105 hover:shadow-xl text-white"
                : "bg-gray-300 cursor-not-allowed"
            }`}
            style={selectedDate ? { background: 'linear-gradient(to right, #5D4037, #FFB300)' } : {}}
            disabled={!selectedDate}
            onClick={handleBooking}
          >
            Book Now
          </button>
        </Link>
        
        <button
          onClick={handleViewBookingCalendar}
          className="py-3 px-8 rounded-xl text-lg font-bold shadow-lg transition-all duration-200 transform hover:scale-105 hover:shadow-xl text-white"
          style={{ backgroundColor: 'hsl(45, 43%, 58%)' }}
        >
          View Booking Calendar
        </button>
      </div>
      {/* Booking list for selected date with status filter */}
      <div className="mt-10 max-w-3xl mx-auto">
        <h3 className="text-xl font-bold text-gray-800 mb-6">
          Bookings for {selectedDate || "..."}
        </h3>
        {/* Status Filter Dropdown & Search Bar - Improved UI */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center gap-3 md:gap-6 bg-gradient-to-r from-amber-50 via-white to-yellow-50 border-2 rounded-xl px-6 py-4 shadow-md" style={{ borderColor: '#FFB300' }}>
          {/* Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="inline-flex items-center" style={{ color: '#5D4037' }}>
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0013 13.414V19a1 1 0 01-1.447.894l-2-1A1 1 0 019 18v-4.586a1 1 0 00-.293-.707L2.293 6.707A1 1 0 012 6V4z"
                />
              </svg>
            </span>
            <label
              htmlFor="statusFilter"
              className="text-sm font-bold" style={{ color: 'hsl(45, 100%, 20%)' }}
            >
              Status:
            </label>
            <select
              id="statusFilter"
              className="rounded-lg border-2 py-2 px-4 text-sm bg-white shadow-sm font-medium"
              style={{ borderColor: 'hsl(45, 100%, 85%)' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All</option>
              <option value="Tentative">Tentative</option>
              <option value="Enquiry">Enquiry</option>
              <option value="Confirmed">Confirmed</option>
            </select>
          </div>
          {/* Search Bar */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="inline-flex items-center" style={{ color: '#FFB300' }}>
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35"
                />
              </svg>
            </span>
            <input
              type="text"
              className="rounded-lg border-2 py-2 px-4 text-sm w-full md:w-64 bg-white shadow-sm"
              style={{ borderColor: 'hsl(45, 100%, 85%)' }}
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={async (e) => {
                const val = e.target.value;
                setSearchTerm(val);
                if (!val.trim()) {
                  setSearchResults(null);
                  return;
                }
                setSearchLoading(true);
                try {
                  const resp = await axios.get(
                    `${import.meta.env.VITE_API_BASE_URL}/api/bookings/search?q=${encodeURIComponent(
                      val
                    )}`
                  );
                  // Only show results for the selected date
                  const results = (resp.data.data || resp.data || []).filter(
                    (b) => {
                      const dateKey = b.startDate && b.startDate.split("T")[0];
                      return dateKey === selectedDate;
                    }
                  );
                  setSearchResults(results);
                } catch (err) {
                  setSearchResults([]);
                } finally {
                  setSearchLoading(false);
                }
              }}
            />
            {searchLoading && (
              <span className="text-xs ml-1 font-medium" style={{ color: '#FFB300' }}>Searching...</span>
            )}
          </div>
        </div>
        {displayBookings.length === 0 ? (
          <div className="text-gray-400 italic">
            {searchTerm.trim()
              ? "No bookings found for this search."
              : `No bookings for this date${
                  statusFilter !== "All" ? ` with status "${statusFilter}"` : ""
                }.`}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayBookings.map((b, i) => (
              <div
                key={i}
                className="bg-white border-2 rounded-xl p-4 text-left hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                style={{ borderColor: 'hsl(45, 100%, 85%)' }}
              >
                <div className="font-bold text-gray-800">{b.name}</div>
                <div className="text-xs text-gray-700">
                  Contact: {b.number || b.contact}
                </div>
                <div className="text-xs text-gray-700">
                  Booking Status: {b.bookingStatus}
                </div>
                {b.notes && (
                  <div className="text-xs text-gray-700">{b.notes}</div>
                )}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      if (b._id) navigate(`/banquet/update-booking/${b._id}`);
                    }}
                    className="flex-1 text-white px-3 py-2 rounded-lg text-sm font-bold transition-all duration-200 transform hover:scale-105 shadow-md"
                    style={{ backgroundColor: 'hsl(45, 43%, 58%)' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (b._id) navigate(`/banquet/invoice/${b._id}`);
                    }}
                    className="flex-1 text-white px-3 py-2 rounded-lg text-sm font-bold transition-all duration-200 transform hover:scale-105 shadow-md"
                    style={{ backgroundColor: 'hsl(45, 43%, 58%)' }}
                  >
                    Invoice
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* BookingCalendar Modal */}
      <BookingCalendar 
        isOpen={showBookingCalendar} 
        onClose={() => setShowBookingCalendar(false)}
        bookingData={bookings}
      />
    </div>
  );
}

export default LaganCalendar;
