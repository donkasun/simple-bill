import React from 'react';
import FieldWrapper from './FieldWrapper';

type StyledInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

const StyledInput: React.FC<StyledInputProps> = ({ label, style, error, required, id, ...props }) => {
  return (
    <FieldWrapper label={label} required={required} error={error} style={style}>
      <input id={id} {...props} />
    </FieldWrapper>
  );
};

export default StyledInput;