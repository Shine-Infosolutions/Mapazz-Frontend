// Dummy useWebSocket hook - WebSocket functionality disabled
const useWebSocket = () => {
  return {
    lastMessage: null,
    readyState: 0, // CLOSED
    sendMessage: () => {},
    disconnect: () => {}
  };
};

export default useWebSocket;