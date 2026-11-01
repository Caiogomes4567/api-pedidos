// Armazenamento em memória. Isola o "onde guardar" das regras de negócio.
let pedidos = [];
let proximoId = 1;

function criar(dados) {
  const pedido = { id: proximoId++, ...dados };
  pedidos.push(pedido);
  return pedido;
}

function listar() {
  return [...pedidos];
}

function buscarPorId(id) {
  return pedidos.find((p) => p.id === id) || null;
}

function atualizar(id, campos) {
  const pedido = buscarPorId(id);
  if (!pedido) return null;
  Object.assign(pedido, campos);
  return pedido;
}

// Usado apenas pelos testes para isolar cenários.
function limpar() {
  pedidos = [];
  proximoId = 1;
}

module.exports = { criar, listar, buscarPorId, atualizar, limpar };
