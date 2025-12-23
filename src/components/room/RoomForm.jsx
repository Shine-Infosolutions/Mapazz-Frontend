import React, { useState, useEffect, useRef } from "react";
import { X, Camera } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { showToast } from "../../utils/toaster";
import { validateRequired, validatePositiveNumber } from "../../utils/validation";

const RoomForm = ({
  showModal,
  setShowModal,
  currentRoom,
  setCurrentRoom,
  handleSubmit,
  editMode,
}) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const { axios } = useAppContext();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/categories/all");
      setCategories(response.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentRoom({
      ...currentRoom,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setCurrentRoom({
        ...currentRoom,
        imageFile: file, // actual file
        images: [imageUrl], // for preview
      });
    }
  };
  // Camera functionality
  const startCamera = async () => {
    setShowCamera(true);
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        setShowCamera(false);
        console.error("Error accessing camera: ", err);
        showToast.error(
          "Could not access camera. Please ensure camera permissions are granted."
        );
      }
    }, 100);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth || 320;
      canvasRef.current.height = videoRef.current.videoHeight || 240;
      context.drawImage(
        videoRef.current,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
      const imageDataURL = canvasRef.current.toDataURL("image/png");
      setCurrentRoom({
        ...currentRoom,
        images: [imageDataURL],
      });
      stopCamera();
    }
  };

  return (
    showModal && (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">
              {editMode ? "Edit Room" : "Add New Room"}
            </h3>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          {showCamera ? (
            <div className="mb-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full h-64 bg-black rounded-lg"
                  autoPlay
                  playsInline
                ></video>
                <canvas ref={canvasRef} className="hidden"></canvas>
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="bg-white text-primary p-3 rounded-full shadow-lg"
                  >
                    <Camera size={24} />
                  </button>
                </div>
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-text/70">
                    Room Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={currentRoom.title || ""}
                    onChange={handleInputChange}
                    placeholder="Enter room title"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    onBlur={(e) => {
                      if (!validateRequired(e.target.value)) {
                        showToast.error('Room title is required');
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-text/70">
                    Room Number
                  </label>
                  <input
                    type="text"
                    name="room_number"
                    value={currentRoom.room_number || ""}
                    onChange={handleInputChange}
                    placeholder="Enter room number"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-text/70">
                    Category
                  </label>
                  <select
                    name="category"
                    value={currentRoom.category || ""}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="" disabled className="italic text-gray-400">
                      Select a category
                    </option>
                    {Array.isArray(categories) && categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-text/70">
                    Price
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={currentRoom.price || ""}
                    onChange={handleInputChange}
                    placeholder="Enter price"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                    min="0"
                    onBlur={(e) => {
                      if (!validatePositiveNumber(e.target.value)) {
                        showToast.error('Price must be a positive number');
                      }
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="extra_bed"
                    id="extra_bed"
                    checked={currentRoom.extra_bed || false}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <label
                    htmlFor="extra_bed"
                    className="text-sm font-medium text-text/70"
                  >
                    Extra Bed
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_reserved"
                    id="is_reserved"
                    checked={currentRoom.is_reserved || false}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <label
                    htmlFor="is_reserved"
                    className="text-sm font-medium text-text/70"
                  >
                    Reserved
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-text/70">
                    Status
                  </label>
                  <select
                    name="status"
                    value={currentRoom.status || ""}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="" disabled className="italic text-gray-400">
                      Select status
                    </option>
                    <option value="available">Available</option>
                    <option value="booked">Booked</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-text/70">
                  Description
                </label>
                <textarea
                  name="description"
                  value={currentRoom.description || ""}
                  onChange={handleInputChange}
                  placeholder="Enter room description"
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-24"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-text/70">
                  Upload Image
                </label>
                <div className="flex flex-col sm:flex-row gap-4 mb-2">
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="flex flex-col items-center justify-center w-full h-20 sm:h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg
                          className="w-8 h-8 mb-2 text-gray-500"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 20 18"
                        >
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M10 12.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                          />
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17 3h-2l-2-2H7L5 3H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z"
                          />
                        </svg>
                        <p className="text-xs text-gray-500">Camera</p>
                      </div>
                    </button>
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor="gallery-input"
                      className="flex flex-col items-center justify-center w-full h-20 sm:h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg
                          className="w-8 h-8 mb-2 text-gray-500"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 20 16"
                        >
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                          />
                        </svg>
                        <p className="text-xs text-gray-500">Gallery</p>
                      </div>
                      <input
                        id="gallery-input"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                {currentRoom.images?.[0] && (
                  <div className="mt-2">
                    <img
                      src={currentRoom.images[0]}
                      alt="Preview"
                      className="w-full h-32 sm:h-40 rounded-md object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary text-white px-4 py-2 rounded-lg w-full sm:w-auto"
                >
                  {editMode ? "Update" : "Create"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    )
  );
};

export default RoomForm;
