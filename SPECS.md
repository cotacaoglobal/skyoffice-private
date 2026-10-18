# Especificações Técnicas e Registro de Correções (Specs)

Este documento centraliza as especificações de arquitetura, comportamento esperado e o registro formal de resoluções de bugs críticos da aplicação **SkyOffice**.

---

## 1. Comportamento e Isolamento de Sessões no Servidor

### Especificação Esperada
- Cada participante conectado no escritório é unicamente identificado por seu `client.sessionId` gerado pelo Colyseus.
- Um jogador NUNCA deve ser removido da sala (`state.players.delete(...)`) em virtude de atualizações de metadados (como nome, textura do avatar ou associação com mesas/cadeiras).
- Apenas a desconexão real de rede ou ação explícita de saída (`onLeave`) autoriza a remoção do jogador da sala.

### Correção Registrada: Bug de Desaparecimento de Membro ao Clicar na Mesa
- **Problema anterior**: Ao associar ou clicar em mesas/cadeiras, o evento `UPDATE_PLAYER_NAME` executava uma busca de desduplicação por nome e deletava sessões concorrentes (`this.state.players.delete(sId)`). Quando dois usuários tinham nomes semelhantes ou colidiam na atualização, o outro membro desaparecia do mapa do colega (e ficava incomunicável).
- **Resolução Implementada** (`server/rooms/SkyOffice.ts`):
  - Remoção de qualquer chamada de deleção de jogador dentro de `UPDATE_PLAYER_NAME`.
  - O jogador só é removido no handler do ciclo de vida nativo do Colyseus (`onLeave`).
- **Status Atual**: ✅ **Funcionando perfeitamente**. Todos os membros permanecem visíveis e conectados mesmo clicando ou associando mesas/cadeiras.

---

## 2. Isolamento de Entrada de Teclado (Chat vs Movimentação Phaser)

### Especificação Esperada
- Ao digitar no campo de texto do chat (`<input>` / `TextField`), nenhuma tecla (como `W`, `A`, `S`, `D`, `Setas`, `E`, `R`, etc.) deve vazar para o motor do jogo (Phaser).
- Ao caminhar pelo mapa com o chat aberto, o cursor de texto dentro do campo de digitação não deve se mover com as setas do teclado.
- Clicar no mapa / canvas do jogo deve automaticamente remover o foco de qualquer campo HTML (`document.activeElement.blur()`) e devolver os controles exclusivamente ao avatar.

### Correção Registrada: Interferência de Teclas entre Chat e Phaser
- **Problema anterior**: O cursor de texto se movia ao andar com setas/WASD e digitar no chat acionava comandos do avatar no canvas.
- **Resolução Implementada**:
  - `client/src/components/Chat.tsx`: Adicionado `event.stopPropagation()` em `onKeyDown`, `onKeyUp` e `onKeyPress` no `InputTextField`. Removido `dispatch(setFocused(true))` invasivo ao apenas abrir o painel de mensagens.
  - `client/src/scenes/Game.ts`: Adicionado listener de `pointerdown` no canvas que executa `blur()` em elementos HTML ativos e despacha `setFocused(false)`. Os métodos `disableKeys()` e `enableKeys()` agora chamam `resetKeys()` para limpar teclas presas. No loop `update()`, se o teclado estiver desabilitado, a velocidade do avatar é zerada imediatamente.
- **Status Atual**: ✅ **Funcionando perfeitamente**. As funções operam de maneira completamente isolada sem qualquer interferência mútua.

---

## 3. Persistência de Sessão e Reconexão Automática (F5 / Refresh)

### Especificação Esperada
- Quando o usuário atualizar a página (`F5`), fechar e reabrir a aba, ele não deve ser forçado a passar novamente pelo seletor de salas, digitação manual do nome ou escolha de avatar.
- A aplicação deve restaurar a sessão automaticamente e colocá-lo diretamente dentro do escritório virtual.
- Caso o usuário deseje sair definitivamente e trocar de sala ou nome, deve utilizar o botão "Sair do Escritório" na barra lateral de membros.

### Correção Registrada: Perda de Contexto e Retorno ao Lobby no Refresh
- **Problema anterior**: Todo F5 resetava o estado global do Redux, exibindo a tela inicial de salas e exigindo preenchimento de tudo novamente.
- **Resolução Implementada**:
  - `client/src/components/LoginDialog.tsx`: Ao entrar no escritório, grava no `localStorage`:
    - `skyoffice_user_name`: Nome escolhido pelo usuário.
    - `skyoffice_user_avatar`: Textura/avatar selecionado.
    - `skyoffice_auto_login`: `'true'`.
  - `client/src/App.tsx`: Criação de fluxo de auto-reconexão com feedback visual (*"🏢 Reconectando ao Escritório... Restaurando sua sessão e avatar..."*). Conecta automaticamente na sala pública, inicializa o Game Scene e entra no escritório sem intervenção manual.
  - `client/src/components/MembersSidebar.tsx`: Ao clicar em "Sair do Escritório", remove `skyoffice_auto_login` do `localStorage`, permitindo retornar intencionalmente ao lobby para selecionar outra sala.
- **Status Atual**: ✅ **Funcionando perfeitamente**. O usuário volta direto ao escritório em qualquer recarregamento da página.

---

