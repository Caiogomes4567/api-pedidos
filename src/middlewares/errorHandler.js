const AppError = require('../errors/AppError');

// JSON malformado no corpo -> erro do cliente (400).
// AppError -> status definido pela regra de negócio.
// Qualquer outra coisa -> 500, sem vazar detalhes internos.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ erro: err.message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON malformado no corpo da requisição.' });
  }
  console.error(err);
  return res.status(500).json({ erro: 'Erro interno do servidor.' });
}

function rotaNaoEncontrada(req, res) {
  res.status(404).json({ erro: 'Rota não encontrada.' });
}

module.exports = { errorHandler, rotaNaoEncontrada };
