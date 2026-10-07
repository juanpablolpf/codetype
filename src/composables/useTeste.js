import { ref, computed, watch, onUnmounted } from 'vue'
import { TRECHOS } from '../data/trechos'
import { LINGUAGENS, CATEGORIAS, MODOS } from '../data/linguagens'
import { colorir } from '../lib/sintaxe'
import { armazenamento } from '../lib/armazenamento'

// 1 palavra = 5 caracteres, a convenção dos testes de digitação
const calcularWpm = (caracteres, segundos) => caracteres / 5 / (segundos / 60)

export function useTeste(categoria, modo) {
  const indice = ref(-1)
  const usadosNaRodada = ref([])
  const letras = ref([]) // { letra, tipo, estado }, estado: '' | 'ok' | 'erro' | 'auto'
  const posicao = ref(0)
  const fase = ref('parado') // parado | digitando | fim
  const historico = ref([]) // um ponto por segundo: { wpm, bruto, erros }
  const resultado = ref(null)
  const recorde = ref(0)

  let inicio = 0, relogio = 0, acertosAnteriores = 0
  let teclas = 0, teclasCertas = 0, erros = 0, teclasNoSegundo = 0, errosNoSegundo = 0

  const lista = computed(() => TRECHOS[categoria.value])
  const trecho = computed(() => lista.value[indice.value])
  const linguagem = computed(() => LINGUAGENS[trecho.value.linguagem])
  const trechosDaRodada = computed(() => usadosNaRodada.value.map((i) => lista.value[i]))
  const acertos = computed(() => letras.value.filter((l) => l.estado === 'ok').length)

  const wpmAoVivo = computed(() =>
    Math.round(calcularWpm(acertosAnteriores + acertos.value, Math.max(historico.value.length, 1))),
  )
  const progresso = computed(() => Math.round((posicao.value / letras.value.length) * 100))
  const restante = computed(() => Math.max(0, +modo.value - historico.value.length))

  const chaveRecorde = computed(() => `ct:pb:${categoria.value}:${modo.value}`)
  watch(chaveRecorde, (chave) => { recorde.value = +armazenamento.ler(chave, 0) }, { immediate: true })

  const descricao = computed(() => {
    const nomeCategoria = CATEGORIAS.find((c) => c.id === categoria.value).nome
    const nomeModo = MODOS.find((m) => m.id === modo.value).nome.toLowerCase()
    return `${nomeCategoria}, ${nomeModo}`
  })

  function sortear() {
    const total = lista.value.length
    let i = Math.floor(Math.random() * total)
    if (total > 1 && i === indice.value) i = (i + 1) % total
    indice.value = i
  }

  function montar() {
    const { codigo, linguagem: id } = trecho.value
    if (!usadosNaRodada.value.includes(indice.value)) usadosNaRodada.value.push(indice.value)
    const tipos = colorir(codigo, LINGUAGENS[id])
    letras.value = [...codigo].map((letra, i) => ({ letra, tipo: tipos[i], estado: '' }))
    posicao.value = 0
    pularIndentacao()
  }

  // A indentação não conta como digitação: entra sozinha depois de cada quebra de linha
  function pularIndentacao() {
    const l = letras.value
    if (posicao.value !== 0 && l[posicao.value - 1].letra !== '\n') return
    while (posicao.value < l.length && l[posicao.value].letra === ' ') {
      l[posicao.value].estado = 'auto'
      posicao.value++
    }
  }

  function zerar() {
    clearInterval(relogio)
    fase.value = 'parado'
    historico.value = []
    usadosNaRodada.value = []
    resultado.value = null
    acertosAnteriores = teclas = teclasCertas = erros = teclasNoSegundo = errosNoSegundo = 0
  }

  function reiniciar() {
    zerar()
    montar()
  }

  function outroTrecho() {
    sortear()
    reiniciar()
  }

  function comecar() {
    fase.value = 'digitando'
    inicio = performance.now()
    relogio = setInterval(registrarSegundo, 1000)
  }

  function registrarSegundo() {
    const segundo = historico.value.length + 1
    historico.value.push({
      wpm: calcularWpm(acertosAnteriores + acertos.value, segundo),
      bruto: teclasNoSegundo * 12,
      erros: errosNoSegundo,
    })
    teclasNoSegundo = errosNoSegundo = 0
    if (modo.value !== 'trecho' && segundo >= +modo.value) terminar()
  }

  function digitar(tecla) {
    if (fase.value === 'fim') return
    if (fase.value === 'parado') comecar()

    const atual = letras.value[posicao.value]
    teclas++
    teclasNoSegundo++
    if (tecla === atual.letra) {
      atual.estado = 'ok'
      teclasCertas++
    } else {
      atual.estado = 'erro'
      erros++
      errosNoSegundo++
    }
    posicao.value++
    if (atual.letra === '\n') pularIndentacao()

    if (posicao.value === letras.value.length) {
      if (modo.value === 'trecho') return terminar()
      // no modo de tempo, o próximo trecho entra sem parar o relógio
      acertosAnteriores += acertos.value
      sortear()
      montar()
    }
  }

  function apagarUma() {
    const l = letras.value
    let p = posicao.value - 1
    while (p > 0 && l[p].estado === 'auto') p--
    if (p < 0 || l[p].estado === 'auto') return false // antes só tem indentação
    for (let i = p; i < posicao.value; i++) l[i].estado = ''
    posicao.value = p
    return true
  }

  function apagar(palavraInteira) {
    if (fase.value !== 'digitando' || !apagarUma() || !palavraInteira) return
    const l = letras.value
    const ehPalavra = (letra) => /[\w$]/.test(letra)
    const apagouPalavra = ehPalavra(l[posicao.value].letra)
    const continua = (letra) => (apagouPalavra ? ehPalavra(letra) : letra === ' ')
    while (posicao.value > 0 && l[posicao.value - 1].letra !== '\n' && continua(l[posicao.value - 1].letra)) apagarUma()
  }

  function terminar() {
    clearInterval(relogio)
    const tempo = modo.value === 'trecho' ? Math.max((performance.now() - inicio) / 1000, 0.5) : +modo.value

    // no modo trecho o teste acaba no meio de um segundo; esse pedaço também entra no gráfico
    if (modo.value === 'trecho') {
      const resto = tempo - historico.value.length
      if (resto > 0.2 || !historico.value.length) {
        historico.value.push({
          wpm: calcularWpm(acertosAnteriores + acertos.value, tempo),
          bruto: (teclasNoSegundo * 12) / Math.max(resto, 0.2),
          erros: errosNoSegundo,
        })
      }
    }

    const certos = acertosAnteriores + acertos.value
    const wpm = Math.round(calcularWpm(certos, tempo))
    const precisao = Math.floor((teclasCertas / teclas) * 100)
    const brutos = historico.value.map((h) => h.bruto)
    const media = brutos.reduce((a, b) => a + b, 0) / brutos.length
    const desvio = Math.sqrt(brutos.reduce((a, b) => a + (b - media) ** 2, 0) / brutos.length)

    const anterior = recorde.value
    const novoRecorde = wpm > anterior && precisao >= 75
    if (novoRecorde) {
      armazenamento.salvar(chaveRecorde.value, wpm)
      recorde.value = wpm
    }

    resultado.value = {
      wpm,
      bruto: Math.round(calcularWpm(teclas, tempo)),
      precisao,
      certos,
      erros,
      constancia: Math.max(0, Math.round(100 * (1 - desvio / media))),
      tempo: Math.round(tempo),
      anterior,
      novoRecorde,
      precisaoBaixa: precisao < 75 && wpm > anterior,
    }
    fase.value = 'fim'
  }

  onUnmounted(() => clearInterval(relogio))

  return {
    letras, posicao, fase, trecho, linguagem, historico, resultado, trechosDaRodada,
    wpmAoVivo, progresso, restante, recorde, descricao,
    digitar, apagar, reiniciar, outroTrecho,
  }
}
