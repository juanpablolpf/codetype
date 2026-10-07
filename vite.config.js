import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base './' deixa os caminhos relativos, então o site funciona
// em juanpablolpf.github.io/codetype/ sem configuração extra.
export default defineConfig({
  base: './',
  plugins: [vue()],
})
