# Catálogo autenticado

**Status:** Implementado e validado localmente com build de produção. Validação na Vercel pendente.

- **CA-01:** Com sessão e vínculo, a pessoa vê os 12 equipamentos do tenant, com patrimônio, nome, categoria e situação. Manutenção tem prioridade e empréstimos sem devolução tornam o item emprestado.
- **CA-02:** A página e o procedimento exigem autenticação. A listagem deriva o tenant do vínculo e exclui equipamentos de outros tenants.
- **CA-03:** Busca por nome, patrimônio ou categoria e filtros de categoria e situação atualizam os cartões. A foto usa o caminho público do Storage. A ausência de foto tem indicação visível. O crédito do Pixabay aparece no catálogo.

Solicitação de empréstimo e troca da foto de TI-0012 pertencem a tarefas separadas.
