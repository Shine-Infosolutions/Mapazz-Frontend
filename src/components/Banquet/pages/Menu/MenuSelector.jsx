
import { useState, useEffect, useMemo } from "react";
import { useAppContext } from "../../../../context/AppContext";
const MenuSelector = ({
  onSave,
  onSaveCategory,
  onClose,
  initialItems,
  foodType,
  ratePlan
}) => {
  const userRole = localStorage.getItem('role');
  const isAdmin = userRole?.toLowerCase() === 'admin';
  const { axios } = useAppContext();
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState(initialItems || []);
  const [currentCategory, setCurrentCategory] = useState("");
  const [planLimits, setPlanLimits] = useState({});
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);

  // WebSocket removed
  const sendMessage = () => {};

  // API functions
  const fetchMenuItems = async () => {
    const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/menu-items`);
    return response.data.success ? response.data.data : response.data;
  };

  const createMenuItem = async (itemData) => {
    const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/menu-items`, itemData);
    return response.data;
  };

  const deleteMenuItem = async (itemId) => {
    const response = await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/menu-items/${itemId}`);
    return response.data;
  };

  const deleteMenuItems = async () => {
    const response = await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/menu-items`);
    return response.data;
  };

  const fetchCategories = async () => {
    const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/banquet-categories/all`);
    return response.data;
  };

  const createCategory = async (categoryData) => {
    const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/banquet-categories/create`, categoryData);
    return response.data;
  };

  const fetchPlanLimits = async () => {
    const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/plan-limits/get`);
    return response.data;
  };

  const createPlanLimits = async (limitsData) => {
    const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/plan-limits`, limitsData);
    return response.data;
  };

  // Sync selectedItems when initialItems changes
  useEffect(() => {
    setSelectedItems(initialItems || []);
  }, [initialItems]);

  // Fetch menu items, categories and plan limits
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuData, categoriesData, limitsData] = await Promise.all([
          fetchMenuItems(),
          fetchCategories(),
          fetchPlanLimits()
        ]);
        
        // Handle categories with predefined order
        if (categoriesData) {
          const cats = Array.isArray(categoriesData) ? categoriesData : 
                      categoriesData.data ? categoriesData.data : 
                      categoriesData.categories ? categoriesData.categories : [];
          
          // Define the desired order based on food type
          const vegCategoryOrder = [
            'WELCOME DRINK', 'STARTER VEG', 'SALAD', 'RAITA', 'MAIN COURSE[PANEER]', 
            'VEGETABLE', 'DAL', 'RICE', 'BREADS', 'DESSERTS'
          ];
          
          const nonVegCategoryOrder = [
            'WELCOME DRINK', 'STARTER VEG', 'SALAD', 'RAITA', 'MAIN COURSE[PANEER]', 
            'MAIN COURSE[NON-VEG]', 'VEGETABLE', 'DAL', 'RICE', 'BREADS', 'DESSERTS'
          ];
          
          const categoryOrder = foodType === 'Veg' ? vegCategoryOrder : nonVegCategoryOrder;
          
          // Filter categories based on food type
          const filteredCats = cats.filter(cat => {
            const catName = cat.cateName || cat.name;
            // For Veg, exclude any NON-VEG categories
            if (foodType === 'Veg' && (catName.includes('NON-VEG') || catName.includes('NON VEG'))) {
              return false;
            }
            return true;
          });
          
          const sortedCats = filteredCats.sort((a, b) => {
            const aName = a.cateName || a.name;
            const bName = b.cateName || b.name;
            const aIndex = categoryOrder.indexOf(aName);
            const bIndex = categoryOrder.indexOf(bName);
            
            // If both are in the order array, sort by their position
            if (aIndex !== -1 && bIndex !== -1) {
              return aIndex - bIndex;
            }
            // If only one is in the order array, prioritize it
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            // If neither is in the order array, sort alphabetically
            return aName.localeCompare(bName);
          });
          
          setCategories(sortedCats);
          if (sortedCats.length > 0) {
            setCurrentCategory(sortedCats[0].cateName || sortedCats[0].name);
          }
        }
        
        // Handle menu items
        if (menuData) {
          const items = Array.isArray(menuData) ? menuData :
                       menuData.data ? menuData.data :
                       menuData.items ? menuData.items : [];
          setMenuItems(items);
        }
        
        // Handle plan limits
        if (limitsData) {
          const limits = limitsData.success ? limitsData.data : limitsData;
          setPlanLimits(limits);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        console.error('Error details:', error.response?.data);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [axios]);

  // Get items for current category filtered by foodType
  const currentCategoryItems = useMemo(() => {
    if (!menuItems.length || !currentCategory) return [];
    
    return menuItems
      .filter(item => {
        
        // Filter by category - handle different category formats
        let categoryMatch = false;
        if (item.category) {
          if (typeof item.category === 'string') {
            // Try regex match first
            const match = item.category.match(/cateName:\s*['"]([^'"]+)['"]/);
            if (match && match[1] === currentCategory) {
              categoryMatch = true;
            } else if (item.category === currentCategory) {
              categoryMatch = true;
            }
          } else if (typeof item.category === 'object') {
            categoryMatch = (item.category.cateName || item.category.name) === currentCategory;
          }
        }
        
        if (!categoryMatch) return false;
        
        // Filter by foodType - handle 'Both' case
        if (foodType && item.foodType) {
          // If item foodType is 'Both', show for any selected foodType
          if (item.foodType === 'Both') {
            return true;
          }
          // Otherwise exact match
          return item.foodType === foodType;
        }
        
        return true;
      })
      .map(item => item.name || item.itemName);
  }, [menuItems, currentCategory, foodType]);

  const handleSelectItem = (item) => {
    setSelectedItems(prev => {
      const isSelected = prev.includes(item);
      if (isSelected) {
        const newItems = prev.filter(i => i !== item);
        
        // Auto-save immediately when item is removed
        setTimeout(() => {
          if (onSave) {
            const categorizedMenu = {};
            newItems.forEach(selectedItem => {
              const itemData = menuItems.find(mi => mi.name === selectedItem);
              if (itemData?.category) {
                let categoryName;
                if (typeof itemData.category === 'string') {
                  // Try to parse complex category format first
                  const match = itemData.category.match(/cateName:\s*['"]([^'"]+)['"]/); 
                  if (match) {
                    categoryName = match[1];
                  } else {
                    // Use simple string category
                    categoryName = itemData.category;
                  }
                } else if (typeof itemData.category === 'object') {
                  categoryName = itemData.category.cateName || itemData.category.name;
                }
                
                if (categoryName) {
                  if (!categorizedMenu[categoryName]) {
                    categorizedMenu[categoryName] = [];
                  }
                  categorizedMenu[categoryName].push(selectedItem);
                }
              }
            });
            onSave(newItems, categorizedMenu);
          }
        }, 0);
        
        return newItems;
      }
      
      // Skip limit checks for Admin users
      if (!isAdmin) {
        // Find matching plan limit based on foodType and ratePlan
        const matchingPlan = Array.isArray(planLimits) 
          ? planLimits.find(plan => plan.foodType === foodType && plan.ratePlan === ratePlan)
          : null;
        
        const categoryLimit = matchingPlan?.limits?.[currentCategory];
        
        if (categoryLimit) {
          const currentCategorySelectedCount = prev.filter(selectedItem => {
            const selectedItemData = menuItems.find(mi => mi.name === selectedItem);
            if (selectedItemData?.category) {
              let categoryName;
              if (typeof selectedItemData.category === 'string') {
                const match = selectedItemData.category.match(/cateName:\s*['"]([^'"]+)['"]/);
                categoryName = match ? match[1] : selectedItemData.category;
              } else if (typeof selectedItemData.category === 'object') {
                categoryName = selectedItemData.category.cateName || selectedItemData.category.name;
              }
              return categoryName === currentCategory;
            }
            return false;
          }).length;
          
          if (currentCategorySelectedCount >= categoryLimit) {
            return prev;
          }
        }
      }
      
      const newItems = [...prev, item];
      
      // Auto-save immediately when item is selected
      setTimeout(() => {
        if (onSave) {
          const categorizedMenu = {};
          newItems.forEach(selectedItem => {
            const itemData = menuItems.find(mi => mi.name === selectedItem);
            if (itemData?.category) {
              let categoryName;
              if (typeof itemData.category === 'string') {
                // Try to parse complex category format first
                const match = itemData.category.match(/cateName:\s*['"]([^'"]+)['"]/); 
                if (match) {
                  categoryName = match[1];
                } else {
                  // Use simple string category
                  categoryName = itemData.category;
                }
              } else if (typeof itemData.category === 'object') {
                categoryName = itemData.category.cateName || itemData.category.name;
              }
              
              if (categoryName) {
                if (!categorizedMenu[categoryName]) {
                  categorizedMenu[categoryName] = [];
                }
                categorizedMenu[categoryName].push(selectedItem);
              }
            }
          });
          onSave(newItems, categorizedMenu);
        }
      }, 0);
      
      return newItems;
    });
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      await createCategory({ cateName: newCategoryName });
      const updatedCategories = await fetchCategories();
      setCategories(updatedCategories);
      setNewCategoryName("");
      setShowAddCategory(false);
      
      // WebSocket notification removed
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleDeleteMenuItem = async (itemName) => {
    try {
      const item = menuItems.find(mi => mi.name === itemName);
      if (item && item.id) {
        await deleteMenuItem(item.id);
        const updatedItems = await fetchMenuItems();
        setMenuItems(updatedItems);
        setSelectedItems(prev => prev.filter(i => i !== itemName));
        
        // WebSocket notification removed
      }
    } catch (error) {
      console.error('Error deleting menu item:', error);
    }
  };

  if (loading) {
    return (
      <div className="modal modal-open">
        <div className="modal-box max-w-6xl h-[92vh] flex items-center justify-center">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-6xl h-[92vh] flex flex-col">
        <button className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4" onClick={() => {
          if (onSave && selectedItems.length > 0) {
            const categorizedMenu = {};
            selectedItems.forEach(item => {
              const itemData = menuItems.find(mi => mi.name === item);
              if (itemData?.category) {
                let categoryName;
                if (typeof itemData.category === 'string') {
                  // Try to parse complex category format first
                  const match = itemData.category.match(/cateName:\s*['"]([^'"]+)['"]/); 
                  if (match) {
                    categoryName = match[1];
                  } else {
                    // Use simple string category
                    categoryName = itemData.category;
                  }
                } else if (typeof itemData.category === 'object') {
                  categoryName = itemData.category.cateName || itemData.category.name;
                }
                
                if (categoryName) {
                  if (!categorizedMenu[categoryName]) {
                    categorizedMenu[categoryName] = [];
                  }
                  categorizedMenu[categoryName].push(item);
                }
              }
            });
            onSave(selectedItems, categorizedMenu);
          }
          onClose();
        }}>✕</button>
        
        <div className="flex flex-1 h-full">
          {/* Categories Sidebar */}
          <aside className="w-[300px] bg-base-200 p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-lg">Categories</h4>
              {isAdmin && (
                <button 
                  className="btn btn-xs btn-primary"
                  onClick={() => setShowAddCategory(true)}
                >
                  +
                </button>
              )}
            </div>
            
            {showAddCategory && (
              <div className="mb-4 p-2 bg-base-100 rounded">
                <input
                  type="text"
                  placeholder="Category name"
                  className="input input-xs w-full mb-2"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
                <div className="flex gap-1">
                  <button 
                    className="btn btn-xs btn-primary"
                    onClick={handleAddCategory}
                  >
                    Add
                  </button>
                  <button 
                    className="btn btn-xs btn-ghost"
                    onClick={() => {
                      setShowAddCategory(false);
                      setNewCategoryName("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            {categories.length === 0 ? (
              <div className="text-center text-gray-500">No categories found</div>
            ) : (
              categories.map((category) => (
                <button
                  key={category.cateName || category.name}
                  className={`w-full p-3 mb-2 rounded-lg text-left ${
                    currentCategory === (category.cateName || category.name)
                      ? "bg-primary text-primary-content" 
                      : "bg-base-100 hover:bg-base-300"
                  }`}
                  onClick={() => setCurrentCategory(category.cateName || category.name)}
                >
                  <div>{category.cateName || category.name}</div>
                  {!isAdmin && (() => {
                    const matchingPlan = Array.isArray(planLimits) 
                      ? planLimits.find(plan => plan.foodType === foodType && plan.ratePlan === ratePlan)
                      : null;
                    const categoryName = category.cateName || category.name;
                    const limit = matchingPlan?.limits?.[categoryName];
                    return limit ? (
                      <div className="text-xs opacity-75">
                        Limit: {limit}
                      </div>
                    ) : null;
                  })()}
                </button>
              ))
            )}
          </aside>

          {/* Items Content */}
          <main className="flex-1 p-6">
            <h3 className="font-bold text-2xl mb-4">{ratePlan} {foodType} Menu Selection</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {currentCategoryItems.length === 0 ? (
                <div className="text-center text-gray-500 col-span-full">
                  {foodType ? `No ${foodType} items found for this category` : 'No items found for this category'}
                </div>
              ) : (
                currentCategoryItems.map(item => {
                  const isSelected = selectedItems.includes(item);
                  
                  // Check if limit reached for this category (skip for Admin)
                  let isLimitReached = false;
                  if (!isAdmin) {
                    const matchingPlan = Array.isArray(planLimits) 
                      ? planLimits.find(plan => plan.foodType === foodType && plan.ratePlan === ratePlan)
                      : null;
                    const categoryLimit = matchingPlan?.limits?.[currentCategory];
                    const currentCategorySelectedCount = selectedItems.filter(selectedItem => {
                      const selectedItemData = menuItems.find(mi => mi.name === selectedItem);
                      if (selectedItemData?.category) {
                        let categoryName;
                        if (typeof selectedItemData.category === 'string') {
                          const match = selectedItemData.category.match(/cateName:\s*['"]([^'"]+)['"]/);
                          categoryName = match ? match[1] : selectedItemData.category;
                        } else if (typeof selectedItemData.category === 'object') {
                          categoryName = selectedItemData.category.cateName || selectedItemData.category.name;
                        }
                        return categoryName === currentCategory;
                      }
                      return false;
                    }).length;
                    
                    isLimitReached = categoryLimit && currentCategorySelectedCount >= categoryLimit && !isSelected;
                  }
                  
                  return (
                    <div
                      key={item}
                      className={`p-3 rounded-lg transition-colors ${
                        isLimitReached 
                          ? "bg-gray-300 cursor-not-allowed opacity-50" 
                          : isSelected 
                          ? "bg-primary text-primary-content cursor-pointer" 
                          : "bg-base-200 hover:bg-base-300 cursor-pointer"
                      }`}
                      onClick={() => !isLimitReached && handleSelectItem(item)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            disabled={isLimitReached}
                            className="checkbox checkbox-sm"
                          />
                          <span className={isLimitReached ? "text-gray-500" : ""}>{item}</span>
                        </div>
                        {isAdmin && (
                          <button
                            className="btn btn-xs btn-error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMenuItem(item);
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </main>
        </div>
        
        <footer className="p-4 border-t flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Selected: {selectedItems.length} items
            {!isAdmin && (() => {
              const matchingPlan = Array.isArray(planLimits) 
                ? planLimits.find(plan => plan.foodType === foodType && plan.ratePlan === ratePlan)
                : null;
              const limit = matchingPlan?.limits?.[currentCategory];
              if (limit) {
                const currentCount = selectedItems.filter(item => {
                  const itemData = menuItems.find(mi => mi.name === item);
                  if (itemData?.category) {
                    let categoryName;
                    if (typeof itemData.category === 'string') {
                      const match = itemData.category.match(/cateName:\s*['"]([^'"]+)['"]/);
                      categoryName = match ? match[1] : itemData.category;
                    } else if (typeof itemData.category === 'object') {
                      categoryName = itemData.category.cateName || itemData.category.name;
                    }
                    return categoryName === currentCategory;
                  }
                  return false;
                }).length;
                return (
                  <div className="text-xs">
                    {currentCategory}: {currentCount}/{limit}
                  </div>
                );
              }
              return null;
            })()}
          </div>

        </footer>
      </div>
    </div>
  );
};

export default MenuSelector;
