import React from 'react';
import PropTypes from 'prop-types';
import { 
  Package, AlertTriangle, TrendingUp, DollarSign, 
  Layers, MapPin, Users, Calendar 
} from 'lucide-react';

const Dashboard = ({ items, lowStockItems }) => {
  const totalItems = items.length;
  const totalValue = items.reduce((sum, item) => sum + (item.currentStock * item.pricePerUnit), 0);
  const categoryCounts = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});
  const locationCounts = items.reduce((acc, item) => {
    acc[item.location] = (acc[item.location] || 0) + 1;
    return acc;
  }, {});

  const outOfStockItems = items.filter(item => item.currentStock === 0).length;
  const goodStockItems = items.filter(item => item.currentStock > item.minStockLevel).length;

  const stats = [
    {
      title: 'Total Items',
      value: totalItems,
      icon: Package,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Low Stock Items',
      value: lowStockItems.length,
      icon: AlertTriangle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600'
    },
    {
      title: 'Out of Stock',
      value: outOfStockItems,
      icon: TrendingUp,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    },
    {
      title: 'Total Value',
      value: `₹${totalValue.toLocaleString('en-IN')}`,
      icon: DollarSign,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    }
  ];

  const categoryStats = Object.entries(categoryCounts).map(([category, count]) => ({
    name: category,
    count,
    percentage: ((count / totalItems) * 100).toFixed(1)
  }));

  const locationStats = Object.entries(locationCounts).map(([location, count]) => ({
    name: location,
    count,
    percentage: ((count / totalItems) * 100).toFixed(1)
  }));

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`${stat.bgColor} rounded-lg p-6 border border-gray-200`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.textColor} mt-1`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category and Location Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="text-blue-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Items by Category</h3>
          </div>
          <div className="space-y-3">
            {categoryStats.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium text-gray-700">{category.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{category.count} items</span>
                  <span className="text-xs text-gray-500">({category.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Location Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="text-green-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">Items by Location</h3>
          </div>
          <div className="space-y-3">
            {locationStats.map((location, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-gray-700">{location.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{location.count} items</span>
                  <span className="text-xs text-gray-500">({location.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stock Status Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="text-purple-600" size={20} />
          <h3 className="text-lg font-semibold text-gray-900">Stock Status Overview</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{goodStockItems}</div>
            <div className="text-sm text-green-700">Good Stock</div>
            <div className="text-xs text-green-600">Above minimum level</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{lowStockItems.length}</div>
            <div className="text-sm text-orange-700">Low Stock</div>
            <div className="text-xs text-orange-600">At or below minimum level</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{outOfStockItems}</div>
            <div className="text-sm text-red-700">Out of Stock</div>
            <div className="text-xs text-red-600">Zero quantity remaining</div>
          </div>
        </div>
      </div>
    </div>
  );
};

Dashboard.propTypes = {
  items: PropTypes.array.isRequired,
  lowStockItems: PropTypes.array.isRequired,
};

export default Dashboard;