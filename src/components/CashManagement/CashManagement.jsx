import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { IndianRupee, CreditCard, Smartphone, TrendingUp, TrendingDown, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
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

const CashManagement = () => {
  const { axios } = useAppContext();
  const [cashData, setCashData] = useState({
    todayRevenue: 0,
    cashInHand: 0,
    cardPayments: 0,
    upiPayments: 0,
    recentTransactions: [],
    expenses: [],
    sentToOffice: 0,
    officeToReception: 0,
    sourceBreakdown: []
  });
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    type: 'KEEP AT RECEPTION',
    source: 'OTHER',
    description: '',
    isCustomerPayment: false,
    keepPercentage: 30
  });
  const [formLoading, setFormLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');

  const fetchCashData = async (filter = dateFilter, source = sourceFilter, startDt = startDate, endDt = endDate, isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setFilterLoading(true);
    }
    try {
      let url = `/api/cash-transactions/all-transactions?filter=${filter}`;
      if (filter === 'range' && startDt && endDt) {
        url += `&startDate=${startDt}&endDate=${endDt}`;
      }
      if (source && source !== 'all') {
        url += `&source=${source}`;
      }
      
      const response = await axios.get(url);
      const data = response.data;
      
      // Process transactions data
      const transactions = data.transactions || [];
      let totalReceived = 0;
      let totalSent = 0;
      let officeToReception = 0;
      
      // Calculate totals from transactions
      transactions.forEach(transaction => {
        if (transaction.type === 'KEEP AT RECEPTION') {
          totalReceived += transaction.amount || 0;
        } else if (transaction.type === 'OFFICE TO RECEPTION') {
          totalReceived += transaction.amount || 0;
          officeToReception += transaction.amount || 0;
        } else if (transaction.type === 'SENT TO OFFICE') {
          totalSent += transaction.amount || 0;
        }
      });
      
      // Calculate cash in hand
      const cashInReception = totalReceived - totalSent;
      
      // Group by source for breakdown
      const sourceMap = {};
      transactions.forEach(transaction => {
        const source = transaction.source || 'OTHER';
        if (!sourceMap[source]) {
          sourceMap[source] = 0;
        }
        if (transaction.type === 'KEEP AT RECEPTION' || transaction.type === 'OFFICE TO RECEPTION') {
          sourceMap[source] += transaction.amount || 0;
        }
      });
      
      const sourceBreakdown = Object.entries(sourceMap).map(([source, total]) => ({
        _id: source,
        total
      }));
      
      const finalData = {
        todayRevenue: totalReceived,
        cashInHand: cashInReception,
        cardPayments: 0,
        upiPayments: 0,
        recentTransactions: transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        expenses: [],
        sentToOffice: totalSent,
        officeToReception: officeToReception,
        sourceBreakdown
      };
      
      setCashData(finalData);
    } catch (error) {
      console.error('Cash Management API Error:', error);
      setCashData({
        todayRevenue: 0,
        cashInHand: 0,
        cardPayments: 0,
        upiPayments: 0,
        recentTransactions: [],
        expenses: [],
        sentToOffice: 0,
        officeToReception: 0,
        sourceBreakdown: []
      });
    } finally {
      setLoading(false);
      setFilterLoading(false);
    }
  };

  useEffect(() => {
    fetchCashData(dateFilter, sourceFilter, startDate, endDate, true);
  }, [axios]);

  const handleDateFilterChange = (newFilter) => {
    setDateFilter(newFilter);
    if (newFilter !== 'range') {
      setStartDate('');
      setEndDate('');
      fetchCashData(newFilter, sourceFilter, '', '', false);
    }
  };

  const handleDateRangeChange = () => {
    if (startDate && endDate) {
      fetchCashData('range', sourceFilter, startDate, endDate, false);
    }
  };

  const handleSourceFilterChange = (newSource) => {
    setSourceFilter(newSource);
    fetchCashData(dateFilter, newSource, startDate, endDate, false);
  };

  const exportToExcel = async () => {
    try {
      let url = `/api/cash-transactions/excel-report?filter=${dateFilter}`;
      if (dateFilter === 'range' && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      if (sourceFilter && sourceFilter !== 'all') {
        url += `&source=${sourceFilter}`;
      }
      
      const response = await axios.get(url, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });
      
      const contentType = response.headers['content-type'] || '';
      let mimeType, fileExtension;
      
      if (contentType.includes('spreadsheet') || contentType.includes('excel')) {
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileExtension = 'xlsx';
      } else {
        mimeType = 'text/csv;charset=utf-8;';
        fileExtension = 'csv';
      }
      
      const blob = new Blob([response.data], { type: mimeType });
      const link = document.createElement('a');
      const downloadUrl = URL.createObjectURL(blob);
      link.setAttribute('href', downloadUrl);
      link.setAttribute('download', `cash-transactions-${new Date().toISOString().split('T')[0]}.${fileExtension}`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      
      toast.success(`${fileExtension.toUpperCase()} report downloaded successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export report');
    }
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || formData.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    setFormLoading(true);
    try {
      if (formData.isCustomerPayment && Number(formData.amount) > 0) {
        const totalAmount = Number(formData.amount);
        const keepAmount = totalAmount * formData.keepPercentage / 100;
        const sendAmount = totalAmount * (100 - formData.keepPercentage) / 100;
        
        if (keepAmount > 0) {
          await axios.post('/api/cash-transactions/add-transaction', {
            amount: keepAmount,
            type: 'KEEP AT RECEPTION',
            source: formData.source,
            description: `Customer Payment - Kept (${formData.keepPercentage}%)`
          });
        }
        
        if (sendAmount > 0) {
          await axios.post('/api/cash-transactions/add-transaction', {
            amount: sendAmount,
            type: 'SENT TO OFFICE',
            source: formData.source,
            description: `Customer Payment - Sent (${100 - formData.keepPercentage}%)`
          });
        }
        
        toast.success(`Payment split: ₹${keepAmount.toFixed(0)} kept, ₹${sendAmount.toFixed(0)} sent`);
      } else {
        await axios.post('/api/cash-transactions/add-transaction', {
          amount: Number(formData.amount),
          type: formData.type,
          source: formData.source,
          description: formData.description
        });
        
        toast.success(formData.type === 'SENT TO OFFICE' ? `₹${formData.amount} sent to office` : 'Transaction added');
      }
      
      setFormData({ amount: '', type: 'KEEP AT RECEPTION', source: 'OTHER', description: '', isCustomerPayment: false, keepPercentage: 30 });
      setShowTransactionForm(false);
      
      // Refresh data
      await fetchCashData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Transaction failed');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return <DashboardLoader pageName="Cash Management" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 w-full overflow-x-hidden" style={{opacity: filterLoading ? 0.8 : 1, transition: 'opacity 0.3s ease-in-out'}}>
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b animate-slideInLeft animate-delay-100" style={{borderColor: '#c3ad6b'}}>
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-6 md:py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
            <div className="w-full md:w-auto">
              <h1 className="text-2xl sm:text-3xl md:text-4xl xl:text-5xl font-bold flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4" style={{color: '#5D4037'}}>
                <div className="p-2 sm:p-3 md:p-4 rounded-xl shadow-lg" style={{background: 'linear-gradient(to right, #c3ad6b, #d4c078)'}}>
                  <IndianRupee className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 xl:h-12 xl:w-12 text-white" />
                </div>
                <span className="text-xl sm:text-2xl md:text-4xl xl:text-5xl" style={{background: 'linear-gradient(to right, #c3ad6b, #d4c078)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
                  Cash Management
                </span>
              </h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base md:text-lg xl:text-xl">Monitor and manage your cash flow operations</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <button
                onClick={exportToExcel}
                className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Export Excel
              </button>
              <button 
                onClick={() => setShowTransactionForm(true)}
                className="w-full sm:w-auto text-white px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 rounded-xl font-semibold flex items-center justify-center gap-2 sm:gap-3 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base md:text-lg"
                style={{background: 'linear-gradient(to right, #c3ad6b, #d4c078)'}}
                onMouseEnter={(e) => e.target.style.background = 'linear-gradient(to right, #b39b5a, #c3ad6b)'}
                onMouseLeave={(e) => e.target.style.background = 'linear-gradient(to right, #c3ad6b, #d4c078)'}
              >
                <IndianRupee className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
                <span className="hidden sm:inline">Add Transaction</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-4 sm:py-6 md:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 animate-fadeInUp animate-delay-200">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 hover:shadow-2xl transition-all duration-300 transform hover:scale-105" style={{border: '1px solid #c3ad6b'}}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide truncate" style={{color: '#5D4037'}}>
                  {dateFilter === 'all' ? "Total Revenue" :
                   dateFilter === 'today' ? "Today's Revenue" : 
                   dateFilter === 'week' ? "This Week's Revenue" :
                   dateFilter === 'month' ? "This Month's Revenue" :
                   dateFilter === 'year' ? "This Year's Revenue" : "Revenue"}
                </p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-2 sm:mt-3" style={{background: 'linear-gradient(to right, #16a34a, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
                  ₹{cashData.todayRevenue.toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 font-medium">Total received</p>
              </div>
              <div className="p-2 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl shadow-lg ml-2 sm:ml-4" style={{background: 'linear-gradient(to right, #16a34a, #059669)'}}>
                <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 hover:shadow-2xl transition-all duration-300 transform hover:scale-105" style={{border: '1px solid #c3ad6b'}}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide truncate" style={{color: '#5D4037'}}>Cash At Reception</p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-2 sm:mt-3" style={{
                  background: cashData.cashInHand >= 0 ? 'linear-gradient(to right, #c3ad6b, #d4c078)' : 'linear-gradient(to right, #dc2626, #ef4444)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  ₹{Math.abs(cashData.cashInHand).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {cashData.cashInHand >= 0 ? 'Available cash' : 'Cash deficit'}
                </p>
              </div>
              <div className="p-3 rounded-full" style={{
                backgroundColor: cashData.cashInHand >= 0 ? 'hsl(45, 100%, 90%)' : '#fef2f2'
              }}>
                {cashData.cashInHand >= 0 ? 
                  <IndianRupee className="h-6 w-6" style={{color: 'hsl(45, 43%, 58%)'}} /> :
                  <AlertCircle className="h-6 w-6 text-red-600" />
                }
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 hover:shadow-2xl transition-all duration-300 transform hover:scale-105" style={{border: '1px solid #c3ad6b'}}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide truncate" style={{color: '#5D4037'}}>Cash In Office</p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-2 sm:mt-3" style={{background: 'linear-gradient(to right, #5D4037, #4A2C20)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
                  ₹{cashData.sentToOffice.toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 font-medium">Sent to office</p>
              </div>
              <div className="p-2 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl shadow-lg ml-2 sm:ml-4" style={{background: 'linear-gradient(to right, #5D4037, #4A2C20)'}}>
                <TrendingDown className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 hover:shadow-2xl transition-all duration-300 transform hover:scale-105" style={{border: '1px solid #c3ad6b'}}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide truncate" style={{color: '#5D4037'}}>Office to Reception</p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-2 sm:mt-3" style={{background: 'linear-gradient(to right, #059669, #16a34a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
                  ₹{cashData.officeToReception.toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 font-medium">Received from office</p>
              </div>
              <div className="p-2 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl shadow-lg ml-2 sm:ml-4" style={{background: 'linear-gradient(to right, #059669, #16a34a)'}}>
                <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Source Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 animate-fadeInUp animate-delay-300">
          {['RESTAURANT', 'ROOM_BOOKING', 'BANQUET + PARTY', 'OTHER'].map((source) => {
            const sourceData = (cashData.sourceBreakdown || []).find(s => s._id === source) || { total: 0 };
            
            return (
              <div key={source} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-scaleIn" style={{border: '1px solid #c3ad6b', animationDelay: `${500 + (['RESTAURANT', 'ROOM_BOOKING', 'BANQUET + PARTY', 'OTHER'].indexOf(source) * 50)}ms`}}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide truncate" style={{color: '#5D4037'}}>
                      {source.replace('_', ' ').replace(' + ', ' & ')}
                    </p>
                    <p className="text-xl sm:text-2xl font-bold mt-2" style={{background: 'linear-gradient(to right, #c3ad6b, #d4c078)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
                      ₹{sourceData.total.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600 mt-1 font-medium">
                      Revenue source
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 rounded-xl ml-2" style={{backgroundColor: '#f5f1e8'}}>
                    <IndianRupee className="h-5 w-5 sm:h-6 sm:w-6" style={{color: '#c3ad6b'}} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6 md:p-8 animate-fadeInUp animate-delay-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
              {filterLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-amber-200 border-t-amber-500"></div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full sm:w-auto">
              <select 
                value={dateFilter} 
                onChange={(e) => handleDateFilterChange(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm w-full sm:w-auto">
                <option value="all">All</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
                <option value="range">Date Range</option>
              </select>
              {dateFilter === 'range' && (
                <>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="Start Date"
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm w-full sm:w-auto"
                  />
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="End Date"
                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm w-full sm:w-auto"
                  />
                  <button
                    onClick={handleDateRangeChange}
                    disabled={!startDate || !endDate}
                    className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors w-full sm:w-auto"
                    style={{backgroundColor: 'hsl(45, 43%, 58%)', color: 'white'}}
                  >
                    Apply
                  </button>
                </>
              )}
              <select 
                value={sourceFilter} 
                onChange={(e) => handleSourceFilterChange(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm w-full sm:w-auto">
                <option value="all">All Sources</option>
                <option value="RESTAURANT">Restaurant</option>
                <option value="ROOM_BOOKING">Room Booking</option>
                <option value="BANQUET + PARTY">Banquet + Party</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {cashData.recentTransactions.length > 0 ? (
              <table className="min-w-full text-sm">
                <thead>
                  <tr style={{backgroundColor: 'hsl(45, 100%, 95%)'}}>
                    <th className="text-left p-2 sm:p-3 font-medium whitespace-nowrap" style={{color: 'hsl(45, 100%, 30%)'}}>Amount</th>
                    <th className="text-left p-2 sm:p-3 font-medium whitespace-nowrap" style={{color: 'hsl(45, 100%, 30%)'}}>Type</th>
                    <th className="text-left p-2 sm:p-3 font-medium whitespace-nowrap" style={{color: 'hsl(45, 100%, 30%)'}}>Source</th>
                    <th className="text-left p-2 sm:p-3 font-medium whitespace-nowrap" style={{color: 'hsl(45, 100%, 30%)'}}>Description</th>
                    <th className="text-left p-2 sm:p-3 font-medium whitespace-nowrap" style={{color: 'hsl(45, 100%, 30%)'}}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {cashData.recentTransactions
                    .filter(transaction => sourceFilter === 'all' || transaction.source === sourceFilter)
                    .slice(0, 10).map((transaction, index) => (
                    <tr key={index} className="border-b border-gray-100 animate-fadeInUp" style={{animationDelay: `${Math.min(index * 50 + 600, 1000)}ms`}}>
                      <td className="p-3">
                        <span className="font-semibold" style={{color: (transaction.type === 'KEEP AT RECEPTION' || transaction.type === 'OFFICE TO RECEPTION') ? '#16a34a' : 'hsl(45, 43%, 58%)'}}>
                          ₹{transaction.amount?.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium" style={{
                          backgroundColor: 
                            transaction.type === 'KEEP AT RECEPTION' ? '#dcfce7' :
                            transaction.type === 'OFFICE TO RECEPTION' ? '#dbeafe' :
                            'hsl(45, 100%, 90%)',
                          color: 
                            transaction.type === 'KEEP AT RECEPTION' ? '#166534' :
                            transaction.type === 'OFFICE TO RECEPTION' ? '#1e40af' :
                            'hsl(45, 100%, 20%)'
                        }}>
                          {transaction.type === 'KEEP AT RECEPTION' ? 'Keep at Reception' :
                           transaction.type === 'OFFICE TO RECEPTION' ? 'Office to Reception' :
                           'Sent to Office'}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600">
                        {transaction.source?.replace('_', ' ')}
                      </td>
                      <td className="p-3 text-gray-500">
                        {transaction.description || '-'}
                      </td>
                      <td className="p-3 text-xs text-gray-400">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No transactions found</p>
                <p className="text-sm">{sourceFilter !== 'all' ? `No transactions found for ${sourceFilter.replace('_', ' ')}` : 'Add your first transaction to get started'}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Form Modal */}
      {showTransactionForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-md border border-amber-200">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Add Cash Transaction</h3>
            <form onSubmit={handleTransactionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Amount (₹)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Transaction Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={formData.isCustomerPayment}
                >
                  <option value="KEEP AT RECEPTION">Keep at Reception</option>
                  <option value="SENT TO OFFICE">Send to Office</option>
                  <option value="OFFICE TO RECEPTION">Office to Reception</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Source</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({...formData, source: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="RESTAURANT">Restaurant</option>
                  <option value="ROOM_BOOKING">Room Booking</option>
                  <option value="BANQUET + PARTY">Banquet + Party</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.isCustomerPayment}
                    onChange={(e) => setFormData({...formData, isCustomerPayment: e.target.checked, description: e.target.checked ? 'Customer Payment' : ''})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Customer Payment (Auto Split)
                  </label>
                </div>
              </div>
              {formData.isCustomerPayment && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Keep at Reception: {formData.keepPercentage}% (₹{formData.amount ? (Number(formData.amount) * formData.keepPercentage / 100).toFixed(0) : 0})
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.keepPercentage}
                    onChange={(e) => setFormData({...formData, keepPercentage: Number(e.target.value)})}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs mt-1 text-gray-500">
                    <span>0%</span>
                    <span>Send to Office: {100 - formData.keepPercentage}% (₹{formData.amount ? (Number(formData.amount) * (100 - formData.keepPercentage) / 100).toFixed(0) : 0})</span>
                    <span>100%</span>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional description"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={formLoading || !formData.amount}
                  className="flex-1 text-white py-2 rounded-lg disabled:opacity-50 transition-colors"
                  style={{backgroundColor: 'hsl(45, 43%, 58%)'}}
                  onMouseEnter={(e) => !e.target.disabled && (e.target.style.backgroundColor = 'hsl(45, 32%, 46%)')}
                  onMouseLeave={(e) => !e.target.disabled && (e.target.style.backgroundColor = 'hsl(45, 43%, 58%)')}
                >
                  {formLoading ? 'Adding...' : 'Add Transaction'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowTransactionForm(false);
                    setFormData({ amount: '', type: 'KEEP AT RECEPTION', source: 'OTHER', description: '', isCustomerPayment: false, keepPercentage: 30 });
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashManagement;