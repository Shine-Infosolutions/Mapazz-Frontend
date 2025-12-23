import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalUsers: 0,
    inventoryItems: 0,
    laundryOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('today');

  useEffect(() => {
    fetchDashboardStats();
  }, [filter]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const [dashboardRes, laundryRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/dashboard/stats?filter=${filter}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/laundry/dashboard?filter=${filter}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setStats({
        totalBookings: dashboardRes.data.stats?.totalBookings || 0,
        totalUsers: dashboardRes.data.stats?.totalUsers || 0,
        inventoryItems: dashboardRes.data.stats?.inventoryItems || 0,
        laundryOrders: laundryRes.data.dashboard?.orderStats?.reduce((sum, stat) => sum + stat.count, 0) || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/dashboard/download-csv?filter=${filter}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dashboard-stats-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading CSV:', error);
    }
  };

  const downloadLaundryCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/laundry/export/csv?filter=${filter}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `laundry-orders-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading laundry CSV:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-4">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="today">Today</option>
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
            <option value="yearly">This Year</option>
          </select>
          <button 
            onClick={downloadCSV}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Export CSV
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Total Bookings</h2>
          <p className="text-3xl font-bold text-blue-600">
            {loading ? '...' : stats.totalBookings}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Total Users</h2>
          <p className="text-3xl font-bold text-green-600">
            {loading ? '...' : stats.totalUsers}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Inventory Items</h2>
          <p className="text-3xl font-bold text-purple-600">
            {loading ? '...' : stats.inventoryItems}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-lg font-semibold">Laundry Orders</h2>
            <button 
              onClick={downloadLaundryCSV}
              className="text-sm px-2 py-1 bg-orange-100 text-orange-600 rounded hover:bg-orange-200"
            >
              Export
            </button>
          </div>
          <p className="text-3xl font-bold text-orange-600">
            {loading ? '...' : stats.laundryOrders}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;