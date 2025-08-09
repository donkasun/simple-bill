import React from 'react';

type StyledTableProps = React.TableHTMLAttributes<HTMLTableElement> & {
  children?: React.ReactNode;
};

const StyledTable: React.FC<StyledTableProps> = ({ children, ...props }) => {
  return (
    <table {...props} style={{ width: '100%', borderCollapse: 'collapse' }}>
      {children}
    </table>
  );
};

export default StyledTable;