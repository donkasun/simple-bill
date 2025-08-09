import React from 'react';

type StyledTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
};

const StyledTextarea: React.FC<StyledTextareaProps> = ({ label, ...props }) => {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <span style={{ fontSize: 14 }}>{label}</span>}
      <textarea {...props} />
    </label>
  );
};

export default StyledTextarea;


