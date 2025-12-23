import React, { useState, useEffect } from 'react';
import { showToast } from '../../utils/toaster';

const GSTSettings = () => {
  const [gstRates, setGstRates] = useState({
    sgstRate: 2.5,
    cgstRate: 2.5,
    gstRate: 5
  });

  useEffect(() => {
    // Load GST rates from localStorage
    const savedRates = localStorage.getItem('defaultGstRates');
    if (savedRates) {
      setGstRates(JSON.parse(savedRates));
    }
  }, []);

  const handleSaveRates = () => {
    // Validate rates
    if (gstRates.sgstRate < 0 || gstRates.cgstRate < 0) {
      showToast.error('GST rates cannot be negative');
      return;
    }

    if (gstRates.sgstRate > 50 || gstRates.cgstRate > 50) {
      showToast.error('GST rates cannot exceed 50%');
      return;
    }

    // Calculate total GST rate
    const totalGstRate = gstRates.sgstRate + gstRates.cgstRate;
    const updatedRates = {
      ...gstRates,
      gstRate: totalGstRate
    };

    // Save to localStorage
    localStorage.setItem('defaultGstRates', JSON.stringify(updatedRates));
    setGstRates(updatedRates);
    
    showToast.success('GST rates saved successfully!');
  };

  const handleReset = () => {
    const defaultRates = {
      sgstRate: 2.5,
      cgstRate: 2.5,
      gstRate: 5
    };
    setGstRates(defaultRates);
    localStorage.setItem('defaultGstRates', JSON.stringify(defaultRates));
    showToast.success('GST rates reset to default!');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">GST Settings</h1>
          <p className="text-gray-600">Configure default GST rates for restaurant orders</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SGST Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={gstRates.sgstRate}
                onChange={(e) => setGstRates({
                  ...gstRates,
                  sgstRate: parseFloat(e.target.value) || 0
                })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter SGST rate"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CGST Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={gstRates.cgstRate}
                onChange={(e) => setGstRates({
                  ...gstRates,
                  cgstRate: parseFloat(e.target.value) || 0
                })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter CGST rate"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total GST Rate:</span>
              <span className="text-lg font-bold text-blue-600">
                {(gstRates.sgstRate + gstRates.cgstRate).toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleSaveRates}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Save GST Rates
            </button>
            <button
              onClick={handleReset}
              className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              Reset to Default
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Note:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• These rates will be used as default for new orders</li>
              <li>• Rates can be edited individually for each order</li>
              <li>• SGST and CGST rates are typically equal (e.g., 2.5% each for 5% total GST)</li>
              <li>• Maximum allowed rate is 50% for each component</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GSTSettings;