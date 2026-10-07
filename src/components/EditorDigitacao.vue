<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

// "teste" é o objeto do useTeste (embrulhado em reactive no App.vue,
// por isso aqui dá para ler teste.pos sem .value).
const props = defineProps({
  teste: { type: Object, required: true },
  modo: { type: String, required: true },
})

const entrada = ref(null)
const viewportEl = ref(null)
const codigoEl = ref(null)
const focado = ref(false)

const fim = computed(() => props.teste.fase === 'fim')

// ---------- linhas, rolagem e cursor ----------
const lh = ref(31) // altura de uma linha em px, medida do CSS
const maxLinhas = ref(11)
const cursorX = ref(0)

const linhaDe = computed(() => {
  const linhas = []
  let l = 0
  for (const c of props.teste.chars) {
    linhas.push(l)
    if (c.ch === '\n') l++
  }
  return linhas
})
const totalLinhas = computed(() => (linhaDe.value.at(-1) ?? 0) + 1)
const linhaAtual = computed(() => {
  const n = props.teste.chars.length
  return linhaDe.value[Math.min(props.teste.pos, n - 1)] ?? 0
})
const visiveis = computed(() => Math.min(totalLinhas.value, maxLinhas.value))
const altura = computed(() => `${visiveis.value * lh.value}px`)
// mantém 2 linhas acima do cursor à vista
const topo = computed(() => Math.max(0, Math.min(linhaAtual.value - 2, totalLinhas.value - visiveis.value)))
const deslocamento = computed(() => `translateY(${-topo.value * lh.value}px)`)
const alturaCursor = computed(() => Math.round(lh.value * 0.62))
const estiloCursor = computed(() => ({
  height: `${alturaCursor.value}px`,
  transform: `translate(${cursorX.value}px, ${linhaAtual.value * lh.value + (lh.value - alturaCursor.value) / 2}px)`,
}))

function classe(c) {
  return `ch t-${c.tipo}${c.ch === '\n' ? ' nl' : ''}${c.st ? ' ' + c.st : ''}`
}

function posicionar() {
  const spans = codigoEl.value?.children
  if (!spans?.length) return
  const noFim = props.teste.pos >= spans.length
  const sp = spans[noFim ? spans.length - 1 : props.teste.pos]
  const x = sp.offsetLeft + (noFim ? sp.offsetWidth : 0)
  cursorX.value = x

  // rolagem lateral em linhas compridas (celular)
  const vp = viewportEl.value
  const largura = vp.clientWidth
  if (x - vp.scrollLeft > largura - 48) vp.scrollLeft = x - largura / 2
  else if (x < vp.scrollLeft + 16) vp.scrollLeft = Math.max(0, x - 48)
}

function medir() {
  if (!viewportEl.value) return
  lh.value = parseFloat(getComputedStyle(viewportEl.value).lineHeight) || 31
  maxLinhas.value = window.innerWidth < 640 ? 8 : 11
  posicionar()
}

// flush: 'post' roda depois que o Vue atualizou o DOM (os spans já existem)
watch(() => [props.teste.pos, props.teste.chars], posicionar, { flush: 'post' })

// ---------- teclado ----------
// A textarea fica invisível e recebe as teclas. Ela sempre guarda um espaço
// (a "sentinela"): se ele some, o teclado do celular apagou algo (backspace).
const SENTINELA = ' '

function limparEntrada() {
  entrada.value.value = SENTINELA
  entrada.value.setSelectionRange(1, 1)
}

function aoTeclar(e) {
  const t = props.teste
  if (e.key === 'Tab') { e.preventDefault(); return t.reiniciar() }
  if (e.key === 'Escape') { e.preventDefault(); return t.outroTrecho() }
  if (t.fase === 'fim') {
    if (e.key === 'Enter') { e.preventDefault(); t.outroTrecho() }
    return
  }
  if (e.key === 'Enter') { e.preventDefault(); return t.digitar('\n') }
  if (e.key === 'Backspace') { e.preventDefault(); return t.apagar(e.ctrlKey || e.altKey || e.metaKey) }
}

// O texto chega pelo evento input (funciona com acentos do ABNT2 e no celular)
function despejar() {
  const valor = entrada.value.value
  limparEntrada()
  if (!valor.startsWith(SENTINELA)) return props.teste.apagar(false)
  for (const c of valor.slice(SENTINELA.length)) props.teste.digitar(c === '\r' ? '\n' : c)
}
function aoDigitar(e) {
  if (!e.isComposing) despejar()
}

function focar() {
  entrada.value?.focus({ preventScroll: true })
}
defineExpose({ focar })

onMounted(() => {
  limparEntrada()
  medir()
  document.fonts?.ready.then(medir)
  window.addEventListener('resize', medir)
  focar()
})
onUnmounted(() => window.removeEventListener('resize', medir))
</script>

