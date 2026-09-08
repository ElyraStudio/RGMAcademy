# RGM Court Booker

Prompt para o Lovable:

Crie um sistema web de agendamento de quadras esportivas para a RGM Academy, com suporte a múltiplas quadras (o número deve ser configurável, não fixo em 2 — o admin pode cadastrar quantas quadras quiser).

1. Página inicial (cliente)

Seleção de qual quadra (ex: Quadra 1, Quadra 2, Quadra 3...), cada uma com nome, foto e tipo de esporte (futsal/vôlei/beach tennis)

Calendário/agenda visual mostrando dias e horários disponíveis e ocupados para a quadra selecionada

Horários organizados em blocos (ex: 1h ou 1h30), com status visual claro: disponível, ocupado, bloqueado pelo admin

Ao clicar num horário livre, abre formulário de reserva: nome, telefone/WhatsApp, data, horário, quadra selecionada

Opção de reserva recorrente/horário fixo: cliente pode marcar o mesmo horário toda semana (ex: toda terça às 19h), o sistema já reserva automaticamente as próximas datas

Tabela de valores visível na página, mostrando preço por horário/turno (manhã, tarde, noite) e por quadra, caso os valores sejam diferentes entre elas

Confirmação de reserva (por enquanto sem pagamento integrado, apenas registro do pedido)

2. Painel administrativo (protegido por login)

Dashboard com visão geral: reservas do dia, da semana, taxa de ocupação por quadra

Lista de todas as reservas (data, horário, quadra, cliente, telefone, status, se é fixa/recorrente)

Capacidade de criar, editar e cancelar reservas manualmente (para casos de reserva por telefone/WhatsApp)

Bloqueio de horários pelo admin: o dono pode bloquear qualquer horário específico (manutenção, evento, uso interno) diretamente pelo painel, e esse horário some da disponibilidade pro cliente

Gerenciar reservas fixas/recorrentes (criar, pausar, cancelar a recorrência)

Gerenciar tabela de valores: editar preços por quadra e por horário/turno

Cadastro e edição das quadras (nome, tipo de esporte, ativa/inativa) — permitir adicionar novas quadras livremente

3. Design

Interface totalmente responsiva, otimizada tanto para celular quanto para desktop — priorize a experiência mobile no fluxo de reserva (a maioria dos clientes vai acessar pelo celular), mas o painel admin deve funcionar bem também em telas grandes

Paleta de cores: azul bebê claro e branco como cores principais, visual limpo e leve

Nome do sistema/marca: RGM Academy

Fácil leitura da tabela de horários mesmo em telas pequenas

4. Estrutura de dados sugerida

Tabela quadras: id, nome, tipo_esporte, ativa

Tabela reservas: id, quadra_id, data, horario_inicio, horario_fim, nome_cliente, telefone, status, recorrente (booleano), dia_semana_recorrencia

Tabela precos: id, quadra_id, turno (manhã/tarde/noite), valor

Tabela bloqueios: id, quadra_id, data, horario_inicio, horario_fim, motivo

Não incluir integração de pagamento nesta primeira versão — isso será adicionado depois.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a5d5d4b2-ddc7-4256-8442-b9bc71c1ec7c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
