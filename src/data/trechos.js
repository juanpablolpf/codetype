import { linguagemDoArquivo } from './linguagens'

// O "?raw" do Vite importa o arquivo como texto puro.
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
  return texto.split(/^@@ /m).filter((bloco) => bloco.trim()).map((bloco) => {
    const quebra = bloco.indexOf('\n')
    const arquivo = bloco.slice(0, quebra).trim()
    const [bruto, extra = ''] = bloco.slice(quebra + 1).split(/^%% ?/m)

    const codigo = bruto
      .split('\n')
      .map((linha) => linha.replace(/\s+$/, ''))
      .join('\n')
      .replace(/^\n+|\n+$/g, '')

    const [resumo = '', ...linhas] = extra.trim().split('\n')
    const notas = linhas
      .map((linha) => linha.match(/^(\d+)(?:-(\d+))?:\s*(.+)$/))
      .filter(Boolean)
      .map((m) => ({ de: +m[1], ate: +(m[2] || m[1]), texto: m[3] }))

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
