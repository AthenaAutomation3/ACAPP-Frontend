import React from "react";

const ScrollingWarning = () => {
  return (
    <div
      style={{
     
        height: "50px",
        overflow: "hidden",
        position: "relative",
        background: "#212529",
        color: "white",
      }}
    >
      <p
        style={{
          width: "100%",
          height: "100%",
          margin: "0",
          lineHeight: "50px",
          textAlign: "center",
          transform: "translateX(100%)",
          animation: "scroll-left 15s linear infinite",
        }}
      >
        Warning: Hard Material
      </p>
      <style>
        {`
          @keyframes scroll-left {
            0% {
              transform: translateX(100%);
            }
            100% {
              transform: translateX(-100%);
            }
          }
        `}
      </style>
    </div>
  );
};

export default ScrollingWarning;
