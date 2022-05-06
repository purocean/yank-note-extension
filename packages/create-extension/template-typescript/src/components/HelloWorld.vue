<script setup lang="ts">
import { onBeforeMount, onMounted, ref } from 'vue'
import { ctx } from 'yank-note-api'
const time = ref('')
const version = __EXTENSION_VERSION__
const id = __EXTENSION_ID__

let timer
onMounted(() => {
  time.value = ctx.lib.dayjs().format('YYYY-MM-DD HH:mm:ss')
  timer = setInterval(() => {
    time.value = ctx.lib.dayjs().format('YYYY-MM-DD HH:mm:ss')
  }, 1000)
})

onBeforeMount(() => {
  clearInterval(timer)
})
</script>

<template>
<div>
  <div>Id: {{id}}</div>
  <div>Version: {{version}}</div>
  <div>Time: {{time}}</div>
</div>
</template>

<style scoped>
div {
  color: #42b983;
  line-height: 1.5;
}
</style>
