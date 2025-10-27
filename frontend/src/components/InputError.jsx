"use client";

export const InputError = ({ messages = [], className = "" }) => {
  const messageArray = Array.isArray(messages) ? messages : [];
  
  return (
    <>
      {messageArray.length > 0 && (
        <div className={`text-sm text-red-600 ${className}`}>
          {messageArray.map((message, index) => (
            <p key={index}>{message}</p>
          ))}
        </div>
      )}
    </>
  );
};

export default InputError;
