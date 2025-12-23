import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  BarChart2,
  FileText,
  HelpCircle,
  Settings,
  UserCheck,
  ChartBarStacked,
  BedDouble,
  LogOut,
  UserRound,
  ChevronDown,
  ChevronUp,
  ListChecks,
  Package,
  Bell,
  Warehouse,
  Book,
  UtensilsCrossed,
  ChefHat,
  ClipboardList,
  IndianRupee,
  Shirt,
  Building2,
  AlertTriangle,
  Tag,
  Sparkles,
} from "lucide-react";
import logoImage from "../assets/hawana golden png.png";

const Sidebar = () => {
  const [openDropdowns, setOpenDropdowns] = useState(new Set());
  const [showSettingsSlider, setShowSettingsSlider] = useState(false);
  const [isAnimated, setIsAnimated] = useState(false);


  const { isSidebarOpen, closeSidebar } = useAppContext();
  const { user, hasRole, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [taskCount, setTaskCount] = useState(0);

  useEffect(() => {
    setTaskCount(0);
    // Trigger animation after component mounts
    const timer = setTimeout(() => setIsAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);



  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleDropdown = (label) => {
    setOpenDropdowns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  // Touch handler for mobile - tap anywhere to close sidebar when open
  const handleMobileTouch = (e) => {
    // Only on mobile devices and only when sidebar is open
    if (window.innerWidth >= 768 || !isSidebarOpen) return;
    
    // Don't trigger if touching sidebar itself or its children
    const sidebar = document.querySelector('aside');
    if (sidebar && sidebar.contains(e.target)) return;
    
    // Close sidebar
    closeSidebar();
  };

  // Add touch listener to document for mobile
  useEffect(() => {
    document.addEventListener('touchstart', handleMobileTouch);
    return () => {
      document.removeEventListener('touchstart', handleMobileTouch);
    };
  }, [isSidebarOpen]);




  const getNavItems = () => {
    // For ACCOUNTS role - only Dashboard and Night Audit Report
    if (hasRole('ACCOUNTS') && !hasRole(['ADMIN', 'GM', 'FRONT DESK'])) {
      return [
        { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
        { icon: FileText, label: "Night Audit Report", path: "/night-audit-report" },
      ];
    }

    const items = [
      // Dashboard - All roles
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    ];

    // Easy Dashboard - Admin, GM, Front Desk
    if (hasRole(['ADMIN', 'GM', 'FRONT DESK'])) {
      items.push({ icon: ChartBarStacked, label: "EZ Dashboard", path: "/easy-dashboard" });
    }

    // Booking - Admin, GM, Front Desk
    if (hasRole(['ADMIN', 'GM', 'FRONT DESK'])) {
      items.push({ icon: Book, label: "Booking", path: "/booking" });
    }

    // Room Management - Admin, GM, Front Desk
    if (hasRole(['ADMIN', 'GM', 'FRONT DESK'])) {
      items.push({
        icon: BedDouble,
        label: "Room Management",
        path: "/rooms",
        isDropdown: true,
        children: [
          { label: "Room List", path: "/rooms", icon: BedDouble },
          { label: "Room Categories", path: "/room-categories", icon: Settings },
          { label: "Room Status", path: "/room-status", icon: BarChart2 },
        ],
      });
    }

    // Hotel Inventory - Admin, GM, Front Desk
    if (hasRole(['ADMIN', 'GM', 'FRONT DESK'])) {
      items.push({ icon: Warehouse, label: "Hotel Inventory", path: "/inventory" });
    }

    // Laundry - Admin, GM, Front Desk
    if (hasRole(['ADMIN', 'GM', 'FRONT DESK'])) {
      items.push({
        icon: Shirt,
        label: "Laundry",
        path: "/laundry",
        isDropdown: true,
        children: [
          { label: "Orders", path: "/laundry/orders", icon: ClipboardList },
          { label: "Categories", path: "/laundry/categories", icon: Tag },
          { label: "Laundry Items", path: "/laundry/items", icon: Shirt },
          { label: "Loss Reports", path: "/laundry/loss-reports", icon: AlertTriangle },
          { label: "Vendors", path: "/vendors", icon: Building2 },
        ],
      });
    }



    // Cash Management - Admin, Front Desk, Accounts
    if (hasRole(['ADMIN', 'FRONT DESK', 'ACCOUNTS'])) {
      items.push({ icon: IndianRupee, label: "Cash Management", path: "/cash-management" });
    }

    // In-Room Dine In - Admin, GM, Staff, Front Desk
    if (hasRole(['ADMIN', 'GM', 'STAFF', 'FRONT DESK'])) {
      items.push({
        icon: UtensilsCrossed,
        label: "In-Room Dine In",
        path: "/restaurant",
        isDropdown: true,
        children: [
          { label: "Menu Items", path: "/restaurant/menu-items", icon: FileText },
          { label: "Create Order", path: "/restaurant/create-order", icon: ShoppingCart },
          { label: "Live Orders", path: "/restaurant/live-orders", icon: ChefHat },
          { label: "All Orders", path: "/restaurant/all-orders", icon: ClipboardList },
          { label: "KOT", path: "/restaurant/kot", icon: ListChecks },
        ],
      });
    }

    // Room Service - Admin, GM, Staff, Front Desk
    if (hasRole(['ADMIN', 'GM', 'STAFF', 'FRONT DESK'])) {
      items.push({
        icon: Bell,
        label: "Room Service",
        path: "/room-service",
        isDropdown: true,
        children: [
          { label: "Create Order", path: "/room-service/create", icon: ShoppingCart },
          { label: "Today's Orders", path: "/room-service/today", icon: ClipboardList },
          { label: "All Orders", path: "/room-service/history", icon: FileText },
        ],
      });
    }



    // Reports - Admin, GM, Front Desk, Accounts
    if (hasRole(['ADMIN', 'GM', 'FRONT DESK', 'ACCOUNTS'])) {
      items.push({ icon: FileText, label: "Night Audit Report", path: "/night-audit-report" });
    }

    // Users - Admin only
    if (hasRole('ADMIN')) {
      items.push({ icon: Users, label: "All Users", path: "/users" });
    }

    return items;
  };

  const navItems = getNavItems();

  const settingsItems = [
    { label: "General Settings", path: "/settings/general" },
    { label: "Business / Hotel Settings", path: "/settings/business" },
    { label: "User & Role Settings", path: "/settings/users" },
    { label: "Notifications & Alerts", path: "/settings/notifications" },
    { label: "Operational Settings", path: "/settings/operational" },
    { label: "Security Settings", path: "/settings/security" },
    { label: "Data & Backup", path: "/settings/data" },
    { label: "Integrations", path: "/settings/integrations" },
  ];

  const bottomNavItems = [
    { icon: HelpCircle, label: "Help & Support", path: "/help" },
    { icon: Settings, label: "Settings", isSlider: true },
  ];

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 bg-[#1f2937] text-[#c2ab65] w-full sm:w-64 max-w-xs transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-all duration-500 ease-out md:relative md:translate-x-0 z-30 flex flex-col h-screen overflow-y-auto`}
      >
      <div className={`flex items-center justify-between md:justify-center p-2 transform transition-all duration-700 delay-100 ${
        isAnimated ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      }`}>
        <img src={logoImage} alt="Havana Hotel" className="h-8 sm:h-10 md:h-12" />
        <button
          onClick={closeSidebar}
          className="md:hidden p-2 text-[#c2ab65] hover:text-white"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div className={`text-center mt-2 font-bold text-base sm:text-lg transform transition-all duration-700 delay-200 ${
        isAnimated ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      }`}>{user?.role}</div>

      <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2">
        {navItems.map((item, index) => (
          <div key={index} className={`transform transition-all duration-500 ease-out ${
            isAnimated ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'
          }`} style={{ transitionDelay: `${300 + index * 100}ms` }}>
            {item.isDropdown ? (
              <>
                <button
                  onClick={() => toggleDropdown(item.label)}
                  className={`flex items-center justify-between w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-colors duration-200 focus:outline-none text-sm sm:text-base
                    ${
                      item.children.some(
                        (child) => location.pathname === child.path
                      )
                        ? "bg-[#c2ab65] text-[#1f2937] font-semibold"
                        : ""
                    }`}
                >
                  <div className="flex items-center">
                    <item.icon className="w-4 sm:w-5 h-4 sm:h-5 mr-2 sm:mr-3" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {openDropdowns.has(item.label) ? (
                    <ChevronUp className="w-3 sm:w-4 h-3 sm:h-4" />
                  ) : (
                    <ChevronDown className="w-3 sm:w-4 h-3 sm:h-4" />
                  )}
                </button>
                {openDropdowns.has(item.label) && (
                  <div className="ml-6 sm:ml-8 mt-1 space-y-1">
                    {item.children.map((subItem, subIndex) => (
                      <Link
                        key={subIndex}
                        to={subItem.path}
                        onClick={() =>
                          window.innerWidth < 768 && closeSidebar()
                        }
                        className={`flex items-center px-3 sm:px-4 py-2 rounded-lg transition-colors duration-200 text-xs sm:text-sm
                          ${
                            location.pathname === subItem.path
                              ? "bg-[#c2ab65] text-[#1f2937] font-semibold"
                              : ""
                          }`}
                      >
                        {subItem.icon && (
                          <subItem.icon className="w-3 sm:w-4 h-3 sm:h-4 mr-2" />
                        )}
                        <span className="truncate">{subItem.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link
                to={item.path}
                onClick={() => window.innerWidth < 768 && closeSidebar()}
                className={`flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-colors duration-200 text-sm sm:text-base ${
                  location.pathname === item.path
                    ? "bg-[#c2ab65] text-[#1f2937] font-semibold"
                    : ""
                }`}
              >
                <div className="flex items-center min-w-0">
                  <item.icon className="w-4 sm:w-5 h-4 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span className={`text-xs rounded-full px-2 py-1 min-w-[20px] text-center flex-shrink-0 ${
                    item.count > 0 ? 'bg-red-500 text-white' : 'bg-gray-400 text-white'
                  }`}>
                    {item.count}
                  </span>
                )}
              </Link>
            )}
          </div>
        ))}
      </nav>

      <div className={`p-3 sm:p-4 border-t border-secondary transform transition-all duration-700 delay-700 ${
        isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}>
        {bottomNavItems.map((item, index) => (
          <div key={index} className={`transform transition-all duration-500 ease-out ${
            isAnimated ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'
          }`} style={{ transitionDelay: `${800 + index * 100}ms` }}>
            {item.isSlider ? (
              <button
                onClick={() => setShowSettingsSlider(true)}
                className="flex items-center px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg w-full text-left text-sm sm:text-base"
              >
                <item.icon className="w-4 sm:w-5 h-4 sm:h-5 mr-2 sm:mr-3" />
                <span className="truncate">{item.label}</span>
              </button>
            ) : (
              <Link
                to={item.path}
                onClick={() => window.innerWidth < 768 && closeSidebar()}
                className="flex items-center px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base"
              >
                <item.icon className="w-4 sm:w-5 h-4 sm:h-5 mr-2 sm:mr-3" />
                <span className="truncate">{item.label}</span>
              </Link>
            )}
          </div>
        ))}
        <div className={`transform transition-all duration-500 ease-out ${
          isAnimated ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'
        }`} style={{ transitionDelay: '1000ms' }}>
          <button
            onClick={handleLogout}
            className="flex items-center px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg w-full text-left text-sm sm:text-base hover:bg-red-600 hover:text-white transition-colors duration-200"
          >
            <LogOut className="w-4 sm:w-5 h-4 sm:h-5 mr-2 sm:mr-3" />
            <span className="truncate">Logout</span>
          </button>
        </div>
      </div>

      </aside>

      {/* Settings Card - Mobile Responsive */}
      {showSettingsSlider && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowSettingsSlider(false)} />
          <div className="fixed left-0 md:left-64 bottom-0 md:bottom-16 z-50 w-full md:w-auto">
            <div className="w-full md:w-60 rounded-t-lg md:rounded-lg shadow-lg border max-h-96 overflow-y-auto" style={{background: 'linear-gradient(to bottom, hsl(45, 100%, 95%), hsl(45, 100%, 90%))', borderColor: 'hsl(45, 43%, 58%)'}}>
              <div className="p-3 border-b flex justify-between items-center" style={{background: 'linear-gradient(to bottom, hsl(45, 43%, 58%), hsl(45, 32%, 46%))', borderColor: 'hsl(45, 43%, 58%)'}}>
                <h3 className="text-sm font-semibold text-white">
                  Settings
                </h3>
                <button 
                  onClick={() => setShowSettingsSlider(false)}
                  className="md:hidden p-1 rounded-full hover:bg-white hover:bg-opacity-20 text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-2 space-y-1 pb-4 md:pb-2">
                {settingsItems.map((setting, index) => (
                  <Link
                    key={index}
                    to={setting.path}
                    onClick={() => {
                      setShowSettingsSlider(false);
                      window.innerWidth < 768 && closeSidebar();
                    }}
                    className="block p-3 md:p-2 rounded transition-colors text-sm md:text-xs border border-transparent hover:border-[hsl(45,43%,58%)] hover:bg-[hsl(45,100%,98%)]"
                  >
                    <span style={{color: 'hsl(45, 100%, 20%)'}}>
                      {setting.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Sidebar;