<template>
  <div class="editor cartao" :class="{ desfocado: !focado, fim }">
    <div class="barra">
      <div class="aba">
        <i :style="{ background: teste.linguagem.cor }"></i>{{ teste.trecho.arquivo }}
      </div>
      <div class="ao-vivo">
        <span v-if="fim">resultado</span>
        <span v-else-if="teste.fase === 'parado' && modo === 'trecho'">comece a digitar</span>
        <span v-else-if="teste.fase === 'parado'"><b>{{ modo }}</b> s</span>
        <template v-else>
          <span v-if="modo === 'trecho'"><b>{{ teste.progresso }}%</b></span>
          <span v-else><b>{{ teste.restante }}</b> s</span>
          <span><b>{{ teste.wpmAoVivo }}</b> wpm</span>
        </template>
      </div>
    </div>

    <div v-show="!fim" class="corpo" @mousedown.prevent="focar">
      <div class="gutter" :style="{ height: altura }">
        <div class="rolagem" :style="{ transform: deslocamento }">
          <span v-for="n in totalLinhas" :key="n" :class="{ atual: n - 1 === linhaAtual }">{{ n }}</span>
        </div>
      </div>
      <div ref="viewportEl" class="viewport" :style="{ height: altura }">
        <div class="rolagem conteudo" :style="{ transform: deslocamento }">
          <div class="linha-atual" :style="{ height: `${lh}px`, transform: `translateY(${linhaAtual * lh}px)` }"></div>
          <pre ref="codigoEl" class="codigo"><template v-for="(c, i) in teste.chars" :key="i"><span :class="classe(c)">{{ c.ch === '\n' ? '↵' : c.ch }}</span><template v-if="c.ch === '\n'">{{ '\n' }}</template></template></pre>
          <div class="cursor" :class="{ piscando: teste.fase !== 'digitando' }" :style="estiloCursor"></div>
        </div>
      </div>
      <div class="refocar">Clique aqui ou aperte uma tecla para digitar</div>
    </div>

    <slot v-if="fim" />

    <textarea
      ref="entrada"
      class="entrada"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
      aria-label="Digite o código"
      @keydown="aoTeclar"
      @input="aoDigitar"
      @compositionend="despejar"
      @focus="focado = true"
      @blur="focado = false"
    ></textarea>
  </div>
</template>

<style scoped>
.editor { position: relative; }
.barra {
  display: flex; align-items: stretch; justify-content: space-between;
  border-bottom: 1px solid var(--line); min-height: 44px; padding-right: 16px;
}
.aba {
  display: flex; align-items: center; gap: 8px; padding: 0 18px;
  font-family: var(--mono); font-size: 13px; color: var(--fg);
  border-right: 1px solid var(--line); box-shadow: inset 0 -1px 0 #fff;
  min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.aba i { flex: none; width: 7px; height: 7px; border-radius: 50%; }
.ao-vivo { display: flex; align-items: center; gap: 18px; font-family: var(--mono); font-size: 13px; color: var(--muted); white-space: nowrap; padding-left: 12px; }
.ao-vivo b { color: var(--fg); font-weight: 500; }

.corpo { position: relative; display: flex; padding: 22px 0; cursor: text; }
.gutter, .viewport { font-family: var(--mono); font-size: 17px; line-height: 1.85; }
.gutter {
  flex: none; overflow: hidden; padding: 0 18px 0 20px; text-align: right;
  color: #3d3d3d; user-select: none; font-variant-numeric: tabular-nums;
}
.gutter span { display: block; transition: color 0.15s; }
.gutter span.atual { color: var(--muted); }
.viewport {
  position: relative; flex: 1; min-width: 0;
  overflow-x: auto; overflow-y: hidden; padding-right: 24px;
  scrollbar-width: thin; scrollbar-color: #333 transparent;
  transition: filter 0.2s, opacity 0.2s;
}
.rolagem { transition: transform 0.18s ease-out; }
.conteudo { position: relative; width: max-content; }
.codigo { margin: 0; font: inherit; white-space: pre; }

.ch { color: var(--pending); }
.ch.ok, .ch.auto { color: var(--tc); }
.ch.err { color: var(--err); background: rgba(255, 99, 105, 0.16); border-radius: 2px; }
.ch.nl { color: transparent; }
.ch.nl.err { color: var(--err); }

.linha-atual {
  position: absolute; left: -24px; right: -24px; top: 0;
  background: rgba(255, 255, 255, 0.03); pointer-events: none;
  transition: transform 0.12s ease-out;
}
.cursor {
  position: absolute; left: 0; top: 0; width: 2px; border-radius: 1px;
  background: #fff; pointer-events: none;
  transition: transform 0.09s ease-out;
}
.cursor.piscando { animation: piscar 1s steps(1) infinite; }
@keyframes piscar { 50% { opacity: 0; } }

.desfocado .viewport, .desfocado .gutter { filter: blur(4px); opacity: 0.45; }
.desfocado .cursor { display: none; }
.refocar {
  position: absolute; inset: 0; display: none; place-items: center;
  color: var(--fg); font-size: 14px; pointer-events: none; text-align: center; padding: 0 16px;
}
.desfocado .refocar { display: grid; }

.entrada {
  position: absolute; left: 0; top: 0; width: 1px; height: 1px;
  opacity: 0; border: 0; padding: 0; resize: none; overflow: hidden;
}

@media (max-width: 640px) {
  .gutter, .viewport { font-size: 14px; }
  .gutter { padding: 0 12px; }
  .corpo { padding: 16px 0; }
  .aba { padding: 0 14px; font-size: 12px; }
  .ao-vivo { gap: 12px; font-size: 12px; }
}
@media (prefers-reduced-motion: reduce) {
  .rolagem, .cursor, .linha-atual { transition: none; }
  .cursor.piscando { animation: none; }
}
</style>
