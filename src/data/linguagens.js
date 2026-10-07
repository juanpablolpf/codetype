const JS_KW = 'const let var function return if else for while do async await import export from default new class extends try catch finally throw typeof instanceof in of null undefined true false this super switch case break continue yield delete void'
const TS_KW = JS_KW + ' type interface enum implements private public protected readonly as keyof string number boolean any unknown never'
const PY_KW = 'def class return if elif else for while in not and or is None True False import from as with try except finally raise lambda pass yield global async await self'
const SQL_KW = 'SELECT FROM WHERE JOIN INNER LEFT RIGHT ON AS GROUP BY ORDER HAVING LIMIT DESC ASC AND OR NOT NULL CREATE TABLE PRIMARY KEY DEFAULT INSERT INTO VALUES UPDATE SET RETURNING WITH INDEX CONFLICT DO NOTHING SERIAL TEXT NUMERIC VARCHAR TIMESTAMP DELETE'
const palavras = (texto) => new Set(texto.split(' '))

export const LINGUAGENS = {
  js: { nome: 'JavaScript', cor: '#f7df1e', kw: palavras(JS_KW), linha: '//', bloco: true },
  ts: { nome: 'TypeScript', cor: '#3b82f6', kw: palavras(TS_KW), linha: '//', bloco: true },
  tsx: { nome: 'React', cor: '#61dafb', kw: palavras(TS_KW), linha: '//', bloco: true, markup: true },
  vue: { nome: 'Vue', cor: '#42b883', kw: palavras(JS_KW), linha: '//', bloco: true, markup: true },
  py: { nome: 'Python', cor: '#ffd43b', kw: palavras(PY_KW), linha: '#', decorator: true },
  sql: { nome: 'SQL', cor: '#c8a8ff', kw: palavras(SQL_KW), linha: '--', maiusculas: true },
  css: { nome: 'CSS', cor: '#ff8fc0', kw: new Set(), bloco: true, css: true },
}

// As abas de cima. "meus" junta trechos dos seus projetos, de várias linguagens.
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
