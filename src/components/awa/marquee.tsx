"use client";

const ITEMS = [
  "Renders Fotorrealistas",
  "Recorridos 360°",
  "Animación Arquitectónica",
  "Modelado 3D",
  "Visualización Inmersiva",
];

export function Marquee() {
  // Duplicate the list so the animation loops seamlessly
  const sequence = [...ITEMS, ...ITEMS];

  return (
    <section
      aria-label="Servicios en síntesis"
      className="border-y border-[#1e1e2a] py-6 md:py-8 bg-[#0f0f17]"
    >
      <div className="awa-marquee">
        <div className="awa-marquee-track">
          {sequence.map((item, i) => (
            <div
              key={`${item}-${i}`}
              className="flex items-center gap-12 whitespace-nowrap"
            >
              <span className="text-2xl md:text-4xl font-heading font-medium text-white">
                {item}
              </span>
              <span className="text-[#00c8b4] text-2xl md:text-4xl">•</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
