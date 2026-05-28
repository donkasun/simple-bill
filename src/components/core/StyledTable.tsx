import React from "react";

type StyledTableProps = React.TableHTMLAttributes<HTMLTableElement> & {
  children?: React.ReactNode;
};

const StyledTable: React.FC<StyledTableProps> = ({
  children,
  style,
  className,
  ...props
}) => {
  return (
    <div
      className="table-wrapper card"
      style={{
        position: "relative",
        background: "var(--white)",
        border: "1px solid var(--brand-border)",
        borderRadius: "12px",
        overflow: "hidden",
        ...style,
      }}
    >
      <table
        {...props}
        className={["table", className].filter(Boolean).join(" ")}
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        {children}
      </table>
    </div>
  );
};

export default StyledTable;
