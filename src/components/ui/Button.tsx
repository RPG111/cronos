import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary"|"outline" };

export default function Button({ className, variant="primary", ...props }: Props) {
  const base = "w-full rounded-2xl px-5 py-3 text-base font-semibold transition";
  const variants = {
    primary: "bg-green-600 hover:bg-green-500 text-white",
    outline: "border border-white/70 text-white hover:bg-white/10"
  };
  return <button className={clsx(base, variants[variant], className)} {...props} />;
}
