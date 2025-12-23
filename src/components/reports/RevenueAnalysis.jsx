import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { TrendingUp, ArrowLeft, Printer, DollarSign, Users, BarChart3 } from 'lucide-react';

const RevenueAnalysis = ({ selectedDate, onBack }) => {
  const { axios } = useAppContext();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, [selectedDate]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/sub-reports/revenue-analysis/${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching revenue analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-lg">Loading Revenue Analysis...</div></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Revenue Analysis</h1>
            </div>
          </div>
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600">Date: {new Date(selectedDate).toLocaleDateString()}</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Total Revenue</p>
                <p className="text-3xl font-bold">₹{reportData?.revenueAnalysis?.roomRevenue?.toFixed(2) || '0.00'}</p>
              </div>
              <DollarSign className="w-12 h-12 text-purple-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total Bookings</p>
                <p className="text-3xl font-bold">{reportData?.revenueAnalysis?.totalBookings || 0}</p>
              </div>
              <Users className="w-12 h-12 text-blue-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Average Rate</p>
                <p className="text-3xl font-bold">₹{reportData?.revenueAnalysis?.averageRate?.toFixed(2) || '0.00'}</p>
              </div>
              <BarChart3 className="w-12 h-12 text-green-200" />
            </div>
          </div>
        </div>

        {/* Detailed Analysis */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            Revenue Breakdown
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Revenue Metrics */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-gray-800">Performance Metrics</h4>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                  <span className="text-gray-700">Room Revenue</span>
                  <span className="text-xl font-bold text-purple-600">₹{reportData?.revenueAnalysis?.roomRevenue?.toFixed(2) || '0.00'}</span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <span className="text-gray-700">Total Bookings</span>
                  <span className="text-xl font-bold text-blue-600">{reportData?.revenueAnalysis?.totalBookings || 0}</span>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <span className="text-gray-700">Average Daily Rate (ADR)</span>
                  <span className="text-xl font-bold text-green-600">₹{reportData?.revenueAnalysis?.averageRate?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>

            {/* Additional Insights */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-gray-800">Revenue Insights</h4>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700">Revenue per Booking</span>
                    <span className="font-semibold">₹{reportData?.revenueAnalysis?.averageRate?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{width: '75%'}}></div>
                  </div>
                </div>
                
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h5 className="font-semibold text-yellow-800 mb-2">Performance Summary</h5>
                  <p className="text-sm text-yellow-700">
                    {reportData?.revenueAnalysis?.totalBookings > 0 
                      ? `Generated ₹${reportData?.revenueAnalysis?.roomRevenue?.toFixed(2)} from ${reportData?.revenueAnalysis?.totalBookings} bookings`
                      : 'No bookings recorded for this date'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {reportData?.revenueAnalysis?.totalBookings === 0 && (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No revenue data available for this date</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RevenueAnalysis;