"use client";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type AuthType = "login" | "register";

export default function AuthCard({ type }: { type: AuthType }) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const [remember, setRemember] = useState(true);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Aquí solo UI. La lógica real la conectamos luego.
    console.log({ type, phone, name, team, remember });
  };

  return (
    <div className="w-full max-w-md rounded-2xl bg-white/10 backdrop-blur-md shadow-xl p-8 text-white">
      <h1
        className={`text-4xl font-extrabold text-center text-emerald-400 ${
          type === "register" ? "mb-2" : "mb-8"
        }`}
      >
        {type === "login" ? "Cronos" : "Crear cuenta"}
      </h1>

      {type === "register" && (
        <p className="mb-6 text-center text-sm text-white/80">
          Eventos Deportivos en vivo cerca de ti
        </p>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        {type === "register" && (
          <div className="space-y-2">
            <span className="block text-xs tracking-widest text-white/70">NOMBRE</span>
            <Input
              placeholder="Tu nombre"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            />
          </div>
        )}

        <div className="space-y-2">
          <span className="block text-xs tracking-widest text-white/70">TELÉFONO</span>
          <Input
            placeholder="+1 415 555 1234"
            value={phone}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
          />
          <p className="text-[11px] text-white/60">Formato E.164 (ej. +15005550006).</p>
        </div>

        {type === "register" && (
          <div className="space-y-2">
            <span className="block text-xs tracking-widest text-white/70">EQUIPO FAVORITO</span>
            <select
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="" disabled>Elige tu equipo</option>
              <option value="América">América</option>
              <option value="Chivas">Chivas</option>
              <option value="Barcelona">Barcelona</option>
              <option value="Real Madrid">Real Madrid</option>
            </select>
          </div>
        )}

        {type === "login" && (
          <label className="flex items-center gap-3 text-white/80 text-sm">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-white/30 bg-black/40"
            />
            Recordar este dispositivo
          </label>
        )}

        <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl shadow-lg">
          {type === "login" ? "Enviar código" : "Crear cuenta"}
        </Button>

        <p className="text-center text-white/80 text-sm">
          {type === "login" ? (
            <>¿No tienes cuenta? <a className="underline" href="/auth/register">Crea una</a></>
          ) : (
            <>¿Ya tienes cuenta? <a className="underline" href="/auth/login">Inicia sesión</a></>
          )}
        </p>
      </form>
    </div>
  );
}
