import React from "react";
import { X } from "lucide-react";
import toast from 'react-hot-toast';
import { validateRequired } from "../../utils/validation";

const CategoryForm = ({
  showModal,
  setShowModal,
  currentCategory,
  setCurrentCategory,
  handleSubmit,
  editMode,
}) => {
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCurrentCategory({
      ...currentCategory,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  return (
    showModal && (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">
              {editMode ? "Edit Category" : "Add New Category"}
            </h3>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-text/70">
                Category Name
              </label>
              <input
                type="text"
                name="name"
                value={currentCategory.name}
                onChange={handleInputChange}
                placeholder="Enter category name"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
                onBlur={(e) => {
                  if (!validateRequired(e.target.value)) {
                    toast.error('Category name is required');
                  } else if (e.target.value.trim().length < 2) {
                    toast.error('Category name must be at least 2 characters');
                  }
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-text/70">
                Description
              </label>
              <textarea
                name="description"
                value={currentCategory.description}
                onChange={handleInputChange}
                placeholder="Enter category description"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-24"
                required
                onBlur={(e) => {
                  if (!validateRequired(e.target.value)) {
                    toast.error('Category description is required');
                  }
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-text/70">
                Base Price
              </label>
              <input
                type="number"
                name="basePrice"
                value={currentCategory.basePrice || ''}
                onChange={handleInputChange}
                placeholder="Enter base price"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                min="0"
                step="0.01"
              />
            </div>

            <div className="flex items-center">
              <select
                name="status"
                value={currentCategory.status}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-lg"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-primary text-white px-4 py-2 rounded-lg"
              >
                {editMode ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  );
};

export default CategoryForm;
