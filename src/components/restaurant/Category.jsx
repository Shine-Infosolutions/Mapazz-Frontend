import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { showToast } from "../../utils/toaster";
import { ArrowLeft } from 'lucide-react';
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

const Category = ({ onBackToItems }) => {
  const { axios } = useAppContext();
  const { hasRole } = useAuth();
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active'
  });

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/restaurant-categories/all');
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setIsInitialLoading(true);
      await fetchCategories();
    };
    loadInitialData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await axios.put(`/api/restaurant-categories/update/${editingCategory._id}`, formData);
      } else {
        await axios.post('/api/restaurant-categories/add', formData);
      }
      fetchCategories();
      setShowForm(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '', status: 'active' });
      showToast.success(`✅ Category ${editingCategory ? 'updated' : 'added'} successfully!`);
    } catch (error) {
      console.error('Error saving category:', error);
      showToast.error(`Failed to ${editingCategory ? 'update' : 'add'} category`);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData(category);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/restaurant-categories/delete/${id}`);
      fetchCategories();
      showToast.success('🗑️ Category deleted successfully!');
    } catch (error) {
      console.error('Error deleting category:', error);
      showToast.error('Failed to delete category');
    }
  };

  if (isInitialLoading) {
    return <DashboardLoader pageName="Restaurant Categories" />;
  }

  return (
    <div className="p-4 sm:p-6" style={{ backgroundColor: 'hsl(45, 100%, 95%)' }}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 animate-slideInLeft animate-delay-100">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToItems}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Items
          </button>
          <h2 className="text-xl sm:text-2xl font-semibold">Restaurant Categories</h2>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 w-full sm:w-auto"
        >
          Add Category
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6 animate-fadeInUp animate-delay-200">
          <h3 className="text-lg font-semibold mb-4">{editingCategory ? 'Edit' : 'Add'} Category</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Category Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="border rounded-lg px-3 py-2 w-full"
              required
            />
            <textarea
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="border rounded-lg px-3 py-2 w-full"
              rows="3"
            />
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="border rounded-lg px-3 py-2 w-full"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <div className="flex space-x-2">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                {editingCategory ? 'Update' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingCategory(null);
                  setFormData({ name: '', description: '', status: 'active' });
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fadeInUp animate-delay-300">
        {categories.map((category, index) => (
          <div key={category._id} className="bg-white p-4 rounded-lg shadow-md animate-scaleIn" style={{animationDelay: `${Math.min(index * 100 + 400, 800)}ms`}}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg">{category.name}</h3>
              <span className={`px-2 py-1 rounded text-sm ${
                category.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {category.status}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-3">{category.description}</p>
            <div className="flex space-x-2">
              <button
                onClick={() => handleEdit(category)}
                className="bg-yellow-500 text-white px-3 py-1 rounded text-sm"
              >
                Edit
              </button>
              {hasRole('ADMIN') && (
                <button
                  onClick={() => handleDelete(category._id)}
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Category;