import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useOrderManagement } from '../../hooks/useOrderManagement';
import { useAuth } from '../../context/AuthContext';

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

const Order = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [isConnected] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [nonChargeable, setNonChargeable] = useState(false);
  const [isMenuLoading, setIsMenuLoading] = useState(true);
  
  const {
    menuItems,
    categories,
    staff,
    tables,
    allBookings,
    cartItems,
    isCartOpen,
    isPlacingOrder,
    searchQuery,
    bookingFilter,
    orderData,
    filteredMenu,
    gstRates,
    setIsCartOpen,
    setSearchQuery,
    setBookingFilter,
    setOrderData,
    setCartItems,
    setGstRates,
    handleAddToCart,
    handleRemoveItem,
    handleQuantityChange,
    handleClearCart,
    getSubtotal,
    getTotalAmount,
    getGstAmounts,
    handlePlaceOrder
  } = useOrderManagement(location);

  // Set loading state based on menu items
  useEffect(() => {
    setIsMenuLoading(menuItems.length === 0);
  }, [menuItems]);

  const categoryFilteredMenu = filteredMenu.filter(item => 
    selectedCategory === '' || item.category === selectedCategory
  );



  return (
    <div className="min-h-screen font-sans p-4 sm:p-6 bg-gradient-to-br from-[#f7f5ef] to-[#c3ad6b]/30">
      <div className="w-full bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-6 sm:p-8 mb-8 border border-[#c3ad6b]/30 animate-slideInLeft animate-delay-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[#b39b5a]">Create New Order</h2>
            {location.state?.isDineIn && (
              <span className="px-3 py-1 bg-[#8B4513] text-white text-xs font-medium rounded-full">
                Dine In - Room Service
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-medium text-green-600">
              System Active
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          <div className="flex flex-col space-y-3">
            <label htmlFor="table-number" className="font-bold text-[#b39b5a]">Room Number</label>
            <select 
              id="table-number" 
              value={orderData.tableNo}
              onChange={(e) => {
                const selectedRoom = tables.find(room => room.tableNumber === e.target.value);
                setOrderData({
                  ...orderData, 
                  tableNo: e.target.value,
                  customerName: selectedRoom?.guestName || ''
                });
              }}
              className="w-full rounded-xl p-4 border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-gray-700 bg-white/80 backdrop-blur-sm transition-all duration-200"
            >
              <option value="">Select Room</option>
              {tables.map(room => (
                <option key={room._id} value={room.tableNumber}>
                  Room {room.tableNumber} - {room.guestName}
                </option>
              ))}
            </select>
            {bookingFilter !== 'all' && tables.length === 0 && (
              <p className="text-sm text-orange-600 mt-1">
                No rooms available for selected booking
              </p>
            )}
          </div>
          <div className="flex flex-col space-y-3">
            <label htmlFor="customerName" className="font-bold text-[#b39b5a]">Customer Name</label>
            <input
              id="customerName"
              type="text"
              value={orderData.customerName}
              onChange={(e) => setOrderData({...orderData, customerName: e.target.value})}
              className="w-full rounded-xl p-4 border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-gray-700 bg-white/80 backdrop-blur-sm transition-all duration-200"
              placeholder="Customer Name"
            />
          </div>
          <div className="flex flex-col space-y-3">
            <label htmlFor="sgst-rate" className="font-bold text-[#b39b5a]">SGST Rate (%)</label>
            <input
              id="sgst-rate"
              type="number"
              step="0.1"
              min="0"
              max="50"
              value={gstRates.sgstRate}
              onChange={(e) => setGstRates({
                ...gstRates,
                sgstRate: parseFloat(e.target.value) || 0,
                gstRate: (parseFloat(e.target.value) || 0) + gstRates.cgstRate
              })}
              className="w-full rounded-xl p-4 border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-gray-700 bg-white/80 backdrop-blur-sm transition-all duration-200"
              placeholder="2.5"
            />
          </div>
          <div className="flex flex-col space-y-3">
            <label htmlFor="cgst-rate" className="font-bold text-[#b39b5a]">CGST Rate (%)</label>
            <input
              id="cgst-rate"
              type="number"
              step="0.1"
              min="0"
              max="50"
              value={gstRates.cgstRate}
              onChange={(e) => setGstRates({
                ...gstRates,
                cgstRate: parseFloat(e.target.value) || 0,
                gstRate: gstRates.sgstRate + (parseFloat(e.target.value) || 0)
              })}
              className="w-full rounded-xl p-4 border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-gray-700 bg-white/80 backdrop-blur-sm transition-all duration-200"
              placeholder="2.5"
            />
          </div>
        </div>
      </div>

      {/* Search and Filter section */}
      <div className="w-full bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-6 sm:p-8 mb-8 border border-[#c3ad6b]/30 animate-fadeInUp animate-delay-200">
        <label htmlFor="search-menu" className="block font-bold mb-4 text-lg text-[#b39b5a]">Search & Filter Menu</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <input
              id="search-menu"
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl pl-12 pr-4 py-4 border-2 border-[#c3ad6b]/30 focus:border-[#c3ad6b] focus:ring-2 focus:ring-[#c3ad6b]/20 text-gray-700 bg-white/80 backdrop-blur-sm transition-all duration-200 text-base"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 absolute left-4 top-1/2 transform -translate-y-1/2 text-[#c3ad6b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl px-4 py-4 border-2 border-[#c3ad6b]/30 focus:border-[#c3ad6b] focus:ring-2 focus:ring-[#c3ad6b]/20 text-gray-700 bg-white/80 backdrop-blur-sm transition-all duration-200 text-base"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* Menu grid */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 animate-fadeInUp animate-delay-300">
        {isMenuLoading ? (
          // Loading skeleton for menu items
          Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border-2 border-[#c3ad6b]/30 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
              <div className="h-5 bg-gray-200 rounded mb-4 w-1/2"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ))
        ) : categoryFilteredMenu.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-400 text-lg mb-2">🍽️</div>
            <div className="text-gray-500">No menu items found</div>
          </div>
        ) : (
          categoryFilteredMenu.map((item, index) => (
          <div key={item._id} className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-xl border-2 border-[#c3ad6b]/30 hover:border-[#c3ad6b] hover:shadow-2xl transition-all duration-300 transform hover:scale-105 animate-scaleIn" style={{animationDelay: `${Math.min(index * 50 + 400, 800)}ms`}}>
            <h3 className="text-xl font-bold truncate text-[#b39b5a] mb-2">{item.name}</h3>
            <p className="text-sm mb-4 text-[#c3ad6b] font-medium">{item.foodType}</p>
            <p className="mb-4 font-bold text-lg text-gray-800">₹{(item.Price || 0).toFixed(2)}</p>

            {cartItems.some(i => i._id === item._id) ? (
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-2">
                  <button
                    className="bg-border text-text w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center hover:bg-secondary transition-colors text-sm sm:text-base"
                    onClick={() => handleQuantityChange(item._id, -1)}
                  >
                    -
                  </button>
                  <span className="font-bold text-text text-sm sm:text-base min-w-[20px] text-center">
                    {cartItems.find(i => i._id === item._id)?.quantity}
                  </span>
                  <button
                    className="bg-primary text-background w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center hover:bg-hover transition-colors text-sm sm:text-base"
                    onClick={() => handleQuantityChange(item._id, 1)}
                  >
                    +
                  </button>
                </div>
                <button
                  className="text-primary hover:text-hover transition-colors duration-200 text-xs sm:text-sm px-2 py-1 rounded"
                  onClick={() => handleRemoveItem(item._id)}
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                className="w-full bg-gradient-to-r from-[#c3ad6b] to-[#b39b5a] text-white py-3 rounded-xl font-bold hover:from-[#b39b5a] hover:to-[#c3ad6b] transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                onClick={() => handleAddToCart(item)}
              >
                Add to Order
              </button>
            )}
          </div>
        ))
        )}
      </div>

      {/* Floating Cart Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="relative">
          <button
            className="p-4 rounded-full shadow-xl bg-gradient-to-r from-[#c3ad6b] to-[#b39b5a] text-white transition-all duration-300 transform hover:scale-110 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-[#c3ad6b]/30"
            onClick={() => setIsCartOpen(!isCartOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.182 1.298.503 1.298H19.5a1 1 0 00.993-.883l.988-7.893z" />
            </svg>
          </button>
          {cartItems.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-gradient-to-r from-[#b39b5a] to-[#c3ad6b] text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-lg animate-pulse">
              {cartItems.length}
            </span>
          )}
        </div>
      </div>

      {/* Cart Popup Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Your Cart</h2>
                <button
                  className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                  onClick={() => setIsCartOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {cartItems.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.182 1.298.503 1.298H19.5a1 1 0 00.993-.883l.988-7.893z" />
                  </svg>
                  <p>Your cart is empty</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 font-semibold text-gray-700">Item</th>
                        <th className="text-center py-2 font-semibold text-gray-700">Qty</th>
                        <th className="text-right py-2 font-semibold text-gray-700">Price</th>
                        <th className="text-center py-2 font-semibold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map(item => (
                        <tr key={item._id} className="border-b border-gray-100">
                          <td className="py-3">
                            <div>
                              <div className="font-medium text-gray-800">{item.name}</div>
                              <div className="text-xs text-gray-500">{categories.find(cat => cat._id === item.category)?.name || item.foodType}</div>
                              <div className="text-xs text-[#c3ad6b]">₹{(item.Price || item.price || 0).toFixed(2)} each</div>
                              {hasRole(['ADMIN', 'GM', 'FRONT DESK', 'STAFF']) && (
                                <label className="flex items-center gap-1 mt-1">
                                  <input
                                    type="checkbox"
                                    checked={item.isFree || false}
                                    onChange={(e) => {
                                      const updatedItems = cartItems.map(cartItem => 
                                        cartItem._id === item._id 
                                          ? { ...cartItem, isFree: e.target.checked }
                                          : cartItem
                                      );
                                      setCartItems(updatedItems);
                                    }}
                                    className="h-3 w-3 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                  />
                                  <span className="text-xs text-orange-600">NC</span>
                                </label>
                              )}
                            </div>
                          </td>
                          <td className="py-3 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors text-xs"
                                onClick={() => handleQuantityChange(item._id, -1)}
                              >
                                -
                              </button>
                              <span className="font-bold text-gray-800 w-6 text-center">{item.quantity}</span>
                              <button
                                className="bg-[#c3ad6b] text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-[#b39b5a] transition-colors text-xs"
                                onClick={() => handleQuantityChange(item._id, 1)}
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-3 text-right font-semibold text-gray-800">
                            <span>₹{((item.Price || item.price || 0) * item.quantity).toFixed(2)}</span>
                          </td>
                          <td className="py-3 text-center">
                            <button
                              className="text-red-500 hover:text-red-700 text-lg font-bold"
                              onClick={() => handleRemoveItem(item._id)}
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="border-t p-4">

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">₹{getGstAmounts().subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">SGST ({gstRates.sgstRate}%):</span>
                    <span className="font-medium">₹{getGstAmounts().sgstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">CGST ({gstRates.cgstRate}%):</span>
                    <span className="font-medium">₹{getGstAmounts().cgstAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg text-gray-800">Total:</span>
                      <span className="font-bold text-lg text-gray-800">₹{getGstAmounts().total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <button
                    className="w-full py-2 px-4 rounded-md text-gray-700 bg-gray-200 font-semibold hover:bg-gray-300 transition-colors duration-200 text-sm"
                    onClick={handleClearCart}
                  >
                    Clear All
                  </button>
                  <button
                    className="w-full py-3 px-4 rounded-md text-white bg-gradient-to-r from-[#c3ad6b] to-[#b39b5a] font-semibold hover:from-[#b39b5a] hover:to-[#c3ad6b] transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => {
                      const hasAnyFreeItems = cartItems.some(item => item.isFree);
                      handlePlaceOrder(hasAnyFreeItems, navigate);
                    }}
                    disabled={isPlacingOrder}
                  >
                    {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Order;