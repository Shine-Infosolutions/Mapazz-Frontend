import Pagination from '../common/Pagination';
import SoundToggle from '../common/SoundToggle';
import { Printer } from 'lucide-react';
import { useKOTManagement } from '../../hooks/useKOTManagement';
import { useAppContext } from '../../context/AppContext';
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

const KOT = () => {
  const { axios } = useAppContext();
  
  const {
    activeTab,
    kots,
    kotHistory,
    orders,
    chefs,
    tables,
    kotForm,
    searchQuery,
    filteredKots,
    currentPage,
    itemsPerPage,
    newOrderNotification,
    menuItems,
    userRole,
    userRestaurantRole,
    isInitialLoading,
    setActiveTab,
    setKotForm,
    setSearchQuery,
    setFilteredKots,
    setCurrentPage,
    setNewOrderNotification,
    fetchKOTs,
    fetchOrders,
    createKOT,
    updateKOTStatus,
    printKOT,
    getStatusColor,
    getPriorityColor,
    handleSearch
  } = useKOTManagement();

  if (isInitialLoading) {
    return <DashboardLoader pageName="Kitchen Order Tickets" />;
  }





  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 animate-slideInLeft animate-delay-100">
          <h1 className="text-3xl font-bold text-text">Kitchen Order Tickets (KOT)</h1>
          <SoundToggle />
        </div>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden animate-fadeInUp animate-delay-200">
          <div className="border-b border-border">
            <nav className="flex">
              <button
                onClick={() => {
                  setActiveTab('kots');
                  setFilteredKots(kots);
                }}
                className={`px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'kots'
                    ? 'bg-primary text-text border-b-2 border-primary'
                    : 'text-gray-500 hover:text-text hover:bg-accent'
                }`}
              >
                Active KOTs
              </button>
              <button
                onClick={() => {
                  setActiveTab('history');
                  setFilteredKots(kotHistory);
                }}
                className={`px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'bg-primary text-text border-b-2 border-primary'
                    : 'text-gray-500 hover:text-text hover:bg-accent'
                }`}
              >
                KOT History
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'create'
                    ? 'bg-primary text-text border-b-2 border-primary'
                    : 'text-gray-500 hover:text-text hover:bg-accent'
                }`}
              >
                Create KOT
              </button>
            </nav>
          </div>
          
          <div className="p-0">
            {(activeTab === 'kots' || activeTab === 'history') && (
              <div className="p-6">
                <form onSubmit={handleSearch} className="mb-4">
                  <div className="flex flex-col sm:flex-row gap-2 max-w-md">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by Order ID, KOT ID, or Table..."
                      className="flex-1 p-2 border border-border rounded bg-white text-text focus:border-primary focus:outline-none text-sm"
                      style={{ borderColor: 'hsl(45, 100%, 85%)', backgroundColor: 'white', color: 'hsl(45, 100%, 20%)' }}
                    />
                    <button
                      type="submit"
                      className="bg-primary text-text px-4 py-2 rounded hover:bg-hover transition-colors whitespace-nowrap text-sm"
                      style={{ backgroundColor: 'hsl(45, 43%, 58%)', color: 'hsl(45, 100%, 20%)' }}
                    >
                      Search
                    </button>
                  </div>
                </form>
                <div className="overflow-x-auto animate-fadeInUp animate-delay-300">
                  <table className="w-full min-w-[800px]">
                    <thead style={{ backgroundColor: 'hsl(45, 71%, 69%)' }}>
                      <tr>
                        <th className="px-2 sm:px-4 py-3 text-left font-semibold text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>Order ID</th>
                        <th className="px-2 sm:px-4 py-3 text-left font-semibold text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>KOTs</th>
                        <th className="px-2 sm:px-4 py-3 text-left font-semibold text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>Table/Room</th>
                        <th className="px-2 sm:px-4 py-3 text-left font-semibold text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>Items</th>
                        <th className="px-2 sm:px-4 py-3 text-left font-semibold text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>Priority</th>
                        <th className="px-2 sm:px-4 py-3 text-left font-semibold text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>Status</th>
                        <th className="px-2 sm:px-4 py-3 text-left font-semibold text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>Chef</th>
                        <th className="px-2 sm:px-4 py-3 text-left font-semibold text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredKots.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((kot, index) => (
                        <tr key={kot._id} className={`${index % 2 === 0 ? 'bg-background' : 'bg-white'} animate-fadeInUp`} style={{animationDelay: `${Math.min(index * 50 + 400, 800)}ms`}}>
                          <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm font-mono" style={{ color: 'hsl(45, 100%, 20%)' }}>
                            <div className="font-semibold">{kot.displayNumber || kot.kotNumber?.slice(-3) || kot.orderId?.slice(-6) || 'N/A'}</div>
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              {kot.kotCount || 1} KOT{(kot.kotCount || 1) > 1 ? 's' : ''}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>{kot.tableNo}</td>
                          <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>
                            <div className="max-w-xs">
                              {kot.items && kot.items.length > 0 ? (
                                <div className="space-y-1">
                                  <div className="text-xs text-blue-600 font-medium mb-1">
                                    {kot.kotCount || 1} KOT{(kot.kotCount || 1) > 1 ? 's' : ''} • {kot.items.length} items
                                  </div>
                                  {kot.items.slice(0, 3).map((item, idx) => {
                                    const itemName = typeof item === 'string' ? item : (item.name || item.itemName || 'Unknown Item');
                                    const quantity = typeof item === 'object' ? (item.quantity || 1) : 1;
                                    const kotNumber = typeof item === 'object' ? (item.kotNumber || 1) : 1;
                                    const note = typeof item === 'object' ? item.note : null;
                                    
                                    return (
                                      <div key={idx} className="truncate flex items-center gap-1">
                                        <span className="bg-blue-500 text-white px-1 rounded text-xs">K{kotNumber}</span>
                                        <span>• {itemName} x{quantity}</span>
                                        {note && <span className="text-gray-500 text-xs"> ({note})</span>}
                                      </div>
                                    );
                                  })}
                                  {kot.items.length > 3 && (
                                    <div className="text-gray-500 text-xs">+{kot.items.length - 3} more items</div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-500">No items</span>
                              )}
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(kot.priority)}`}>
                              {kot.priority}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs ${getStatusColor(kot.status)}`}>
                              {kot.status}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm" style={{ color: 'hsl(45, 100%, 20%)' }}>{kot.assignedChef?.name || 'Unassigned'}</td>
                          <td className="px-2 sm:px-4 py-3">
                            <div className="flex flex-col sm:flex-row gap-1">
                              {kot.status === 'preparing' && (
                                <button
                                  onClick={() => updateKOTStatus(kot._id, 'ready', kot.orderId)}
                                  className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 whitespace-nowrap"
                                >
                                  Mark Ready
                                </button>
                              )}
                              <button
                                onClick={() => printKOT(kot)}
                                className="bg-purple-500 text-white px-2 py-1 rounded text-xs hover:bg-purple-600 whitespace-nowrap flex items-center gap-1"
                                title="Print KOT"
                              >
                                <Printer className="w-3 h-3" />
                                Print
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(filteredKots.length / itemsPerPage)}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredKots.length}
                />
                
                {filteredKots.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {searchQuery ? 'No KOTs found matching your search.' : 'No KOTs found.'}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'create' && (
              <div className="p-6 animate-fadeInUp animate-delay-300">
                <div className="max-w-2xl mx-auto">
                  <h2 className="text-xl font-bold mb-4" style={{ color: 'hsl(45, 100%, 20%)' }}>Create New KOT</h2>
                  <form onSubmit={createKOT} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-text">Select Order</label>
                <select
                  value={kotForm.orderId}
                  onChange={(e) => {
                    const selectedOrder = orders.find(o => o._id === e.target.value);
                    setKotForm({
                      ...kotForm,
                      orderId: e.target.value,
                      tableNo: selectedOrder?.tableNo || '',
                      items: selectedOrder?.items || []
                    });
                  }}
                  className="w-full p-3 border-2 border-border rounded-lg bg-white text-text focus:border-primary focus:outline-none transition-colors"
                  style={{ borderColor: 'hsl(45, 100%, 85%)', backgroundColor: 'white', color: 'hsl(45, 100%, 20%)' }}
                  required
                >
                  <option value="">Select Order</option>
                  {orders.map(order => (
                    <option key={order._id} value={order._id}>
                      Order {order._id.slice(-6)} - Table {order.tableNo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text">Table Number</label>
                <select
                  value={kotForm.tableNo}
                  onChange={(e) => setKotForm({...kotForm, tableNo: e.target.value})}
                  className="w-full p-3 border-2 border-border rounded-lg bg-white text-text focus:border-primary focus:outline-none transition-colors"
                  style={{ borderColor: 'hsl(45, 100%, 85%)', backgroundColor: 'white', color: 'hsl(45, 100%, 20%)' }}
                  required
                >
                  <option value="">Select Table</option>
                  {Array.isArray(tables) && tables.map(table => (
                    <option key={table._id} value={table.tableNumber}>
                      Table {table.tableNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text">Priority Level</label>
                <select
                  value={kotForm.priority}
                  onChange={(e) => setKotForm({...kotForm, priority: e.target.value})}
                  className="w-full p-3 border-2 border-border rounded-lg bg-white text-text focus:border-primary focus:outline-none transition-colors"
                  style={{ borderColor: 'hsl(45, 100%, 85%)', backgroundColor: 'white', color: 'hsl(45, 100%, 20%)' }}
                >
                  <option value="low">Low Priority</option>
                  <option value="normal">Normal Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text">Estimated Time (minutes)</label>
                <input
                  type="number"
                  placeholder="Enter estimated time"
                  value={kotForm.estimatedTime}
                  onChange={(e) => setKotForm({...kotForm, estimatedTime: e.target.value})}
                  className="w-full p-3 border-2 border-border rounded-lg bg-white text-text focus:border-primary focus:outline-none transition-colors"
                  style={{ borderColor: 'hsl(45, 100%, 85%)', backgroundColor: 'white', color: 'hsl(45, 100%, 20%)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text">Assign Chef</label>
                <select
                  value={kotForm.assignedChef}
                  onChange={(e) => setKotForm({...kotForm, assignedChef: e.target.value})}
                  className="w-full p-3 border-2 border-border rounded-lg bg-white text-text focus:border-primary focus:outline-none transition-colors"
                  style={{ borderColor: 'hsl(45, 100%, 85%)', backgroundColor: 'white', color: 'hsl(45, 100%, 20%)' }}
                >
                  <option value="">Select Chef</option>
                  {chefs.map(chef => (
                    <option key={chef._id} value={chef._id}>
                      {chef.name || chef.username}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full p-3 rounded-lg font-semibold transition-colors shadow-md"
                style={{ backgroundColor: 'hsl(45, 43%, 58%)', color: 'hsl(45, 100%, 20%)' }}
                onMouseOver={(e) => e.target.style.backgroundColor = 'hsl(45, 32%, 46%)'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'hsl(45, 43%, 58%)'}
              >
                Create KOT
              </button>
                  </form>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default KOT;