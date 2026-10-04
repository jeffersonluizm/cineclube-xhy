import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import revistas from './revistas';
import artigos from './artigos';
import catalogos from './catalogos';
import ciclos from './ciclos';
import filmes from './filmes';
import sobre from './sobre';
import resumo from './resumo';

/** Painel do editor: todas as rotas exigem token */
const router = Router();
router.use(requireAuth);
router.use('/revistas', revistas);
router.use('/artigos', artigos);
router.use('/catalogos', catalogos);
router.use('/ciclos', ciclos);
router.use('/filmes', filmes);
router.use('/sobre', sobre);
router.use('/resumo', resumo);

export default router;
