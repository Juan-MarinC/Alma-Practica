import { FormLogin } from "@/components/admin/form-login";

export default function PaginaLogin() {
  return (
    <div className="mx-auto mt-16 max-w-sm">
      <div className="tarjeta-admin">
        <h1 className="mb-6 font-serif text-3xl text-cacao">Entrar al panel</h1>
        <FormLogin />
      </div>
    </div>
  );
}
