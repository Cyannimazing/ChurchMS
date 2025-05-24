"use client";

export const InputError = ({ messages = [], className = "" }) => {
  return (
    <>
      {messages.length > 0 && (
        <div className={`text-sm text-red-600 ${className}`}>
          {messages.map((message, index) => (
            <p key={index}>{message}</p>
          ))}
        </div>
      )}
    </>
  );
};

export default InputError;
