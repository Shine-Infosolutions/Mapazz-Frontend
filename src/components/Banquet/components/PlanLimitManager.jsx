// import { useState, useEffect } from 'react';
// import { useAppContext } from '../../../context/AppContext';
// import toast from 'react-hot-toast';
// import { Plus, Edit, Settings } from 'lucide-react';

// const LIMIT_CATEGORIES = [
//   'STARTERS_GROUP', 'BEVERAGES', 'SOUP_VEG', 'SOUP_NON_VEG',
//   'MAIN_COURSE_PANEER', 'MAIN_COURSE_CHICKEN', 'MAIN_COURSE_MUTTON',
//   'MAIN_COURSE_FISH_WITH_BONE', 'VEGETABLES', 'MAIN_COURSE_GHAR_KA_SWAD',
//   'RICE', 'INDIAN_BREADS', 'SALAD_BAR', 'CURD_AND_RAITA',
//   'DESSERTS', 'ICE_CREAM', 'WATER', 'LIVE_COUNTER'
// ];

// const PlanLimitManager = () => {
//   const { axios } = useAppContext();
//   const [categories, setCategories] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [editingPlan, setEditingPlan] = useState(null);

//   const fetchCategories = async () => {
//     try {
//       setLoading(true);
//       const response = await axios.get('/api/banquet-categories/all');
//       setCategories(response.data || []);
//     } catch (error) {
//       console.error('Failed to fetch categories:', error);
//       toast.error('Failed to fetch categories');
//       setCategories([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchCategories();
//   }, []);

//   const handleSave = async (planData) => {
//     try {
//       const response = await axios.post('/api/banquet-categories/create', planData);
      
//       if (response.status === 200 || response.status === 201 || response.data?.success) {
//         toast.success('Category saved successfully');
//         setEditingPlan(null);
//         fetchCategories();
//       } else {
//         toast.error('Failed to save category');
//       }
//     } catch (error) {
//       console.error('Failed to save category:', error);
//       toast.error(error.response?.data?.message || 'Failed to save category');
//     }
//   };

//   const PlanEditor = ({ plan, onSave, onCancel }) => {
//     const [formData, setFormData] = useState(() => {
//       if (plan && Object.keys(plan).length > 0) {
//         return plan;
//       }
//       return {
//         cateName: '',
//         status: 'active'
//       };
//     });

//     return (
//       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//         <div className="bg-white rounded-lg p-6 max-w-md w-full" style={{border: '1px solid hsl(45, 100%, 85%)'}}>
//           <h3 className="text-lg font-semibold mb-4" style={{color: 'hsl(45, 100%, 20%)'}}>
//             Add Plan
//           </h3>
          
//           <div className="space-y-4 mb-6">
//             <div>
//               <label className="block text-sm font-medium mb-2" style={{color: 'hsl(45, 100%, 20%)'}}>
//                 Category Name
//               </label>
//               <input
//                 type="text"
//                 value={formData.cateName}
//                 onChange={(e) => setFormData(prev => ({ ...prev, cateName: e.target.value }))}
//                 className="w-full p-3 rounded-lg focus:outline-none focus:ring-2"
//                 style={{border: '1px solid hsl(45, 100%, 85%)', focusRingColor: 'hsl(45, 43%, 58%)'}}
//                 placeholder="Enter category name"
//                 required
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium mb-2" style={{color: 'hsl(45, 100%, 20%)'}}>
//                 Status
//               </label>
//               <select
//                 value={formData.status}
//                 onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
//                 className="w-full p-3 rounded-lg focus:outline-none focus:ring-2"
//                 style={{border: '1px solid hsl(45, 100%, 85%)', focusRingColor: 'hsl(45, 43%, 58%)'}}
//               >
//                 <option value="active">Active</option>
//                 <option value="inactive">Inactive</option>
//               </select>
//             </div>
//           </div>

//           <div className="flex gap-2">
//             <button
//               onClick={() => onSave(formData)}
//               className="text-white px-4 py-2 rounded transition-colors"
//               style={{backgroundColor: 'hsl(45, 43%, 58%)'}}
//               onMouseEnter={(e) => e.target.style.backgroundColor = 'hsl(45, 32%, 46%)'}
//               onMouseLeave={(e) => e.target.style.backgroundColor = 'hsl(45, 43%, 58%)'}
//             >
//               Save
//             </button>
//             <button
//               onClick={onCancel}
//               className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
//             >
//               Cancel
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="min-h-screen" style={{backgroundColor: 'hsl(45, 100%, 95%)'}}>
//       <div className="p-4 sm:p-6">
//         <div className="flex justify-between items-center mb-4 sm:mb-6">
//           <h1 className="text-xl sm:text-2xl font-bold" style={{color: 'hsl(45, 100%, 20%)'}}>Banquet Categories</h1>
//           <button
//             onClick={() => setEditingPlan({})}
//             className="text-white px-4 py-2 rounded transition-colors flex items-center"
//             style={{backgroundColor: 'hsl(45, 43%, 58%)'}}
//             onMouseEnter={(e) => e.target.style.backgroundColor = 'hsl(45, 32%, 46%)'}
//             onMouseLeave={(e) => e.target.style.backgroundColor = 'hsl(45, 43%, 58%)'}
//           >
//             <Plus size={16} className="mr-2" /> Add Category
//           </button>
//         </div>

