import type { RequestLaboratory } from "./room-availability";

const laboratories = [
  { id: "physics", name: "Physics Laboratory", description: "Request laboratory time and services for physics experiments, demonstrations, and related activities." },
  { id: "circuits", name: "Circuits Laboratory", description: "Request laboratory time and services for electronics, circuits, and related experiments." },
] as const;

function LaboratoryIcon({ laboratory }: { laboratory: RequestLaboratory }) {
  return <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {laboratory === "physics" ? <>
      <ellipse cx="32" cy="32" rx="25" ry="10" /><ellipse cx="32" cy="32" rx="25" ry="10" transform="rotate(60 32 32)" /><ellipse cx="32" cy="32" rx="25" ry="10" transform="rotate(120 32 32)" /><circle cx="32" cy="32" r="3" fill="currentColor" stroke="none" />
    </> : <>
      <rect x="17" y="15" width="30" height="34" rx="3" /><path d="M24 7v8M32 7v8M40 7v8M24 49v8M32 49v8M40 49v8M9 23h8M9 32h8M9 41h8M47 23h8M47 32h8M47 41h8" /><path d="M26 25h2M36 25h2M26 34h2M36 34h2M26 42h2M36 42h2" strokeWidth="4" />
    </>}
  </svg>;
}

export default function RequestLaboratoryChoices({ laboratory, onChange }: { laboratory: RequestLaboratory; onChange: (laboratory: RequestLaboratory) => void }) {
  return <fieldset className="request-laboratory-options">
    <legend className="sr-only">Choose a laboratory</legend>
    {laboratories.map(({ id, name, description }) => <label key={id} className={`request-laboratory-option ${laboratory === id ? "is-selected" : ""}`}>
      <input type="radio" name="laboratory" value={id} checked={laboratory === id} onChange={() => onChange(id)} />
      <span className="request-laboratory-icon"><LaboratoryIcon laboratory={id} /></span>
      <span className="request-laboratory-copy"><strong>{name}</strong><span>{description}</span></span>
    </label>)}
  </fieldset>;
}
