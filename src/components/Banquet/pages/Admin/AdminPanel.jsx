import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import MenuItemManager from '../../components/MenuItemManager';
import PlanLimitManager from '../../components/PlanLimitManager';
// import useWebSocket from '../../../../hooks/useWebSocket';
import { FiWifi, FiWifiOff } from 'react-icons/fi';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('menu-items');
  const [initializing, setInitializing] = useState(false);
  const [realtimeActivity, setRealtimeActivity] = useState([]);

  // WebSocket connection for real-time monitoring - DISABLED
  // const { lastMessage, readyState } = useWebSocket();
  const lastMessage = null;
  const readyState = 0;

  // Handle real-time messages
  useEffect(() => {
    if (lastMessage) {
      const activity = {
        id: Date.now(),
        type: lastMessage.type,
        data: lastMessage.data,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setRealtimeActivity(prev => [activity, ...prev.slice(0, 9)]); // Keep last 10 activities
      
      // Show toast notifications for admin
      switch (lastMessage.type) {
        case 'BOOKING_CREATED':
          toast.success(`📋 New booking: ${lastMessage.data.name}`);
          break;
        case 'BOOKING_UPDATED':
          toast.success(`✏️ Booking updated: ${lastMessage.data.name}`);
          break;
        case 'BOOKING_DELETED':
          toast.success(`🗑️ Booking deleted`);
          break;
        default:
          break;
      }
    }
  }, [lastMessage]);

  const initializeDefaults = async () => {
    try {
      setInitializing(true);
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/plan-limits/initialize`);
      if (response.data.success) {
        toast.success(response.data.message);
      }
    } catch (error) {
      toast.error('Failed to initialize defaults');
    } finally {
      setInitializing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('menu-items')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'menu-items'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Menu Items
            </button>
            <button
              onClick={() => setActiveTab('plan-limits')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'plan-limits'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Plan Limits
            </button>
            <button
              onClick={() => setActiveTab('realtime-monitor')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'realtime-monitor'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Real-time Monitor
            </button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center gap-2">
                {readyState === 1 ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <FiWifi className="text-sm" />
                    <span className="text-xs font-medium">Live</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-600">
                    <FiWifiOff className="text-sm" />
                    <span className="text-xs font-medium">Offline</span>
                  </div>
                )}
              </div>
              <button
                onClick={initializeDefaults}
                disabled={initializing}
                className="my-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                {initializing ? 'Initializing...' : 'Initialize Default Limits'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {activeTab === 'menu-items' && <MenuItemManager />}
        {activeTab === 'plan-limits' && <PlanLimitManager />}
        {activeTab === 'realtime-monitor' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Real-time Activity Monitor</h2>
            <div className="space-y-3">
              {realtimeActivity.length === 0 ? (
                <p className="text-gray-500 italic">No recent activity</p>
              ) : (
                realtimeActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.type === 'BOOKING_CREATED' ? 'bg-green-500' :
                        activity.type === 'BOOKING_UPDATED' ? 'bg-blue-500' :
                        activity.type === 'BOOKING_DELETED' ? 'bg-red-500' : 'bg-gray-500'
                      }`}></div>
                      <div>
                        <p className="font-medium">
                          {activity.type === 'BOOKING_CREATED' && '📋 New Booking Created'}
                          {activity.type === 'BOOKING_UPDATED' && '✏️ Booking Updated'}
                          {activity.type === 'BOOKING_DELETED' && '🗑️ Booking Deleted'}
                        </p>
                        {activity.data && (
                          <p className="text-sm text-gray-600">
                            {activity.data.name && `Customer: ${activity.data.name}`}
                            {activity.data.bookingStatus && ` | Status: ${activity.data.bookingStatus}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{activity.timestamp}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
