// Inspirado en "Split Text" / "Blur Text" de React Bits: cada palabra aparece con desenfoque.
// Es CSS (clase .aparecer): arranca al pintar la página, sin esperar a que cargue el JavaScript.
export function TextoDividido({ texto, className, retraso = 0 }: { texto: string; className?: string; retraso?: number }) {
  const palabras = texto.split(" ");
  return (
    <span className={className}>
      <span className="sr-only">{texto}</span>
      <span aria-hidden>
        {palabras.map((p, i) => (
          <span key={i} className="aparecer inline-block whitespace-pre" style={{ animationDelay: `${retraso + i * 0.06}s` }}>
            {p + (i < palabras.length - 1 ? " " : "")}
          </span>
        ))}
      </span>
    </span>
  );
}
