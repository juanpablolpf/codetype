<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  teste: { type: Object, required: true },
  modo: { type: String, required: true },
})

const entrada = ref(null)
const janela = ref(null)
const codigo = ref(null)
const focado = ref(false)

const fim = computed(() => props.teste.fase === 'fim')

const alturaLinha = ref(31)
const maxLinhas = ref(11)
const cursorX = ref(0)

const linhaDe = computed(() => {
  let linha = 0
  return props.teste.letras.map(({ letra }) => (letra === '\n' ? linha++ : linha))
})
const totalLinhas = computed(() => linhaDe.value.at(-1) + 1)
const linhaAtual = computed(() => linhaDe.value[Math.min(props.teste.posicao, linhaDe.value.length - 1)])
const visiveis = computed(() => Math.min(totalLinhas.value, maxLinhas.value))
const altura = computed(() => `${visiveis.value * alturaLinha.value}px`)
// mantém 2 linhas acima do cursor à vista
const topo = computed(() => Math.max(0, Math.min(linhaAtual.value - 2, totalLinhas.value - visiveis.value)))
const deslocamento = computed(() => `translateY(${-topo.value * alturaLinha.value}px)`)
const alturaCursor = computed(() => Math.round(alturaLinha.value * 0.62))
const estiloCursor = computed(() => ({
  height: `${alturaCursor.value}px`,
  transform: `translate(${cursorX.value}px, ${linhaAtual.value * alturaLinha.value + (alturaLinha.value - alturaCursor.value) / 2}px)`,
}))

function classeDaLetra({ letra, tipo, estado }) {
  return ['letra', `t-${tipo}`, letra === '\n' && 'quebra', estado].filter(Boolean)
}

function posicionarCursor() {
  const spans = codigo.value.children
  const noFim = props.teste.posicao === spans.length
  const span = spans[noFim ? spans.length - 1 : props.teste.posicao]
  const x = span.offsetLeft + (noFim ? span.offsetWidth : 0)
  cursorX.value = x

  // no celular a linha pode passar da largura da tela
  const largura = janela.value.clientWidth
  if (x - janela.value.scrollLeft > largura - 48) janela.value.scrollLeft = x - largura / 2
  else if (x < janela.value.scrollLeft + 16) janela.value.scrollLeft = Math.max(0, x - 48)
}

function medir() {
  alturaLinha.value = parseFloat(getComputedStyle(janela.value).lineHeight)
  maxLinhas.value = window.innerWidth < 640 ? 8 : 11
  posicionarCursor()
}

watch(() => [props.teste.posicao, props.teste.letras], posicionarCursor, { flush: 'post' })

// A textarea fica invisível e recebe as teclas. Ela sempre guarda um espaço
// (a "sentinela"): se ele some, o teclado do celular apagou algo (backspace).
const SENTINELA = ' '

function limparEntrada() {
  entrada.value.value = SENTINELA
  entrada.value.setSelectionRange(1, 1)
}

function aoTeclar(e) {
  const { teste } = props
  if (e.key === 'Tab') { e.preventDefault(); return teste.reiniciar() }
  if (e.key === 'Escape') { e.preventDefault(); return teste.outroTrecho() }
  if (teste.fase === 'fim') {
    if (e.key === 'Enter') { e.preventDefault(); teste.outroTrecho() }
    return
  }
  if (e.key === 'Enter') { e.preventDefault(); return teste.digitar('\n') }
  if (e.key === 'Backspace') { e.preventDefault(); return teste.apagar(e.ctrlKey || e.altKey || e.metaKey) }
}

// Lê o texto pelo evento input, e não pelo keydown, para aceitar acentos do ABNT2 e o teclado do celular
function lerEntrada() {
  const valor = entrada.value.value
  limparEntrada()
  if (!valor.startsWith(SENTINELA)) return props.teste.apagar(false)
  for (const letra of valor.slice(SENTINELA.length)) props.teste.digitar(letra === '\r' ? '\n' : letra)
}

function focar() {
  entrada.value.focus({ preventScroll: true })
}
defineExpose({ focar })

