import React from "react";

const InputWithIcon = ({ icon, label, placeholder, type = "text", value, onChange, inputClassName = "" }) => (
  <div className="relative w-full mb-2">
    {label && <label className="block text-sm font-medium mb-1">{label}</label>}
    <div className="flex items-center">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{icon}</span>
      <input
        className={inputClassName}
        style={{ paddingLeft: '2.5rem' }}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  </div>
);

export default InputWithIcon;
