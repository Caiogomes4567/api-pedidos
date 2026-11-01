const AppError = require('../errors/AppError');
const repository = require('../repositories/pedidos.repository');

const TIPOS = ['entrega', 'retirada', 'local'];
const PRIORIDADES = ['baixa', 'normal', 'alta'];
const STATUS = ['recebido', 'em_preparacao', 'enviado', 'entregue', 'cancelado'];

// Transições permitidas (máquina de estados simples).
const TRANSICOES = {
  recebido: ['em_preparacao', 'cancelado'],
  em_preparacao: ['enviado', 'cancelado'],
  enviado: ['entregue'],
  entregue: [],
  cancelado: [],
};

function validarPedido(dados) {
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
    throw new AppError('Corpo da requisição inválido.', 400);
  }
  const { cliente, tipo, valor, prioridade } = dados;

  if (typeof cliente !== 'string' || cliente.trim() === '') {
    throw new AppError('O campo "cliente" é obrigatório e deve ser um texto não vazio.', 400);
  }
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0) {
    throw new AppError('O campo "valor" deve ser numérico e maior que zero.', 400);
  }
  if (!TIPOS.includes(tipo)) {
    throw new AppError(`O campo "tipo" deve ser um de: ${TIPOS.join(', ')}.`, 400);
  }
  if (!PRIORIDADES.includes(prioridade)) {
    throw new AppError(`O campo "prioridade" deve ser um de: ${PRIORIDADES.join(', ')}.`, 400);
  }
  return { cliente: cliente.trim(), tipo, valor, prioridade };
}

// IDs não numéricos ("abc", "1.5", "-1") também não existem -> 404.
function parseId(idTexto) {
  return /^[1-9]\d*$/.test(String(idTexto)) ? Number(idTexto) : null;
}

function criarPedido(dados) {
  const valido = validarPedido(dados);
  return repository.criar({ ...valido, status: 'recebido' });
}

function listarPedidos() {
  return repository.listar();
}

function consultarPedido(idTexto) {
  const id = parseId(idTexto);
  const pedido = id === null ? null : repository.buscarPorId(id);
  if (!pedido) throw new AppError('Pedido não encontrado.', 404);
  return pedido;
}

function atualizarStatus(idTexto, dados) {
  // Ordem: 404 (recurso) antes de 400 (corpo) para IDs inexistentes.
  const pedido = consultarPedido(idTexto);

  const novoStatus = dados && dados.status;
  if (!STATUS.includes(novoStatus)) {
    throw new AppError(`O campo "status" deve ser um de: ${STATUS.join(', ')}.`, 400);
  }
  if (!TRANSICOES[pedido.status].includes(novoStatus)) {
    const permitidas = TRANSICOES[pedido.status].join(', ') || 'nenhuma';
    throw new AppError(
      `Transição inválida: "${pedido.status}" -> "${novoStatus}". Permitidas: ${permitidas}.`,
      400
    );
  }
  return repository.atualizar(pedido.id, { status: novoStatus });
}

module.exports = {
  criarPedido,
  listarPedidos,
  consultarPedido,
  atualizarStatus,
  TIPOS,
  PRIORIDADES,
  STATUS,
  TRANSICOES,
};
