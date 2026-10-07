<script setup>
import { ref, reactive, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { CATEGORIAS, MODOS } from './data/linguagens'
import { armazenamento } from './lib/armazenamento'
import { useTeste } from './composables/useTeste'
import SeletorConfig from './components/SeletorConfig.vue'
import EditorDigitacao from './components/EditorDigitacao.vue'
import PainelResultado from './components/PainelResultado.vue'
import ExplicacaoCodigo from './components/ExplicacaoCodigo.vue'

const lerOpcao = (chave, lista, padrao) => {
  const salvo = armazenamento.ler(chave, padrao)
  return lista.some((item) => item.id === salvo) ? salvo : padrao
}
const categoria = ref(lerOpcao('ct:lang', CATEGORIAS, 'meus'))
const modo = ref(lerOpcao('ct:mode', MODOS, 'trecho'))

const teste = reactive(useTeste(categoria, modo))
teste.outroTrecho()

const editor = ref(null)
const explicacao = ref(null)
const focar = () => editor.value?.focar()

watch(categoria, (c) => {
  armazenamento.salvar('ct:lang', c)
  teste.outroTrecho()
  focar()
})
watch(modo, (m) => {
  armazenamento.salvar('ct:mode', m)
  teste.reiniciar()
  focar()
})

function acao(fn) {
  fn()
  focar()
}

async function explicar() {
  await nextTick()
  const suave = !matchMedia('(prefers-reduced-motion: reduce)').matches
  explicacao.value?.$el.scrollIntoView({ behavior: suave ? 'smooth' : 'auto' })
  focar()
}

function teclaGlobal(e) {
  if (e.target.tagName === 'TEXTAREA' || e.ctrlKey || e.metaKey || e.altKey) return
  if (e.target.closest?.('button') && (e.key === 'Enter' || e.key === ' ')) return
  if (e.key === 'Tab' || e.key === 'Escape') {
    e.preventDefault()
    e.key === 'Tab' ? teste.reiniciar() : teste.outroTrecho()
    return focar()
  }
  if (e.key.length === 1 || e.key === 'Enter') focar()
}
onMounted(() => document.addEventListener('keydown', teclaGlobal))
onUnmounted(() => document.removeEventListener('keydown', teclaGlobal))
</script>

<template>
  <div class="wrap">
    <header class="topo">
      <div class="logo"><span class="marca"></span>codetype</div>
      <div class="recorde" :title="teste.descricao">
        <template v-if="teste.recorde">Recorde <b>{{ teste.recorde }} wpm</b></template>
        <template v-else>Sem recorde ainda</template>
      </div>
    </header>

    <section class="intro">
      <h1>Treine digitando código de verdade.</h1>
      <p>
        Trechos dos seus projetos e de JavaScript, TypeScript, Vue, Python, SQL e CSS.
        O código ganha cor conforme você acerta, e no fim você vê o que cada linha faz.
      </p>
    </section>

    <main>
      <SeletorConfig v-model:categoria="categoria" v-model:modo="modo" />

      <EditorDigitacao ref="editor" :teste="teste" :modo="modo">
        <PainelResultado
          :resultado="teste.resultado"
          :historico="teste.historico"
          :descricao="teste.descricao"
          @explicar="explicar"
          @repetir="acao(teste.reiniciar)"
          @proximo="acao(teste.outroTrecho)"
        />
      </EditorDigitacao>

      <div class="atalhos">
        <div class="teclas">
          <span><kbd>tab</kbd>recomeçar</span>
          <span><kbd>esc</kbd>outro trecho</span>
          <span><kbd>enter</kbd>nova linha, já indentada</span>
          <span><kbd>ctrl</kbd><kbd>⌫</kbd>apagar palavra</span>
        </div>
        <div class="btns toque">
          <button class="btn" type="button" @click="acao(teste.reiniciar)">Recomeçar</button>
          <button class="btn" type="button" @click="acao(teste.outroTrecho)">Outro trecho</button>
        </div>
      </div>

      <ExplicacaoCodigo v-if="teste.fase === 'fim'" ref="explicacao" :trechos="teste.trechosDaRodada" />
    </main>

    <footer>Seus recordes ficam salvos neste navegador, separados por linguagem e modo.</footer>
  </div>
</template>

<style scoped>
.topo { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 22px 0; }
.logo { display: flex; align-items: center; gap: 9px; font-weight: 600; font-size: 17px; letter-spacing: -0.02em; }
.marca { width: 9px; height: 18px; background: #fff; border-radius: 2px; }
.recorde { font-size: 13px; color: var(--muted); white-space: nowrap; }
.recorde b { color: var(--fg); font-weight: 500; font-family: var(--mono); }

.intro { padding: 48px 0 32px; }
h1 {
  margin: 0; font-size: clamp(30px, 5vw, 46px); line-height: 1.08; font-weight: 600;
  letter-spacing: -0.035em; max-width: 16ch;
  background: linear-gradient(180deg, #fff 30%, #8f8f8f);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.intro p { margin: 14px 0 0; color: var(--muted); max-width: 54ch; }

.atalhos { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-top: 16px; }
.teclas { display: flex; flex-wrap: wrap; gap: 8px 20px; font-size: 13px; color: var(--faint); }
.toque { display: none; }

footer { padding: 64px 0 40px; color: var(--faint); font-size: 13px; }

@media (hover: none) {
  .teclas { display: none; }
  .toque { display: flex; }
}
@media (max-width: 640px) {
  .intro { padding: 24px 0; }
}
</style>
