import React from 'react';

type StyledInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

const StyledInput: React.FC<StyledInputProps> = ({ label, ...props }) => {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <span style={{ fontSize: 14 }}>{label}</span>}
      <input {...props} />
    </label>
  );
};

export default StyledInput;