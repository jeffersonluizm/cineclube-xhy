import dotenv from 'dotenv';

// Antes de importar o app: as rotas leem variáveis de ambiente ao serem carregadas
dotenv.config();

import app from './app';
import { conectarBanco } from './lib/banco';
import { problemasDeConfiguracao } from './lib/configuracao';
import mongoose from 'mongoose';
import { agendarConferenciaDemonstracao, bancoAceitaDemonstracao, conferirDemonstracao, demoLigado } from './lib/demo';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3001;

// Em produção, configuração faltando ou fraca impede a partida, com mensagem do que corrigir
const problemas = problemasDeConfiguracao();
if (problemas.length > 0) {
  console.error(`Configuração inválida para produção:\n- ${problemas.join('\n- ')}`);
  process.exit(1);
}
if (IS_PRODUCTION && !process.env.CLOUDINARY_URL) {
  console.warn('AVISO: CLOUDINARY_URL não definida. Imagens serão salvas em disco local e podem ser perdidas a cada deploy.');
}

// MONGODB_TIMEOUT_MS: prazo para achar o banco (padrão 8 s); maior ajuda com Atlas acordando ou máquina ocupada
conectarBanco({ timeoutMs: Number(process.env.MONGODB_TIMEOUT_MS) || undefined })
  .then(async () => {
    if (demoLigado()) {
      // O reset apaga tudo: a demonstração só parte num banco que é de demonstração
      const recusa = bancoAceitaDemonstracao(mongoose.connection.name);
      if (recusa) {
        console.error(recusa);
        process.exit(1);
      }
      // Demonstração: confere na partida (o servidor pode ter dormido além do prazo do reset)
      // e a cada 5 min; o horário do último reset fica no banco, não na memória
      const r = await conferirDemonstracao();
      console.log(`Modo demonstração LIGADO (dados de exemplo ${r}).`);
      agendarConferenciaDemonstracao();
    }
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
  })
  .catch((err) => {
    console.error('Erro ao conectar ao MongoDB:', err);
    process.exit(1);
  });

export default app;
