import React from 'react';
import { 
    BarChart3, Users, BedDouble, Calendar, Settings, 
    HelpCircle, Utensils, Car, Package, Warehouse,
    CreditCard, FileText, UserCheck, Bell, ClipboardList
} from 'lucide-react';

const DashboardLoader = ({ pageName = "Dashboard" }) => {
    const getIcon = () => {
        const name = pageName.toLowerCase();
        
        if (name.includes('dashboard')) return BarChart3;
        if (name.includes('staff') || name.includes('user')) return Users;
        if (name.includes('room')) return BedDouble;
        if (name.includes('calendar') || name.includes('event')) return Calendar;
        if (name.includes('setting')) return Settings;
        if (name.includes('help') || name.includes('support')) return HelpCircle;
        if (name.includes('restaurant') || name.includes('menu') || name.includes('food')) return Utensils;
        if (name.includes('cab') || name.includes('vehicle') || name.includes('driver')) return Car;
        if (name.includes('pantry') || name.includes('item') || name.includes('vendor')) return Package;
        if (name.includes('inventory') || name.includes('wastage')) return Warehouse;
        if (name.includes('cash') || name.includes('payment') || name.includes('billing')) return CreditCard;
        if (name.includes('booking') || name.includes('reservation') || name.includes('invoice')) return FileText;
        if (name.includes('task') || name.includes('assign')) return UserCheck;
        if (name.includes('my task')) return Bell;
        if (name.includes('laundry') || name.includes('order')) return ClipboardList;
        
        return BarChart3;
    };
    
    const IconComponent = getIcon();
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-yellow-50">
            <div className="text-center">
                <div className="relative">
                    <div className="animate-spin rounded-full h-20 w-20 border-4 border-amber-200 border-t-amber-500 mx-auto mb-6"></div>
                    <IconComponent className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-amber-600" />
                </div>
                <p className="text-xl font-bold text-gray-800 mb-2">Loading {pageName}</p>
                <p className="text-sm text-gray-600">Please wait while we fetch your data...</p>
            </div>
        </div>
    );
};

export default DashboardLoader;
