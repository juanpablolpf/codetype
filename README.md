# codetype

Treino de digitação com trechos reais de código, no estilo do Monkeytype. O código ganha cor conforme você acerta e, no fim, aparece o que cada linha faz.

**Abrir:** https://juanpablolpf.github.io/codetype/

- Trechos dos meus projetos (RefundPay, LearnEnglish, aprendendo-vue) e de JavaScript, TypeScript, Vue, Python, SQL e CSS
- Modo trecho inteiro ou contra o relógio (30, 60 e 120 s)
- Enter já pula a indentação da linha seguinte
- Resultado com wpm, precisão, constância, gráfico por segundo e recorde salvo no navegador
- Explicação linha a linha em português depois de cada teste

Feito com Vue 3 + Vite.

## Rodar no seu computador

```bash
npm install
npm run dev
```

## Adicionar um trecho

Os trechos ficam em `src/data/trechos/*.txt`. Cada um começa com `@@ nome-do-arquivo.ext` (a extensão define as cores), seguido do código e da explicação:

```
@@ exemplo.js
const dobro = (n) => n * 2
%% Resumo do que o trecho faz.
1: O que a linha 1 faz.
```
