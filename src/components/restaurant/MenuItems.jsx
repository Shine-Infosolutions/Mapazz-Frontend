import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import Pagination from "../common/Pagination";
import Category from "./Category";
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

const MenuItems = () => {
  const { axios } = useAppContext();
  const { hasRole } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [activeTab, setActiveTab] = useState('items');
  const [formData, setFormData] = useState({
    name: '',
    Price: 0,
    category: '',
    Discount: 0,
    foodType: 'Veg',
    isActive: true,
    image: '',
    description: '',
    timeToPrepare: 0
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9);

  const fetchMenuItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/menu-items', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Menu items response:', response.data);
      const items = response.data.data || response.data;
      setMenuItems(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error('Error fetching menu:', error);
      setMenuItems([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/restaurant-categories/all');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setIsInitialLoading(true);
      await Promise.all([fetchMenuItems(), fetchCategories()]);
      setIsInitialLoading(false);
    };
    loadInitialData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (editingItem) {
        await axios.put(`/api/menu-items/${editingItem._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('/api/menu-items', formData);
      }
      fetchMenuItems();
      setShowForm(false);
      setEditingItem(null);
      setFormData({ name: '', Price: 0, category: '', Discount: 0, foodType: 'Veg', isActive: true, image: '', description: '', timeToPrepare: 0 });
    } catch (error) {
      console.error('Error saving menu item:', error);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/menu-items/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMenuItems();
    } catch (error) {
      console.error('Error deleting menu item:', error);
    }
  };

  if (activeTab === 'categories') {
    return <Category onBackToItems={() => setActiveTab('items')} />;
  }

  if (isInitialLoading) {
    return <DashboardLoader pageName="Menu Items" />;
  }

  return (
    <div className="p-4 sm:p-6" style={{ backgroundColor: 'hsl(45, 100%, 95%)', color: 'hsl(45, 100%, 20%)' }}>
      {/* Tab Navigation */}
      <div className="mb-6 animate-slideInLeft animate-delay-100">
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('items')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'items'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Menu Items
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'categories'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Categories
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4 animate-fadeInUp animate-delay-200">
        <h2 className="text-xl sm:text-2xl font-semibold" style={{ color: 'hsl(45, 100%, 20%)' }}>Menu Items</h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-lg w-full sm:w-auto"
          style={{ backgroundColor: 'hsl(45, 43%, 58%)', color: 'hsl(45, 100%, 20%)' }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'hsl(45, 32%, 46%)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'hsl(45, 43%, 58%)'}
        >
          Add Item
        </button>
      </div>

      {showForm && (
        <div className="p-4 sm:p-6 rounded-lg shadow-md mb-6 animate-fadeInUp animate-delay-300" style={{ backgroundColor: 'white', border: '1px solid hsl(45, 100%, 85%)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'hsl(45, 100%, 20%)' }}>{editingItem ? 'Edit' : 'Add'} Menu Item</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'hsl(45, 100%, 20%)' }}>Item Name *</label>
              <input
                type="text"
                placeholder="Enter item name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full rounded-lg px-3 py-2"
                style={{ border: '1px solid hsl(45, 100%, 85%)', backgroundColor: 'white', color: 'hsl(45, 100%, 20%)' }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'hsl(45, 100%, 20%)' }}>Price *</label>
              <input
                type="number"
                placeholder="Enter price"
                value={formData.Price}
                onChange={(e) => setFormData({...formData, Price: Math.max(0, Number(e.target.value))})}
                className="w-full rounded-lg px-3 py-2"
                style={{ border: '1px solid hsl(45, 100%, 85%)', backgroundColor: 'white', color: 'hsl(45, 100%, 20%)' }}
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'hsl(45, 100%, 20%)' }}>Discount</label>
              <input
                type="number"
                placeholder="Enter discount amount"
                value={formData.Discount}
                onChange={(e) => setFormData({...formData, Discount: Math.max(0, Number(e.target.value))})}
                className="w-full rounded-lg px-3 py-2"
                style={{ border: '1px solid hsl(45, 100%, 85%)', backgroundColor: 'white', color: 'hsl(45, 100%, 20%)' }}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'hsl(45, 100%, 20%)' }}>Food Type *</label>
              <select
                value={formData.foodType}
                onChange={(e) => setFormData({...formData, foodType: e.target.value})}
                className="w-full rounded-lg px-3 py-2"
                style={{ border: '1px solid hsl(45, 100%, 85%)', backgroundColor: 'white', color: 'hsl(45, 100%, 20%)' }}
                required
              >
                <option value="Veg">Veg</option>
                <option value="Non-Veg">Non-Veg</option>
                <option value="Both">Both</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'hsl(45, 100%, 20%)' }}>Time to Prepare (minutes)</label>
              <input
                type="number"
                placeholder="Enter preparation time"
                value={formData.timeToPrepare}
                onChange={(e) => setFormData({...formData, timeToPrepare: Number(e.target.value)})}
                className="w-full rounded-lg px-3 py-2"
                style={{ border: '1px solid hsl(45, 100%, 85%)', backgroundColor: 'white', color: 'hsl(45, 100%, 20%)' }}
                min="0"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1" style={{ color: 'hsl(45, 100%, 20%)' }}>Description</label>
              <textarea
                placeholder="Enter item description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full rounded-lg px-3 py-2"
                style={{ border: '1px solid hsl(45, 100%, 85%)', backgroundColor: 'white', color: 'hsl(45, 100%, 20%)' }}
                rows="3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'hsl(45, 100%, 20%)' }}>Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full rounded-lg px-3 py-2"
                style={{ border: '1px solid hsl(45, 100%, 85%)', backgroundColor: 'white', color: 'hsl(45, 100%, 20%)' }}
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2 flex space-x-2">
              <button 
                type="submit" 
                className="px-4 py-2 rounded-lg"
                style={{ backgroundColor: 'hsl(45, 71%, 69%)', color: 'hsl(45, 100%, 20%)' }}
              >
                {editingItem ? 'Update' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingItem(null);
                  setFormData({ name: '', Price: 0, category: '', Discount: 0, foodType: 'Veg', isActive: true, image: '', description: '', timeToPrepare: 0 });
                }}
                className="px-4 py-2 rounded-lg"
                style={{ backgroundColor: 'hsl(45, 32%, 46%)', color: 'white' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {menuItems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No menu items found. Add some items to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fadeInUp animate-delay-300">
          {menuItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item, index) => (
          <div key={item._id} className="p-4 rounded-lg shadow-md animate-scaleIn" style={{ backgroundColor: 'white', border: '1px solid hsl(45, 100%, 85%)', animationDelay: `${Math.min(index * 100 + 400, 800)}ms` }}>
            <h3 className="font-semibold text-lg" style={{ color: 'hsl(45, 100%, 20%)' }}>{item.name}</h3>
            <p className="text-sm" style={{ color: 'hsl(45, 100%, 40%)' }}>Food Type: {item.foodType}</p>
            <p className="text-sm mb-2" style={{ color: 'hsl(45, 100%, 30%)' }}>{item.description}</p>
            <p className="font-semibold" style={{ color: 'hsl(45, 43%, 58%)' }}>₹{item.Price}</p>
            {item.Discount > 0 && <p className="text-sm" style={{ color: 'hsl(120, 60%, 50%)' }}>Discount: ₹{item.Discount}</p>}
            <p className="text-sm" style={{ color: 'hsl(45, 100%, 40%)' }}>Category: {categories.find(cat => cat._id === item.category)?.name || 'N/A'}</p>
            {item.timeToPrepare > 0 && <p className="text-sm" style={{ color: 'hsl(45, 100%, 40%)' }}>Prep Time: {item.timeToPrepare} min</p>}
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium" style={{ color: 'hsl(45, 100%, 40%)' }}>Active:</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.isActive}
                  onChange={async (e) => {
                    try {
                      const token = localStorage.getItem('token');
                      await axios.put(`/api/menu-items/${item._id}`, {
                        ...item,
                        isActive: e.target.checked
                      }, {
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      fetchMenuItems();
                    } catch (error) {
                      console.error('Error updating item status:', error);
                    }
                  }}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${
                  item.isActive ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                    item.isActive ? 'translate-x-5' : 'translate-x-0.5'
                  } mt-0.5`}></div>
                </div>
              </label>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <button
                onClick={() => handleEdit(item)}
                className="px-3 py-1 rounded text-sm flex-1"
                style={{ backgroundColor: 'hsl(45, 100%, 80%)', color: 'hsl(45, 100%, 20%)' }}
              >
                Edit
              </button>
              {hasRole('ADMIN') && (
                <button
                  onClick={() => handleDelete(item._id)}
                  className="px-3 py-1 rounded text-sm flex-1"
                  style={{ backgroundColor: 'hsl(0, 70%, 60%)', color: 'white' }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
          ))}
        </div>
      )}
      
      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil((menuItems?.length || 0) / itemsPerPage)}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        totalItems={menuItems?.length || 0}
      />
    </div>
  );
};

export default MenuItems;