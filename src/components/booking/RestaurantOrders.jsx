import React from 'react';
import { UtensilsCrossed, Edit2, Save, X, Trash2 } from 'lucide-react';

const RestaurantOrders = ({ 
  restaurantCharges, 
  editingOrder, 
  editItems, 
  onEditOrder, 
  onSaveOrder, 
  onCancelEdit, 
  onUpdateItemQuantity,
  onRemoveOrder,
  onRemoveItem,
  onToggleNC
}) => {
  if (restaurantCharges.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
        <UtensilsCrossed className="mr-2 text-blue-600" size={20} />
        Restaurant Orders
      </h2>
      <div className="space-y-4">
        {restaurantCharges.map((order, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-medium text-gray-800">Room {order.tableNo}</p>
                <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`font-medium text-lg ${order.nonChargeable ? 'line-through text-gray-500' : ''}`}>
                  ₹{order.amount}
                </span>
                {order.nonChargeable && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">NC</span>}
                <label className="flex items-center space-x-1 text-sm">
                  <input
                    type="checkbox"
                    checked={order.nonChargeable || false}
                    onChange={() => onToggleNC(order._id, 'restaurant')}
                    className="w-4 h-4"
                  />
                  <span>NC</span>
                </label>
                <button
                  type="button"
                  onClick={() => onEditOrder(order, 'restaurant')}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveOrder(order._id, 'restaurant')}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            {editingOrder && editingOrder._id === order._id ? (
              <div className="space-y-3">
                {editItems.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                    <div className="flex-1">
                      <p className="font-medium">{item.name || item.itemName || 'Unknown Item'}</p>
                      <p className="text-sm text-gray-600">₹{item.price || item.unitPrice || 0} each</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => onUpdateItemQuantity(itemIndex, item.quantity - 1)}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-200"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => onUpdateItemQuantity(itemIndex, item.quantity + 1)}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-200"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(itemIndex)}
                        className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="ml-4 font-semibold">₹{item.total || item.totalPrice || (item.quantity * (item.price || item.unitPrice || 0))}</div>
                  </div>
                ))}
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    <X size={16} className="inline mr-1" /> Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onSaveOrder}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Save size={16} className="inline mr-1" /> Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {order.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex justify-between items-center text-sm">
                    <span>{item.name || item.itemName || 'Unknown Item'} x {item.quantity}</span>
                    <div className="flex items-center space-x-2">
                      <span className={(item.nonChargeable || item.isFree || item.nc) ? 'line-through text-gray-500' : ''}>
                        ₹{item.total || item.totalPrice || (item.price * item.quantity) || 0}
                      </span>
                      {(item.nonChargeable || item.isFree || item.nc) && <span className="text-xs bg-red-100 text-red-800 px-1 py-0.5 rounded">NC</span>}
                      <label className="flex items-center space-x-1 text-xs">
                        <input
                          type="checkbox"
                          checked={item.nonChargeable || item.isFree || item.nc || false}
                          onChange={() => onToggleNC(order._id, 'restaurant', itemIndex)}
                          className="w-3 h-3"
                        />
                        <span>NC</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RestaurantOrders;