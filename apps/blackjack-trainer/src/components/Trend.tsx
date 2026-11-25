import { useId } from "react";
export function Trend({ label, values }: { label: string; values: number[] }) {
  const id = useId();
  if (!values.length)
    return <p className="muted">{label}: no submitted checks yet.</p>;
  const samples = values.slice(-100),
    lo = Math.min(0, ...samples),
    hi = Math.max(1, ...samples),
    range = hi - lo;
  const points = samples
    .map(
      (v, i) =>
        `${12 + (i / Math.max(1, samples.length - 1)) * 476},${108 - ((v - lo) / range) * 90}`,
    )
    .join(" ");
  return (
    <figure className="trend">
      <figcaption id={id}>
        {label} · last {samples.length} checks
      </figcaption>
      <svg viewBox="0 0 500 130" role="img" aria-labelledby={id}>
        <polyline
          points={points}
          fill="none"
          stroke="#dfc58b"
          strokeWidth="2"
        />
        <line x1="12" y1="112" x2="488" y2="112" stroke="#657975" />
        <text x="12" y="128" fill="currentColor" fontSize="11">
          {samples[0]!.toFixed(1)} first
        </text>
        <text x="380" y="128" fill="currentColor" fontSize="11">
          {samples[samples.length - 1]!.toFixed(1)} latest
        </text>
      </svg>
    </figure>
  );
}
