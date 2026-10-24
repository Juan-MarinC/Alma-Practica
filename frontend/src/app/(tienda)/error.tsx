"use client";

export default function ErrorTienda({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-md place-items-center px-5 text-center">
      <div>
        <h1 className="font-serif text-4xl text-cacao">No pudimos cargar la tienda</h1>
        <p className="mt-3 text-cacao/85">Estamos teniendo un problema temporal. Intenta de nuevo en unos segundos.</p>
        <button onClick={reset} className="mt-6 rounded-full bg-cacao px-6 py-3 text-sm text-crema hover:bg-cacao/90">
          Reintentar
        </button>
      </div>
    </div>
  );
}
