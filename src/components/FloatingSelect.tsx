"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type PrimitiveOption = string;
type ObjectOption = Record<string, unknown>;
type OptionInput = PrimitiveOption | ObjectOption;

type NormalizedOption = {
  value: string;
  label: string;
  raw: OptionInput;
};

type Props = {
  id?: string;
  name: string;
  label: string;
  options: OptionInput[];
  optionLabelKey?: string;
  optionValueKey?: string;
  multiple?: boolean;
  maxSelections?: number;
  value?: string | string[];
  defaultValue?: string | string[];
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  maxMenuHeight?: number;
  className?: string;
  style?: React.CSSProperties;
  onCommit?: (selected: NormalizedOption[]) => void;
};

function normalizeOptions(
  options: OptionInput[],
  optionLabelKey?: string,
  optionValueKey?: string
) {
  return options.map((option) => {
    if (typeof option === "string") {
      return {
        value: option,
        label: option,
        raw: option,
      };
    }

    const label =
      (optionLabelKey ? option[optionLabelKey] : option.label) ??
      (optionValueKey ? option[optionValueKey] : option.value) ??
      "";
    const value =
      (optionValueKey ? option[optionValueKey] : option.value) ??
      (optionLabelKey ? option[optionLabelKey] : option.label) ??
      "";

    return {
      value: String(value),
      label: String(label),
      raw: option,
    };
  });
}

