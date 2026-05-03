import {
  type ClipboardEvent,
  type ChangeEvent,
  type InputHTMLAttributes,
  type HTMLInputTypeAttribute,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
  useMemo,
  useRef,
} from "react";
import type { LucideIcon } from "lucide-react";

interface AuthHeadingProps {
  title: string;
  description?: string;
  badge?: string;
}

export function AuthHeading({ title, description, badge }: AuthHeadingProps) {
  return (
    <div className="mb-5 text-center">
      {badge && (
        <div className="inline-flex items-center rounded-full border border-emerald-300/55 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
          {badge}
        </div>
      )}
      <h1 className="mt-3 text-[clamp(1.65rem,5vw,2.25rem)] font-extrabold leading-tight text-slate-900">
        {title}
      </h1>
      {description && (
        <p className="mx-auto mt-2 max-w-[34ch] text-sm text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
}

interface AuthTextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: HTMLInputTypeAttribute;
  autoComplete?: string;
  required?: boolean;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  icon?: LucideIcon;
  rightAddon?: ReactNode;
  disabled?: boolean;
  maxLength?: number;
}

export function AuthTextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
  required = false,
  inputMode,
  icon: Icon,
  rightAddon,
  disabled = false,
  maxLength,
}: AuthTextFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[0.8rem] font-semibold text-slate-700"
      >
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          inputMode={inputMode}
          disabled={disabled}
          maxLength={maxLength}
          className={`input h-11 rounded-xl border-slate-300 bg-slate-100/90 text-[0.84rem] text-slate-700 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white ${
            Icon ? "pl-10" : "pl-3.5"
          } ${rightAddon ? "pr-10" : "pr-3.5"}`}
        />
        {rightAddon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightAddon}
          </div>
        )}
      </div>
    </div>
  );
}

interface AuthAlertProps {
  type: "danger" | "success" | "warning" | "info";
  message: string;
}

export function AuthAlert({ type, message }: AuthAlertProps) {
  return <div className={`alert ${type} text-sm`}>{message}</div>;
}

interface AuthSeparatorProps {
  label?: string;
}

export function AuthSeparator({ label = "OR" }: AuthSeparatorProps) {
  return (
    <div className="flex items-center gap-3 py-0.5">
      <span className="h-px flex-1 bg-slate-200" />
      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </span>
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

interface AuthCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  name?: string;
  autoFocus?: boolean;
}

function sanitizeOtpValue(value: string): string {
  return value.replace(/\D/g, "");
}

function focusInputAt(
  refs: RefObject<Array<HTMLInputElement | null>>,
  index: number,
) {
  refs.current[index]?.focus();
}

export function AuthCodeInput({
  value,
  onChange,
  length = 6,
  name = "otpCode",
  autoFocus = false,
}: AuthCodeInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const normalizedValue = useMemo(
    () => sanitizeOtpValue(value).slice(0, length),
    [length, value],
  );
  const slots = Array.from({ length }, (_, index) => normalizedValue[index] ?? "");

  const setValueAt = (index: number, digit: string) => {
    const next = slots.slice();
    next[index] = digit;
    onChange(next.join("").slice(0, length));
  };

  const handleChange = (index: number, raw: string) => {
    const digits = sanitizeOtpValue(raw);
    if (!digits) {
      setValueAt(index, "");
      return;
    }

    if (digits.length > 1) {
      const next = slots.slice();
      digits
        .slice(0, length - index)
        .split("")
        .forEach((digit, offset) => {
          next[index + offset] = digit;
        });
      onChange(next.join("").slice(0, length));
      const targetIndex = Math.min(index + digits.length, length - 1);
      focusInputAt(refs, targetIndex);
      return;
    }

    setValueAt(index, digits);
    if (index < length - 1) {
      focusInputAt(refs, index + 1);
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !slots[index] && index > 0) {
      focusInputAt(refs, index - 1);
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusInputAt(refs, index - 1);
    }

    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      focusInputAt(refs, index + 1);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = sanitizeOtpValue(event.clipboardData.getData("text"));
    if (!pasted) {
      return;
    }
    onChange(pasted.slice(0, length));
    const focusIndex = Math.min(pasted.length, length) - 1;
    if (focusIndex >= 0) {
      focusInputAt(refs, focusIndex);
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-2.5">
      {slots.map((digit, index) => (
        <input
          key={`${name}-${index}`}
          ref={(element) => {
            refs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          name={`${name}-${index}`}
          value={digit}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          autoFocus={autoFocus && index === 0}
          className="auth-otp-box"
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  );
}
