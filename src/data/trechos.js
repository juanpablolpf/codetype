import { linguagemDoArquivo } from './linguagens'

import meus from './trechos/meus.txt?raw'
import js from './trechos/js.txt?raw'
import ts from './trechos/ts.txt?raw'
import vue from './trechos/vue.txt?raw'
import py from './trechos/py.txt?raw'
import sql from './trechos/sql.txt?raw'
import css from './trechos/css.txt?raw'

// Formato de cada trecho nos .txt:
//   @@ nome-do-arquivo.ext
//   ...código...
//   %% Resumo do que o trecho faz.
//   1: O que a linha 1 faz.
//   3-5: O que as linhas 3 a 5 fazem.
function lerTrechos(texto, categoria) {
  // no Windows o git pode trazer os .txt com \r\n
  return texto.replace(/\r\n/g, '\n').split(/^@@ /m).filter((bloco) => bloco.trim()).map((bloco) => {
    const quebra = bloco.indexOf('\n')
    const arquivo = bloco.slice(0, quebra).trim()
    const [parteCodigo, parteExplicacao = ''] = bloco.slice(quebra + 1).split(/^%% ?/m)

    const codigo = parteCodigo
      .split('\n')
      .map((linha) => linha.replace(/\s+$/, ''))
      .join('\n')
      .replace(/^\n+|\n+$/g, '')

    const [resumo = '', ...linhasDeNota] = parteExplicacao.trim().split('\n')
    const notas = linhasDeNota
      .map((linha) => linha.match(/^(\d+)(?:-(\d+))?:\s*(.+)$/))
      .filter(Boolean)
      .map(([, de, ate, texto]) => ({ de: +de, ate: +(ate || de), texto }))

    return {
      arquivo,
      codigo,
      resumo: resumo.trim(),
      notas,
      linguagem: linguagemDoArquivo(arquivo, categoria),
    }
  })
}

export const TRECHOS = {
  meus: lerTrechos(meus, 'ts'),
  js: lerTrechos(js, 'js'),
  ts: lerTrechos(ts, 'ts'),
  vue: lerTrechos(vue, 'vue'),
  py: lerTrechos(py, 'py'),
  sql: lerTrechos(sql, 'sql'),
  css: lerTrechos(css, 'css'),
}
