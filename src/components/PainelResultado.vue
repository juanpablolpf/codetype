<script setup>
import { computed } from 'vue'
import GraficoWpm from './GraficoWpm.vue'

const props = defineProps({
  resultado: { type: Object, required: true },
  historico: { type: Array, required: true },
  descricao: { type: String, required: true },
})

// defineEmits lista os eventos que o pai pode escutar (@explicar, @repetir...).
// No React, o pai passaria funções como props (onExplicar, onRepetir...).
defineEmits(['explicar', 'repetir', 'proximo'])

const veredito = computed(() => {
  const r = props.resultado
  if (r.novoRecorde) {
    return r.anterior
      ? `Novo recorde em ${props.descricao}. Antes era ${r.anterior} wpm.`
      : `Primeiro recorde em ${props.descricao}.`
  }
  if (r.precisaoBaixa) return 'Recorde não salvo: a precisão precisa ser de pelo menos 75%.'
  return r.anterior ? `Seu recorde aqui é ${r.anterior} wpm.` : ''
})
</script>

<template>
  <div class="resultado" aria-live="polite">
    <div class="topo">
      <div class="principal"><span class="numero">{{ resultado.wpm }}</span><span class="unidade">wpm</span></div>
      <div class="numeros">
        <div><span>Precisão</span><b>{{ resultado.precisao }}<small>%</small></b></div>
        <div><span>Bruto</span><b>{{ resultado.bruto }} <small>wpm</small></b></div>
        <div><span>Caracteres</span><b>{{ resultado.certos }}<small> / </small><em>{{ resultado.erros }}</em></b></div>
        <div><span>Constância</span><b>{{ resultado.constancia }}<small>%</small></b></div>
        <div><span>Tempo</span><b>{{ resultado.tempo }}<small> s</small></b></div>
      </div>
    </div>

    <GraficoWpm :pontos="historico" />

    <div class="rodape">
      <span class="veredito" :class="{ novo: resultado.novoRecorde }">{{ veredito }}</span>
      <div class="btns">
        <button class="btn" type="button" @click="$emit('explicar')">Entender o código</button>
        <button class="btn" type="button" @click="$emit('repetir')">Repetir trecho</button>
        <button class="btn primario" type="button" @click="$emit('proximo')">Próximo trecho</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.resultado { padding: 28px 28px 24px; }
.topo { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 28px 44px; }
.principal { line-height: 1; }
.numero { font-size: clamp(64px, 11vw, 96px); font-weight: 600; letter-spacing: -0.05em; font-variant-numeric: tabular-nums; }
.unidade { font-size: 15px; color: var(--muted); margin-left: 6px; }
.numeros {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 18px 28px; flex: 1; min-width: 260px; padding-bottom: 8px;
}
.numeros div { display: flex; flex-direction: column; gap: 2px; }
.numeros span { font-size: 13px; color: var(--muted); }
.numeros b { font-family: var(--mono); font-weight: 500; font-size: 20px; }
.numeros small { font-size: 13px; color: var(--muted); font-weight: 400; }
.numeros em { font-style: normal; color: var(--err); }
.rodape {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 14px;
  margin-top: 26px; padding-top: 20px; border-top: 1px solid var(--line);
}
.veredito { color: var(--muted); font-size: 14px; }
.veredito.novo { color: var(--fg); }
@media (max-width: 640px) {
  .resultado { padding: 22px 18px 20px; }
}
</style>
