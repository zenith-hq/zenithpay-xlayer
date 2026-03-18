const RUNG_COUNT = 20;

export function Ladder({ side }: { side: "left" | "right" }) {
  return (
    <div className="flex h-full w-full flex-col">
      {Array.from({ length: RUNG_COUNT }).map((_, i) => (
        <div
          key={i}
          className={`relative w-full flex-1 ${i !== RUNG_COUNT - 1 ? "border-b" : ""}`}
          style={{
            backgroundImage:
              "repeating-linear-gradient(315deg, currentColor 0, currentColor 1px, transparent 0, transparent 50%)",
            backgroundSize: "7px 7px",
            backgroundAttachment: "fixed",
            color: "oklch(from var(--foreground) l c h / 0.08)",
          }}
        />
      ))}
    </div>
  );
}
