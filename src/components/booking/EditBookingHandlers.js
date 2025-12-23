export const createOrderHandlers = (axios, fetchRoomServiceOrders, showToast, setEditingOrder, setEditItems) => {
  const handleEditOrder = (order, type) => {
    setEditingOrder({ ...order, type });
    setEditItems([...order.items]);
  };

  const handleSaveOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      const subtotal = editItems.reduce((sum, item) => {
        const unitPrice = item.unitPrice || item.price || 0;
        return sum + (item.quantity * unitPrice);
      }, 0);
      const totalAmount = subtotal;
      
      if (editingOrder.type === 'service') {
        await axios.put(`/api/room-service/orders/${editingOrder._id}`, {
          items: editItems,
          subtotal,
          totalAmount
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else {
        await axios.patch(`/api/restaurant-orders/${editingOrder._id}`, {
          items: editItems,
          amount: totalAmount
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }

      await fetchRoomServiceOrders();
      setEditingOrder(null);
      setEditItems([]);
      showToast.success('Order updated successfully');
    } catch (err) {
      console.error('Failed to update order:', err);
      showToast.error('Failed to update order');
    }
  };

  const handleCancelEdit = () => {
    setEditingOrder(null);
    setEditItems([]);
  };

  const updateItemQuantity = (index, quantity) => {
    const newItems = [...editItems];
    newItems[index].quantity = Math.max(0, quantity);
    const unitPrice = newItems[index].unitPrice || newItems[index].price || 0;
    const calculatedTotal = newItems[index].quantity * unitPrice;
    newItems[index].totalPrice = calculatedTotal;
    newItems[index].total = calculatedTotal;
    setEditItems(newItems);
  };

  const handleRemoveOrder = async (orderId, type) => {
    if (!confirm('Are you sure you want to remove this order?')) return;
    
    try {
      const token = localStorage.getItem('token');
      
      if (type === 'service') {
        await axios.delete(`/api/room-service/orders/${orderId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else {
        await axios.patch(`/api/restaurant-orders/${orderId}/status`, {
          status: 'cancelled'
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      
      await fetchRoomServiceOrders();
      showToast.success('Order removed successfully');
    } catch (err) {
      console.error('Failed to remove order:', err);
      showToast.error('Failed to remove order');
    }
  };

  const handleRemoveItem = (itemIndex) => {
    const newItems = editItems.filter((_, index) => index !== itemIndex);
    setEditItems(newItems);
  };

  return {
    handleEditOrder,
    handleSaveOrder,
    handleCancelEdit,
    updateItemQuantity,
    handleRemoveOrder,
    handleRemoveItem
  };
};
