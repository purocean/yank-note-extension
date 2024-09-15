const { state: { width, height, apiToken, instruction, endpoint } } = data

const client = await env.gradio.Client.connect(endpoint, { hf_token: apiToken })

const submission = await client.submit('/infer', {
  prompt: instruction,
  seed: 0,
  width,
  height,
  randomize_seed: true,
  num_inference_steps: 4,
}, undefined, undefined, true)

let result
for await (const msg of submission) {
  if (msg.type === 'data') {
    result = msg
    break
  }

  if (msg.type === 'status' && msg.stage !== 'error') {
    const status = msg.progress_data?.map(
      item => `${item.desc || item.unit}: ${item.index}/${item.length}`
    ).join('\n') || msg.stage || ''

    env.updateStatus(status)
  }
}

const url = result?.data?.[0]?.url

if (!url) {
  throw new Error(JSON.stringify(result))
}

return { url, method: 'GET' }
