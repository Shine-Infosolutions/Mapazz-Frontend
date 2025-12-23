import React, { useState, useEffect } from 'react';
import { Calendar, FileText, Download, Printer } from 'lucide-react';
import axios from 'axios';

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

const NightAuditReport = () => {
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const generateReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await axios.get(`${BASE_URL}/api/reports/night-audit?date=${reportDate}`, { headers });
      setReportData(response.data.data);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, []);

  const printReport = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 print:shadow-none print:hidden animate-slideInLeft animate-delay-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Night Audit Report</h1>
              <p className="text-gray-600 mt-1">Comprehensive hotel operations report</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <button
                onClick={generateReport}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
              <button
                onClick={printReport}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center gap-2 print:hidden"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="bg-white rounded-lg shadow-sm print:shadow-none animate-fadeInUp animate-delay-200">
          {/* Report Header */}
          <div className="p-6 border-b print:border-gray-300">
            <div className="text-center">
              <h2 className="text-xl font-bold">Night Audit Report</h2>
              <p className="text-gray-600">{new Date(reportDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Generating report...</p>
            </div>
          ) : !reportData ? (
            <div className="p-6 text-center">
              <p className="text-gray-600">No data available. Please generate a report.</p>
            </div>
          ) : (
          <div className="p-6 space-y-8">
            {/* House Status */}
            <section className="animate-scaleIn animate-delay-300">
              <h3 className="text-lg font-semibold mb-4 text-blue-600 border-b pb-2">House Status</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-yellow-100">
                      <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Today</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">WTD</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">MTD</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">YTD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData && (
                      <>
                        <tr><td className="border border-gray-300 px-4 py-2 font-medium">Total Rooms</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.totalRooms.today}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.totalRooms.wtd}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.totalRooms.mtd}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.totalRooms.ytd}</td></tr>
                        <tr><td className="border border-gray-300 px-4 py-2">Out of Order</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.outOfOrder.today || '-'}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.outOfOrder.wtd || '-'}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.outOfOrder.mtd || '-'}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.outOfOrder.ytd || '-'}</td></tr>
                        <tr><td className="border border-gray-300 px-4 py-2">Room Inventory</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.roomInventory.today}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.roomInventory.wtd}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.roomInventory.mtd}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.roomInventory.ytd}</td></tr>
                        <tr><td className="border border-gray-300 px-4 py-2">Available</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.available.today}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.available.wtd}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.available.mtd}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.available.ytd}</td></tr>
                        <tr><td className="border border-gray-300 px-4 py-2">Occupied</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.occupied.today}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.occupied.wtd}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.occupied.mtd}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.occupied.ytd}</td></tr>
                        <tr><td className="border border-gray-300 px-4 py-2">Reserved</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.reserved.today || '-'}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.reserved.wtd}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.reserved.mtd}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.reserved.ytd}</td></tr>
                        <tr><td className="border border-gray-300 px-4 py-2">Reservations Made</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.reservationsMade.today}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.reservationsMade.wtd}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.reservationsMade.mtd}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.reservationsMade.ytd}</td></tr>
                        <tr><td className="border border-gray-300 px-4 py-2">Arrivals</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.arrivals.today || '-'}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.arrivals.wtd}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.arrivals.mtd}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.arrivals.ytd}</td></tr>
                        <tr><td className="border border-gray-300 px-4 py-2">Departures</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.departures.today}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.departures.wtd}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.departures.mtd}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.departures.ytd}</td></tr>
                        <tr><td className="border border-gray-300 px-4 py-2">Walk-Ins</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.walkIns.today || '-'}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.walkIns.wtd}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.walkIns.mtd}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.walkIns.ytd}</td></tr>
                        <tr><td className="border border-gray-300 px-4 py-2">No Shows</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.noShows.today}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.noShows.wtd}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.noShows.mtd}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.noShows.ytd}</td></tr>
                        <tr><td className="border border-gray-300 px-4 py-2">Cancellations</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.cancellations.today || '-'}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.cancellations.wtd || '-'}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.cancellations.mtd}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.cancellations.ytd}</td></tr>
                        <tr><td className="border border-gray-300 px-4 py-2">Void</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.void.today}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.void.wtd}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.void.mtd}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.void.ytd}</td></tr>
                        <tr><td className="border border-gray-300 px-4 py-2">Over Stay</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.overStay.today || '-'}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.overStay.wtd || '-'}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.overStay.mtd || '-'}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.overStay.ytd || '-'}</td></tr>
                        <tr><td className="border border-gray-300 px-4 py-2">Under Stay</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.underStay.today || '-'}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.underStay.wtd || '-'}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.underStay.mtd}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.underStay.ytd}</td></tr>
                        <tr><td className="border border-gray-300 px-4 py-2">Stay Over</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.stayOver.today}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.stayOver.wtd}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.stayOver.mtd}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.stayOver.ytd}</td></tr>
                        <tr><td className="border border-gray-300 px-4 py-2">Guest in House</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.guestInHouse.today}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.guestInHouse.wtd}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.guestInHouse.mtd}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.houseStatus.guestInHouse.ytd}</td></tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* House Keeping Status */}
            <section className="animate-scaleIn animate-delay-300">
              <h3 className="text-lg font-semibold mb-4 text-blue-600 border-b pb-2">House Keeping Status</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-yellow-100">
                      <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Vacant</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Occupied</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData && (
                      <>
                        <tr><td className="border border-gray-300 px-4 py-2">Clean</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.housekeepingStatus.clean.vacant}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.housekeepingStatus.clean.occupied || '-'}</td></tr>
                        <tr><td className="border border-gray-300 px-4 py-2">Dirty</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.housekeepingStatus.dirty.vacant}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.housekeepingStatus.dirty.occupied || '-'}</td></tr>
                        <tr><td className="border border-gray-300 px-4 py-2">Touch-up</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.housekeepingStatus.touchUp.vacant}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.housekeepingStatus.touchUp.occupied || '-'}</td></tr>
                        <tr><td className="border border-gray-300 px-4 py-2 font-medium">Total</td><td className="border border-gray-300 px-4 py-2 text-center font-medium">{reportData.housekeepingStatus.total.vacant}</td><td className="border border-gray-300 px-4 py-2 text-center font-medium">{reportData.housekeepingStatus.total.occupied}</td></tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Revenue Analysis */}
            <section className="animate-scaleIn animate-delay-300">
              <h3 className="text-lg font-semibold mb-4 text-blue-600 border-b pb-2">Revenue Analysis</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-yellow-100">
                      <th className="border border-gray-300 px-4 py-2 text-left">Particulars</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Today</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">%</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">WTD</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">%</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">MTD</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">%</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">YTD</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData && (
                      <>
                        <tr><td className="border border-gray-300 px-4 py-2">Room Charges A/C</td><td className="border border-gray-300 px-4 py-2 text-center">₹{reportData.revenueAnalysis.roomCharges.today.toLocaleString()}</td><td className="border border-gray-300 px-4 py-2 text-center">{((reportData.revenueAnalysis.roomCharges.today / reportData.revenueAnalysis.total.today) * 100).toFixed(2)}%</td><td className="border border-gray-300 px-4 py-2 text-center">₹{reportData.revenueAnalysis.roomCharges.wtd.toLocaleString()}</td><td className="border border-gray-300 px-4 py-2 text-center">{((reportData.revenueAnalysis.roomCharges.wtd / reportData.revenueAnalysis.total.wtd) * 100).toFixed(2)}%</td><td className="border border-gray-300 px-4 py-2 text-center">₹{reportData.revenueAnalysis.roomCharges.mtd.toLocaleString()}</td><td className="border border-gray-300 px-4 py-2 text-center">{((reportData.revenueAnalysis.roomCharges.mtd / reportData.revenueAnalysis.total.mtd) * 100).toFixed(2)}%</td><td className="border border-gray-300 px-4 py-2 text-center">₹{reportData.revenueAnalysis.roomCharges.ytd.toLocaleString()}</td><td className="border border-gray-300 px-4 py-2 text-center">{((reportData.revenueAnalysis.roomCharges.ytd / reportData.revenueAnalysis.total.ytd) * 100).toFixed(2)}%</td></tr>
                        <tr><td className="border border-gray-300 px-4 py-2">No Show Charges A/C</td><td className="border border-gray-300 px-4 py-2 text-center">₹{reportData.revenueAnalysis.noShowCharges.today.toLocaleString()}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.revenueAnalysis.total.today > 0 ? ((reportData.revenueAnalysis.noShowCharges.today / reportData.revenueAnalysis.total.today) * 100).toFixed(2) : 0}%</td><td className="border border-gray-300 px-4 py-2 text-center">₹{reportData.revenueAnalysis.noShowCharges.wtd.toLocaleString()}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.revenueAnalysis.total.wtd > 0 ? ((reportData.revenueAnalysis.noShowCharges.wtd / reportData.revenueAnalysis.total.wtd) * 100).toFixed(2) : 0}%</td><td className="border border-gray-300 px-4 py-2 text-center">₹{reportData.revenueAnalysis.noShowCharges.mtd.toLocaleString()}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.revenueAnalysis.total.mtd > 0 ? ((reportData.revenueAnalysis.noShowCharges.mtd / reportData.revenueAnalysis.total.mtd) * 100).toFixed(2) : 0}%</td><td className="border border-gray-300 px-4 py-2 text-center">₹{reportData.revenueAnalysis.noShowCharges.ytd.toLocaleString()}</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.revenueAnalysis.total.ytd > 0 ? ((reportData.revenueAnalysis.noShowCharges.ytd / reportData.revenueAnalysis.total.ytd) * 100).toFixed(2) : 0}%</td></tr>
                        <tr><td className="border border-gray-300 px-4 py-2">Sales A/C</td><td className="border border-gray-300 px-4 py-2 text-center">₹{reportData.revenueAnalysis.salesAC.today.toLocaleString()}</td><td className="border border-gray-300 px-4 py-2 text-center">{((reportData.revenueAnalysis.salesAC.today / reportData.revenueAnalysis.total.today) * 100).toFixed(2)}%</td><td className="border border-gray-300 px-4 py-2 text-center">₹{reportData.revenueAnalysis.salesAC.wtd.toLocaleString()}</td><td className="border border-gray-300 px-4 py-2 text-center">{((reportData.revenueAnalysis.salesAC.wtd / reportData.revenueAnalysis.total.wtd) * 100).toFixed(2)}%</td><td className="border border-gray-300 px-4 py-2 text-center">₹{reportData.revenueAnalysis.salesAC.mtd.toLocaleString()}</td><td className="border border-gray-300 px-4 py-2 text-center">{((reportData.revenueAnalysis.salesAC.mtd / reportData.revenueAnalysis.total.mtd) * 100).toFixed(2)}%</td><td className="border border-gray-300 px-4 py-2 text-center">₹{reportData.revenueAnalysis.salesAC.ytd.toLocaleString()}</td><td className="border border-gray-300 px-4 py-2 text-center">{((reportData.revenueAnalysis.salesAC.ytd / reportData.revenueAnalysis.total.ytd) * 100).toFixed(2)}%</td></tr>
                        <tr className="bg-yellow-50"><td className="border border-gray-300 px-4 py-2 font-medium">Total</td><td className="border border-gray-300 px-4 py-2 text-center font-medium">₹{reportData.revenueAnalysis.total.today.toLocaleString()}</td><td className="border border-gray-300 px-4 py-2 text-center font-medium">100%</td><td className="border border-gray-300 px-4 py-2 text-center font-medium">₹{reportData.revenueAnalysis.total.wtd.toLocaleString()}</td><td className="border border-gray-300 px-4 py-2 text-center font-medium">100%</td><td className="border border-gray-300 px-4 py-2 text-center font-medium">₹{reportData.revenueAnalysis.total.mtd.toLocaleString()}</td><td className="border border-gray-300 px-4 py-2 text-center font-medium">100%</td><td className="border border-gray-300 px-4 py-2 text-center font-medium">₹{reportData.revenueAnalysis.total.ytd.toLocaleString()}</td><td className="border border-gray-300 px-4 py-2 text-center font-medium">100%</td></tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Performance Analysis */}
            <section className="animate-scaleIn animate-delay-300">
              <h3 className="text-lg font-semibold mb-4 text-blue-600 border-b pb-2">Performance Analysis</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-yellow-100">
                      <th className="border border-gray-300 px-4 py-2 text-left">Particulars</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Today</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">WTD</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">MTD</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">YTD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData && (
                      <>
                        <tr><td className="border border-gray-300 px-4 py-2">Occupancy %</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.performanceAnalysis.occupancyPercent.today.toFixed(2)}%</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.performanceAnalysis.occupancyPercent.wtd.toFixed(2)}%</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.performanceAnalysis.occupancyPercent.mtd.toFixed(2)}%</td><td className="border border-gray-300 px-4 py-2 text-center">{reportData.performanceAnalysis.occupancyPercent.ytd.toFixed(2)}%</td></tr>
                        <tr><td className="border border-gray-300 px-4 py-2">Average Daily Rate (ADR)</td><td className="border border-gray-300 px-4 py-2 text-center">₹{reportData.performanceAnalysis.adr.today.toLocaleString()}</td><td className="border border-gray-300 px-4 py-2 text-center">₹{reportData.performanceAnalysis.adr.wtd.toLocaleString()}</td><td className="border border-gray-300 px-4 py-2 text-center">₹{reportData.performanceAnalysis.adr.mtd.toLocaleString()}</td><td className="border border-gray-300 px-4 py-2 text-center">₹{reportData.performanceAnalysis.adr.ytd.toLocaleString()}</td></tr>
                        <tr><td className="border border-gray-300 px-4 py-2">Rev-Par</td><td className="border border-gray-300 px-4 py-2 text-center">₹{reportData.performanceAnalysis.revPar.today.toLocaleString()}</td><td className="border border-gray-300 px-4 py-2 text-center">₹{reportData.performanceAnalysis.revPar.wtd.toLocaleString()}</td><td className="border border-gray-300 px-4 py-2 text-center">₹{reportData.performanceAnalysis.revPar.mtd.toLocaleString()}</td><td className="border border-gray-300 px-4 py-2 text-center">₹{reportData.performanceAnalysis.revPar.ytd.toLocaleString()}</td></tr>
                        <tr><td className="border border-gray-300 px-4 py-2">Average Rate Per Guest (ARG)</td><td className="border border-gray-300 px-4 py-2 text-center">₹{reportData.performanceAnalysis.arg.today.toLocaleString()}</td><td className="border border-gray-300 px-4 py-2 text-center">₹{reportData.performanceAnalysis.arg.wtd.toLocaleString()}</td><td className="border border-gray-300 px-4 py-2 text-center">₹{reportData.performanceAnalysis.arg.mtd.toLocaleString()}</td><td className="border border-gray-300 px-4 py-2 text-center">₹{reportData.performanceAnalysis.arg.ytd.toLocaleString()}</td></tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 10 Days Forecast */}
            <section className="animate-scaleIn animate-delay-300">
              <h3 className="text-lg font-semibold mb-4 text-blue-600 border-b pb-2">10 Days Forecast</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-yellow-100">
                      <th className="border border-gray-300 px-4 py-2 text-left">Particulars</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Date</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Total</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Arrival</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Stay Over</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Departure</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Expected Occupancy</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Expected Occupancy %</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Expected Revenue</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Expected ADR</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Expected Rev-Par</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData && reportData.forecast.map((day, i) => (
                      <tr key={i}>
                        <td className="border border-gray-300 px-4 py-2">{day.dayName}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{new Date(day.date).toLocaleDateString()}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{day.totalRooms}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{day.arrival}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{day.stayOver}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{day.departure}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{day.expectedOccupancy}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">{day.expectedOccupancyPercent.toFixed(2)}%</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">₹{day.expectedRevenue.toLocaleString()}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">₹{day.expectedADR.toLocaleString()}</td>
                        <td className="border border-gray-300 px-4 py-2 text-center">₹{day.expectedRevPar.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
          )}
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          /* Hide sidebar and navigation */
          aside, nav, .sidebar, [class*="sidebar"], [class*="nav"] { display: none !important; }
          body > div > div:first-child { display: none !important; }
          
          /* Remove ALL height and overflow constraints */
          * { 
            height: auto !important;
            max-height: none !important;
            min-height: auto !important;
            overflow: visible !important;
            max-width: none !important;
          }
          
          body, html { 
            height: auto !important;
            overflow: visible !important;
          }
          
          /* Component styles */
          .print\\:hidden { display: none !important; }
          .bg-gray-50 { background: white !important; }
          .shadow-sm { box-shadow: none !important; }
          .rounded-lg { border-radius: 0 !important; }
          
          /* Force content to flow */
          .overflow-x-auto { overflow: visible !important; }
          
          /* Multi-page printing */
          table { 
            page-break-inside: auto !important;
            width: 100% !important;
          }
          section {
            page-break-inside: auto !important;
            margin-bottom: 30px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default NightAuditReport;