import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, TrendingUp, TrendingDown, Calendar, User, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

const StockMovementLog = ({ onClose }) => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/inventory/movements`);
      const data = await response.json();
      setMovements(data.movements || []);
    } catch (error) {
      toast.error('Failed to fetch stock movements');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMovementIcon = (type) => {
    return type === 'stock-in' ? (
      <TrendingUp className="text-green-600" size={16} />
    ) : (
      <TrendingDown className="text-orange-600" size={16} />
    );
  };

  const getMovementColor = (type) => {
    return type === 'stock-in' 
      ? 'bg-green-50 border-green-200 text-green-800'
      : 'bg-orange-50 border-orange-200 text-orange-800';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">Loading stock movements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <FileText className="text-blue-600" size={24} />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Stock Movement Log</h2>
              <p className="text-sm text-gray-600">Recent stock in/out transactions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={24} />
          </button>
        </div>

        {/* Movements List */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {movements.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No movements found</h3>
              <p className="text-gray-600">Stock movements will appear here once you start managing inventory.</p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {movements.map((movement) => (
                <div
                  key={movement._id}
                  className={`border rounded-lg p-4 ${getMovementColor(movement.type)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getMovementIcon(movement.type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">
                            {movement.itemId?.name || 'Unknown Item'}
                          </h4>
                          <span className="text-xs font-mono bg-white bg-opacity-50 px-2 py-1 rounded">
                            {movement.itemId?.itemCode || 'N/A'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Quantity:</span>
                              <span className="font-semibold">
                                {movement.type === 'stock-out' ? '-' : '+'}{movement.quantity}
                              </span>
                            </div>
                            
                            {movement.issuedTo && (
                              <div className="flex items-center gap-2">
                                <User size={14} />
                                <span className="font-medium">Issued To:</span>
                                <span>{movement.issuedTo}</span>
                              </div>
                            )}
                            
                            {movement.reason && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Reason:</span>
                                <span>{movement.reason}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} />
                              <span className="font-medium">Date:</span>
                              <span>{formatDate(movement.date)}</span>
                            </div>
                            
                            {movement.notes && (
                              <div>
                                <span className="font-medium">Notes:</span>
                                <p className="text-gray-700 mt-1">{movement.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        movement.type === 'stock-in' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {movement.type === 'stock-in' ? 'Stock In' : 'Stock Out'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing {movements.length} recent movements
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

StockMovementLog.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default StockMovementLog;