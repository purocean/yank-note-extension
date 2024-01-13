<script setup>
import { ref } from 'vue'

const ctx = window.useYnCtx({ injectGlobalCss: true })
const msg = ref('Hello World!')

function test () {
  ctx.ui.useToast().show('info', 'Hello World!')
}
</script>

<template>
  <h1>{{ msg }}</h1>
  <div style="display: flex">
    <input v-model="msg" />
    <button @click="test">TEST</button>
  </div>
</template>

<style>
  body {
    padding: 16px;
  }
</style>