## 4. Comunicação por Proximidade (WebRTC / Áudio e Vídeo)

### Especificação Esperada
- Quando dois avatares se aproximam a uma distância de proximidade no mapa (definida em `MyPlayer` e `OtherPlayer`), a chamada de vídeo e áudio via WebRTC/PeerJS deve ser iniciada automaticamente.
- Ambos os membros devem ver e ouvir um ao outro em tempo real.
- Ao se afastarem além do raio de alcance, a chamada é finalizada automaticamente.

### Verificação
- A correção do isolamento do estado dos jogadores no servidor garantiu que as instâncias do `OtherPlayer` permaneçam ativas no Phaser do cliente, permitindo que a verificação de proximidade (`Phaser.Math.Distance.Between`) funcione continuamente sem interrupções.
- **Status Atual**: ✅ **Funcionando perfeitamente**.

---

## 5. Gravação de Reuniões com Compatibilidade Multi-Dispositivo (Desktop & Mobile)

### Especificação Esperada
- No desktop, a gravação captura áudio mixado (tela + microfone local + colegas via WebRTC) e vídeo da tela compartilhada.
- No mobile (onde `getDisplayMedia` é bloqueado por restrições dos navegadores móveis), a gravação realiza fallback automático para captura de áudio local + vozes dos participantes sem travar ou falhar silenciosamente.
- Suporte a formatos de vídeo `video/webm` e `video/mp4` conforme a compatibilidade do dispositivo.

### Correção Registrada: Gravação Mobile e Falhas Silenciosas
- **Problema anterior**: No celular, clicar em "Gravar Reunião" falhava silenciosamente porque navegadores mobile rejeitam `getDisplayMedia`.
- **Resolução Implementada** (`client/src/components/BottomTaskbar.tsx`):
  - Fallback defensivo que detecta suporte a `getDisplayMedia` e, em caso de erro ou dispositivo móvel, grava o áudio do mixer e vídeo da câmera do avatar.
  - Seleção dinâmica do `mimeType` suportado pelo navegador (`video/webm` ou `video/mp4`).
- **Status Atual**: ✅ **Funcionando perfeitamente**.

---

## 6. Persistência de Vídeos Gravados no Navegador (IndexedDB)

### Especificação Esperada
- Vídeos gravados não devem sumir após recarregar a página (F5) ou fechar e reabrir o escritório.
- O usuário deve poder reproduzir qualquer reunião gravada anterior diretamente pela aba "Vídeos Gravados" da Central de Reuniões.

### Correção Registrada: Perda de Blob URL em Recarregamentos
- **Problema anterior**: Os vídeos gravados geravam apenas URLs em memória (`blob:http...`), que eram descartadas pelo navegador ao sair da sessão ou dar F5.
- **Resolução Implementada** (`client/src/services/VideoStorageService.ts` e `client/src/components/MeetingHistoryDialog.tsx`):
  - Criação de armazenamento persistente com `IndexedDB` (`skyoffice_media_db`), que suporta grandes volumes de dados (vídeos HD).
  - Ao gravar, o `Blob` do vídeo é salvo no IndexedDB associado ao ID da reunião.
  - Ao abrir a Central de Reuniões, as URLs de vídeo são reidratadas automaticamente via `VideoStorageService.getVideoUrl(m.id)`.
- **Status Atual**: ✅ **Funcionando perfeitamente**. Os vídeos gravados permanecem acessíveis e prontos para reprodução/download mesmo após múltiplos recarregamentos.

---

## 7. Central de Atas e Inteligência Artificial Centralizada por Escritório

### Especificação Esperada
- Apenas **UMA** chave de API da IA (Google Gemini) deve ser configurada por escritório, compartilhada entre todos os membros da equipe.
- Membros comuns não precisam saber, gerar ou digitar chaves de API individuais.
- Ao salvar a chave na aba "Configuração de IA", ela é sincronizada no backend do servidor e compartilhada para toda a organização.
- A IA do Gemini 1.5 Flash deve processar o áudio gravado e gerar a ata completa: resumo executivo, decisões aprovadas, itens de ação, compromissos por pessoa e transcrição.

### Correção Registrada: Falha de Geração de Atas e Chaves Fragmentadas por Usuário
- **Problema anterior**: A chave de API ficava restrita ao `localStorage` do computador de quem a digitou. Se a resposta da IA retornasse blocos markdown envoltos em ```json, o parse quebrava e gerava apenas fallback genérico sem transcrição.
- **Resolução Implementada**:
  - `server/index.ts`: Criados os endpoints `/api/office-settings` (GET e POST) para armazenamento centralizado da chave corporativa da IA no servidor.
  - `client/src/services/MeetingStorage.ts`: Adicionado `getApiKeyAsync()` e `setApiKey()`, sincronizando automaticamente com o servidor central.
  - `client/src/services/GeminiMeetingService.ts`: Sanitização inteligente de blocos de resposta JSON com suporte a remoção de formatação markdown antes do parse, garantindo extração robusta de resumos, transcrição e decisões.
  - Atualização dos serviços `BiaChatService` e `SemanticSearchService` para utilizar a chave corporativa unificada.
- **Status Atual**: ✅ **Funcionando perfeitamente**. A IA processa áudio, atas, busca semântica e chat com a assistente Bia de forma centralizada.

