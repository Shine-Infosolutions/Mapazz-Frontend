import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ConfirmationDialog from '../common/ConfirmationDialog';
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

const LossReports = () => {
  const [lossReports, setLossReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsInitialLoading(true);
      await fetchLossReports();
      setIsInitialLoading(false);
    };
    loadInitialData();
  }, []);

  const fetchLossReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/laundry/loss-report`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('Loss reports response:', data);
      setLossReports(Array.isArray(data) ? data : (data.reports || data.data || data.lossReports || []));
    } catch (error) {
      console.error('Error fetching loss reports:', error);
      toast.error('Failed to fetch loss reports');
      setLossReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = (reportId, newStatus) => {
    setConfirmAction(() => () => performStatusUpdate(reportId, newStatus));
    setShowConfirmDialog(true);
  };

  const performStatusUpdate = async (reportId, newStatus) => {
    setShowConfirmDialog(false);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/laundry/loss-report/${reportId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        }
      );
      if (response.ok) {
        toast.success('Status updated successfully');
        fetchLossReports();
      }
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setConfirmAction(null);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      reported: 'bg-red-100 text-red-800',
      investigating: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      compensated: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (isInitialLoading) {
    return <DashboardLoader pageName="Loss Reports" />;
  }

  return (
    <div className="min-h-screen bg-background p-4" style={{opacity: loading ? 0 : 1, transition: 'opacity 0.3s ease-in-out'}}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-4 mb-4 border border-border animate-slideInLeft animate-delay-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-text flex items-center gap-2">
                <AlertTriangle className="text-primary" size={24} />
                Loss Reports
              </h1>
              <p className="text-gray-600 mt-1">Track and manage laundry loss reports</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading loss reports...</p>
          </div>
        ) : lossReports.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg text-center py-16 border border-border">
            <AlertTriangle className="mx-auto mb-4 text-gray-400" size={64} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No loss reports found</h3>
            <p className="text-gray-500">No laundry loss reports have been filed yet</p>
          </div>
        ) : (
        <>
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {lossReports.map((report, index) => (
              <div key={report._id} className="bg-white rounded-2xl shadow-lg p-6 border border-border hover:shadow-xl transition-all duration-200 animate-scaleIn" style={{animationDelay: `${Math.min(index * 100 + 200, 600)}ms`}}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Room {report.roomNumber}</h3>
                    <p className="text-gray-600 font-medium">{report.guestName || 'N/A'}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(report.status)}`}>
                    {report.status}
                  </span>
                </div>
                <div className="text-sm mb-3 space-y-2">
                  <div><span className="text-gray-500">Items Lost:</span> 
                    <div className="font-medium text-xs mt-1">
                      {report.lostItems?.map((item, idx) => (
                        <span key={idx} className="inline-block bg-gray-100 px-2 py-1 rounded mr-1 mb-1">
                          {item.quantity}x {item.itemName}
                        </span>
                      )) || 'No items'}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-gray-500">Amount:</span> <span className="font-medium">₹{report.totalLossAmount}</span></div>
                    <div><span className="text-gray-500">Reported:</span> <span className="font-medium">{new Date(report.createdAt).toLocaleDateString()}</span></div>
                  </div>
                </div>
                <select
                  value={report.status}
                  onChange={(e) => handleStatusUpdate(report._id, e.target.value)}
                  className="w-full text-sm border border-border rounded-lg px-3 py-2 hover:border-primary focus:border-primary focus:ring-2 focus:ring-accent focus:outline-none transition-all duration-200 bg-white"
                >
                  <option value="reported">Reported</option>
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolved</option>
                  <option value="compensated">Compensated</option>
                </select>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-2xl shadow-lg overflow-hidden border border-border">
            <table className="min-w-full">
              <thead className="bg-background">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-text uppercase tracking-wider">Room</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-text uppercase tracking-wider">Guest</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-text uppercase tracking-wider">Lost Items</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-text uppercase tracking-wider">Loss Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-text uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-text uppercase tracking-wider">Reported</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-text uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lossReports.map((report, index) => (
                  <tr key={report._id} className="hover:bg-gray-50 transition-colors duration-150 animate-fadeInUp" style={{animationDelay: `${Math.min(index * 50 + 200, 600)}ms`}}>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">{report.roomNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-700">{report.guestName || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        {report.lostItems?.map((item, idx) => (
                          <span key={idx} className="inline-block bg-accent text-primary text-xs px-2 py-1 rounded-full mr-1 mb-1 font-medium">
                            {item.quantity}x {item.itemName}
                          </span>
                        )) || 'No items'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">₹{report.totalLossAmount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(report.status)}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={report.status}
                        onChange={(e) => handleStatusUpdate(report._id, e.target.value)}
                        className="text-sm border border-border rounded-lg px-3 py-2 hover:border-primary focus:border-primary focus:ring-2 focus:ring-accent focus:outline-none transition-all duration-200 bg-white"
                      >
                        <option value="reported">Reported</option>
                        <option value="investigating">Investigating</option>
                        <option value="resolved">Resolved</option>
                        <option value="compensated">Compensated</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
        )}

        <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => { setShowConfirmDialog(false); setConfirmAction(null); }}
        onConfirm={confirmAction}
        title="Confirm Status Update"
        message="Are you sure you want to update the status of this loss report?"
        confirmText="Update"
        cancelText="Cancel"
        type="info"
        />
      </div>
    </div>
  );
};

export default LossReports;
