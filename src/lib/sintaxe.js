// Um colorizador de sintaxe pequeno: devolve um tipo para cada caractere
// (kw = palavra-chave, st = texto, fn = função, nu = número, cm = comentário,
// tg = tag, at = atributo, ty = tipo/classe, pr = propriedade, pu = pontuação).
// Não é perfeito como o de um editor, mas acerta o que importa nos trechos.

function regras(L) {
  const R = []
  if (L.markup) R.push(['cm', /<!--[\s\S]*?-->/y])
  if (L.bloco) R.push(['cm', /\/\*[\s\S]*?\*\//y])
  if (L.linha) R.push(['cm', new RegExp(L.linha + '.*', 'y')])
  R.push(['st', /`(?:\\[\s\S]|[^`\\])*`|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"/y])

  if (L.markup) {
    R.push(['tg', /<\/?[A-Za-z][\w-]*|(?<![=-])\/?>/y])
    R.push(['at', /[@:]?[A-Za-z][\w.-]*(?==)/y])
  }
  if (L.decorator) R.push(['fn', /@[\w.]+/y])

  if (L.css) {
    R.push(['kw', /@[\w-]+/y])
    R.push(['nu', /#[0-9a-fA-F]{3,8}\b/y])
    R.push(['fn', /\.[A-Za-z][\w-]*/y])
    R.push(['kw', /:[A-Za-z][\w-]*/y])
    R.push(['at', /--[\w-]+/y])
    R.push(['nu', /\d*\.?\d+(?:px|rem|em|%|s|ms|fr|vh|vw|deg)?/y])
    R.push(['at', /[A-Za-z][\w-]*(?=\s*:\s)/y])
    R.push(['fn', /[A-Za-z][\w-]*(?=\()/y])
    R.push(['ty', /[A-Za-z][\w-]*/y])
  } else {
    R.push(['nu', /0x[0-9a-fA-F]+|\d+(?:\.\d+)?/y])
    R.push(['id', /[A-Za-z_$][\w$]*/y])
  }
  return R
}

function classificar(palavra, inicio, src, L) {
  if (L.kw.has(L.maiusculas ? palavra.toUpperCase() : palavra)) return 'kw'
  let j = inicio + palavra.length
  while (src[j] === ' ') j++
  if (src[j] === '(') return 'fn'
  if (src[inicio - 1] === '.') return 'pr'
  if (/^[A-Z]/.test(palavra)) return 'ty'
  return 'tx'
}

export function colorir(src, L) {
  const tipos = new Array(src.length).fill('tx')
  const R = regras(L)
  let i = 0

  while (i < src.length) {
    let achou = false
    for (const [tipo, re] of R) {
      re.lastIndex = i
      const m = re.exec(src)
      if (m && m[0].length) {
        tipos.fill(tipo === 'id' ? classificar(m[0], i, src, L) : tipo, i, i + m[0].length)
        i += m[0].length
        achou = true
        break
      }
    }
    if (!achou) {
      if (/[{}()[\];,.:=+\-*/<>!&|?%^~]/.test(src[i])) tipos[i] = 'pu'
      i++
    }
  }
  return tipos
}
