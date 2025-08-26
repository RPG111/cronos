import AuthCard from "@/components/AuthCard";

export default function RegisterPage() {
  return (
    <div className="relative min-h-dvh w-full">
      <img
        src="/images/stadium.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover blur-sm"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />

      <div className="relative z-10 min-h-dvh flex items-center justify-center px-6">
        <AuthCard type="register" />
      </div>
    </div>
  );
}
