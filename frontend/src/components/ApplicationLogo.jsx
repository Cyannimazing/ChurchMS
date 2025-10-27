const ApplicationLogo = ({ className = "h-8 w-8" }) => (
  <svg
    className={className}
    viewBox="0 0 40 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Cross */}
    <path
      d="M20 2V12M16 7H24"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    
    {/* Church building */}
    <path
      d="M20 12L8 22V46H32V22L20 12Z"
      fill="currentColor"
    />
    
    {/* Door */}
    <rect
      x="16"
      y="36"
      width="8"
      height="10"
      fill="white"
      rx="1"
    />
    
    {/* Window */}
    <circle cx="20" cy="28" r="2.5" fill="white" />
  </svg>
);

export default ApplicationLogo;
