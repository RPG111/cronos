"use client";
import { useState } from "react";
import Button from "./ui/Button";
import Input from "./ui/Input";

export default function OTPDialog({ onVerify }: { onVerify: (code: string)=>Promise<void> }) {
  const [code, setCode] = useState("");

  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-white/10 p-4">
      <p className="text-white/80 text-sm">
        Te enviamos un código por SMS. Escríbelo para confirmar.
      </p>
      <Input
        placeholder="Código de 6 dígitos"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        maxLength={6}
        inputMode="numeric"
      />
      <Button onClick={() => onVerify(code)}>Confirmar</Button>
    </div>
  );
}
