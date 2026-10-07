import { ref, computed, onUnmounted } from 'vue'
import { TRECHOS } from '../data/trechos'
import { LINGUAGENS, CATEGORIAS, MODOS } from '../data/linguagens'
import { colorir } from '../lib/sintaxe'
import { armazenamento } from '../lib/armazenamento'

export function useTeste(categoria, modo) {
  const indice = ref(-1)
  const usados = ref([]) // trechos que apareceram nesta rodada (para a explicação)
  const chars = ref([]) // { ch, tipo, st } — st: '' | 'ok' | 'err' | 'auto'
  const pos = ref(0)
  const fase = ref('parado') // parado | digitando | fim
  const historico = ref([]) // um ponto por segundo: { wpm, bruto, erros }
  const resultado = ref(null)
  const agora = ref(0) // muda a cada segundo, para o wpm ao vivo recalcular
  const versaoRecorde = ref(0)

  // Contadores que não aparecem na tela não precisam ser reativos.
  let inicio = 0, relogio = 0, acertosAnteriores = 0
  let teclas = 0, teclasCertas = 0, erros = 0, teclasNoSegundo = 0, errosNoSegundo = 0

  const lista = computed(() => TRECHOS[categoria.value])
  const trecho = computed(() => lista.value[indice.value])
  const linguagem = computed(() => LINGUAGENS[trecho.value.linguagem])
  const trechosDaRodada = computed(() => usados.value.map((i) => lista.value[i]))
  const acertos = computed(() => chars.value.reduce((n, c) => n + (c.st === 'ok'), 0))

  const segundos = () => (performance.now() - inicio) / 1000
  const ppm = (caracteres, s) => caracteres / 5 / (s / 60) // 5 caracteres = 1 palavra

  const wpmAoVivo = computed(() => {
    agora.value // dependência: recalcula a cada segundo
    if (fase.value !== 'digitando') return 0
    return Math.round(ppm(acertosAnteriores + acertos.value, Math.max(segundos(), 1)))
  })
  const progresso = computed(() => Math.round((pos.value / (chars.value.length || 1)) * 100))
  const restante = computed(() => Math.max(0, +modo.value - historico.value.length))

  const chaveRecorde = computed(() => `ct:pb:${categoria.value}:${modo.value}`)
  const recorde = computed(() => {
    versaoRecorde.value
    return +armazenamento.ler(chaveRecorde.value, 0)
  })
  const descricao = computed(() => {
    const cat = CATEGORIAS.find((c) => c.id === categoria.value).nome
    const md = MODOS.find((m) => m.id === modo.value).nome.toLowerCase()
    return `${cat}, ${md}`
  })

  function sortear() {
    let i = Math.floor(Math.random() * lista.value.length)
    if (lista.value.length > 1 && i === indice.value) i = (i + 1) % lista.value.length
    indice.value = i
  }

  function montar() {
    const t = trecho.value
    if (!usados.value.includes(indice.value)) usados.value.push(indice.value)
    const tipos = colorir(t.codigo, LINGUAGENS[t.linguagem])
    chars.value = [...t.codigo].map((ch, i) => ({ ch, tipo: tipos[i], st: '' }))
    pos.value = 0
    pularIndentacao()
  }

  // Depois de uma quebra de linha, os espaços do começo da linha seguinte entram sozinhos
  function pularIndentacao() {
    const c = chars.value
    if (pos.value !== 0 && c[pos.value - 1].ch !== '\n') return
    while (pos.value < c.length && c[pos.value].ch === ' ') {
      c[pos.value].st = 'auto'
      pos.value++
    }
  }

  function zerar() {
    clearInterval(relogio)
    fase.value = 'parado'
    historico.value = []
    usados.value = []
    resultado.value = null
    acertosAnteriores = teclas = teclasCertas = erros = teclasNoSegundo = errosNoSegundo = 0
  }

  function reiniciar() {
    if (indice.value < 0) sortear()
    zerar()
    montar()
  }

  function outroTrecho() {
    sortear()
    zerar()
    montar()
  }

  function comecar() {
    fase.value = 'digitando'
    inicio = performance.now()
    relogio = setInterval(aCadaSegundo, 1000)
  }

  function aCadaSegundo() {
    const s = historico.value.length + 1
    historico.value.push({
      wpm: ppm(acertosAnteriores + acertos.value, s),
      bruto: teclasNoSegundo * 12,
      erros: errosNoSegundo,
    })
    teclasNoSegundo = errosNoSegundo = 0
    agora.value++
    if (modo.value !== 'trecho' && s >= +modo.value) terminar()
  }

  function digitar(tecla) {
    if (fase.value === 'fim' || pos.value >= chars.value.length) return
    if (fase.value === 'parado') comecar()

    const atual = chars.value[pos.value]
    teclas++
    teclasNoSegundo++
    if (tecla === atual.ch) {
      atual.st = 'ok'
      teclasCertas++
    } else {
      atual.st = 'err'
      erros++
      errosNoSegundo++
    }
    pos.value++
    if (atual.ch === '\n') pularIndentacao()

    if (pos.value >= chars.value.length) {
      if (modo.value === 'trecho') return terminar()
      // no modo de tempo, o próximo trecho entra sem parar o relógio
      acertosAnteriores += acertos.value
      sortear()
      montar()
    }
  }

  function apagarUm() {
    const c = chars.value
    if (pos.value === 0) return false
    let p = pos.value - 1
    while (p > 0 && c[p].st === 'auto') p--
    if (c[p].st === 'auto') return false // só tem indentação antes: nada a apagar
    for (let i = p; i < pos.value; i++) c[i].st = ''
    pos.value = p
    return true
  }

  function apagar(palavraInteira = false) {
    if (fase.value !== 'digitando' || !apagarUm() || !palavraInteira) return
    const c = chars.value
    const ehPalavra = (ch) => /[\w$]/.test(ch)
    const eraPalavra = ehPalavra(c[pos.value].ch)
    while (
      pos.value > 0 &&
      c[pos.value - 1].ch !== '\n' &&
      (eraPalavra ? ehPalavra(c[pos.value - 1].ch) : c[pos.value - 1].ch === ' ')
    ) apagarUm()
  }

  function terminar() {
    clearInterval(relogio)
    const tempo = modo.value === 'trecho' ? Math.max(segundos(), 0.5) : +modo.value

    // no modo trecho, o último pedaço de segundo também entra no gráfico
    if (modo.value === 'trecho') {
      const resto = tempo - historico.value.length
      if (resto > 0.2 || !historico.value.length) {
        historico.value.push({
          wpm: ppm(acertosAnteriores + acertos.value, tempo),
          bruto: (teclasNoSegundo * 12) / Math.max(resto, 0.2),
          erros: errosNoSegundo,
        })
      }
    }

    const certos = acertosAnteriores + acertos.value
    const wpm = Math.round(ppm(certos, tempo))
    const precisao = teclas ? Math.floor((teclasCertas / teclas) * 100) : 0
    const brutos = historico.value.map((h) => h.bruto)
    const media = brutos.reduce((a, b) => a + b, 0) / (brutos.length || 1)
    const desvio = Math.sqrt(brutos.reduce((a, b) => a + (b - media) ** 2, 0) / (brutos.length || 1))

    const anterior = recorde.value
    const novoRecorde = wpm > anterior && precisao >= 75
    if (novoRecorde) {
      armazenamento.salvar(chaveRecorde.value, wpm)
      versaoRecorde.value++
    }

    resultado.value = {
      wpm,
      bruto: Math.round(ppm(teclas, tempo)),
      precisao,
      certos,
      erros,
      constancia: media ? Math.max(0, Math.round(100 * (1 - desvio / media))) : 0,
      tempo: Math.round(tempo),
      anterior,
      novoRecorde,
      precisaoBaixa: precisao < 75 && wpm > anterior,
    }
    fase.value = 'fim'
  }

  onUnmounted(() => clearInterval(relogio))

  return {
    chars, pos, fase, trecho, linguagem, historico, resultado, trechosDaRodada,
    wpmAoVivo, progresso, restante, recorde, descricao,
    digitar, apagar, reiniciar, outroTrecho,
  }
}
