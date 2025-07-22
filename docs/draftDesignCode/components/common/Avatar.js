import React from 'react';

const Avatar = ({ name, subtitle, imageUrl }) => {
  return (
    <section className="avatar-section">
      <div className="avatar">
        <img 
          src={imageUrl || "https://codia-f2c.s3.us-west-1.amazonaws.com/image/2025-07-21/YVSdXWTiKv.png"} 
          alt={`${name} profile`}
        />
      </div>
      <div className="avatar-info">
        <h2 className="avatar-name">{name}</h2>
        <p className="avatar-subtitle">{subtitle}</p>
      </div>
    </section>
  );
};

export default Avatar;
