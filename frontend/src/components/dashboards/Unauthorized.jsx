import React from "react";
import "../Management.css";

const Unauthorized = () => {
  return (
    <div className="unauthorized">
      <div className="unauthorized-content">
        <h1>🚫 Access Denied</h1>
        <p>You don't have permission to access this page.</p>
        <p>Please contact your administrator if you believe this is an error.</p>
        <button onClick={() => window.history.back()}>Go Back</button>
      </div>
    </div>
  );
};

export default Unauthorized;