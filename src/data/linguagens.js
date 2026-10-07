const JS = 'const let var function return if else for while do async await import export from default new class extends try catch finally throw typeof instanceof in of null undefined true false this super switch case break continue yield delete void'
const TS = JS + ' type interface enum implements private public protected readonly as keyof string number boolean any unknown never'
const PY = 'def class return if elif else for while in not and or is None True False import from as with try except finally raise lambda pass yield global async await self'
const SQL = 'SELECT FROM WHERE JOIN INNER LEFT RIGHT ON AS GROUP BY ORDER HAVING LIMIT DESC ASC AND OR NOT NULL CREATE TABLE PRIMARY KEY DEFAULT INSERT INTO VALUES UPDATE SET RETURNING WITH INDEX CONFLICT DO NOTHING SERIAL TEXT NUMERIC VARCHAR TIMESTAMP DELETE'
const conjunto = (texto) => new Set(texto.split(' '))

export const LINGUAGENS = {
  js: { cor: '#f7df1e', palavrasChave: conjunto(JS), comentarioLinha: '//', comentarioBloco: true },
  ts: { cor: '#3b82f6', palavrasChave: conjunto(TS), comentarioLinha: '//', comentarioBloco: true },
  tsx: { cor: '#61dafb', palavrasChave: conjunto(TS), comentarioLinha: '//', comentarioBloco: true, tags: true },
  vue: { cor: '#42b883', palavrasChave: conjunto(JS), comentarioLinha: '//', comentarioBloco: true, tags: true },
  py: { cor: '#ffd43b', palavrasChave: conjunto(PY), comentarioLinha: '#', decoradores: true },
  sql: { cor: '#c8a8ff', palavrasChave: conjunto(SQL), comentarioLinha: '--', ignoraMaiusculas: true },
  css: { cor: '#ff8fc0', palavrasChave: new Set(), comentarioBloco: true, css: true },
}

// "meus" mistura linguagens: em cada trecho, a cor vem da extensão do arquivo
export const CATEGORIAS = [
  { id: 'meus', nome: 'Meus projetos' },
  { id: 'js', nome: 'JavaScript' },
  { id: 'ts', nome: 'TypeScript' },
  { id: 'vue', nome: 'Vue' },
  { id: 'py', nome: 'Python' },
  { id: 'sql', nome: 'SQL' },
  { id: 'css', nome: 'CSS' },
]

export const MODOS = [
  { id: 'trecho', nome: 'Trecho inteiro' },
  { id: '30', nome: '30 s' },
  { id: '60', nome: '60 s' },
  { id: '120', nome: '120 s' },
]

export function linguagemDoArquivo(arquivo, padrao) {
  const extensao = arquivo.split('.').pop()
  return LINGUAGENS[extensao] ? extensao : padrao
}
