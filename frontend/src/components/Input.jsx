const Input = ({ disabled = false, className = "", ...props }) => (
  <input
    disabled={disabled}
    className={`${className}`.trim()}
    {...props}
  />
);

export default Input;
