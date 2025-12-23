import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Plus, Filter, Download, Eye, Edit, Trash2, Clock, CheckCircle } from 'lucide-react';
import TaskModal from './TaskModal';
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

const Housekeeping = () => {
  const { axios } = useAppContext();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignedTo: '',
    roomNumber: ''
  });
  const [stats, setStats] = useState({
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    urgentTasks: 0
  });

  useEffect(() => {
    const loadInitialData = async () => {
      setIsInitialLoading(true);
      await Promise.all([fetchTasks(), fetchStats()]);
      setIsInitialLoading(false);
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tasks, filters]);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/housekeeping/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(response.data.tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/housekeeping/dashboard/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const applyFilters = () => {
    let filtered = tasks;
    
    if (filters.status) {
      filtered = filtered.filter(task => task.status === filters.status);
    }
    if (filters.priority) {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }
    if (filters.assignedTo) {
      filtered = filtered.filter(task => task.assignedTo.toLowerCase().includes(filters.assignedTo.toLowerCase()));
    }
    if (filters.roomNumber) {
      filtered = filtered.filter(task => task.roomNumber.includes(filters.roomNumber));
    }
    
    setFilteredTasks(filtered);
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setShowModal(true);
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setShowModal(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/housekeeping/${taskId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchTasks();
        fetchStats();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/housekeeping/${taskId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTasks();
      fetchStats();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const exportCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/housekeeping/export/csv', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `housekeeping-tasks-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isInitialLoading) {
    return <DashboardLoader pageName="Housekeeping Management" />;
  }

  return (
    <div className="p-6" style={{opacity: loading ? 0 : 1, transition: 'opacity 0.3s ease-in-out'}}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6 animate-slideInLeft animate-delay-100">
        <h1 className="text-2xl font-bold">Housekeeping Management</h1>
        <div className="flex gap-4">
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={handleCreateTask}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 animate-fadeInUp animate-delay-200">
        <div className="bg-white p-4 rounded-lg shadow animate-scaleIn" style={{animationDelay: '300ms'}}>
          <h3 className="text-sm font-medium text-gray-500">Total Tasks</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.totalTasks}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow animate-scaleIn" style={{animationDelay: '350ms'}}>
          <h3 className="text-sm font-medium text-gray-500">Pending</h3>
          <p className="text-2xl font-bold text-yellow-600">{stats.pendingTasks}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow animate-scaleIn" style={{animationDelay: '400ms'}}>
          <h3 className="text-sm font-medium text-gray-500">In Progress</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.inProgressTasks}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow animate-scaleIn" style={{animationDelay: '450ms'}}>
          <h3 className="text-sm font-medium text-gray-500">Completed</h3>
          <p className="text-2xl font-bold text-green-600">{stats.completedTasks}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow animate-scaleIn" style={{animationDelay: '500ms'}}>
          <h3 className="text-sm font-medium text-gray-500">Urgent</h3>
          <p className="text-2xl font-bold text-red-600">{stats.urgentTasks}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 animate-fadeInUp animate-delay-300">
        <div className="flex items-center gap-4 flex-wrap">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={filters.priority}
            onChange={(e) => setFilters({...filters, priority: e.target.value})}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <input
            type="text"
            placeholder="Room Number"
            value={filters.roomNumber}
            onChange={(e) => setFilters({...filters, roomNumber: e.target.value})}
            className="px-3 py-2 border rounded-lg"
          />
          <input
            type="text"
            placeholder="Assigned To"
            value={filters.assignedTo}
            onChange={(e) => setFilters({...filters, assignedTo: e.target.value})}
            className="px-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden animate-fadeInUp animate-delay-300">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTasks.map((task, index) => (
                <tr key={task._id} className="hover:bg-gray-50 animate-fadeInUp" style={{animationDelay: `${Math.min(index * 50 + 400, 800)}ms`}}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{task.roomNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{task.taskType}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{task.assignedTo}</td>
                  <td className="px-6 py-4 text-sm max-w-xs truncate">{task.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      {task.status === 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(task._id, 'in_progress')}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          title="Start Task"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                      )}
                      {task.status === 'in_progress' && (
                        <button
                          onClick={() => handleStatusUpdate(task._id, 'completed')}
                          className="p-1 text-green-600 hover:bg-green-100 rounded"
                          title="Complete Task"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEditTask(task)}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                        title="Edit Task"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task._id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                        title="Delete Task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Modal */}
      {showModal && (
        <TaskModal
          task={selectedTask}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            fetchTasks();
            fetchStats();
          }}
        />
      )}
    </div>
  );
};

export default Housekeeping;