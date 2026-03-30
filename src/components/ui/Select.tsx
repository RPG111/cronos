import { SelectHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type Props = SelectHTMLAttributes<HTMLSelectElement>;

const Select = forwardRef<HTMLSelectElement, Props>(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={clsx(
        "w-full rounded-2xl bg-green-900/70 text-white",
        "px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-green-500",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});

export default Select;
