function montarRegras(linguagem) {
  const regras = []
  if (linguagem.tags) regras.push(['comentario', /<!--[\s\S]*?-->/y])
  if (linguagem.comentarioBloco) regras.push(['comentario', /\/\*[\s\S]*?\*\//y])
  if (linguagem.comentarioLinha) regras.push(['comentario', new RegExp(linguagem.comentarioLinha + '.*', 'y')])
  regras.push(['texto', /`(?:\\[\s\S]|[^`\\])*`|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"/y])

  if (linguagem.tags) {
    // o lookbehind evita pintar o ">" de "=>" como fim de tag
    regras.push(['tag', /<\/?[A-Za-z][\w-]*|(?<![=-])\/?>/y])
    regras.push(['atributo', /[@:]?[A-Za-z][\w.-]*(?==)/y])
  }
  if (linguagem.decoradores) regras.push(['funcao', /@[\w.]+/y])

  if (linguagem.css) {
    regras.push(['chave', /@[\w-]+/y])
    regras.push(['numero', /#[0-9a-fA-F]{3,8}\b/y])
    regras.push(['funcao', /\.[A-Za-z][\w-]*/y])
    regras.push(['chave', /:[A-Za-z][\w-]*/y])
    regras.push(['atributo', /--[\w-]+/y])
    regras.push(['numero', /\d*\.?\d+(?:px|rem|em|%|s|ms|fr|vh|vw|deg)?/y])
    regras.push(['atributo', /[A-Za-z][\w-]*(?=\s*:\s)/y])
    regras.push(['funcao', /[A-Za-z][\w-]*(?=\()/y])
    regras.push(['tipo', /[A-Za-z][\w-]*/y])
  } else {
    regras.push(['numero', /0x[0-9a-fA-F]+|\d+(?:\.\d+)?/y])
    regras.push(['identificador', /[A-Za-z_$][\w$]*/y])
  }
  return regras
}

function classificarIdentificador(palavra, inicio, codigo, linguagem) {
  if (linguagem.palavrasChave.has(linguagem.ignoraMaiusculas ? palavra.toUpperCase() : palavra)) return 'chave'
  let j = inicio + palavra.length
  while (codigo[j] === ' ') j++
  if (codigo[j] === '(') return 'funcao'
  if (codigo[inicio - 1] === '.') return 'propriedade'
  if (/^[A-Z]/.test(palavra)) return 'tipo'
  return 'nome'
}

// Devolve o tipo de cada caractere do código (chave, texto, funcao...), que vira a cor
export function colorir(codigo, linguagem) {
  const tipos = new Array(codigo.length).fill('nome')
  const regras = montarRegras(linguagem)
  let i = 0

  while (i < codigo.length) {
    const regra = regras.find(([, re]) => {
      re.lastIndex = i
      return re.test(codigo) && re.lastIndex > i
    })
    if (regra) {
      const [tipo, re] = regra
      const fim = re.lastIndex
      tipos.fill(tipo === 'identificador' ? classificarIdentificador(codigo.slice(i, fim), i, codigo, linguagem) : tipo, i, fim)
      i = fim
    } else {
      if (/[{}()[\];,.:=+\-*/<>!&|?%^~]/.test(codigo[i])) tipos[i] = 'pontuacao'
      i++
    }
  }
  return tipos
}
