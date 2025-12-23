import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { showToast } from '../../utils/toaster';
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
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

const RoomStatus = () => {
  const { axios } = useAppContext();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('/api/rooms/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRooms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      showToast.error('Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  const updateRoomStatus = async (roomId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/rooms/update/${roomId}`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setRooms(rooms.map(room => 
        room._id === roomId ? { ...room, status: newStatus } : room
      ));
      showToast.success('Room status updated successfully');
    } catch (error) {
      console.error('Error updating room status:', error);
      showToast.error('Failed to update room status');
    }
  };

  if (loading) {
    return <DashboardLoader pageName="Room Status" />;
  }

  return (
    <div className="p-6 bg-background min-h-screen" style={{opacity: loading ? 0 : 1, transition: 'opacity 0.3s ease-in-out'}}>
      <h1 className="text-3xl font-bold text-text mb-6 animate-slideInLeft animate-delay-100">Room Status</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room, index) => (
          <div key={room._id} className="bg-white rounded-lg shadow p-4 animate-scaleIn" style={{animationDelay: `${Math.min(index * 100 + 200, 600)}ms`}}>
            <h3 className="font-semibold text-lg mb-2">Room {room.room_number}</h3>
            <p className="text-gray-600 mb-3">{room.title}</p>
            
            <div className="mb-3">
              <span className={`px-2 py-1 rounded text-sm ${
                room.status === 'available' ? 'bg-green-100 text-green-800' :
                room.status === 'booked' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {room.status}
              </span>
            </div>
            
            <select
              value={room.status}
              onChange={(e) => updateRoomStatus(room._id, e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="available">Available</option>
              <option value="booked">Booked</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomStatus;