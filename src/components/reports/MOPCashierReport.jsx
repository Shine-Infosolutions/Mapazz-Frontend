import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { DollarSign, ArrowLeft, Printer, CreditCard } from 'lucide-react';

const MOPCashierReport = ({ selectedDate, onBack }) => {
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
      const response = await axios.get(`/api/sub-reports/mop-cashier/${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching MOP report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="text-lg">Loading MOP Report...</div></div>;
  }

  const totalAmount = Object.values(reportData?.mopReport || {}).reduce((sum, data) => sum + data.amount, 0);
  const totalTransactions = Object.values(reportData?.mopReport || {}).reduce((sum, data) => sum + data.count, 0);

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
              <div className="p-3 bg-green-100 rounded-xl">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">MOP Wise Cashier Report</h1>
            </div>
          </div>
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Total Amount</p>
                <p className="text-3xl font-bold">₹{totalAmount.toFixed(2)}</p>
              </div>
              <DollarSign className="w-12 h-12 text-green-200" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total Transactions</p>
                <p className="text-3xl font-bold">{totalTransactions}</p>
              </div>
              <CreditCard className="w-12 h-12 text-blue-200" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="mb-6">
            <p className="text-gray-600">Date: {new Date(selectedDate).toLocaleDateString()}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(reportData?.mopReport || {}).map(([mode, data]) => (
              <div key={mode} className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">{mode}</h3>
                  <CreditCard className="w-6 h-6 text-gray-400" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Transactions:</span>
                    <span className="font-semibold text-blue-600">{data.count}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Amount:</span>
                    <span className="text-xl font-bold text-green-600">₹{data.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Average:</span>
                    <span className="font-medium text-purple-600">₹{data.count > 0 ? (data.amount / data.count).toFixed(2) : '0.00'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {Object.keys(reportData?.mopReport || {}).length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No payment transactions found for this date</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MOPCashierReport;