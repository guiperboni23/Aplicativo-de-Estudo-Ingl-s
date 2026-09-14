# 🎧 Speak Up — inglês progressivo (voz + escrita)

Jogo de estudo de inglês em **50 fases**: você fala ou escreve, o app corrige cada erro na hora
com explicação em português, dá estrelas e libera a próxima fase. Tem também conversa livre por
voz ou texto, revisão dos seus próprios erros e acompanhamento de evolução.

**É gratuito e funciona offline.** Não tem conta, não tem assinatura, não tem serviço pago por
trás: tudo — correção, conversa, fontes, ícones — roda dentro do seu aparelho.

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

# opção 2 — o servidor do projeto (mesma coisa, sem dependências)
node server/serve.mjs
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

## Conversa livre

Na aba **Conversa** você bate papo com o Alex, o parceiro de conversa do app, por voz ou por
escrito. Ele não é um modelo de linguagem — é um motor de diálogo que roda no aparelho:

- reconhece o assunto pelo que você escreve (trabalho, família, comida, futebol, viagem, bichos,
  filmes, música, tecnologia, dinheiro, saúde, planos, infância, cidade e mais);
- reage ao tom do que você disse ("That's awesome" / "Yeah, that sounds rough");
- tem opiniões próprias e faz sempre uma pergunta nova, sem repetir na mesma conversa;
- lembra dos assuntos que você trouxe e volta neles depois;
- quando você erra, sugere uma frase pronta para guardar, da categoria do seu erro.

E, o tempo todo, o corretor analisa cada frase sua e explica os erros em português.

Se preferir treinar uma situação específica, o mesmo seletor tem 8 cenários com roteiro (café,
restaurante, aeroporto, médico, reunião, entrevista…).

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
js/tutor.js             motor de diálogo: reações, perguntas, memória da conversa
js/views/               telas: mapa, fase, conversa, progresso, ajustes
css/fonts.css           fontes do app (arquivos em fonts/, nada vem de fora)
server/serve.mjs        servidor estático para testar no computador (sem dependências)
tests/                  testes do corretor, do conteúdo das fases e da conversa
```

## Privacidade

Seu progresso fica no `localStorage` do navegador (exporte o JSON de vez em quando na aba
Progresso). O app **não faz nenhuma requisição para fora** — as fontes e os ícones são servidos
junto com ele. A única coisa que sai do aparelho é o áudio do reconhecimento de fala, que o
próprio navegador (Chrome/Safari) manda para o serviço dele para transcrever; no chat escrito e
nas fases de escrita, nem isso.
