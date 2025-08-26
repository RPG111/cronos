import Select from "./ui/Select";
import { TEAMS } from "@/lib/teams";

export default function TeamSelect(props: { value: string; onChange: (v: string)=>void }) {
  return (
    <Select value={props.value} onChange={(e)=>props.onChange(e.target.value)}>
      <option value="" disabled>Elige tu equipo</option>
      {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
    </Select>
  );
}
