import React, { ReactNode } from "react";

type Props = {
  children: ReactNode;
  type?: "button" | "submit" | "reset";
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
};

export default function AppButton({
  children,
  type = "button",
  onClick,
  disabled,
  className,
  style,
  title,
}: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`app-btn${className ? ` ${className}` : ""}`}
      style={style}
      title={title}
    >
      {children}
    </button>
  );
}
