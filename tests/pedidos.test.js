const request = require('supertest');
const app = require('../src/app');
const repository = require('../src/repositories/pedidos.repository');

const pedidoValido = { cliente: 'Carlos Silva', tipo: 'entrega', valor: 350, prioridade: 'normal' };

beforeEach(() => repository.limpar());

describe('POST /pedidos', () => {
  test('cria pedido válido com 201 e status "recebido"', async () => {
    const res = await request(app).post('/pedidos').send(pedidoValido);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 1, ...pedidoValido, status: 'recebido' });
  });

  test('remove espaços do cliente', async () => {
    const res = await request(app).post('/pedidos').send({ ...pedidoValido, cliente: '  Ana  ' });
    expect(res.status).toBe(201);
    expect(res.body.cliente).toBe('Ana');
  });

  test.each([
    ['cliente vazio', { cliente: '' }],
    ['cliente só espaços', { cliente: '   ' }],
    ['cliente ausente', { cliente: undefined }],
    ['valor zero', { valor: 0 }],
    ['valor negativo', { valor: -10 }],
    ['valor string', { valor: '350' }],
    ['valor ausente', { valor: undefined }],
    ['tipo inválido', { tipo: 'voador' }],
    ['prioridade inválida', { prioridade: 'urgentissima' }],
  ])('rejeita %s com 400 e mensagem', async (_nome, alteracao) => {
    const res = await request(app).post('/pedidos').send({ ...pedidoValido, ...alteracao });
    expect(res.status).toBe(400);
    expect(res.body.erro).toEqual(expect.any(String));
  });

  test('JSON malformado retorna 400', async () => {
    const res = await request(app).post('/pedidos').set('Content-Type', 'application/json').send('{ quebrado');
    expect(res.status).toBe(400);
  });
});

describe('GET /pedidos', () => {
  test('lista vazia retorna 200 e []', async () => {
    const res = await request(app).get('/pedidos');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('lista pedidos cadastrados', async () => {
    await request(app).post('/pedidos').send(pedidoValido);
    await request(app).post('/pedidos').send(pedidoValido);
    const res = await request(app).get('/pedidos');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});

describe('GET /pedidos/:id', () => {
  test('retorna pedido existente', async () => {
    await request(app).post('/pedidos').send(pedidoValido);
    const res = await request(app).get('/pedidos/1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  test.each(['999', 'abc', '0', '-1', '1.5'])('ID "%s" inexistente retorna 404', async (id) => {
    const res = await request(app).get(`/pedidos/${id}`);
    expect(res.status).toBe(404);
  });
});

describe('PATCH /pedidos/:id/status', () => {
  beforeEach(async () => {
    await request(app).post('/pedidos').send(pedidoValido);
  });

  test('transição válida retorna 200', async () => {
    const res = await request(app).patch('/pedidos/1/status').send({ status: 'em_preparacao' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('em_preparacao');
  });

  test('percorre o fluxo completo até entregue', async () => {
    for (const status of ['em_preparacao', 'enviado', 'entregue']) {
      const res = await request(app).patch('/pedidos/1/status').send({ status });
      expect(res.status).toBe(200);
    }
  });

  test('status desconhecido retorna 400', async () => {
    const res = await request(app).patch('/pedidos/1/status').send({ status: 'voando' });
    expect(res.status).toBe(400);
  });

  test('corpo sem status retorna 400', async () => {
    const res = await request(app).patch('/pedidos/1/status').send({});
    expect(res.status).toBe(400);
  });

  test('transição proibida (recebido -> entregue) retorna 400', async () => {
    const res = await request(app).patch('/pedidos/1/status').send({ status: 'entregue' });
    expect(res.status).toBe(400);
    expect(res.body.erro).toMatch(/Transição inválida/);
  });

  test('pedido cancelado não pode mudar de status', async () => {
    await request(app).patch('/pedidos/1/status').send({ status: 'cancelado' });
    const res = await request(app).patch('/pedidos/1/status').send({ status: 'em_preparacao' });
    expect(res.status).toBe(400);
  });

  test('ID inexistente retorna 404', async () => {
    const res = await request(app).patch('/pedidos/999/status').send({ status: 'cancelado' });
    expect(res.status).toBe(404);
  });
});

describe('Erros inesperados', () => {
  test('rota inexistente retorna 404 em JSON', async () => {
    const res = await request(app).get('/nada');
    expect(res.status).toBe(404);
  });

  test('falha interna retorna 500 (não 400)', async () => {
    const spy = jest.spyOn(repository, 'listar').mockImplementation(() => {
      throw new Error('falha simulada');
    });
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = await request(app).get('/pedidos');
    expect(res.status).toBe(500);
    expect(res.body.erro).toBe('Erro interno do servidor.');
    spy.mockRestore();
    errSpy.mockRestore();
  });
});
