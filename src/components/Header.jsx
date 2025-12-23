import React from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { Menu, LogOut, User } from "lucide-react";

const Header = () => {
  const { toggleSidebar } = useAppContext();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="md:hidden bg-white shadow-sm p-3 sm:p-4 flex items-center justify-between sticky top-0 z-20">
      {/* Hamburger Menu for mobile */}
      <button onClick={toggleSidebar} className="text-primary p-1">
        <Menu size={24} />
      </button>

      {/* User info */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center text-gray-700">
          <User className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">{user?.username}</span>
          <span className="ml-2 px-2 py-1 bg-[#D4AF37] text-white text-xs rounded">
            {user?.role}
          </span>
        </div>
      </div>

      {/* Logout button */}
      <button
        onClick={handleLogout}
        className="flex items-center px-3 sm:px-4 py-2 rounded-lg bg-[#1f2937] text-[#c2ab65] hover:bg-[#374151] transition-colors duration-200 text-sm sm:text-base"
      >
        <LogOut className="w-4 sm:w-5 h-4 sm:h-5 mr-1 sm:mr-2" />
        <span className="hidden xs:inline">Logout</span>
      </button>
    </header>
  );
};

export default Header;
