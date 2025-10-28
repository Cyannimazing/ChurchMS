"use client";

export const Button = ({
  children,
  onClick,
  type = "button",
  disabled = false,
  className = "",
  variant = "primary",
  ...props
}) => {
  const baseClasses =
    "px-4 py-2 rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 inline-flex items-center justify-center";

  const variantClasses = {
    primary:
      "cursor-pointer text-sm font-medium text-white bg-blue-600 border border-transparent hover:bg-blue-700 focus:ring-blue-500 transition-colors",
    outline:
      "cursor-pointer border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500",
    danger: "cursor-pointer bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    action:
      "cursor-pointer text-xs font-medium text-white bg-emerald-600 border border-transparent hover:bg-emerald-700 focus:ring-emerald-500 transition-all duration-200 shadow-sm hover:shadow-md",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
