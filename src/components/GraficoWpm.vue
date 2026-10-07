<script setup>
import { computed } from 'vue'

const props = defineProps({
  pontos: { type: Array, required: true }, // [{ wpm, bruto, erros }] um por segundo
})

const W = 600
const H = 170
const M = { esq: 30, dir: 6, topo: 8, base: 22 }

const teto = computed(() => {
  const maior = Math.max(10, ...props.pontos.map((p) => Math.max(p.wpm, p.bruto)))
  return Math.ceil(maior / 20) * 20
})
const n = computed(() => props.pontos.length)
const x = (i) => M.esq + (n.value === 1 ? (W - M.esq - M.dir) / 2 : (i / (n.value - 1)) * (W - M.esq - M.dir))
const y = (v) => M.topo + (1 - v / teto.value) * (H - M.topo - M.base)

const caminho = (campo) =>
  props.pontos.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[campo]).toFixed(1)}`).join('')

const grade = computed(() => [0, 0.5, 1].map((f) => Math.round(teto.value * f)))
const passo = computed(() => Math.max(1, Math.ceil(n.value / 8)))
const rotulosX = computed(() =>
  props.pontos.map((_, i) => i).filter((i) => i % passo.value === 0 || i === n.value - 1),
)
</script>

<template>
  <div class="grafico">
    <svg :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="none" role="img" aria-label="wpm ao longo do teste">
      <g v-for="v in grade" :key="v">
        <line :x1="M.esq" :x2="W - M.dir" :y1="y(v)" :y2="y(v)" stroke="rgba(255,255,255,.07)" />
        <text :x="M.esq - 8" :y="y(v) + 4" text-anchor="end">{{ v }}</text>
      </g>
      <text v-for="i in rotulosX" :key="'x' + i" :x="x(i)" :y="H - 4" text-anchor="middle">{{ i + 1 }}</text>
      <path :d="caminho('bruto')" fill="none" stroke="#4d4d4d" stroke-width="1.5" vector-effect="non-scaling-stroke" />
      <path :d="caminho('wpm')" fill="none" stroke="#fff" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round" />
      <template v-for="(p, i) in pontos" :key="'e' + i">
        <circle v-if="p.erros" :cx="x(i)" :cy="y(p.wpm)" r="3.5" fill="#ff6369" />
      </template>
    </svg>
    <div class="legenda">
      <span><i></i>wpm</span>
      <span><i class="bruto"></i>bruto por segundo</span>
      <span><i class="erro"></i>segundo com erro</span>
    </div>
  </div>
</template>

<style scoped>
.grafico { margin-top: 28px; }
svg { display: block; width: 100%; height: 170px; overflow: visible; font: 11px var(--mono); fill: #6e6e6e; }
.legenda { display: flex; flex-wrap: wrap; gap: 8px 18px; margin-top: 10px; font-size: 12px; color: var(--apagado); }
.legenda span { display: inline-flex; align-items: center; gap: 6px; }
.legenda i { width: 14px; height: 2px; background: #fff; }
.legenda i.bruto { background: #4d4d4d; }
.legenda i.erro { width: 6px; height: 6px; border-radius: 50%; background: var(--erro); }
@media (max-width: 640px) { svg { height: 130px; } }
</style>
