# 🎧 Speak Up — inglês progressivo (voz + escrita)

Jogo de estudo de inglês em **50 fases**: você fala ou escreve, o app corrige cada erro na hora
com explicação em português, dá estrelas e libera a próxima fase. Tem também **conversa livre com
um nativo dos EUA** (por voz ou texto, sobre qualquer assunto), revisão dos seus próprios erros e
acompanhamento de evolução — tudo salvo no seu aparelho.

Feito para o Guilherme retomar o inglês sozinho, com correção constante e dificuldade crescente.

---

## Usar no celular (recomendado)

O app é publicado de graça pelo **GitHub Pages** e vira um ícone na tela de início do celular.
O endereço `https://` é obrigatório: sem ele o navegador não libera o microfone.

**1. Ligar o GitHub Pages (uma única vez, pelo computador ou pelo próprio celular)**

1. Abra o repositório no GitHub → aba **Settings** (Configurações).
2. No menu da esquerda, clique em **Pages**.
3. Em *Build and deployment* → *Source*, escolha **Deploy from a branch**.
4. Em *Branch*, escolha a branch do projeto e a pasta **/ (root)** → **Save**.
5. Espere de 1 a 2 minutos e recarregue a página: aparece o link
   `https://guiperboni23.github.io/Aplicativo-de-Estudo-Ingl-s/`.

**2. Instalar no celular**

- **Android (Chrome):** abra o link → menu **⋮** → **Adicionar à tela inicial** / *Instalar app*.
- **iPhone (Safari):** abra o link → botão **Compartilhar** → **Adicionar à Tela de Início**.

Ele abre em tela cheia, com ícone próprio, e **funciona offline** (o único recurso que precisa de
internet é o reconhecimento de fala do Chrome).

**3. Liberar o microfone**

Na primeira gravação o navegador pergunta se pode usar o microfone — toque em **Permitir**.
Se negar sem querer: Chrome → 🔒 ao lado do endereço → *Permissões* → *Microfone* → Permitir.

> **Qual navegador:** no Android use o **Chrome** (reconhecimento de fala completo).
> No iPhone use o **Safari** (iOS 14.5+); se a fala não funcionar no seu aparelho, o chat escrito,
> os treinos e o progresso continuam funcionando normalmente, e o chat de voz tem um campo
> para digitar o que você diria.

> **Atenção:** o progresso fica salvo no navegador do aparelho. Celular e computador têm XP
> separados — use *Progresso → exportar JSON* para levar de um para o outro.

---

## Como usar

O app é um site estático (sem build, sem dependências obrigatórias). Como ele usa módulos ES,
precisa ser servido por HTTP — abrir o arquivo direto (`file://`) não funciona.

```bash
# opção 1 — qualquer servidor estático
python3 -m http.server 8787
# depois abra http://localhost:8787

# opção 2 — o servidor do projeto (serve o app e habilita o modo IA)
node server/proxy.mjs
# abre em http://localhost:8787
```

**Use o Chrome ou o Edge** (desktop ou Android): são os navegadores com reconhecimento de fala.
No Firefox/Safari o chat de voz fica indisponível, mas o chat escrito, os treinos e o progresso
funcionam normalmente. Na primeira gravação o navegador pede permissão de microfone — aceite.

Publicar no GitHub Pages também funciona — veja a seção "Usar no celular" acima.

---

## O mapa de fases

50 fases em trilha, divididas em 5 mundos. Cada fase tem 3 a 5 itens curtos, um tipo só e um foco só.
Você precisa de **55% de acerto** para passar; 75% dão 2 estrelas e 90% dão 3.

| Mundo | Fases | Foco |
| --- | --- | --- |
| Primeiros passos | 1–10 | verbo *to be*, apresentação, rotina |
| Dia a dia | 11–20 | presente, perguntas, negativas, pedidos |
| O passado | 21–30 | passado simples, irregulares, histórias |
| Conversas reais | 31–40 | trabalho, viagem, present perfect, preposições |
| Opinião e carreira | 41–50 | reunião, entrevista, condicional |

Cinco tipos de fase:

| Tipo | O que você faz |
| --- | --- |
| 🎤 **Falar** | responde uma pergunta em inglês falando; o app transcreve e corrige |
| ✍️ **Escrever** | responde por escrito a um tema em português |
| 🗣️ **Pronúncia** | lê uma frase em voz alta e vê, palavra por palavra, o que saiu |
| 🎧 **Ditado** | ouve a frase e escreve o que entendeu |
| 🔧 **Consertar** | recebe uma frase errada e escreve a versão certa |

Todo erro que você comete em qualquer fase vira **cartão de revisão**. Quando houver cartões
vencidos, aparece a **Revisão do dia** no topo do mapa (repetição espaçada de 1, 3, 7, 16 e 35 dias).

As outras três abas: **Conversa** (bate-papo livre, voz ou escrita), **Progresso**
(fases, estrelas, precisão, onde você mais erra) e **Ajustes** (voz, microfone, conversa com nativo).

## Como a correção funciona

Motor próprio (`js/corrector/`) com **mais de 200 regras** focadas nos erros típicos de brasileiros:

