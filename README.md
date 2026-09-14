# 🎧 Speak Up — inglês progressivo (voz + escrita)

App de estudo próprio de inglês: você **fala** em inglês, o app **transcreve**, **corrige cada erro**
com explicação em português e **continua a conversa em voz alta**. Tem também chat escrito, treinos
curtos e acompanhamento de evolução — tudo salvo no seu navegador.

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

## As cinco abas

| Aba | O que faz |
| --- | --- |
| 🎙️ **Voz** | Toque no microfone (ou `Espaço`), fale uma frase. O app transcreve, mostra o que errou palavra por palavra, explica em português e responde em voz alta. |
| ⌨️ **Escrita** | Mesmo motor de correção para texto (`Ctrl+Enter` envia). Tem botão de tema para escrever quando faltar assunto. |
| 🏋️ **Treinos** | **Pronúncia** (lê a frase, o app compara palavra por palavra), **Ditado** (ouve e escreve) e **Revisar meus erros** (repetição espaçada com os *seus* erros). |
| 📈 **Progresso** | XP, nível (A1 → C1), ofensiva de dias, precisão por dia, erros recorrentes por categoria, histórico das frases e backup em JSON. |
| ⚙️ **Ajustes** | Voz do tutor, velocidade da fala, sotaque do reconhecimento, modo IA e atalhos. |

Atalhos: `1`–`5` trocam de aba · `Espaço` liga/desliga o microfone · `Ctrl+Enter` envia no chat escrito.

---

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

- Cada frase gera **XP** conforme tamanho e precisão; o XP define o nível (A1 → A1+ → A2 → … → C1).
- O nível **libera cenários** mais difíceis e frases mais longas nos treinos.
- Todo erro corrigido entra num **deck de revisão espaçada** (caixas de 1, 3, 7, 16 e 35 dias):
  o que você erra volta a aparecer até você acertar.
- A aba Progresso mostra em qual **categoria** você erra mais e sugere a mini-lição do dia.

---

## Modo IA (opcional)

Sem IA o app já corrige e conversa: o tutor offline tem 8 cenários roteirizados (café, entrevista,
reunião, viagem, médico, small talk…) e conversa livre com perguntas de acompanhamento.

Ligando o modo IA, as respostas ficam mais naturais e as correções mais detalhadas. A chave da API
fica **no seu computador**, dentro do servidor local — nunca na página:

```bash
cd server
npm install
export ANTHROPIC_API_KEY="sua-chave"   # ou: ant auth login
cd ..
node server/proxy.mjs                  # http://localhost:8787
```

Depois, em **Ajustes → Modo IA**, marque "usar o tutor de IA" e clique em "testar conexão".
Se o servidor cair, o app volta sozinho para o tutor offline.

O modelo padrão é `claude-opus-5` (mude com `SPEAKUP_MODEL=...`).

---

## Testes

```bash
node --test "tests/*.test.mjs"
```

Os testes cobrem a morfologia (conjugação, comparativos, artigos), as correções por categoria,
o modo voz, o alinhamento de palavras da pronúncia e — o mais importante — garantem que
**frases corretas não são alteradas**.

---

## Estrutura

```
index.html              interface e abas
manifest.webmanifest    dados de instalação no celular (nome, ícone, cor)
sw.js                   service worker: faz o app abrir offline
icons/                  ícones do app
css/styles.css          tema escuro
js/app.js               abas, HUD (nível/XP/ofensiva), atalhos
js/state.js             XP, níveis, ofensiva, histórico e revisão espaçada (localStorage)
js/speech.js            reconhecimento de fala + síntese de voz
js/corrector/
  rules.js              200+ regras de correção com explicação em português
  morphology.js         conjugação, plural, comparativos, artigos
  engine.js             aplica as regras, gera texto corrigido, diff e nota
js/lessons.js           cenários, frases de pronúncia, ditados, temas de escrita
js/tutor.js             tutor offline (respostas, mini-lições)
js/ai.js                cliente do modo IA
js/views/               telas: conversa, treinos, progresso, ajustes
server/proxy.mjs        servidor local opcional (estáticos + API do tutor de IA)
tests/                  testes do motor de correção
```

## Privacidade

Tudo fica no `localStorage` do seu navegador (exporte o JSON de vez em quando na aba Progresso).
O reconhecimento de fala do Chrome envia o áudio para o serviço do navegador; o modo IA, quando
ligado, envia suas frases para a API da Anthropic através do servidor local.
