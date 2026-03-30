import { InputHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type Props = InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, Props>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={clsx(
        "w-full rounded-2xl bg-green-900/70 text-white placeholder-white/60",
        "px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-green-500",
        className
      )}
      {...props}
    />
  );
});

export default Input;
