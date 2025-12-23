import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Users, ArrowLeft, Printer, AlertCircle, DollarSign } from 'lucide-react';

const DueBalanceReport = ({ onBack }) => {
  const { axios } = useAppContext();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/sub-reports/due-balance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching due balance report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-lg">Loading Due Balance Report...</div></div>;
  }

  const totalDue = reportData?.dueBalances?.reduce((sum, guest) => sum + guest.dueAmount, 0) || 0;
  const totalAdvance = reportData?.dueBalances?.reduce((sum, guest) => sum + guest.advancePaid, 0) || 0;

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
              <div className="p-3 bg-red-100 rounded-xl">
                <Users className="w-6 h-6 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">In House Guest Due Balance</h1>
            </div>
          </div>
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100">Total Due Amount</p>
                <p className="text-3xl font-bold">₹{totalDue.toFixed(2)}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-red-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Total Advance Paid</p>
                <p className="text-3xl font-bold">₹{totalAdvance.toFixed(2)}</p>
              </div>
              <DollarSign className="w-12 h-12 text-green-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">In-House Guests</p>
                <p className="text-3xl font-bold">{reportData?.dueBalances?.length || 0}</p>
              </div>
              <Users className="w-12 h-12 text-blue-200" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="mb-6">
            <p className="text-gray-600">Report generated on: {new Date().toLocaleDateString()}</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">GRC No</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Guest Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Room</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Amount</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Advance Paid</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Due Amount</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData?.dueBalances?.map((guest, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-blue-600">{guest.grcNo}</td>
                    <td className="px-6 py-4 font-medium">{guest.guestName}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {guest.roomNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold">₹{guest.totalAmount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-green-600 font-semibold">₹{guest.advancePaid.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-bold text-red-600">₹{guest.dueAmount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        guest.dueAmount > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {guest.dueAmount > 0 ? 'Pending' : 'Paid'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-right font-bold text-gray-900">TOTALS:</td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">
                    ₹{reportData?.dueBalances?.reduce((sum, guest) => sum + guest.totalAmount, 0).toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-green-600">₹{totalAdvance.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-bold text-red-600">₹{totalDue.toFixed(2)}</td>
                  <td className="px-6 py-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {(!reportData?.dueBalances || reportData.dueBalances.length === 0) && (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No guests with pending balances found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DueBalanceReport;