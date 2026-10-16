'use client';

import AboutForm from '@/components/admin/AboutForm';
import { useCarregar } from '@/components/admin/hooks';
import { useToast } from '@/components/admin/Toasts';
import { CabecalhoPagina, EstadoCarregando, EstadoErro } from '@/components/admin/ui';
import { adminApi, AboutInput } from '@/lib/adminApi';

export default function AdminSobrePage() {
  const avisar = useToast();
  const { dados: about, setDados, erro, recarregar } = useCarregar(() => adminApi.sobre.get(), []);

  if (erro) return <EstadoErro mensagem={erro} tentarDeNovo={recarregar} />;
  if (!about) return <EstadoCarregando />;

  async function salvar(data: AboutInput) {
    setDados(await adminApi.sobre.update(data));
    avisar('Página sobre salva.');
  }

  return (
    <div>
      <CabecalhoPagina
        titulo="sobre"
        acoes={
          <a href="/sobre" target="_blank" rel="noopener" className="font-display text-azul-escuro hover:underline">
            ver no site ↗
          </a>
        }
      />
      <AboutForm initial={about} onSave={salvar} />
    </div>
  );
}
