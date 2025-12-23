import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';

import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import LoadingScreen from './components/LoadingScreen';
import Dashboard from './components/Dashboard';
import EasyDashboard from './components/easy dashboard/easydashboard';
import RoomList from './components/room/RoomList';
import CategoryList from './components/category/CategoryList';
import RoomStatus from './components/room/RoomStatus';
import Booking from './components/booking/Booking';
import BookingForm from './components/booking/BookingForm';
import EditBookingForm from './components/booking/EditBookingForm';
import BookingDetails from './components/booking/BookingDetails';
import Users from './components/Users/Users';
import LaganCalendar from './components/Banquet/pages/Calendar/LaganCalendar';
import ListBooking from './components/Banquet/pages/Students/ListBooking';
import AddBooking from './components/Banquet/pages/Students/AddBooking';
import UpdateBooking from './components/Banquet/pages/Students/UpdateBooking';
import MenuPlanManager from './components/Banquet/components/MenuPlanManager';
import Invoice from './components/Banquet/pages/Students/Invoice';
import MenuView from './components/Banquet/pages/Students/MenuView';
import HotelCheckout from './components/booking/HotelCheckout';
import HotelInvoice from './components/booking/HotelInvoice';
import HotelInventory from './components/Inventory/HotelInventory';
import RoomService from './components/room/RoomService';
import RoomServiceBilling from './components/room/RoomServiceBilling';
import BillLookup from './components/room/BillLookup';
import SaleBill from './components/room/SaleBill';
import RoomServiceToday from './components/room/RoomServiceToday';
import RoomServiceHistory from './components/room/RoomServiceHistory';
import CreateRoomService from './components/room/CreateRoomService';
import EditRoomService from './components/room/EditRoomService';
import RoomServiceDetails from './components/room/RoomServiceDetails';

// Restaurant Components
import MenuItems from './components/restaurant/MenuItems';
import Order from './components/restaurant/Order';
import LiveOrders from './components/restaurant/LiveOrders';
import AllOrders from './components/restaurant/AllOrders';
import EditOrder from './components/restaurant/EditOrder';
import KOT from './components/restaurant/KOT';
import GSTSettings from './components/restaurant/GSTSettings';
import RestaurantInvoice from './components/restaurant/RestaurantInvoice';
import SharedHotelInvoice from './components/booking/SharedHotelInvoice';
import { RoomServiceInvoice, LaundryInvoice } from './components/invoices';
import NightAuditReport from './components/reports/NightAuditReport';
import CashManagement from './components/CashManagement/CashManagement';
import LaundryOrders from './components/Laundry/LaundryOrders';
import CreateLaundryOrder from './components/Laundry/CreateLaundryOrder';
import LaundryOrderView from './components/Laundry/LaundryOrderView';
import LaundryOrderEdit from './components/Laundry/LaundryOrderEdit';
import LaundryItems from './components/Laundry/LaundryItems';
import LaundryCategories from './components/Laundry/LaundryCategories';
import LossReports from './components/Laundry/LossReports';
import VendorManagement from './components/Vendor/VendorManagement';
import Housekeeping from './components/Housekeeping/Housekeeping';

