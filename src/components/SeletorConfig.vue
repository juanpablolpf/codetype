<script setup>
import { CATEGORIAS, MODOS } from '../data/linguagens'

const categoria = defineModel('categoria', { required: true })
const modo = defineModel('modo', { required: true })
</script>

<template>
  <div class="config">
    <div class="grupo" role="group" aria-label="Linguagem">
      <button
        v-for="c in CATEGORIAS"
        :key="c.id"
        type="button"
        :aria-pressed="c.id === categoria"
        @click="categoria = c.id"
      >{{ c.nome }}</button>
    </div>
    <div class="grupo" role="group" aria-label="Modo">
      <button
        v-for="m in MODOS"
        :key="m.id"
        type="button"
        :aria-pressed="m.id === modo"
        @click="modo = m.id"
      >{{ m.nome }}</button>
    </div>
  </div>
</template>

<style scoped>
.config { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; }
.grupo {
  display: inline-flex; padding: 3px; gap: 2px;
  border: 1px solid var(--linha); border-radius: 999px; background: var(--painel);
}
.grupo button {
  border: 0; background: transparent; cursor: pointer; white-space: nowrap;
  padding: 6px 13px; border-radius: 999px; font-size: 13px; color: var(--apagado);
  transition: background-color 0.15s, color 0.15s;
}
.grupo button:hover { color: var(--texto); }
.grupo button[aria-pressed="true"] { background: rgba(255, 255, 255, 0.1); color: var(--texto); }

@media (max-width: 640px) {
  .config {
    flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none;
    margin-inline: -16px; padding-inline: 16px;
  }
  .config::-webkit-scrollbar { display: none; }
  .grupo { flex: none; }
}
</style>
