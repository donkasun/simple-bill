import React from 'react';

type StyledDropdownProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

const StyledDropdown: React.FC<StyledDropdownProps> = ({ label, children, ...props }) => {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <span style={{ fontSize: 14 }}>{label}</span>}
      <select {...props}>{children}</select>
    </label>
  );
};

export default StyledDropdown;