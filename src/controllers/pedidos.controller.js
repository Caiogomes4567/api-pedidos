const service = require('../services/pedidos.service');

// Controller: traduz HTTP <-> service. Não contém regra de negócio.
function criar(req, res, next) {
  try {
    res.status(201).json(service.criarPedido(req.body));
  } catch (err) {
    next(err);
  }
}

function listar(req, res, next) {
  try {
    res.status(200).json(service.listarPedidos());
  } catch (err) {
    next(err);
  }
}

function consultar(req, res, next) {
  try {
    res.status(200).json(service.consultarPedido(req.params.id));
  } catch (err) {
    next(err);
  }
}

function atualizarStatus(req, res, next) {
  try {
    res.status(200).json(service.atualizarStatus(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

module.exports = { criar, listar, consultar, atualizarStatus };
