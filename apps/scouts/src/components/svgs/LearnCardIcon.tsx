import React from "react";

const LearnCardIcon: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <svg
      width="36"
      height="35"
      viewBox="0 0 36 35"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="2.95834"
        y="6.83325"
        width="30.0833"
        height="22.7917"
        rx="2"
        stroke="#FBFBFC"
        strokeWidth="2"
      />
      <path d="M1.95834 14.5833H34.0417" stroke="#FBFBFC" strokeWidth="2" />
    </svg>
  );
};

export default LearnCardIcon;
