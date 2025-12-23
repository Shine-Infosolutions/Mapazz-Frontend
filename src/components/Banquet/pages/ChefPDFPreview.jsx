import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useReactToPrint } from "react-to-print";
import Logo from "../../../assets/hawana golden png.png";

const ChefPDFPreview = ({ booking, className }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(false);
  const printRef = useRef();

  const fetchMenuData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/banquet-menus/${booking._id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log('Chef Menu API Response:', response.data);
      console.log('Menu data structure:', response.data.data);
      console.log('Categories:', response.data.data?.categories);
      
      const menuData = response.data.data?.categories || response.data.data || response.data || {};
      console.log('Final menu data:', menuData);
      setMenuData(menuData);
    } catch (error) {
      console.error('Error fetching menu:', error);
      setMenuData({});
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    await fetchMenuData();
    setShowPreview(true);
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Chef_Instructions_${booking.customerRef || booking.name}_${new Date().toISOString().split('T')[0]}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 0.5in;
      }
      @media print {
        body { -webkit-print-color-adjust: exact; }
        * { print-color-adjust: exact !important; }
      }
    `,
    onAfterPrint: () => console.log('Print completed')
  });

  return (
    <>
      <button
        onClick={handlePreview}
        className={`w-full inline-flex items-center justify-center gap-1 rounded-lg shadow transition-colors font-semibold px-3 py-2 text-xs ${className || ''}`}
        style={{backgroundColor: '#c3ad6b', color: 'white'}}
        onMouseEnter={(e) => e.target.style.backgroundColor = '#b39b5a'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#c3ad6b'}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Chef Invoice
      </button>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-5xl mx-auto max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Chef Instructions Preview</h3>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 text-white rounded transition-colors"
                  style={{backgroundColor: '#c3ad6b'}}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#b39b5a'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#c3ad6b'}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Download PDF'}
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{borderColor: '#c3ad6b'}}></div>
                  <span className="ml-2">Loading menu...</span>
                </div>
              ) : (
                <div ref={printRef} className="bg-white p-8 max-w-4xl mx-auto">
                  <div className="text-center mb-8">
                    <img src={Logo} alt="Ashoka Hotel" className="w-20 h-20 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold">ASHOKA HOTEL - CHEF INSTRUCTIONS</h1>
                  </div>
                  
                  <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4 pb-2" style={{borderBottom: '2px solid #c3ad6b', color: '#c3ad6b'}}>BOOKING DETAILS</h2>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                      <div><strong>Customer:</strong> {booking.name || 'N/A'}</div>
                      <div><strong>Date:</strong> {new Date(booking.startDate).toLocaleDateString()}</div>
                      <div><strong>Time:</strong> {booking.time || 'N/A'}</div>
                      <div><strong>Pax:</strong> {booking.pax || 'N/A'}</div>
                      <div><strong>Food Type:</strong> {booking.foodType || 'N/A'}</div>
                      <div><strong>Rate Plan:</strong> {booking.ratePlan || 'N/A'}</div>
                      <div><strong>Hall:</strong> {booking.hall || 'N/A'}</div>
                      <div><strong>Ref:</strong> {booking.customerRef || 'N/A'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h2 className="text-xl font-bold mb-6 pb-2" style={{borderBottom: '2px solid #c3ad6b', color: '#c3ad6b'}}>MENU ITEMS TO PREPARE</h2>
                    {menuData && Object.keys(menuData).length > 0 ? (
                      <div className="grid grid-cols-2 gap-8">
                        {Object.entries(menuData).map(([category, items]) => {
                          const skip = ["_id", "createdAt", "updatedAt", "__v", "bookingRef", "customerRef"];
                          if (skip.includes(category)) return null;
                          if (Array.isArray(items) && items.length > 0) {
                            return (
                              <div key={category} className="mb-6">
                                <h3 className="text-lg font-bold mb-3 uppercase" style={{color: '#c3ad6b'}}>
                                  {category.replaceAll("_", " ")}
                                </h3>
                                <ul className="space-y-2">
                                  {items.map((item, i) => (
                                    <li key={i} className="flex items-start">
                                      <span className="mr-3 mt-1">•</span>
                                      <span className="text-sm">{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    ) : (
                      <p className="text-center py-8 text-gray-500">No menu items available</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChefPDFPreview;
