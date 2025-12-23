import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Calendar, ArrowLeft, Printer, TrendingUp, Users } from 'lucide-react';

const ForecastReport = ({ selectedDate, onBack }) => {
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
      const response = await axios.get(`/api/sub-reports/forecast/${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching forecast:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-lg">Loading 10 Days Forecast...</div></div>;
  }

  const totalBookings = reportData?.forecast?.reduce((sum, day) => sum + day.bookings, 0) || 0;
  const totalRevenue = reportData?.forecast?.reduce((sum, day) => sum + day.revenue, 0) || 0;
  const averageDaily = totalRevenue / 10;

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
              <div className="p-3 bg-teal-100 rounded-xl">
                <Calendar className="w-6 h-6 text-teal-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">10 Days Forecast</h1>
            </div>
          </div>
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100">Total Bookings (10 Days)</p>
                <p className="text-3xl font-bold">{totalBookings}</p>
              </div>
              <Users className="w-12 h-12 text-teal-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Total Revenue (10 Days)</p>
                <p className="text-3xl font-bold">₹{totalRevenue.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-purple-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Average Daily Revenue</p>
                <p className="text-3xl font-bold">₹{averageDaily.toFixed(2)}</p>
              </div>
              <Calendar className="w-12 h-12 text-blue-200" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="mb-6">
            <p className="text-gray-600">Forecast Period: {new Date(selectedDate).toLocaleDateString()} - {new Date(new Date(selectedDate).getTime() + 9 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
          </div>
          
          {/* Forecast Chart */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Daily Forecast Overview</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Bookings Chart */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Daily Bookings</h4>
                <div className="space-y-2">
                  {reportData?.forecast?.map((day, index) => {
                    const maxBookings = Math.max(...(reportData?.forecast?.map(d => d.bookings) || [1]));
                    const width = maxBookings > 0 ? (day.bookings / maxBookings) * 100 : 0;
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-20 text-xs text-gray-600">
                          {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                          <div 
                            className="bg-gradient-to-r from-teal-400 to-teal-600 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                            style={{ width: `${Math.max(width, 10)}%` }}
                          >
                            {day.bookings}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Revenue Chart */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-700">Daily Revenue</h4>
                <div className="space-y-2">
                  {reportData?.forecast?.map((day, index) => {
                    const maxRevenue = Math.max(...(reportData?.forecast?.map(d => d.revenue) || [1]));
                    const width = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-20 text-xs text-gray-600">
                          {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                          <div 
                            className="bg-gradient-to-r from-purple-400 to-purple-600 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                            style={{ width: `${Math.max(width, 15)}%` }}
                          >
                            ₹{day.revenue.toFixed(0)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Day</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Bookings</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData?.forecast?.map((day, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium">{new Date(day.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                        {day.bookings}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-purple-600">₹{day.revenue.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      {index > 0 && (
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          day.revenue > reportData.forecast[index - 1].revenue 
                            ? 'bg-green-100 text-green-800' 
                            : day.revenue < reportData.forecast[index - 1].revenue
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {day.revenue > reportData.forecast[index - 1].revenue ? '↗' : 
                           day.revenue < reportData.forecast[index - 1].revenue ? '↘' : '→'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(!reportData?.forecast || reportData.forecast.length === 0) && (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No forecast data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForecastReport;