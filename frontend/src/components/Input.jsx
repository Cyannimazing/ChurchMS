const Input = ({ disabled = false, className = "", ...props }) => (
  <input
    disabled={disabled}
    className={`${className} p-4 rounded-md shadow-sm border-gray-300 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50`.trim()}
    {...props}
  />
);

export default Input;
