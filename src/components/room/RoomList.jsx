import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader,
  BedDouble,
  ChevronDown,
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { showToast } from "../../utils/toaster";
import RoomForm from "./RoomForm";
import Pagination from "../common/Pagination";
import DashboardLoader from '../DashboardLoader';

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

const RoomList = () => {
  const { axios } = useAppContext();
  const { hasRole } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentRoom, setCurrentRoom] = useState({
    _id: null,
    title: "",
    category: "",
    room_number: "",
    price: "",
    exptra_bed: false,
    is_reserved: false,
    status: "",
    description: "",
    images: [],
  });

  // New state for filtering and pagination
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(9);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const getAuthToken = () => {
    return localStorage.getItem("token");
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (page === 1 && statusFilter === 'all' && !categoryFilter && !searchTerm) {
        setIsInitialLoading(true);
      }
      setLoading(true);
      await Promise.all([fetchRooms(), fetchCategories()]);
      setLoading(false);
      setIsInitialLoading(false);
    };

    fetchData();
  }, [page, statusFilter, categoryFilter, searchTerm]);

  const fetchRooms = async () => {
    try {
      setLoading(true);

      // Build query parameters (in a real implementation, you'd use these with your API)
      let url = `${import.meta.env.VITE_API_BASE_URL}/api/rooms/all`;

      const { data } = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      let filteredRooms = Array.isArray(data) ? data : [];

      // Client-side filtering (replace with server-side filtering when API supports it)
      if (statusFilter !== "all") {
        filteredRooms = filteredRooms.filter((room) =>
          statusFilter === "available"
            ? room.status === "available"
            : statusFilter === "booked"
            ? room.status === "booked"
            : statusFilter === "maintenance"
            ? room.status === "maintenance"
            : true
        );
      }

      if (categoryFilter) {
        filteredRooms = filteredRooms.filter(
          (room) =>
            room.categoryId === categoryFilter ||
            (room.categoryId && room.categoryId._id === categoryFilter)
        );
      }

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredRooms = filteredRooms.filter(
          (room) =>
            room.title.toLowerCase().includes(term) ||
            room.room_number.toString().includes(term)
        );
      }

      // Calculate pagination
      const totalItems = filteredRooms.length;
      const totalPages = Math.ceil(totalItems / limit);

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const paginatedRooms = filteredRooms.slice(
        startIndex,
        startIndex + limit
      );

      setRooms(Array.isArray(paginatedRooms) ? paginatedRooms : []);
      setTotal(totalItems);
      setTotalPages(totalPages);
      setError(null);
    } catch (err) {
      setError("Failed to fetch rooms");
      console.error("Error fetching rooms:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/categories/all`
      );
      const categoryMap = {};
      if (Array.isArray(data)) {
        data.forEach((category) => {
          categoryMap[category._id] = category.name;
        });
      }
      setCategories(categoryMap);
      localStorage.setItem("roomCategories", JSON.stringify(categoryMap));
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const handleAddRoom = () => {
    setEditMode(false);
    setCurrentRoom({
      _id: null,
      title: "",
      category: "",
      room_number: "",
      price: "",
      exptra_bed: false,
      is_reserved: false,
      status: "",
      description: "",
      images: [],
    });
    setShowModal(true);
  };

  const handleEditRoom = (room) => {
    setEditMode(true);
    setCurrentRoom({
      _id: room._id,
      title: room.title,
      category: typeof room.categoryId === "object" ? room.categoryId._id : room.categoryId,
      room_number: room.room_number,
      price: room.price,
      exptra_bed: room.exptra_bed,
      is_reserved: room.is_reserved,
      status: room.status,
      description: room.description,
      images: room.images,
      imageUrl: room.images && room.images.length > 0 ? room.images[0] : "",
    });
    setShowModal(true);
  };

  const handleDeleteRoom = async (id) => {
    if (window.confirm("Are you sure you want to delete this room?")) {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        };

        await axios.delete(
          `${import.meta.env.VITE_API_BASE_URL}/api/rooms/delete/${id}`,
          config
        );
        setRooms(rooms.filter((room) => room._id !== id));
        showToast.success("Room deleted successfully");
      } catch (err) {
        console.error("Error deleting room:", err);
        showToast.error("Failed to delete room");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const roomData = {
        title: currentRoom.title,
        category: currentRoom.category,
        room_number: currentRoom.room_number,
        price: parseFloat(currentRoom.price),
        extra_bed: currentRoom.exptra_bed,
        status: currentRoom.status,
        description: currentRoom.description,
        images: currentRoom.images,
      };

      const config = {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      };

      if (editMode) {
        const { data } = await axios.put(
          `${import.meta.env.VITE_API_BASE_URL}/api/rooms/update/${currentRoom._id}`,
          roomData,
          config
        );

        setRooms(
          rooms.map((room) =>
            room._id === currentRoom._id ? data : room
          )
        );
        showToast.success("Room updated successfully");
      } else {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/rooms/add`,
          roomData,
          config
        );
        setRooms([...rooms, data.room]);
        showToast.success("Room added successfully");
      }

      setShowModal(false);
    } catch (err) {
      console.error("Error saving room:", err);
      showToast.error("Failed to save room");
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "booked":
        return "bg-red-100 text-red-800";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 min-h-screen overflow-y-auto bg-[#fff9e6]" style={{opacity: isInitialLoading ? 0 : 1, transition: 'opacity 0.3s ease-in-out'}}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 sm:mt-6 gap-4 animate-slideInLeft animate-delay-100">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1f2937]">Rooms</h1>
        <button
          onClick={handleAddRoom}
          className="bg-secondary text-dark px-4 py-2 cursor-pointer rounded-lg hover:shadow-lg transition-shadow font-medium w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Add Room
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 animate-fadeInUp animate-delay-200">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark/50 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by room title or number..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-sm sm:text-base"
          />
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex justify-end animate-fadeInUp animate-delay-300" ref={dropdownRef}>
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center px-4 py-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          >
            <span className="capitalize mr-2">{statusFilter}</span>
            <ChevronDown
              size={16}
              className={`transition-transform ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg z-10 py-1 border border-gray-100">
              {["all", "available", "booked", "maintenance"].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status);
                    setPage(1);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 capitalize transition-colors hover:bg-gray-50 ${
                    statusFilter === status
                      ? "font-medium text-primary"
                      : "text-dark/70"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* {Object.keys(categories).length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="text-dark/70 self-center">Filter by Category:</span>
          <button
            onClick={() => {
              setCategoryFilter("");
              setPage(1);
            }}
            className={`px-3 py-1 rounded-lg text-sm ${
              categoryFilter === ""
                ? "bg-secondary text-dark font-medium "
                : "bg-primary/30 text-dark cursor-pointer"
            }`}
          >
            All
          </button>
          {Object.entries(categories).map(([id, name]) => (
            <button
              key={id}
              onClick={() => {
                setCategoryFilter(id);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-lg text-sm ${
                categoryFilter === id
                  ? "bg-secondary text-dark font-medium "
                  : "bg-primary/30 text-dark cursor-pointer"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )} */}

      {error && <div className="text-red-500 text-sm">{error}</div>}

      {isInitialLoading ? (
        <DashboardLoader pageName="Room Management" />
      ) : loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader className="w-8 h-8 text-secondary animate-spin" />
          <span className="ml-2 text-dark">Loading rooms...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {rooms.length > 0 ? (
              rooms.map((room, index) => (
                <div
                  key={room._id}
                  className="bg-primary/50 border border-gray-200 backdrop-blur-sm rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all animate-scaleIn"
                  style={{animationDelay: `${Math.min(index * 100 + 400, 800)}ms`}}
                >
                  {/* Image Section */}
                  <div className="h-40 sm:h-48 bg-gray-200 relative overflow-hidden">
                    {room.images &&
                    room.images.length > 0 &&
                    room.images[0].startsWith("data:image/") ? (
                      <img
                        src={room.images[0]}
                        alt={room.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <BedDouble size={48} className="text-gray-400" />
                      </div>
                    )}

                    <div className="absolute top-2 right-2 flex space-x-2">
                      <button
                        onClick={() => handleEditRoom(room)}
                        className="bg-white/80 cursor-pointer text-dark p-1.5 rounded-full hover:bg-white"
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </button>
                      {hasRole('ADMIN') && (
                        <button
                          onClick={() => handleDeleteRoom(room._id)}
                          className="bg-white/80 text-red-600 p-1.5 rounded-full hover:bg-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="absolute top-2 left-2">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusClass(
                          room.status
                        )}`}
                      >
                        {room.status
                          ? room.status.charAt(0).toUpperCase() +
                            room.status.slice(1)
                          : "Unknown"}
                      </span>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base sm:text-lg font-semibold text-dark">
                        Room {room.room_number}
                      </h3>
                    </div>
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <span className="text-xs sm:text-sm text-dark/70">Room title:</span>
                      <span className="font-semibold text-dark text-sm sm:text-base truncate ml-2">
                        {room.title}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <span className="text-xs sm:text-sm text-dark/70">Category:</span>
                      <span className="font-semibold text-dark text-sm sm:text-base truncate ml-2">
                        {typeof room.categoryId === "object" && room.categoryId?.name
                          ? room.categoryId.name
                          : categories[room.categoryId] || "Unknown"}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm text-dark/70">Price:</span>
                        <span className="font-semibold text-dark text-sm sm:text-base">
                          ₹{room.price}/night
                        </span>
                      </div>

                      {room.exptra_bed && (
                        <div className="mt-2 py-1 px-2 bg-blue-100 text-blue-800 text-xs rounded">
                          Extra Bed Available
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12 text-dark/70">
                No rooms found matching your criteria
              </div>
            )}
          </div>

          <div className="animate-fadeInUp animate-delay-300">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              itemsPerPage={limit}
              totalItems={total}
            />
          </div>
        </>
      )}

      <RoomForm
        showModal={showModal}
        setShowModal={setShowModal}
        currentRoom={currentRoom}
        setCurrentRoom={setCurrentRoom}
        handleSubmit={handleSubmit}
        editMode={editMode}
      />
    </div>
  );
};

export default RoomList;