onMounted(() => {
  limparEntrada()
  medir()
  document.fonts.ready.then(medir)
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
      <div class="numeros" :style="{ height: altura }">
        <div class="rolagem" :style="{ transform: deslocamento }">
          <span v-for="n in totalLinhas" :key="n" :class="{ atual: n - 1 === linhaAtual }">{{ n }}</span>
        </div>
      </div>
      <div ref="janela" class="janela" :style="{ height: altura }">
        <div class="rolagem conteudo" :style="{ transform: deslocamento }">
          <div class="linha-atual" :style="{ height: `${alturaLinha}px`, transform: `translateY(${linhaAtual * alturaLinha}px)` }"></div>
          <pre ref="codigo" class="codigo"><template v-for="(l, i) in teste.letras" :key="i"><span :class="classeDaLetra(l)">{{ l.letra === '\n' ? '↵' : l.letra }}</span><template v-if="l.letra === '\n'">{{ '\n' }}</template></template></pre>
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
      @input="(e) => !e.isComposing && lerEntrada()"
      @compositionend="lerEntrada"
      @focus="focado = true"
      @blur="focado = false"
    ></textarea>
  </div>
</template>

<style scoped>
.editor { position: relative; }
.barra {
  display: flex; align-items: stretch; justify-content: space-between;
  border-bottom: 1px solid var(--linha); min-height: 44px; padding-right: 16px;
}
.aba {
  display: flex; align-items: center; gap: 8px; padding: 0 18px;
  font-family: var(--mono); font-size: 13px; color: var(--texto);
  border-right: 1px solid var(--linha); box-shadow: inset 0 -1px 0 #fff;
  min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.aba i { flex: none; width: 7px; height: 7px; border-radius: 50%; }
.ao-vivo { display: flex; align-items: center; gap: 18px; font-family: var(--mono); font-size: 13px; color: var(--apagado); white-space: nowrap; padding-left: 12px; }
.ao-vivo b { color: var(--texto); font-weight: 500; }

.corpo { position: relative; display: flex; padding: 22px 0; cursor: text; }
.numeros, .janela { font-family: var(--mono); font-size: 17px; line-height: 1.85; }
.numeros {
  flex: none; overflow: hidden; padding: 0 18px 0 20px; text-align: right;
  color: #3d3d3d; user-select: none; font-variant-numeric: tabular-nums;
}
.numeros span { display: block; transition: color 0.15s; }
.numeros span.atual { color: var(--apagado); }
.janela {
  position: relative; flex: 1; min-width: 0;
  overflow-x: auto; overflow-y: hidden; padding-right: 24px;
  scrollbar-width: thin; scrollbar-color: #333 transparent;
  transition: filter 0.2s, opacity 0.2s;
}
.rolagem { transition: transform 0.18s ease-out; }
.conteudo { position: relative; width: max-content; }
.codigo { margin: 0; font: inherit; white-space: pre; }

.letra { color: var(--pendente); }
.letra.ok, .letra.auto { color: var(--cor-token); }
.letra.erro { color: var(--erro); background: rgba(255, 99, 105, 0.16); border-radius: 2px; }
.letra.quebra { color: transparent; }
.letra.quebra.erro { color: var(--erro); }

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

.desfocado .janela, .desfocado .numeros { filter: blur(4px); opacity: 0.45; }
.desfocado .cursor { display: none; }
.refocar {
  position: absolute; inset: 0; display: none; place-items: center;
  color: var(--texto); font-size: 14px; pointer-events: none; text-align: center; padding: 0 16px;
}
.desfocado .refocar { display: grid; }

.entrada {
  position: absolute; left: 0; top: 0; width: 1px; height: 1px;
  opacity: 0; border: 0; padding: 0; resize: none; overflow: hidden;
}

@media (max-width: 640px) {
  .numeros, .janela { font-size: 14px; }
  .numeros { padding: 0 12px; }
  .corpo { padding: 16px 0; }
  .aba { padding: 0 14px; font-size: 12px; }
  .ao-vivo { gap: 12px; font-size: 12px; }
}
@media (prefers-reduced-motion: reduce) {
  .rolagem, .cursor, .linha-atual { transition: none; }
  .cursor.piscando { animation: none; }
}
</style>