- **verbo `to be`**: `I have 30 years` → `I am 30 years old`, `I have hungry` → `I am hungry`
- **3ª pessoa**: `he work` → `he works`, `she dont like` → `she doesn't like`
- **tempo verbal**: `yesterday I go` → `yesterday I went`, `I live here since 2019` → `I have lived here since 2019`
- **preposições**: `listen music` → `listen to music`, `depend of` → `depend on`, `in monday` → `on Monday`
- **colocações**: `do a mistake` → `make a mistake`, `make a question` → `ask a question`
- **incontáveis**: `informations` → `information`, `advices` → `advice`
- **comparativos**: `more easy` → `easier`, `the most big` → `the biggest`
- **ordem das palavras**: `what means this?` → `what does this mean?`, `do you can?` → `can you?`
- **avisos** (sem alterar o texto): falsos cognatos (`pretend`, `actually`, `library`…) e palavras
  em português no meio da frase

Cada correção vem com categoria, gravidade, explicação em português e um exemplo.
No **modo voz**, pontuação e grafia não contam como erro (quem pontua é o reconhecimento de fala).

### Evolução progressiva

- Cada fase concluída dá **estrelas** (1 a 3) e **XP**; a fase seguinte só abre com pelo menos 1 estrela.
- O XP define o nível (A1 → A1+ → A2 → … → C1), que libera cenários mais difíceis na conversa livre.
- Os erros viram cartões de revisão e voltam até você acertar.
- A aba Progresso mostra em qual **categoria** você mais erra, com exemplos das suas frases.

---

## Conversa com um nativo (opcional)

Na aba **Conversa** você bate papo com o *Alex*, um americano de Denver, sobre qualquer assunto —
futebol, trabalho, filmes, o seu dia. Ele fala inglês casual e curto, tem opinião, devolve pergunta
e corrige seus erros do jeito que um amigo corrige: repetindo a frase certa dentro da resposta.
As explicações de gramática em português continuam vindo do corretor do próprio app, que roda
no aparelho e é instantâneo.

Isso usa a API da Anthropic e **é pago por uso** (cerca de 1 centavo de dólar por mensagem no
Claude Opus 5; o Haiku 4.5 custa umas 5 vezes menos). Há dois jeitos de ligar, em **Ajustes →
Conversa com nativo**:

**1. Chave neste aparelho — é o que funciona no celular**

1. Crie uma chave em [console.anthropic.com](https://console.anthropic.com) → *API keys*, e defina
   um limite de gastos na conta.
2. Em Ajustes, escolha *Chave neste aparelho*, cole a chave (`sk-ant-...`) e escolha o modelo.
3. Toque em **testar conversa**: se aparecer um ✅ com uma frase em inglês, está pronto.

O navegador chama a API direto, com os mesmos cabeçalhos que o SDK oficial usa no modo
`dangerouslyAllowBrowser`. A chave fica guardada só no seu aparelho — **quem pegar seu celular
desbloqueado consegue vê-la**, então use uma chave só para isso, com limite de gasto.

**2. Servidor local — mais seguro, mas só no computador**

```bash
cd server
npm install
export ANTHROPIC_API_KEY="sua-chave"
cd ..
node server/proxy.mjs       # http://localhost:8787
```

Em Ajustes, escolha *Servidor local*. A chave nunca entra no navegador. O modelo padrão é
`claude-opus-5` (mude com `SPEAKUP_MODEL=...`).

**Sem nada disso o app continua inteiro**: as 50 fases, a correção e os treinos não dependem de
internet, e a conversa livre cai no tutor offline, que puxa assunto e responde de forma simples.

---

## Testes

```bash
node --test "tests/*.test.mjs"
```

Os testes cobrem o formato das mensagens mandadas para a API, a morfologia (conjugação, comparativos, artigos), as correções por categoria,
o modo voz, o alinhamento de palavras da pronúncia e a integridade das 50 fases. Dois deles são
os mais importantes: **frases corretas não podem ser alteradas** e **toda resposta certa do
conteúdo tem que passar limpa pelo próprio corretor** — foi assim que apareceram (e foram
corrigidos) falsos positivos como "in the street" e "The kids play".

---

## Estrutura

```
index.html              casca do app (topo, conteúdo, barra de navegação)
manifest.webmanifest    dados de instalação no celular (nome, ícone, cor)
sw.js                   service worker: faz o app abrir offline
icons/                  ícones do app
css/styles.css          tema preto/verde/branco
js/app.js               navegação entre telas e topo (estrelas, ofensiva, nível)
js/missions.js          as 50 fases (conteúdo de todos os itens)
js/state.js             XP, estrelas, fases concluídas, ofensiva e revisão (localStorage)
js/speech.js            reconhecimento de fala + síntese de voz
js/corrector/
  rules.js              200+ regras de correção com explicação em português
  morphology.js         conjugação, plural, comparativos, artigos
  engine.js             aplica as regras, gera texto corrigido, diff e nota
js/lessons.js           assuntos, cenários e temas da conversa livre
js/tutor.js             respostas do tutor offline (plano B, sem internet)
js/persona.js           quem é o Alex: a instrução mandada em toda conversa
js/ai.js                conversa com nativo (chave no aparelho ou servidor local)
js/views/               telas: mapa, fase, conversa, progresso, ajustes
server/proxy.mjs        servidor local opcional (estáticos + API do tutor de IA)
tests/                  testes do corretor e do conteúdo das fases
```

## Privacidade

Tudo fica no `localStorage` do seu navegador (exporte o JSON de vez em quando na aba Progresso).
O reconhecimento de fala do Chrome envia o áudio para o serviço do navegador. A conversa com o
nativo, quando ligada, envia o que você fala ou escreve para a API da Anthropic — direto do
aparelho ou pelo servidor local, conforme o modo escolhido. Sem ela, nada sai do seu aparelho.
