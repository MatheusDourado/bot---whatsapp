const mockIdentificarUsuario = jest.fn();
const mockSendWhatsAppMessage = jest.fn();

jest.mock('../services/citsmartService', () => ({
  identificarUsuario: mockIdentificarUsuario,
}));

jest.mock('../services/twilioService', () => ({
  sendWhatsAppMessage: mockSendWhatsAppMessage,
}));

const { subfluxoIdentificacao } = require('../utils/identificacaoUsuario');

describe('subfluxoIdentificacao', () => {
  beforeEach(() => {
    mockIdentificarUsuario.mockReset();
    mockSendWhatsAppMessage.mockReset();
  });

  test('identifies user via phone', async () => {
    mockIdentificarUsuario.mockResolvedValue({ idempregado: 123 });
    const session = {};
    const from = 'whatsapp:+5511999999999';

    const result = await subfluxoIdentificacao({ from, body: '', session });

    expect(result).toBe(true);
    expect(session.idempregado).toBe(123);
    expect(mockIdentificarUsuario).toHaveBeenCalledWith({ telefone: '5511999999999' });
    expect(mockSendWhatsAppMessage).toHaveBeenCalledWith(from, '✅ Identificado por telefone!');
  });

  test('falls back from phone to name then login', async () => {
    mockIdentificarUsuario
      .mockResolvedValueOnce(null) // phone
      .mockResolvedValueOnce(null) // name
      .mockResolvedValueOnce({ idempregado: 77 }); // login success

    const session = {};
    const from = 'whatsapp:+5511888888888';

    let result = await subfluxoIdentificacao({ from, body: '', session });
    expect(result).toBe(false);
    expect(session.identStep).toBe('nome');
    expect(mockSendWhatsAppMessage).toHaveBeenLastCalledWith(
      from,
      'Não achei seu telefone. Digite seu NOME COMPLETO (com acentos):'
    );

    result = await subfluxoIdentificacao({ from, body: 'John Doe', session });
    expect(result).toBe(false);
    expect(session.identStep).toBe('login');
    expect(mockSendWhatsAppMessage).toHaveBeenLastCalledWith(
      from,
      'Não localizei pelo nome. Agora, digite o LOGIN do CITSMART:'
    );

    result = await subfluxoIdentificacao({ from, body: 'jdoe', session });
    expect(result).toBe(true);
    expect(session.idempregado).toBe(77);
    expect(mockSendWhatsAppMessage).toHaveBeenLastCalledWith(from, '✅ Identificado por login!');
    expect(mockIdentificarUsuario.mock.calls).toEqual([
      [{ telefone: '5511888888888' }],
      [{ nome: 'John Doe' }],
      [{ login: 'jdoe' }],
    ]);
  });

  test('handles unsuccessful identification', async () => {
    mockIdentificarUsuario
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const session = {};
    const from = 'whatsapp:+5511777777777';

    let result = await subfluxoIdentificacao({ from, body: '', session });
    expect(result).toBe(false);
    result = await subfluxoIdentificacao({ from, body: 'John', session });
    expect(result).toBe(false);
    result = await subfluxoIdentificacao({ from, body: 'johnd', session });
    expect(result).toBe('ENCERRAR');
    expect(session.idempregado).toBeUndefined();
    expect(mockSendWhatsAppMessage).toHaveBeenLastCalledWith(
      from,
      '❌ Não consegui identificar. Sessão encerrada. Contate o suporte.'
    );
  });
});
