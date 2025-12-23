import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
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

const LaundryCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [formData, setFormData] = useState({
    categoryName: '',
    description: '',
    isActive: true
  });
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsInitialLoading(true);
      await fetchCategories();
      setIsInitialLoading(false);
    };
    loadInitialData();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/laundry-categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setCategories(Array.isArray(data) ? data : (data.categories || []));
    } catch (error) {
      toast.error('Failed to fetch categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmAction(() => performSubmit);
    setShowConfirmDialog(true);
  };

  const performSubmit = async () => {
    setShowConfirmDialog(false);
    try {
      const token = localStorage.getItem('token');
      const url = editingCategory
        ? `${import.meta.env.VITE_API_BASE_URL}/api/laundry-categories/${editingCategory._id}`
        : `${import.meta.env.VITE_API_BASE_URL}/api/laundry-categories`;
      
      const response = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success(`Category ${editingCategory ? 'updated' : 'added'} successfully`);
        setShowForm(false);
        resetForm();
        fetchCategories();
      }
    } catch (error) {
      toast.error('Failed to save category');
    } finally {
      setConfirmAction(null);
    }
  };

  const handleDelete = (id) => {
    setConfirmAction(() => () => performDelete(id));
    setShowConfirmDialog(true);
  };

  const performDelete = async (id) => {
    setShowConfirmDialog(false);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/laundry-categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success('Category deleted successfully');
        fetchCategories();
      }
    } catch (error) {
      toast.error('Failed to delete category');
    } finally {
      setConfirmAction(null);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      categoryName: category.categoryName,
      description: category.description || '',
      isActive: category.isActive !== undefined ? category.isActive : true
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      categoryName: '',
      description: '',
      isActive: true
    });
    setEditingCategory(null);
  };

  if (isInitialLoading) {
    return <DashboardLoader pageName="Laundry Categories" />;
  }

  return (
    <div className="min-h-screen bg-background p-4" style={{opacity: loading ? 0 : 1, transition: 'opacity 0.3s ease-in-out'}}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-4 mb-4 border border-border animate-slideInLeft animate-delay-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-text flex items-center gap-2">
                <Tag className="text-primary" size={20} />
                Laundry Categories
              </h1>
            </div>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="px-4 py-2 bg-primary hover:bg-hover text-white rounded-lg flex items-center gap-2 text-sm transition-all duration-200"
            >
              <Plus size={16} />
              Add Category
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg text-center py-16 border border-border">
            <Tag className="mx-auto mb-4 text-gray-400" size={64} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No categories found</h3>
            <p className="text-gray-500">Create your first laundry category</p>
          </div>
        ) : (
        <>
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {categories.map((category, index) => (
              <div key={category._id} className="bg-white rounded-2xl shadow-lg p-6 border border-border hover:shadow-xl transition-all duration-200 animate-scaleIn" style={{animationDelay: `${Math.min(index * 100 + 200, 600)}ms`}}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">{category.categoryName}</h3>
                    <p className="text-gray-600 mt-1">{category.description || 'No description'}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${category.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEdit(category)} 
                    className="flex-1 px-3 py-1.5 bg-primary hover:bg-hover text-white text-sm rounded-lg transition-all duration-200"
                  >
                    <Edit size={16} className="inline mr-1" /> Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(category._id)} 
                    className="flex-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-all duration-200"
                  >
                    <Trash2 size={16} className="inline mr-1" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-2xl shadow-lg overflow-hidden border border-border">
            <table className="min-w-full">
              <thead className="bg-background">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-text uppercase tracking-wider">Category Name</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-text uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-text uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-text uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((category, index) => (
                  <tr key={category._id} className="hover:bg-gray-50 transition-colors duration-150 animate-fadeInUp" style={{animationDelay: `${Math.min(index * 50 + 200, 600)}ms`}}>
                    <td className="px-6 py-4 font-semibold text-gray-900">{category.categoryName}</td>
                    <td className="px-6 py-4 text-gray-600">{category.description || 'No description'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${category.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEdit(category)} 
                          className="px-3 py-1.5 bg-primary hover:bg-hover text-white text-xs rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 shadow-sm hover:shadow-md"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(category._id)} 
                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 shadow-sm hover:shadow-md"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
        )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingCategory ? 'Edit' : 'Add'} Category</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category Name</label>
                <input
                  type="text"
                  value={formData.categoryName}
                  onChange={(e) => setFormData({...formData, categoryName: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="3"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="mr-2"
                />
                <label className="text-sm font-medium">Active</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{editingCategory ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

        <ConfirmationDialog
          isOpen={showConfirmDialog}
          onClose={() => { setShowConfirmDialog(false); setConfirmAction(null); }}
          onConfirm={confirmAction}
          title={confirmAction?.toString().includes('Delete') ? 'Confirm Deletion' : `Confirm ${editingCategory ? 'Update' : 'Creation'}`}
          message={confirmAction?.toString().includes('Delete') 
            ? 'Are you sure you want to delete this category? This action cannot be undone.'
            : `Are you sure you want to ${editingCategory ? 'update' : 'create'} this category "${formData.categoryName}"?`
          }
          confirmText={confirmAction?.toString().includes('Delete') ? 'Delete' : (editingCategory ? 'Update' : 'Create')}
          cancelText="Cancel"
          type={confirmAction?.toString().includes('Delete') ? 'danger' : 'info'}
        />
      </div>
    </div>
  );
};

export default LaundryCategories;
