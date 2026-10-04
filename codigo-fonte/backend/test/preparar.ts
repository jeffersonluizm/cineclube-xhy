// Carregado pelo npm test (--import) antes de qualquer teste, no runner e em cada arquivo:
// impede que um teste caia no banco embutido de desenvolvimento (porta 27018, backend/data/db).
process.env.CINECLUBE_PROIBIR_BANCO_DEV = '1';
