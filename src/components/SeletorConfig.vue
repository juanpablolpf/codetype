<script setup>
import { CATEGORIAS, MODOS } from '../data/linguagens'

// defineModel cria um v-model no componente: o pai escreve
// <SeletorConfig v-model:categoria="x" v-model:modo="y" /> e os dois lados ficam ligados.
// (No React seriam duas props, value e onChange, para cada um.)
const categoria = defineModel('categoria', { required: true })
const modo = defineModel('modo', { required: true })
</script>

<template>
  <div class="config">
    <div class="seg" role="group" aria-label="Linguagem">
      <button
        v-for="c in CATEGORIAS"
        :key="c.id"
        type="button"
        :aria-pressed="c.id === categoria"
        @click="categoria = c.id"
      >{{ c.nome }}</button>
    </div>
    <div class="seg" role="group" aria-label="Modo">
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
.seg {
  display: inline-flex; padding: 3px; gap: 2px;
  border: 1px solid var(--line); border-radius: 999px; background: var(--panel);
}
.seg button {
  border: 0; background: transparent; cursor: pointer; white-space: nowrap;
  padding: 6px 13px; border-radius: 999px; font-size: 13px; color: var(--muted);
  transition: background-color 0.15s, color 0.15s;
}
.seg button:hover { color: var(--fg); }
.seg button[aria-pressed="true"] { background: rgba(255, 255, 255, 0.1); color: var(--fg); }

@media (max-width: 640px) {
  .config {
    flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none;
    margin-inline: -16px; padding-inline: 16px;
  }
  .config::-webkit-scrollbar { display: none; }
  .seg { flex: none; }
}
</style>
