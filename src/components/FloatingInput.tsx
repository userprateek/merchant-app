"use client";

import React, { forwardRef, useMemo, useState } from "react";

type Props = {
  id?: string;
  name: string;
  type?: React.HTMLInputTypeAttribute;
  label?: string;
  defaultValue?: string;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;
  upperCase?: boolean;
  filter?: (value: string) => string;
  className?: string;
  style?: React.CSSProperties;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  onKeyPress?: React.KeyboardEventHandler<HTMLInputElement>;
  onClick?: React.MouseEventHandler<HTMLInputElement>;
  onCommit?: (value: string) => void;
  onLocalChange?: (value: string) => void;
};

const FloatingInput = forwardRef<HTMLInputElement, Props>(function FloatingInput(
  {
    id,
    name,
    type = "text",
    label,
    defaultValue = "",
    placeholder,
    autoFocus,
    disabled,
    required,
    maxLength = 100,
    upperCase,
    filter,
    className,
    style,
    onFocus,
    onBlur,
    onKeyDown,
    onKeyPress,
    onClick,
    onCommit,
    onLocalChange,
  },
  ref
) {
  const [isFocus, setIsFocus] = useState(false);
  const [isBlur, setIsBlur] = useState(true);
  const [localValue, setLocalValue] = useState(defaultValue);

  const labelClass = useMemo(() => {
    if (isFocus) return "input--label active";
    if ((localValue + "").length > 0 && isBlur) return "input--label filled";
    return "input--label";
  }, [isBlur, isFocus, localValue]);

  const handleChange = (nextRaw: string) => {
    let next = nextRaw;
    if (filter) next = filter(next);
    if (upperCase) next = next.toUpperCase();
    if (next.length > maxLength || disabled) return;
    setLocalValue(next);
    onLocalChange?.(next);
  };

  return (
    <div className={`input--content${className ? ` ${className}` : ""}`}>
      <input
        ref={ref}
        id={id}
        name={name}
        type={type}
        value={localValue}
        disabled={disabled}
        required={required}
        maxLength={maxLength}
        autoFocus={autoFocus}
        autoComplete="off"
        placeholder={placeholder}
        style={style}
        className={disabled ? "disable" : ""}
        onFocus={(event) => {
          setIsFocus(true);
          setIsBlur(false);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setIsFocus(false);
          setIsBlur(true);
          onBlur?.(event);
          onCommit?.(localValue);
        }}
        onKeyDown={onKeyDown}
        onKeyPress={onKeyPress}
        onClick={onClick}
        onChange={(event) => handleChange(event.target.value)}
      />

      {label && <div className={labelClass}>{label}</div>}
    </div>
  );
});

export default React.memo(FloatingInput);
