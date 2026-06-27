interface ToolDef {
  id: string
  label: string
  icon: string
  init?: (container: HTMLElement) => void
  destroy?: () => void
  render?: (container: HTMLElement) => void
}

let tools: ToolDef[] = []
let activeTool: string | null = null
let panelContent: HTMLElement | null = null
let destroyedFns = new Map<string, () => void>()

function getToolbar(): HTMLElement {
  return document.getElementById('tb')!
}

function getPanel(): HTMLElement {
  return document.getElementById('pn')!
}

function getPanelBody(): HTMLElement {
  return document.getElementById('pn-b')!
}

function getPanelTitle(): HTMLElement {
  return document.getElementById('pn-t')!
}

function getPanelClose(): HTMLElement {
  return document.getElementById('pn-x')!
}

function openTool(id: string) {
  const tool = tools.find(t => t.id === id)
  if (!tool) return

  if (activeTool === id) {
    closePanel()
    return
  }

  if (activeTool) {
    const prev = document.querySelector(`.tb-b[data-tool="${activeTool}"]`)
    prev?.classList.remove('a')
    destroyedFns.get(activeTool)?.()
  }

  activeTool = id
  const btn = document.querySelector(`.tb-b[data-tool="${id}"]`)
  btn?.classList.add('a')

  const body = getPanelBody()
  body.innerHTML = ''
  panelContent = body
  getPanelTitle().textContent = tool.label
  getPanel().classList.add('o')

  tool.init?.(body)
}

function closePanel() {
  if (activeTool) {
    const btn = document.querySelector(`.tb-b[data-tool="${activeTool}"]`)
    btn?.classList.remove('a')
    destroyedFns.get(activeTool)?.()
    destroyedFns.delete(activeTool)
    activeTool = null
  }
  getPanel().classList.remove('o')
  getPanelBody().innerHTML = ''
}

export function registerTool(tool: ToolDef) {
  tools.push(tool)
  const tb = getToolbar()
  const btn = document.createElement('button')
  btn.className = 'tb-b'
  btn.dataset.tool = tool.id
  btn.textContent = tool.icon
  btn.title = tool.label
  btn.onclick = () => openTool(tool.id)
  tb.insertBefore(btn, tb.querySelector('.tb-s'))
}

export function setSidebarCollapsed(collapsed: boolean) {
  getToolbar().classList.toggle('c', collapsed)
  if (collapsed) closePanel()
}

export function destroyTool(id: string) {
  const btn = document.querySelector(`.tb-b[data-tool="${id}"]`)
  btn?.remove()
  if (activeTool === id) closePanel()
  tools = tools.filter(t => t.id !== id)
}
