import React from 'react';

const Input = ({ placeholder, value, onChange, className }) => {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`p-3 border border-gray-300 rounded-lg w-full ${className}`}
    />
  );
};

export default Input;
