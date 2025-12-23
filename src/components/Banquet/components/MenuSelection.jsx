import { useState, useEffect } from 'react';
import { useAppContext } from '../../../context/AppContext';
import toast from 'react-hot-toast';

const MenuSelection = () => {
  const { axios } = useAppContext();
  const [ratePlans, setRatePlans] = useState([]);
  const [selectedRatePlan, setSelectedRatePlan] = useState('');
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRatePlans = async () => {
    try {
      const response = await axios.get('/api/rate-plans');
      if (response.data.success) {
        setRatePlans(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch rate plans');
    }
  };

  const fetchMenuItems = async () => {
    if (!selectedRatePlan) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`/api/menu-items?ratePlan=${selectedRatePlan}`);
      if (response.data.success) {
        setMenuItems(response.data.data);
        // Group items by category
        const cats = [...new Set(response.data.data.map(item => item.category))];
        setCategories(cats);
      }
    } catch (error) {
      toast.error('Failed to fetch menu items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRatePlans();
  }, []);

  useEffect(() => {
    if (selectedRatePlan) {
      fetchMenuItems();
    } else {
      setMenuItems([]);
      setCategories([]);
    }
  }, [selectedRatePlan]);

  const handleItemToggle = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const getItemsByCategory = (category) => {
    return menuItems.filter(item => item.category === category);
  };

  return (
    <div className="min-h-screen" style={{backgroundColor: 'hsl(45, 100%, 95%)'}}>
      <div className="p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-6" style={{color: 'hsl(45, 100%, 20%)'}}>Menu Selection</h1>
        
        {/* Rate Plan Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6" style={{border: '1px solid hsl(45, 100%, 85%)'}}>
          <h2 className="text-lg font-semibold mb-4" style={{color: 'hsl(45, 100%, 20%)'}}>Select Rate Plan</h2>
          <select
            value={selectedRatePlan}
            onChange={(e) => setSelectedRatePlan(e.target.value)}
            className="w-full p-3 rounded-lg focus:outline-none focus:ring-2"
            style={{border: '1px solid hsl(45, 100%, 85%)', focusRingColor: 'hsl(45, 43%, 58%)'}}
          >
            <option value="">Please select a rate plan before choosing menu items</option>
            {ratePlans.map(plan => (
              <option key={plan._id} value={plan._id}>{plan.name}</option>
            ))}
          </select>
        </div>

        {/* Menu Items by Category */}
        {selectedRatePlan && (
          <div className="space-y-6">
            {categories.length === 0 && !loading && (
              <div className="bg-white rounded-lg shadow p-6 text-center" style={{border: '1px solid hsl(45, 100%, 85%)'}}>
                <p className="text-gray-500">No items found for this category</p>
              </div>
            )}
            
            {categories.map(category => {
              const categoryItems = getItemsByCategory(category);
              return (
                <div key={category} className="bg-white rounded-lg shadow" style={{border: '1px solid hsl(45, 100%, 85%)'}}>
                  <div className="p-4 border-b" style={{borderColor: 'hsl(45, 100%, 85%)'}}>
                    <h3 className="text-lg font-semibold" style={{color: 'hsl(45, 100%, 20%)'}}>{category}</h3>
                  </div>
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryItems.map(item => (
                      <label key={item._id} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item._id)}
                          onChange={() => handleItemToggle(item._id)}
                          className="rounded"
                        />
                        <span className="text-sm">{item.name}</span>
                        <span className="text-xs text-gray-500">({item.foodType})</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-lg shadow p-6 text-center" style={{border: '1px solid hsl(45, 100%, 85%)'}}>
            <p className="text-gray-500">Loading menu items...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuSelection;
