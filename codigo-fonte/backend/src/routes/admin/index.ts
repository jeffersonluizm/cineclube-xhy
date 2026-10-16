import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import revistas from './revistas';
import artigos from './artigos';
import catalogos from './catalogos';
import ciclos from './ciclos';
import filmes from './filmes';
import sobre from './sobre';
import resumo from './resumo';
import { criarLimitadorEscritaDemo, tetoDemo } from '../../middleware/demo';

/** Painel do editor: todas as rotas exigem token */
const router = Router();
router.use(requireAuth);
// Demonstração pública: escritas por hora e teto de volume por coleção (fora dela, nada muda)
router.use(criarLimitadorEscritaDemo());
router.post('/revistas', tetoDemo('revistas'));
router.post('/artigos', tetoDemo('textos'));
router.post('/catalogos', tetoDemo('catalogos'));
router.post('/ciclos', tetoDemo('ciclos'));
router.post('/filmes', tetoDemo('filmes'));
router.use('/revistas', revistas);
router.use('/artigos', artigos);
router.use('/catalogos', catalogos);
router.use('/ciclos', ciclos);
router.use('/filmes', filmes);
router.use('/sobre', sobre);
router.use('/resumo', resumo);

export default router;
