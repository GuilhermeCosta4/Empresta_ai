# Solicitar empréstimo

**Status:** Implementado e validado localmente com build de produção. Validação na Vercel pendente.

- **CA-01:** Um item disponível gera imediatamente um empréstimo e um evento de auditoria na mesma transação. O vencimento fica a 14 dias corridos da criação e é exibido no fuso de São Paulo. O item passa a emprestado.
- **CA-02:** Manutenção, indisponibilidade, três empréstimos ativos e vencimento ultrapassado bloqueiam a solicitação com motivo visível. O empréstimo está em atraso quando o instante atual ultrapassa o vencimento.
- **CA-03:** Pedidos simultâneos criam no máximo um empréstimo ativo por equipamento e não ultrapassam o limite por pessoa.
- **CA-04:** O tenant e o titular vêm da sessão. “Meus empréstimos” mostra apenas os itens ativos do titular e suas datas previstas.

O PRD prevalece sobre o briefing quanto ao limite de três e ao prazo corrido. O crédito do Pixabay permanece conforme a decisão aprovada. Devolução, reserva, renovação e Operações ficam fora desta entrega.
