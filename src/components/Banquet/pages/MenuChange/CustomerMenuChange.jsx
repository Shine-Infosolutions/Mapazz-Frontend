import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import MenuSelector from "../Menu/MenuSelector";

const CustomerMenuChange = () => {
  const { customerRef } = useParams();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSelector, setShowSelector] = useState(false);
  const [inputRef, setInputRef] = useState("");
  const [booking, setBooking] = useState(null);
  useEffect(() => {
    if (!customerRef) return;
    const fetchMenu = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/menu/all/${customerRef}`
        );
        setBooking(res.data.booking);
        console.log(res.data.booking);
        setMenu(res.data.menu);
      } catch (err) {
        setError("Failed to fetch menu for this customerRef.");
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, [customerRef]);

  const handleSave = async (selectedItems, categorizedMenu) => {
    try {
      setLoading(true);
      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/menu/update/${customerRef}`,
        { categorizedMenu }
      );
      toast.success("Menu updated successfully!");
      setMenu(categorizedMenu);
      setShowSelector(false);
    } catch (err) {
      toast.error("Failed to update menu.");
    } finally {
      setLoading(false);
    }
  };

  // If no customerRef, show input to enter it
  if (!customerRef) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full">
          <Toaster position="top-center" />
          <h1 className="text-2xl font-bold mb-4 text-center">
            Edit Menu by CustomerRef
          </h1>
          <input
            type="text"
            placeholder="Enter CustomerRef"
            value={inputRef}
            onChange={(e) => setInputRef(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 w-full mb-4"
          />
          <button
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            onClick={() => {
              if (inputRef) navigate(`/menu-edit/${inputRef}`);
            }}
          >
            Fetch Menu
          </button>
        </div>
      </div>
    );
  }

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <Toaster position="top-center" />
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">
          Edit Menu for CustomerRef: {customerRef}
        </h1>
        <button
          className="mb-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          onClick={() => setShowSelector(true)}
        >
          Edit Menu
        </button>
        {showSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <MenuSelector
                initialItems={[]}
                foodType={booking.foodType}
                ratePlan={booking.ratePlan}
                categorizedMenu={menu}
                onSave={handleSave}
                onClose={() => setShowSelector(false)}
              />
            </div>
          </div>
        )}
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Current Menu</h2>
          {menu ? (
            <pre className="bg-gray-100 rounded p-4 overflow-x-auto text-sm">
              {JSON.stringify(menu, null, 2)}
            </pre>
          ) : (
            <div>No menu found for this customerRef.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerMenuChange;
