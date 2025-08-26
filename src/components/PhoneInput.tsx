import Input from "./ui/Input";

export default function PhoneInput(props: { value: string; onChange: (v: string)=>void }) {
  return (
    <Input
      inputMode="tel"
      placeholder="+1 415 555 1234"
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
    />
  );
}