//         <div className="bg-white rounded-lg shadow" style={{border: '1px solid hsl(45, 100%, 85%)'}}>
//           <div className="p-4 border-b" style={{borderColor: 'hsl(45, 100%, 85%)'}}>
//             <h2 className="text-lg font-semibold" style={{color: 'hsl(45, 100%, 20%)'}}>Categories ({categories.length})</h2>
//           </div>
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead style={{backgroundColor: 'hsl(45, 100%, 98%)'}}>
//                 <tr>
//                   <th className="px-4 py-3 text-left text-sm font-medium" style={{color: 'hsl(45, 100%, 20%)'}}>Name</th>
//                   <th className="px-4 py-3 text-left text-sm font-medium" style={{color: 'hsl(45, 100%, 20%)'}}>Status</th>
//                   <th className="px-4 py-3 text-left text-sm font-medium" style={{color: 'hsl(45, 100%, 20%)'}}>Created</th>
//                   <th className="px-4 py-3 text-left text-sm font-medium" style={{color: 'hsl(45, 100%, 20%)'}}>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {loading ? (
//                   <tr>
//                     <td colSpan="4" className="px-4 py-8 text-center text-gray-500">Loading...</td>
//                   </tr>
//                 ) : categories.length === 0 ? (
//                   <tr>
//                     <td colSpan="4" className="px-4 py-8 text-center text-gray-500">No categories found</td>
//                   </tr>
//                 ) : (
//                   categories.map(category => (
//                     <tr key={category._id} className="border-t" style={{borderColor: 'hsl(45, 100%, 85%)'}}>
//                       <td className="px-4 py-3 text-sm">{category.cateName}</td>
//                       <td className="px-4 py-3 text-sm">
//                         <span className={`px-2 py-1 rounded text-xs ${
//                           category.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
//                         }`}>
//                           {category.status}
//                         </span>
//                       </td>
//                       <td className="px-4 py-3 text-sm">
//                         {category.createdAt ? new Date(category.createdAt).toLocaleDateString() : 'N/A'}
//                       </td>
//                       <td className="px-4 py-3 text-sm">
//                         <button
//                           onClick={() => setEditingPlan(category)}
//                           className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
//                         >
//                           <Edit size={16} />
//                         </button>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>

//       {editingPlan && (
//         <PlanEditor
//           plan={editingPlan}
//           onSave={handleSave}
//           onCancel={() => setEditingPlan(null)}
//         />
//       )}
//     </div>
//   );
// };

// export default PlanLimitManager;
import { useState, useEffect } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

// const LIMIT_CATEGORIES = [
//   'STARTERS_GROUP', 'BEVERAGES', 'SOUP_VEG', 'SOUP_NON_VEG',
//   'MAIN_COURSE_PANEER', 'MAIN_COURSE_CHICKEN', 'MAIN_COURSE_MUTTON',
//   'MAIN_COURSE_FISH_WITH_BONE', 'VEGETABLES', 'MAIN_COURSE_GHAR_KA_SWAD',
//   'RICE', 'INDIAN_BREADS', 'SALAD_BAR', 'CURD_AND_RAITA',
//   'DESSERTS', 'ICE_CREAM', 'WATER', 'LIVE_COUNTER'
// ];

