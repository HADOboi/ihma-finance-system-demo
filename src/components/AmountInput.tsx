import { useEffect, useState } from "react";

/** Formats a raw numeric string with Indian numbering commas while preserving in-progress decimals. */
export function formatAmountText(raw: string): string {
  if (raw === "") return "";
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const [intPart = "", ...rest] = cleaned.split(".");
  const decPart = rest.length > 0 ? rest.join("").slice(0, 2) : undefined;
  const intFmt =
    intPart === ""
      ? ""
      : new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(intPart));
  return decPart !== undefined ? `${intFmt}.${decPart}` : intFmt;
}

const toNumber = (raw: string) => {
  const n = parseFloat(raw.replace(/,/g, ""));
  return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
};

interface AmountInputProps {
  value: number | string | undefined;
  onValueChange: (value: number) => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  readOnly?: boolean;
  id?: string;
}

/**
 * Text input that displays amounts with Indian numbering commas as the user types
 * while reporting a plain 2-decimal number back to the form state.
 */
export default function AmountInput({
  value,
  onValueChange,
  className,
  placeholder,
  autoFocus,
  readOnly,
  id,
}: AmountInputProps) {
  const [text, setText] = useState<string>(() =>
    value === undefined || value === null || value === "" || Number(value) === 0
      ? ""
      : formatAmountText(String(value))
  );

  useEffect(() => {
    const incoming = value === undefined || value === null || value === "" ? 0 : Number(value);
    if (toNumber(text) !== incoming) {
      setText(incoming === 0 ? "" : formatAmountText(String(incoming)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      autoFocus={autoFocus}
      readOnly={readOnly}
      value={text}
      placeholder={placeholder}
      onChange={(e) => {
        const formatted = formatAmountText(e.target.value);
        setText(formatted);
        onValueChange(toNumber(formatted));
      }}
      className={className}
    />
  );
}
