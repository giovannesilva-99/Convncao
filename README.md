# Dashboard da Convenção 2026

O dashboard deve ser acessado pelo servidor Node, não abrindo `index.html` diretamente como `file://`. O servidor busca a planilha no Google Sheets e entrega o CSV pela mesma origem do dashboard, evitando que cada navegador precise superar as políticas CORS do Google.

## Iniciar

Requer Node.js 18 ou mais recente. Na pasta do projeto, execute no PowerShell:

```powershell
npm.cmd install
node server.mjs
```

Mantenha essa janela aberta enquanto o dashboard estiver em uso. O terminal informa o endereço local e o endereço IPv4 da rede.

## Acessar em outros computadores

Os computadores precisam estar na mesma rede que o computador servidor. Compartilhe o endereço `http://IP-DO-COMPUTADOR:4173` mostrado pelo servidor. Não envie o arquivo HTML para cada pessoa abrir localmente.

No Windows, permita o Node.js na rede **Privada** quando o Firewall solicitar. Se o acesso for bloqueado sem aviso, a equipe de TI deve liberar entrada TCP na porta `4173` para a rede privada. O IP pode mudar ao reiniciar o roteador ou reconectar o computador; use o endereço exibido no terminal.

Para pessoas fora da rede local, publique `server.mjs` e `index.html` em um host acessível por todos e proteja o endpoint conforme as regras da empresa. O navegador deve usar a URL HTTPS desse host.

## Endpoints

- `/` serve o dashboard.
- `/api/responses` consulta o CSV público no servidor e mantém em memória a última cópia válida durante falhas temporárias do Google.
- `/vendor/papaparse.min.js` serve a dependência local, sem depender da CDN no navegador.

## Exportar presenças

Use **Exportar planilha CSV** na aba de presença para baixar a lista completa, incluindo todos os convidados. As colunas **Confirmação da participação** e **Na lista de convidados enviada** diferenciam confirmações, convidados sem resposta e respostas fora da lista. Uma resposta recebida sem uma opção válida de hospedagem fica marcada separadamente como pendente de confirmação. Quando uma pessoa envia o formulário mais de uma vez, o painel mantém apenas a resposta mais recente. E-mails alternativos conhecidos são associados ao convidado correspondente; respostas sem correspondência permanecem separadas. O arquivo usa UTF-8 com BOM e separador compatível com configurações regionais brasileiras para abrir corretamente no Excel.
