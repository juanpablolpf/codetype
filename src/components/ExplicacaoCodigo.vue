<script setup>
import { computed } from 'vue'
import { LINGUAGENS } from '../data/linguagens'
import { colorir } from '../lib/sintaxe'

const props = defineProps({
  trechos: { type: Array, required: true },
})

// Para cada trecho: as linhas já coloridas, agrupadas pelos intervalos das notas.
// Linhas sem nota (fechar chave, linha vazia) viram um grupo "quieto".
const blocos = computed(() =>
  props.trechos
    .filter((t) => t.resumo || t.notas.length)
    .map((t) => {
      const tipos = colorir(t.codigo, LINGUAGENS[t.linguagem])
      let i = 0
      const linhas = t.codigo.split('\n').map((texto) => {
        const linha = [...texto].map((letra) => ({ letra, tipo: tipos[i++] }))
        i++ // pula o "\n", que também tem um tipo
        return linha
      })

      const grupos = []
      for (let n = 1; n <= linhas.length; ) {
        const nota = t.notas.find((x) => x.de === n)
        const ate = nota
          ? Math.min(nota.ate, linhas.length)
          : (t.notas.filter((x) => x.de > n).sort((a, b) => a.de - b.de)[0]?.de ?? linhas.length + 1) - 1
        grupos.push({
          de: n,
          texto: nota?.texto ?? '',
          linhas: linhas.slice(n - 1, ate),
        })
        n = ate + 1
      }

      return { ...t, cor: LINGUAGENS[t.linguagem].cor, grupos }
    }),
)
</script>

<template>
  <section class="explicacao">
    <h2>O que esse código faz</h2>
    <article v-for="b in blocos" :key="b.arquivo" class="cartao">
      <header>
        <span class="arquivo"><i :style="{ background: b.cor }"></i>{{ b.arquivo }}</span>
        <p>{{ b.resumo }}</p>
      </header>
      <div v-for="g in b.grupos" :key="g.de" class="grupo" :class="{ quieto: !g.texto }">
        <pre class="codigo"><span v-for="(linha, k) in g.linhas" :key="k" class="linha"><span class="num">{{ g.de + k }}</span><span v-for="(c, j) in linha" :key="j" :class="`t-${c.tipo}`">{{ c.letra }}</span>{{ linha.length ? '' : ' ' }}</span></pre>
        <p v-if="g.texto" class="nota">{{ g.texto }}</p>
      </div>
    </article>
  </section>
</template>

<style scoped>
.explicacao { margin-top: 20px; scroll-margin-top: 20px; }
h2 { margin: 0 0 14px; font-size: 20px; font-weight: 600; letter-spacing: -0.02em; }
.cartao + .cartao { margin-top: 14px; }
header { padding: 18px 22px 16px; border-bottom: 1px solid var(--linha); }
.arquivo { display: inline-flex; align-items: center; gap: 8px; font-family: var(--mono); font-size: 13px; }
.arquivo i { width: 7px; height: 7px; border-radius: 50%; }
header p { margin: 8px 0 0; color: var(--apagado); max-width: 70ch; }

.grupo {
  display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 28px;
  padding: 12px 22px; border-top: 1px solid var(--linha);
  transition: background-color 0.15s;
}
header + .grupo { border-top: 0; }
.grupo:hover { background: rgba(255, 255, 255, 0.025); }
.grupo.quieto { padding-block: 6px; }
.grupo.quieto .codigo { opacity: 0.55; }

.codigo {
  margin: 0; font-family: var(--mono); font-size: 13.5px; line-height: 1.75;
  white-space: pre; overflow-x: auto; scrollbar-width: thin; scrollbar-color: #333 transparent;
}
.linha { display: block; }
.num { display: inline-block; width: 3ch; margin-right: 12px; text-align: right; color: #3d3d3d; user-select: none; }
.codigo [class^="t-"] { color: var(--cor-token); }
.nota { margin: 0; padding-top: 2px; font-size: 14px; line-height: 1.6; color: #c9c9c9; }

@media (max-width: 640px) {
  .grupo { grid-template-columns: 1fr; gap: 6px; padding: 12px 16px; }
  header { padding: 16px; }
  .codigo { font-size: 13px; }
}
</style>
