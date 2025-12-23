import React, { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const LossReportModal = ({ isOpen, onClose, selectedOrder, onSuccess }) => {
  const [lossFormData, setLossFormData] = useState({
    selectedItems: [],
    lossNote: ''
  });

  const handleLossItemToggle = (item) => {
    const isSelected = lossFormData.selectedItems.some(selected => selected.itemId === item._id);
    
    if (isSelected) {
      setLossFormData({
        ...lossFormData,
        selectedItems: lossFormData.selectedItems.filter(selected => selected.itemId !== item._id)
      });
    } else {
      setLossFormData({
        ...lossFormData,
        selectedItems: [...lossFormData.selectedItems, {
          itemId: item._id,
          itemName: item.itemName,
          quantity: item.quantity,
          calculatedAmount: item.calculatedAmount || item.price * item.quantity
        }]
      });
    }
  };

  const handleSubmitLossReport = async () => {
    if (lossFormData.selectedItems.length === 0) {
      toast.error('Please select at least one item to report as lost');
      return;
    }
    
    if (!lossFormData.lossNote.trim()) {
      toast.error('Please provide a reason for the loss');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/laundry/loss-report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: selectedOrder._id,
          roomNumber: selectedOrder.roomNumber,
          guestName: selectedOrder.requestedByName,
          lostItems: lossFormData.selectedItems,
          lossNote: lossFormData.lossNote,
          reportedBy: localStorage.getItem('userName') || 'Staff'
        })
      });

      if (response.ok) {
        // Also report individual items as lost
        for (const lostItem of lossFormData.selectedItems) {
          try {
            await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/laundry/item/${lostItem.itemId}/damage`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                description: lossFormData.lossNote,
                reportType: 'loss'
              })
            });
          } catch (error) {
            console.error('Failed to report individual item loss:', error);
          }
        }
        
        toast.success('Loss report submitted successfully');
        setLossFormData({ selectedItems: [], lossNote: '' });
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to submit loss report');
      }
    } catch (error) {
      toast.error('Failed to submit loss report');
    }
  };

  const handleClose = () => {
    setLossFormData({ selectedItems: [], lossNote: '' });
    onClose();
  };

  if (!isOpen || !selectedOrder) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50" style={{animation: 'fadeIn 0.15s ease-out'}}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" style={{animation: 'slideIn 0.15s ease-out'}}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold" style={{color: '#8B4513'}}>Report Item Loss</h2>
          <button 
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1 rounded transition-colors duration-200"
            title="Close Modal"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Items</label>
            <div className="border rounded p-3 max-h-40 overflow-y-auto">
              {selectedOrder.items?.map((item, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id={`item-${index}`}
                    checked={lossFormData.selectedItems.some(selected => selected.itemId === item._id)}
                    onChange={() => handleLossItemToggle(item)}
                    className="rounded"
                  />
                  <label htmlFor={`item-${index}`} className="text-sm flex-1">
                    {item.quantity}x {item.itemName} - ₹{item.calculatedAmount || item.price * item.quantity}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Loss Note</label>
            <textarea
              value={lossFormData.lossNote}
              onChange={(e) => setLossFormData({...lossFormData, lossNote: e.target.value})}
              placeholder="Describe the reason for loss..."
              className="w-full p-3 border rounded resize-none"
              rows={3}
            />
          </div>
          
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSubmitLossReport}
              className="flex-1 py-2 text-white rounded transition-colors duration-200"
              style={{backgroundColor: '#DAA520'}}
            >
              Report Loss
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LossReportModal;