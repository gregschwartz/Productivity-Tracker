import React from "react";

/**
 * Reusable error alert component using Tailwind classes instead of inline styles
 * @param {Object} props - Component props
 * @param {string} props.title - Error title/heading
 * @param {string|React.ReactNode} props.message - Error message content
 * @param {string} props.type - Error type ('error' or 'warning')
 */
function ErrorAlert({ 
  title, 
  message, 
  type = "error" 
}) {
  const baseClasses = "p-6 border rounded-md";
  const typeClasses = type === "error" 
    ? "bg-red-50 border-red-200 text-red-900"
    : "bg-yellow-50 border-yellow-200 text-yellow-900";

  return (
    <div className={`${baseClasses} ${typeClasses}`}>
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      <div className="text-sm">{message}</div>
    </div>
  );
}

export default ErrorAlert; 