import './App.css'

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500); // 2.5 seconds loading time

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <AuthProvider>
      <AppProvider>
          <Router>
          <Toaster position="top-right" />
          <Routes>
            {/* Public Routes */}
            <Route path="/shared-invoice/:id" element={<SharedHotelInvoice />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="easy-dashboard" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK']}>
                <EasyDashboard />
              </PrivateRoute>
            } />
            
            {/* Room Management Routes */}
            <Route path="rooms" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK']}>
                <RoomList />
              </PrivateRoute>
            } />
            <Route path="room-categories" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK']}>
                <CategoryList />
              </PrivateRoute>
            } />
            <Route path="room-status" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK']}>
                <RoomStatus />
              </PrivateRoute>
            } />
            
            {/* Booking Routes */}
            <Route path="booking" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK']}>
                <Booking />
              </PrivateRoute>
            } />
            <Route path="bookingform" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK']}>
                <BookingForm />
              </PrivateRoute>
            } />
            <Route path="edit-booking/:bookingId" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK']}>
                <EditBookingForm />
              </PrivateRoute>
            } />
            <Route path="booking-details/:bookingId" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK']}>
                <BookingDetails />
              </PrivateRoute>
            } />
            <Route path="reservation" element={<div>Reservation Component</div>} />
            
            {/* Inventory Routes */}
            <Route path="inventory" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK']}>
                <HotelInventory />
              </PrivateRoute>
            } />
            
            {/* Laundry Routes */}
            <Route path="laundry/orders" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK']}>
                <LaundryOrders />
              </PrivateRoute>
            } />
            <Route path="laundry/orders/create" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK']}>
                <CreateLaundryOrder />
              </PrivateRoute>
            } />
            <Route path="laundry/orders/view/:id" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK']}>
                <LaundryOrderView />
              </PrivateRoute>
            } />
            <Route path="laundry/orders/edit/:id" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK']}>
                <LaundryOrderEdit />
              </PrivateRoute>
            } />
            <Route path="laundry/categories" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK']}>
                <LaundryCategories />
              </PrivateRoute>
            } />
            <Route path="laundry/items" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK']}>
                <LaundryItems />
              </PrivateRoute>
            } />
            <Route path="laundry/loss-reports" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK']}>
                <LossReports />
              </PrivateRoute>
            } />
            
            {/* Vendor Routes */}
            <Route path="vendors" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK']}>
                <VendorManagement />
              </PrivateRoute>
            } />
            
            {/* Housekeeping Routes */}
            <Route path="housekeeping" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'HOUSEKEEPING', 'FRONT DESK']}>
                <Housekeeping />
              </PrivateRoute>
            } />
            
            {/* Cash Management Routes */}
            <Route path="cash-management" element={
              <PrivateRoute requiredRoles={['ADMIN', 'FRONT DESK', 'ACCOUNTS']}>
                <CashManagement />
              </PrivateRoute>
            } />
            
            {/* Banquet Routes */}
            <Route path="banquet/calendar" element={<LaganCalendar />} />
            <Route path="banquet/add-booking" element={<AddBooking />} />
            <Route path="banquet/update-booking/:id" element={<UpdateBooking />} />
            <Route path="banquet/list-booking" element={<ListBooking />} />
            <Route path="banquet/menu-plan-manager" element={<MenuPlanManager />} />
            <Route path="banquet/invoice/:id" element={<Invoice />} />
            <Route path="banquet/menu-view/:id" element={<MenuView />} />
            
            {/* Users Routes - Admin Only */}
            <Route path="users" element={
              <PrivateRoute requiredRoles={['ADMIN']}>
                <Users />
              </PrivateRoute>
            } />
            
            {/* Room Service Routes */}
            <Route path="room-service" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK', 'STAFF']}>
                <RoomService />
              </PrivateRoute>
            } />
            <Route path="room-service/create" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK', 'STAFF']}>
                <CreateRoomService />
              </PrivateRoute>
            } />
            <Route path="room-service/edit/:orderId" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK', 'STAFF']}>
                <EditRoomService />
              </PrivateRoute>
            } />
            <Route path="room-service/details/:id" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK', 'STAFF']}>
                <RoomServiceDetails />
              </PrivateRoute>
            } />
            <Route path="room-service/today" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK', 'STAFF']}>
                <RoomServiceToday />
              </PrivateRoute>
            } />
            <Route path="room-service/history" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK', 'STAFF']}>
                <RoomServiceHistory />
              </PrivateRoute>
            } />
            <Route path="room-service-billing" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK']}>
                <RoomServiceBilling />
              </PrivateRoute>
            } />
            <Route path="bill-lookup" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK']}>
                <BillLookup />
              </PrivateRoute>
            } />
            <Route path="sale-bill" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK']}>
                <SaleBill />
              </PrivateRoute>
            } />
            
            {/* Restaurant Routes */}
            <Route path="restaurant/menu-items" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK', 'STAFF']}>
                <MenuItems />
              </PrivateRoute>
            } />
            <Route path="restaurant/create-order" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK', 'STAFF']}>
                <Order />
              </PrivateRoute>
            } />
            <Route path="restaurant/live-orders" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK', 'STAFF']}>
                <LiveOrders />
              </PrivateRoute>
            } />
            <Route path="restaurant/all-orders" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK', 'STAFF']}>
                <AllOrders />
              </PrivateRoute>
            } />
            <Route path="restaurant/edit-order/:orderId" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK', 'STAFF']}>
                <EditOrder />
              </PrivateRoute>
            } />
            <Route path="restaurant/kot" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK', 'STAFF']}>
                <KOT />
              </PrivateRoute>
            } />
            <Route path="restaurant/gst-settings" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM']}>
                <GSTSettings />
              </PrivateRoute>
            } />
            <Route path="restaurant/invoice/:orderId" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK']}>
                <RestaurantInvoice />
              </PrivateRoute>
            } />
            <Route path="restaurant-invoice/:bookingId" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK']}>
                <RestaurantInvoice />
              </PrivateRoute>
            } />
            <Route path="room-service-invoice/:bookingId" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK']}>
                <RoomServiceInvoice />
              </PrivateRoute>
            } />
            <Route path="laundry-invoice/:bookingId" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK']}>
                <LaundryInvoice />
              </PrivateRoute>
            } />
            
            {/* Reports Routes */}
            <Route path="night-audit-report" element={
              <PrivateRoute requiredRoles={['ADMIN', 'GM', 'FRONT DESK', 'ACCOUNTS']}>
                <NightAuditReport />
              </PrivateRoute>
            } />
            
            {/* Checkout Routes */}
            <Route path="hotel-checkout" element={<HotelCheckout />} />
            <Route path="invoice" element={<HotelInvoice />} />
          </Route>
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          </Router>
      </AppProvider>
    </AuthProvider>
  );
}

export default App