const PlanLimitManager = () => {
  const { axios } = useAppContext();
  const [limits, setLimits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const fetchLimits = async () => {
    try {
      setLoading(true);
      const [limitsResponse, categoriesResponse] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/plan-limits/get`),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/banquet-categories/all`)
      ]);
      if (limitsResponse.data.success) {
        setLimits(limitsResponse.data.data);
      }
      setCategories(categoriesResponse.data || []);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLimits();
  }, []);

  const handleSave = async (planData) => {
    try {
  const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/plan-limits`, planData);
      if (response.data.success) {
        toast.success('Plan limits updated successfully');
        setEditingPlan(null);
        fetchLimits();
      }
    } catch (error) {
      toast.error('Failed to update plan limits');
    }
  };

  const PlanEditor = ({ plan, onSave, onCancel, onDelete }) => {
    const [categories, setCategories] = useState([]);
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [formData, setFormData] = useState(() => {
      if (plan && Object.keys(plan).length > 0) {
        return plan;
      }
      return {
        ratePlan: 'Silver',
        foodType: 'Veg',
        limits: {}
      };
    });

    useEffect(() => {
      const fetchCategories = async () => {
        try {
          const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/banquet-categories/all`);
          setCategories(response.data || []);
        } catch (error) {
          toast.error('Failed to fetch categories');
        }
      };
      fetchCategories();
    }, []);

    const handleLimitChange = (categoryId, value) => {
      setFormData(prev => ({
        ...prev,
        limits: { ...prev.limits, [categoryId]: parseInt(value) || 0 }
      }));
    };

    const handleCreateCategory = async (categoryData) => {
      try {
        const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/banquet-categories/create`, categoryData);
        if (response.status === 200 || response.status === 201) {
          toast.success('Category created successfully');
          setShowCategoryForm(false);
          // Refresh categories
          const categoriesResponse = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/banquet-categories/all`);
          setCategories(categoriesResponse.data || []);
        }
      } catch (error) {
        toast.error('Failed to create category');
      }
    };

    const handleDeleteCategory = async (categoryId) => {
      if (window.confirm('Are you sure you want to delete this category?')) {
        try {
          const response = await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/banquet-categories/delete/${categoryId}`);
          if (response.status === 200) {
            toast.success('Category deleted successfully');
            // Refresh categories
            const categoriesResponse = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/banquet-categories/all`);
            setCategories(categoriesResponse.data || []);
            // Remove from form limits
            setFormData(prev => {
              const newLimits = { ...prev.limits };
              delete newLimits[categoryId];
              return { ...prev, limits: newLimits };
            });
          }
        } catch (error) {
          toast.error('Failed to delete category');
        }
      }
    };

    const CategoryForm = ({ onSave, onCancel }) => {
      const [categoryData, setCategoryData] = useState({ cateName: '', status: 'active' });
      
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Add Category</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Category Name</label>
                <input
                  type="text"
                  value={categoryData.cateName}
                  onChange={(e) => setCategoryData(prev => ({ ...prev, cateName: e.target.value }))}
                  className="w-full p-3 rounded-lg border focus:outline-none focus:ring-2"
                  placeholder="Enter category name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={categoryData.status}
                  onChange={(e) => setCategoryData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full p-3 rounded-lg border focus:outline-none focus:ring-2"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onSave(categoryData)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Save
              </button>
              <button
                onClick={onCancel}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">
            {plan ? 'Edit' : 'Add'} Plan Limits
          </h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <select
              value={formData.ratePlan}
              onChange={(e) => setFormData(prev => ({ ...prev, ratePlan: e.target.value }))}
              className="border rounded px-3 py-2"
            >
              <option value="Silver">Silver</option>
              <option value="Gold">Gold</option>
              <option value="Platinum">Platinum</option>
            </select>
            <select
              value={formData.foodType}
              onChange={(e) => setFormData(prev => ({ ...prev, foodType: e.target.value }))}
              className="border rounded px-3 py-2"
            >
              <option value="Veg">Veg</option>
              <option value="Non-Veg">Non-Veg</option>
            </select>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-md font-medium">Categories</h4>
              <button
                type="button"
                onClick={() => setShowCategoryForm(true)}
                className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
              >
                Add Category
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {categories.filter(cat => cat.status === 'active').map(category => (
                <div key={category._id} className="relative">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium">
                      {category.cateName}
                    </label>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(category._id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Delete category"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={(formData.limits && formData.limits[category._id]) || 0}
                    onChange={(e) => handleLimitChange(category._id, e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onSave(formData)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Save
            </button>
            {plan && plan._id && (
              <button
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete ${formData.ratePlan} - ${formData.foodType} plan?`)) {
                    onDelete(plan);
                  }
                }}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Delete
              </button>
            )}
            <button
              onClick={onCancel}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
          
          {showCategoryForm && (
            <CategoryForm
              onSave={handleCreateCategory}
              onCancel={() => setShowCategoryForm(false)}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Plan Limit Manager</h2>
        <button
          onClick={() => setEditingPlan({})}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Add New Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-8">Loading...</div>
        ) : limits.length === 0 ? (
          <div className="col-span-full text-center py-8">No plan limits found</div>
        ) : (
          limits.map(limit => (
            <div key={`${limit.ratePlan}-${limit.foodType}`} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {limit.ratePlan} - {limit.foodType}
                </h3>
                <button
                  onClick={() => setEditingPlan(limit)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Edit
                </button>
              </div>
              
              <div className="space-y-2 text-sm">
                {Object.entries(limit.limits || {}).map(([categoryKey, value]) => {
                  // Try to find by ID first, then by name
                  const category = categories.find(cat => cat._id === categoryKey || cat.cateName === categoryKey);
                  return (
                    <div key={categoryKey} className="flex justify-between">
                      <span className="text-gray-600">{category?.cateName || categoryKey}:</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {editingPlan && (
        <PlanEditor
          plan={editingPlan}
          onSave={handleSave}
          onCancel={() => setEditingPlan(null)}
          onDelete={(planToDelete) => {
            handleDelete(planToDelete);
            setEditingPlan(null);
          }}
        />
      )}
    </div>
  );
};

export default PlanLimitManager;
