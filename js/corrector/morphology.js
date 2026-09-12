// Morfologia verbal usada pelas regras de correção.

const THIRD_IRREGULAR = {
  be: 'is', have: 'has', do: 'does', go: 'goes', say: 'says', can: 'can',
};

/** Conjuga um verbo na 3ª pessoa do singular (he/she/it). */
export function third(verb) {
  const v = verb.toLowerCase();
  if (THIRD_IRREGULAR[v]) return THIRD_IRREGULAR[v];
  if (/(?:s|x|z|ch|sh)$/.test(v)) return `${v}es`;
  if (/[^aeiou]y$/.test(v)) return `${v.slice(0, -1)}ies`;
  if (/(?:o)$/.test(v)) return `${v}es`;
  return `${v}s`;
}

const PAST_IRREGULAR = {
  be: 'was', begin: 'began', break: 'broke', bring: 'brought', build: 'built',
  buy: 'bought', catch: 'caught', choose: 'chose', come: 'came', cost: 'cost',
  cut: 'cut', do: 'did', drink: 'drank', drive: 'drove', eat: 'ate', fall: 'fell',
  feel: 'felt', find: 'found', fly: 'flew', forget: 'forgot', get: 'got',
  give: 'gave', go: 'went', grow: 'grew', have: 'had', hear: 'heard',
  hold: 'held', keep: 'kept', know: 'knew', lead: 'led', learn: 'learned',
  leave: 'left', lend: 'lent', let: 'let', lose: 'lost', make: 'made',
  mean: 'meant', meet: 'met', pay: 'paid', put: 'put', read: 'read',
  ride: 'rode', run: 'ran', say: 'said', see: 'saw', sell: 'sold', send: 'sent',
  sing: 'sang', sit: 'sat', sleep: 'slept', speak: 'spoke', spend: 'spent',
  stand: 'stood', swim: 'swam', take: 'took', teach: 'taught', tell: 'told',
  think: 'thought', understand: 'understood', wake: 'woke', wear: 'wore',
  win: 'won', write: 'wrote',
};

/** Verbo/adjetivo de uma sílaba terminado em consoante-vogal-consoante (stop -> stopped). */
function doublesFinalConsonant(word) {
  const vowelGroups = word.match(/[aeiouy]+/g) || [];
  return vowelGroups.length === 1 && /[^aeiou][aeiou][^aeiouwxy]$/.test(word);
}

/** Passado simples de um verbo (irregular ou regular). */
export function past(verb) {
  const v = verb.toLowerCase();
  if (PAST_IRREGULAR[v]) return PAST_IRREGULAR[v];
  if (v.endsWith('e')) return `${v}d`;
  if (/[^aeiou]y$/.test(v)) return `${v.slice(0, -1)}ied`;
  if (doublesFinalConsonant(v)) return `${v}${v.slice(-1)}ed`;
  return `${v}ed`;
}

/** Particípio usado depois de have/has/had (aproximação útil para dicas). */
const PARTICIPLE_IRREGULAR = {
  be: 'been', begin: 'begun', break: 'broken', choose: 'chosen', come: 'come',
  do: 'done', drink: 'drunk', drive: 'driven', eat: 'eaten', fall: 'fallen',
  fly: 'flown', forget: 'forgotten', give: 'given', go: 'gone', grow: 'grown',
  know: 'known', ride: 'ridden', run: 'run', see: 'seen', sing: 'sung',
  speak: 'spoken', swim: 'swum', take: 'taken', wake: 'woken', wear: 'worn',
  write: 'written',
};

export function participle(verb) {
  const v = verb.toLowerCase();
  if (PARTICIPLE_IRREGULAR[v]) return PARTICIPLE_IRREGULAR[v];
  return past(v);
}

/** Gerúndio: -ing com as regras usuais de grafia. */
export function gerund(verb) {
  const v = verb.toLowerCase();
  if (v === 'be') return 'being';
  if (/ie$/.test(v)) return `${v.slice(0, -2)}ying`;
  if (/[^aeiou]e$/.test(v)) return `${v.slice(0, -1)}ing`;
  if (doublesFinalConsonant(v)) return `${v}${v.slice(-1)}ing`;
  return `${v}ing`;
}

const IRREGULAR_COMPARATIVE = {
  good: ['better', 'best'], bad: ['worse', 'worst'], far: ['further', 'furthest'],
  little: ['less', 'least'], much: ['more', 'most'], many: ['more', 'most'],
};

/** Comparativo / superlativo curto de adjetivos de 1-2 sílabas. */
export function comparative(adj, superlative = false) {
  const a = adj.toLowerCase();
  if (IRREGULAR_COMPARATIVE[a]) return IRREGULAR_COMPARATIVE[a][superlative ? 1 : 0];
  const suffix = superlative ? 'est' : 'er';
  if (a.endsWith('e')) return `${a}${suffix}`;
  if (/[^aeiou]y$/.test(a)) return `${a.slice(0, -1)}i${suffix}`;
  if (doublesFinalConsonant(a)) return `${a}${a.slice(-1)}${suffix}`;
  return `${a}${suffix}`;
}

/** "to be" concordando com o sujeito. */
export function beOf(subject, past_ = false) {
  const s = subject.toLowerCase();
  if (s === 'i') return past_ ? 'was' : 'am';
  if (['he', 'she', 'it', 'this', 'that'].includes(s)) return past_ ? 'was' : 'is';
  return past_ ? 'were' : 'are';
}

/** Copia o padrão de maiúsculas da string original para a correção. */
export function matchCase(original, replacement) {
  if (!original || !replacement) return replacement;
  if (original === original.toUpperCase() && original.length > 1) return replacement.toUpperCase();
  if (original[0] === original[0].toUpperCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

/** "a" ou "an" conforme o som inicial da palavra. */
export function articleFor(word = '') {
  const w = word.toLowerCase();
  const soundsLikeConsonant = /^(uni|use|user|usu|eu|one|once)/.test(w);
  const soundsLikeVowel = /^(hour|honest|honor|heir)/.test(w);
  if (soundsLikeVowel) return 'an';
  if (soundsLikeConsonant) return 'a';
  return /^[aeiou]/.test(w) ? 'an' : 'a';
}
