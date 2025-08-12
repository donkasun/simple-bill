import React from 'react';
import FieldWrapper from './FieldWrapper';

type StyledDropdownProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
};

const StyledDropdown: React.FC<StyledDropdownProps> = ({ label, children, required, error, id, style, ...props }) => {
  return (
    <FieldWrapper label={label} required={required} error={error} style={style}>
      <select id={id} {...props}>
        {children}
      </select>
    </FieldWrapper>
  );
};

export default StyledDropdown;