export default function FloatingSelect({
  id,
  name,
  label,
  options,
  optionLabelKey,
  optionValueKey,
  multiple = false,
  maxSelections = 1000,
  value,
  defaultValue,
  disabled,
  required,
  searchPlaceholder = "Search...",
  maxMenuHeight = 220,
  className,
  style,
  onCommit,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocus, setIsFocus] = useState(false);
  const [isBlur, setIsBlur] = useState(true);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const normalizedOptions = useMemo(
    () => normalizeOptions(options, optionLabelKey, optionValueKey),
    [options, optionLabelKey, optionValueKey]
  );

  const normalizedPropValue = useMemo(() => {
    const source = value ?? defaultValue;
    const values = Array.isArray(source) ? source : source ? [source] : [];
    return values.map(String);
  }, [value, defaultValue]);

  const [selectedValues, setSelectedValues] = useState<string[]>(normalizedPropValue);

  useEffect(() => {
    setSelectedValues(normalizedPropValue);
  }, [normalizedPropValue]);

  const selectedOptions = useMemo(
    () =>
      normalizedOptions.filter((option) => selectedValues.includes(option.value)),
    [normalizedOptions, selectedValues]
  );

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return normalizedOptions;
    const query = search.toLowerCase();
    return normalizedOptions.filter((option) =>
      option.label.toLowerCase().includes(query)
    );
  }, [normalizedOptions, search]);

  const displayValue = useMemo(() => {
    if (selectedOptions.length === 0) return "";
    if (!multiple) return selectedOptions[0].label;
    if (selectedOptions.length === 1) return selectedOptions[0].label;
    return `Multiple selections (${selectedOptions.length})`;
  }, [multiple, selectedOptions]);
  const isFilled = displayValue.trim().length > 0;
  const submittedValue = useMemo(() => {
    if (!multiple) return selectedValues[0] ?? "";
    return selectedValues.join(",");
  }, [multiple, selectedValues]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      const isInTrigger = containerRef.current?.contains(target);
      const isInMenu = menuRef.current?.contains(target);
      if (!isInTrigger && !isInMenu) {
        setIsOpen(false);
        setIsFocus(false);
        setIsBlur(true);
        onCommit?.(selectedOptions);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen, onCommit, selectedOptions]);

  useEffect(() => {
    if (!isOpen) return;
    searchInputRef.current?.focus();
    setHighlightedIndex(0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const updateMenuPosition = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 1000,
      });
    };

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen]);

  const labelClass = isFocus
    ? "inp--label active"
    : isFilled && isBlur
    ? "inp--label filled"
    : "inp--label";

  const selectOption = (option: NormalizedOption) => {
    if (disabled) return;

    if (!multiple) {
      const next = [option.value];
      setSelectedValues(next);
      setIsOpen(false);
      setIsFocus(false);
      setIsBlur(true);
      onCommit?.(normalizedOptions.filter((item) => next.includes(item.value)));
      return;
    }

    setSelectedValues((prev) => {
      if (prev.includes(option.value)) {
        return prev.filter((value) => value !== option.value);
      }
      if (prev.length >= maxSelections) {
        return prev;
      }
      return [...prev, option.value];
    });
  };

  const focusOption = (index: number) => {
    const maxIndex = filteredOptions.length - 1;
    if (maxIndex < 0) return;
    const safeIndex = Math.max(0, Math.min(index, maxIndex));
    setHighlightedIndex(safeIndex);
    optionRefs.current[safeIndex]?.focus();
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!filteredOptions.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusOption(0);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      setIsFocus(false);
      setIsBlur(true);
      onCommit?.(selectedOptions);
    }
  };

  const handleOptionKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
    option: NormalizedOption
  ) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusOption(index + 1);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (index === 0) {
        searchInputRef.current?.focus();
      } else {
        focusOption(index - 1);
      }
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      selectOption(option);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      setIsFocus(false);
      setIsBlur(true);
      onCommit?.(selectedOptions);
      return;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`dropdown--wrapper${className ? ` ${className}` : ""}${disabled ? " disabled-wrapper" : ""}${
        isOpen ? " active" : ""
      }`}
      style={style}
    >
      <input type="hidden" name={name} value={submittedValue} />
      <input
        id={id}
        type="text"
        className={`inp--field ${disabled ? "disable" : ""} ${isFocus ? "active" : ""}`}
        disabled={disabled}
        value={displayValue}
        readOnly
        name={name+"_display"}
        onFocus={() => {
          if (disabled) return;
          setIsOpen(true);
          setIsFocus(true);
          setIsBlur(false);
        }}
        onClick={() => {
          if (disabled) return;
          setIsOpen(true);
          setIsFocus(true);
          setIsBlur(false);
        }}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setIsOpen(true);
          }
          if (event.key === "Escape") {
            event.preventDefault();
            setIsOpen(false);
            setIsFocus(false);
            setIsBlur(true);
          }
        }}
      />

      <div className={labelClass}>
        {label}
        {required ? <span style={{ color: "red", paddingLeft: 4 }}>*</span> : null}
      </div>

      {!disabled && (
        <div className="caret--icon" aria-hidden="true">
          {isOpen ? "▲" : "▼"}
        </div>
      )}

      {!disabled &&
        isOpen &&
        isMounted &&
        createPortal(
          <div ref={menuRef} className="dropdown--menu" style={menuStyle}>
          <div className="drop--search">
            <input
              ref={searchInputRef}
              type="text"
              className="search"
              placeholder={searchPlaceholder}
              value={search}
              autoComplete="off"
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
          <div className="drop--content scroll" style={{ maxHeight: maxMenuHeight }}>
            {filteredOptions.length === 0 ? (
              <div className="not--found">No results found</div>
            ) : (
              <ul className="list-group">
                {filteredOptions.map((option, optionIndex) => {
                  const checked = selectedValues.includes(option.value);
                  return (
                    <li
                      key={option.value}
                      className={`drop--item ${checked ? "selected" : ""}`}
                    >
                      <button
                        type="button"
                        ref={(el) => {
                          optionRefs.current[optionIndex] = el;
                        }}
                        className={`drop--item-btn ${highlightedIndex === optionIndex ? "highlighted" : ""}`}
                        onClick={() => selectOption(option)}
                        onKeyDown={(event) => handleOptionKeyDown(event, optionIndex, option)}
                      >
                        <span className={`search--checkbox ${checked ? "checked" : ""}`} />
                        <span>{option.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          </div>,
          document.body
        )}
    </div>
  );
}
