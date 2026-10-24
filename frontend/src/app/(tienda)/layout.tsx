import { AvisoCookies } from "@/components/aviso-cookies";
import { CarritoProvider } from "@/components/carrito";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { PanelCarrito } from "@/components/panel-carrito";

export default function LayoutTienda({ children }: { children: React.ReactNode }) {
  return (
    <CarritoProvider>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <PanelCarrito />
      <AvisoCookies />
    </CarritoProvider>
  );
}
