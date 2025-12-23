import React, { useState } from "react";
import { X } from "lucide-react";
import {
  eachDayOfInterval,
  format,
  getDay,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
} from "date-fns";
import { GrLinkPrevious, GrLinkNext } from "react-icons/gr";

const getColor = (dateStr, bookingData) => {
  const dayBookings = bookingData[dateStr] || [];
  const count = dayBookings.length;
  if (count >= 3) return "bg-red-500 text-white";
  if (count >= 2) return "bg-amber-500 text-white";
  if (count >= 1) return "bg-green-500 text-white";
  return "";
};

const BookingCalendar = ({ isOpen, onClose, bookingData = {} }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  if (!isOpen) return null;

  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });
  const firstDayOfWeek = getDay(start);
  const emptyCells = Array.from({ length: firstDayOfWeek });
  const monthName = format(currentMonth, "MMMM yyyy");

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs  flex items-center justify-center z-[999] p-4 overflow-auto">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-center">
          Booking Calendar
        </h2>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={prevMonth}
              className="px-4 py-2 bg-background hover:bg-border rounded-lg"
            >
              <GrLinkPrevious />
            </button>
            <h3 className="text-lg font-semibold">{monthName}</h3>
            <button
              onClick={nextMonth}
              className="px-4 py-2 bg-background hover:bg-border rounded-lg"
            >
              <GrLinkNext />
            </button>
          </div>

          <div className="grid grid-cols-7 text-xs font-medium text-center mb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="grid grid-cols-7 text-center gap-1 text-sm">
            {emptyCells.map((_, idx) => (
              <div key={`empty-${idx}`} className="h-10"></div>
            ))}
            {days.map((day) => {
              const dayStr = format(day, "yyyy-MM-dd");
              const dayBookings = bookingData[dayStr] || [];
              return (
                <div
                  key={dayStr}
                  className={`h-10 flex items-center justify-center rounded-full cursor-pointer hover:opacity-80 ${getColor(
                    dayStr, bookingData
                  )}`}
                  title={dayBookings.length > 0 ? `${dayBookings.length} booking${dayBookings.length > 1 ? 's' : ''}` : ''}
                >
                  {format(day, "d")}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-6 text-sm mt-6 justify-center">
          <div className="flex items-center">
            <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
            3+ Bookings
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-amber-500 rounded-full mr-2"></span>
            2 Bookings
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            1 Booking
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingCalendar;
