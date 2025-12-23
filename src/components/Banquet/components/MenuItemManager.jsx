import { useState, useEffect } from 'react';
import { useAppContext } from '../../../context/AppContext';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit } from 'lucide-react';

const MenuItemManager = () => {
  const { axios } = useAppContext();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    foodType: 'Both'
  });
  const [editingItem, setEditingItem] = useState(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/menu-items`);
      if (response.data.success) {
        setItems(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch menu items');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/banquet-categories/all`);
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.category) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      if (editingItem) {
        const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/menu-items/${editingItem._id}`, form);
        if (response.data.success) {
          toast.success('Menu item updated successfully');
          setEditingItem(null);
        }
      } else {
        const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/menu-items`, form);
        if (response.data.success) {
          toast.success('Menu item added successfully');
        }
      }
      setForm({ name: '', category: '', foodType: 'Both' });
      fetchItems();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${editingItem ? 'update' : 'add'} menu item`);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    
    let categoryId = '';
    
    if (typeof item.category === 'string') {
      if (item.category.length === 24 && /^[0-9a-fA-F]{24}$/.test(item.category)) {
        categoryId = item.category;
      } else {
        const matchingCategory = Array.isArray(categories) ? categories.find(cat => 
          cat.cateName?.toLowerCase() === item.category.toLowerCase()
        ) : null;
        categoryId = matchingCategory?._id || '';
      }
    } else if (item.category?._id) {
      categoryId = item.category._id;
    } else if (item.category) {
      categoryId = item.category.toString();
    }
    
    if (!categoryId) {
      const displayedCategory = typeof item.category === 'string' ? item.category : 
        item.category?.cateName || item.category?.name || '';
      const matchingCategory = Array.isArray(categories) ? categories.find(cat => 
        cat.cateName?.toLowerCase() === displayedCategory.toLowerCase()
      ) : null;
      categoryId = matchingCategory?._id || '';
    }
    
    setForm({
      name: item.name,
      category: categoryId,
      foodType: item.foodType
    });
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setForm({ name: '', category: '', foodType: 'Both' });
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/menu-items/${id}`);
      toast.success('Menu item deleted successfully');
      fetchItems();
    } catch (error) {
      toast.error('Failed to delete menu item');
    }
  };

  return (
    <div className="min-h-screen" style={{backgroundColor: 'hsl(45, 100%, 95%)'}}>
      <div className="p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6" style={{color: 'hsl(45, 100%, 20%)'}}>Menu Item Manager</h1>
        
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6" style={{border: '1px solid hsl(45, 100%, 85%)'}}>
          <h2 className="text-lg font-semibold mb-4" style={{color: 'hsl(45, 100%, 20%)'}}>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Item Name"
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
              className="p-3 rounded-lg focus:outline-none focus:ring-2"
              style={{border: '1px solid hsl(45, 100%, 85%)', focusRingColor: 'hsl(45, 43%, 58%)'}}
              required
            />
            <select
              value={form.category}
              onChange={(e) => setForm({...form, category: e.target.value})}
              className="p-3 rounded-lg focus:outline-none focus:ring-2"
              style={{border: '1px solid hsl(45, 100%, 85%)', focusRingColor: 'hsl(45, 43%, 58%)'}}
              required
            >
              <option value="">Select Category</option>
              {Array.isArray(categories) ? categories.filter(cat => cat.status === 'active').map(cat => (
                <option key={cat._id} value={cat._id}>{cat.cateName}</option>
              )) : []}
            </select>
            <select
              value={form.foodType}
              onChange={(e) => setForm({...form, foodType: e.target.value})}
              className="p-3 rounded-lg focus:outline-none focus:ring-2"
              style={{border: '1px solid hsl(45, 100%, 85%)', focusRingColor: 'hsl(45, 43%, 58%)'}}
            >
              <option value="Both">Both</option>
              <option value="Veg">Veg Only</option>
              <option value="Non-Veg">Non-Veg Only</option>
            </select>
            <div className="flex gap-2">
              <button
                type="submit"
                className="text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center flex-1"
                style={{backgroundColor: 'hsl(45, 43%, 58%)'}}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'hsl(45, 32%, 46%)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'hsl(45, 43%, 58%)'}
              >
                {editingItem ? <Edit size={16} className="mr-2" /> : <Plus size={16} className="mr-2" />}
                {editingItem ? 'Update Item' : 'Add Item'}
              </button>
              {editingItem && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-gray-600 px-4 py-3 rounded-lg border transition-colors"
                  style={{borderColor: 'hsl(45, 100%, 85%)'}}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow" style={{border: '1px solid hsl(45, 100%, 85%)'}}>
          <div className="p-4 border-b" style={{borderColor: 'hsl(45, 100%, 85%)'}}>
            <h2 className="text-lg font-semibold" style={{color: 'hsl(45, 100%, 20%)'}}>Menu Items ({items.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{backgroundColor: 'hsl(45, 100%, 98%)'}}>
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium" style={{color: 'hsl(45, 100%, 20%)'}}>Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium" style={{color: 'hsl(45, 100%, 20%)'}}>Category</th>
                  <th className="px-4 py-3 text-left text-sm font-medium" style={{color: 'hsl(45, 100%, 20%)'}}>Food Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium" style={{color: 'hsl(45, 100%, 20%)'}}>Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium" style={{color: 'hsl(45, 100%, 20%)'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">Loading...</td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">No items found</td>
                  </tr>
                ) : (
                  items.map(item => {
                    let categoryName = '-';
                    if (item.category) {
                      if (typeof item.category === 'string') {
                        const match = item.category.match(/cateName: '([^']+)'/);
                        categoryName = match ? match[1] : item.category;
                      } else if (item.category.cateName) {
                        categoryName = item.category.cateName;
                      } else if (item.category.name) {
                        categoryName = item.category.name;
                      }
                    }
                    return (
                      <tr key={item._id} className="border-t" style={{borderColor: 'hsl(45, 100%, 85%)'}}>
                        <td className="px-4 py-3 text-sm">{item.name}</td>
                        <td className="px-4 py-3 text-sm">{categoryName}</td>
                        <td className="px-4 py-3 text-sm">{item.foodType}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded text-xs ${
                            item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {item.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                              title="Edit item"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                              title="Delete item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuItemManager;
