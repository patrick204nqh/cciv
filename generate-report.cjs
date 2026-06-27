#!/usr/bin/env node
// Write the architecture review HTML report

const fs = require('fs');
const path = require('path');

const tmpDir = process.env.TMPDIR || '/tmp';
const timestamp = Date.now();
const filePath = path.join(tmpDir, `architecture-review-${timestamp}.html`);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Architecture Review — HMS Beagle</title>
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<script>mermaid.initialize({startOnLoad:true,theme:'neutral',themeVariables:{primaryColor:'#1e293b',primaryTextColor:'#f1f5f9',primaryBorderColor:'#334155',lineColor:'#64748b',secondaryColor:'#0f172a',tertiaryColor:'#1e293b',fontSize:'14px'}})</script>
<style>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');
body { font-family: 'Inter', system-ui, sans-serif; background: #0a0e14; color: #e2e8f0; }
code, .mono { font-family: 'JetBrains Mono', monospace; }
.card { background: #131820; border: 1px solid #1e293b; border-radius: 16px; padding: 2rem; transition: border-color 0.2s; }
.card:hover { border-color: #334155; }
.badge-strong { background: #166534; color: #bbf7d0; padding: 2px 10px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.05em; }
.badge-explore { background: #854d0e; color: #fef08a; padding: 2px 10px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.05em; }
.badge-speculative { background: #1e3a5f; color: #93c5fd; padding: 2px 10px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.05em; }
.before-box { background: #1a0a0a; border: 1px solid #3b1a1a; border-radius: 12px; padding: 1.25rem; }
.after-box { background: #0a1a0a; border: 1px solid #1a3b1a; border-radius: 12px; padding: 1.25rem; }
.diagram-container { background: #0a0e14; border: 1px solid #1e293b; border-radius: 12px; padding: 1rem; margin: 1rem 0; overflow-x: auto; }
.adr-warning { background: #3b1a1a; border: 1px solid #5c2a2a; border-radius: 8px; padding: 0.75rem 1rem; margin: 0.75rem 0; font-size: 0.875rem; color: #fca5a5; }
.file-link { color: #60a5fa; text-decoration: none; font-family: 'JetBrains Mono', monospace; font-size: 0.8125rem; }
.file-link:hover { text-decoration: underline; }
.metric { font-size: 2rem; font-weight: 700; line-height: 1; }
.metric-label { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
.mermaid { background: transparent !important; }
.mermaid .label { color: #e2e8f0 !important; }
</style>
</head>
<body class="min-h-screen">
<div class="max-w-6xl mx-auto px-6 py-12">

<!-- Header -->
<div class="mb-12">
  <div class="flex items-center gap-3 mb-2">
    <h1 class="text-3xl font-bold text-white">Architecture Review</h1>
    <span class="text-sm text-slate-500">HMS Beagle</span>
  </div>
  <p class="text-slate-400 text-base">Deepening opportunities identified through systematic codebase exploration. Each candidate applies the <span class="text-slate-300">deletion test</span> — would removing the module concentrate complexity or just move it?</p>
</div>

<!-- Executive Summary -->
<div class="card mb-8">
  <h2 class="text-xl font-semibold text-white mb-4">Executive Summary</h2>
  <div class="grid grid-cols-4 gap-6 mb-6">
    <div><div class="metric text-red-400">18 MB</div><div class="metric-label">in-code geometry (JS literals)</div></div>
    <div><div class="metric text-orange-400">358 MB</div><div class="metric-label">4K textures in git</div></div>
    <div><div class="metric text-slate-400">0</div><div class="metric-label">application tests</div></div>
    <div><div class="metric text-emerald-400">6</div><div class="metric-label">entities (all with unique patterns)</div></div>
  </div>
  <p class="text-slate-400 text-sm leading-relaxed">
    The core architectural decisions (ADR-001, ADR-002) are sound. The friction comes from <strong class="text-slate-200">build artifacts committed as source</strong> and <strong class="text-slate-200">shallow data-wrangling modules</strong> that should be behind deeper seams. The biggest win: the GLB compile pipeline <em>already exists</em> (<code class="text-sky-400">src/scripts/compile-model.ts</code>) but the runtime ignores it — geometry still flows through 29 JS literal files loaded at import time. Completing that seam removes 18 MB from the bundle and collapses 7 data directories into one binary.
  </p>
</div>

<!-- Candidate 1: GLB Runtime Seam -->
<div class="card mb-6" id="candidate-1">
  <div class="flex items-start justify-between mb-4">
    <div>
      <div class="flex items-center gap-3 mb-1">
        <h2 class="text-xl font-semibold text-white">1. Complete the GLB Runtime Seam</h2>
        <span class="badge-strong">Strong</span>
      </div>
      <p class="text-sm text-slate-400">Replace the in-code JS-literal geometry pipeline with runtime GLB loading</p>
    </div>
  </div>

  <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
    <div>
      <div class="text-slate-500 mb-1">Files</div>
      <div class="space-y-0.5">
        <div class="file-link">src/models/ship/data/{hull,deck,sails,aft,rigging,details,interior}/*.js</div>
        <div class="file-link">src/models/ship/config.ts</div>
        <div class="file-link">src/model/factory.ts</div>
        <div class="file-link">src/model/types.ts</div>
        <div class="file-link">src/scripts/compile-model.ts</div>
      </div>
    </div>
    <div>
      <div class="text-slate-500 mb-1">Cost</div>
      <div>29 files deleted, 3 files modified, 1 new loader module</div>
    </div>
  </div>

  <div class="adr-warning">
    <strong>Contradicts ADR-001</strong> — which chose flat data files over bundled formats ("works well with tree-shaking and diff review"). The friction is real enough to warrant reopening: 18 MB of JS literals are loaded synchronously at module import time, blocking the critical path and making every model addition cost proportional to its vertex count rather than its interface complexity.
  </div>

  <div class="mb-4">
    <h3 class="text-sm font-semibold text-slate-300 mb-2">Problem</h3>
    <ul class="text-sm text-slate-400 space-y-1.5 list-disc list-inside">
      <li><strong class="text-slate-300">Synchronous import-time loading</strong> — importing <code>config.ts</code> parses and allocates 18 MB of Float32Arrays before any code runs. The bundle includes every vertex whether the model is on screen or not.</li>
      <li><strong class="text-slate-300">No tree-shaking</strong> — JS literals are already the "treeshaken" format (you can't shake individual vertices). GLB compresses geometry 3-5× via Draco/meshopt.</li>
      <li><strong class="text-slate-300">Diff noise</strong> — touching the model rebuild regenerates all 29 data files. Meaningful diffs are buried in numeric churn.</li>
      <li><strong class="text-slate-300">Duplicated pipeline</strong> — <code>compile-model.ts</code> already reads these same data files and writes a GLB. The output sits in <code>public/models/</code> unused.</li>
    </ul>
  </div>

  <div class="mb-4">
    <h3 class="text-sm font-semibold text-slate-300 mb-2">Solution</h3>
    <p class="text-sm text-slate-400 leading-relaxed">Introduce a <strong>GlbLoader</strong> adapter at the model-creation seam. The <code>ModelFactory</code> gains a second adapter: <code>glb</code> (async, runtime-loaded) alongside the existing <code>extracted</code> (sync, in-code). <code>ModelConfig</code> replaces the <code>meshGroups</code> array with a <code>glbPath</code> string for GLB-sourced models. The compile step (<code>compile-model.ts</code>) becomes part of the build pipeline — run before <code>vite build</code>. The 29 data files become build intermediates cached in <code>.cache/</code>.</p>
  </div>

  <div class="grid grid-cols-2 gap-6">
    <div class="before-box">
      <div class="text-xs font-semibold text-red-400 mb-2 uppercase tracking-wider">Before</div>
      <div class="diagram-container">
        <pre class="mermaid">
graph TB
  subgraph Source["<b>Source (committed)</b>"]
    JS["29 .js files<br/>18 MB Float32Array<br/>literals"]
    CFG["config.ts<br/>meshGroups array"]
  end
  subgraph Runtime["<b>Runtime</b>"]
    IMP["import config.ts<br/>(synchronous)"]
    FAC["factory.ts buildGeometry()<br/>BufferGeometry.fromArray"]
    MESH["THREE.Mesh"]
  end
  JS --> CFG --> IMP --> FAC --> MESH
  style JS fill:#3b1a1a,stroke:#5c2a2a
  style IMP fill:#3b1a1a,stroke:#5c2a2a
  style FAC fill:#3b1a1a,stroke:#5c2a2a
</pre>
      </div>
    </div>
    <div class="after-box">
      <div class="text-xs font-semibold text-emerald-400 mb-2 uppercase tracking-wider">After</div>
      <div class="diagram-container">
        <pre class="mermaid">
graph TB
  subgraph Build["<b>Build (cached)</b>"]
    PL["pull-reference.mjs<br/>download Poly Haven"]
    BM["build-model.mjs<br/>→ .cache/"]
    CM["compile-model.ts<br/>→ public/models/ship.glb"]
  end
  subgraph Runtime["<b>Runtime</b>"]
    CFG2["config.ts<br/>{ glbPath: '/models/ship.glb' }"]
    LOAD["GlbLoader<br/>(async, Draco meshopt)"]
    MESH2["THREE.Group (from GLB)"]
    OVR["apply material overrides"]
  end
  PL --> BM --> CM
  CFG2 --> LOAD --> MESH2 --> OVR
  CM -.-> LOAD
  style CM fill:#0a3a0a,stroke:#1a5a1a
  style LOAD fill:#0a3a0a,stroke:#1a5a1a
  style MESH2 fill:#0a3a0a,stroke:#1a5a1a
</pre>
      </div>
    </div>
  </div>

  <div class="mt-4 grid grid-cols-3 gap-4">
    <div class="text-sm">
      <div class="text-emerald-400 font-semibold">Leverage</div>
      <div class="text-slate-400 text-xs leading-relaxed">One GlbLoader serves every future model. Callers never see geometry construction — just <code>loadModel(config) → ModelEntity</code>.</div>
    </div>
    <div class="text-sm">
      <div class="text-emerald-400 font-semibold">Locality</div>
      <div class="text-slate-400 text-xs leading-relaxed">Model geometry changes live in a single GLB binary. No more 29-file diffs. Material overrides stay in config — the only place a model's appearance is defined.</div>
    </div>
    <div class="text-sm">
      <div class="text-emerald-400 font-semibold">Testability</div>
      <div class="text-slate-400 text-xs leading-relaxed">The loader seam accepts an injected <code>GLTFLoader</code> adapter. Tests provide a fake that returns canned geometry — no filesystem, no network.</div>
    </div>
  </div>
</div>

<!-- Candidate 2: Texture as Build Artifact -->
<div class="card mb-6" id="candidate-2">
  <div class="flex items-start justify-between mb-4">
    <div>
      <div class="flex items-center gap-3 mb-1">
        <h2 class="text-xl font-semibold text-white">2. Texture Pipeline as Build Artifact</h2>
        <span class="badge-strong">Strong</span>
      </div>
      <p class="text-sm text-slate-400">Move 358 MB of 4K JPGs out of git; generate at build time</p>
    </div>
  </div>

  <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
    <div>
      <div class="text-slate-500 mb-1">Files</div>
      <div class="space-y-0.5">
        <div class="file-link">public/textures/ship/*/{diff,nor_gl,rough,metal,arm}_4k.jpg</div>
        <div class="file-link">src/textures/sources.ts</div>
        <div class="file-link">scripts/pull-reference.mjs</div>
        <div class="file-link">scripts/build-model.mjs</div>
      </div>
    </div>
    <div>
      <div class="text-slate-500 mb-1">Cost</div>
      <div>38 texture files removed from git, 2 scripts updated, .gitignore entry</div>
    </div>
  </div>

  <div class="mb-4">
    <h3 class="text-sm font-semibold text-slate-300 mb-2">Problem</h3>
    <ul class="text-sm text-slate-400 space-y-1.5 list-disc list-inside">
      <li><strong class="text-slate-300">358 MB in repo</strong> — every clone pays the full texture cost. 4K JPGs are overkill for a ship that renders at ~600px on screen.</li>
      <li><strong class="text-slate-300">Already a build artifact</strong> — <code>pull-reference.mjs</code> downloads these exact files from Poly Haven. <code>build-model.mjs</code> copies them to <code>public/textures/</code>. They're regenerated artifacts that happen to be committed.</li>
      <li><strong class="text-slate-300">No fallback for offline</strong> — if textures aren't pulled, the app shows broken materials. A generated 2K fallback would make the app self-contained.</li>
    </ul>
  </div>

  <div class="mb-4">
    <h3 class="text-sm font-semibold text-slate-300 mb-2">Solution</h3>
    <p class="text-sm text-slate-400 leading-relaxed">
      Add <code>public/textures/</code> to <code>.gitignore</code>. Update <code>build-model.mjs</code> to generate 2K downscaled fallback textures procedurally or via sharp. The pull step remains optional for production-quality rendering. The app works without pulled textures.
    </p>
  </div>

  <div class="grid grid-cols-2 gap-6">
    <div class="before-box">
      <div class="text-xs font-semibold text-red-400 mb-2 uppercase tracking-wider">Before</div>
      <div class="diagram-container">
        <pre class="mermaid">
graph LR
  PH["Poly Haven<br/>4K source"] --> PULL["pull-reference.mjs<br/>→ .cache/"]
  PULL --> BUILD["build-model.mjs<br/>copies to public/textures/"]
  BUILD --> GIT["git commit<br/>358 MB stored"]
  GIT --> APP["app serves from public/"]
  style GIT fill:#3b1a1a,stroke:#5c2a2a
</pre>
      </div>
    </div>
    <div class="after-box">
      <div class="text-xs font-semibold text-emerald-400 mb-2 uppercase tracking-wider">After</div>
      <div class="diagram-container">
        <pre class="mermaid">
graph LR
  PH2["Poly Haven<br/>4K source"] --> PULL2["pull-reference.mjs<br/>→ .cache/"]
  PULL2 --> BUILD2["build-model.mjs<br/>→ public/textures/ &<br/>generates 2K fallback"]
  BUILD2 --> GITIGNORE[".gitignore<br/>public/textures/"]
  PULL2 --> FALLBACK["procedural fallback<br/>in source (256px)"]
  FALLBACK --> APP2["app works offline"]
  BUILD2 -.-> DEV["dev: full quality"]
  style GITIGNORE fill:#0a3a0a,stroke:#1a5a1a
  style FALLBACK fill:#0a3a0a,stroke:#1a5a1a
</pre>
      </div>
    </div>
  </div>

  <div class="mt-4 grid grid-cols-3 gap-4">
    <div class="text-sm">
      <div class="text-emerald-400 font-semibold">Leverage</div>
      <div class="text-slate-400 text-xs leading-relaxed">One pipeline change removes 358 MB from every clone. Texture quality becomes a build flag, not a commit.</div>
    </div>
    <div class="text-sm">
      <div class="text-emerald-400 font-semibold">Locality</div>
      <div class="text-slate-400 text-xs leading-relaxed">Texture resolution and source live in one config (<code>references.json</code>). No stale textures in git.</div>
    </div>
    <div class="text-sm">
      <div class="text-emerald-400 font-semibold">Testability</div>
      <div class="text-slate-400 text-xs leading-relaxed">Tests use the procedural fallback textures — deterministic, zero network, zero I/O.</div>
    </div>
  </div>
</div>

<!-- Candidate 3: Shallow Build Script Seam -->
<div class="card mb-6" id="candidate-3">
  <div class="flex items-start justify-between mb-4">
    <div>
      <div class="flex items-center gap-3 mb-1">
        <h2 class="text-xl font-semibold text-white">3. Consolidate Build Scripts (Delete src/scripts/)</h2>
        <span class="badge-strong">Strong</span>
      </div>
      <p class="text-sm text-slate-400">Eliminate the reverse dependency from build tools to application code</p>
    </div>
  </div>

  <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
    <div>
      <div class="text-slate-500 mb-1">Files</div>
      <div class="space-y-0.5">
        <div class="file-link">src/scripts/compile-model.ts</div>
        <div class="file-link">src/scripts/lib/paths.ts</div>
        <div class="file-link">scripts/pull-reference.mjs</div>
        <div class="file-link">scripts/build-model.mjs</div>
      </div>
    </div>
    <div>
      <div class="text-slate-500 mb-1">Cost</div>
      <div>2 files moved, 1 deleted, package.json scripts updated</div>
    </div>
  </div>

  <div class="mb-4">
    <h3 class="text-sm font-semibold text-slate-300 mb-2">Problem</h3>
    <ul class="text-sm text-slate-400 space-y-1.5 list-disc list-inside">
      <li><strong class="text-slate-300">Reverse dependency</strong> — <code>src/scripts/compile-model.ts</code> imports <code>../textures/sources</code> (application code). Build tools should depend on source, not the other way around.</li>
      <li><strong class="text-slate-300">Split across two dirs</strong> — <code>scripts/</code> (Node.js .mjs) and <code>src/scripts/</code> (TypeScript .ts via tsx). Same pipeline, different conventions, no shared helpers.</li>
      <li><strong class="text-slate-300">Deletion test</strong> — delete <code>src/scripts/</code>: complexity reappears in <code>scripts/</code> (you'd need to duplicate paths and texture-parsing). That's the signal: this module is earning its keep but lives on the wrong side of the seam.</li>
    </ul>
  </div>

  <div class="mb-4">
    <h3 class="text-sm font-semibold text-slate-300 mb-2">Solution</h3>
    <p class="text-sm text-slate-400 leading-relaxed">
      Move <code>compile-model.ts</code> and <code>lib/paths.ts</code> to <code>scripts/</code>. Convert <code>textures/sources.ts</code> to a pure JSON manifest that both the runtime and build scripts read. The seam becomes: build tools read <code>textures.json</code>; the runtime imports <code>textures.json</code> via Vite's JSON import. No cross-dependency.
    </p>
  </div>

  <div class="grid grid-cols-2 gap-6">
    <div class="before-box">
      <div class="text-xs font-semibold text-red-400 mb-2 uppercase tracking-wider">Before</div>
      <div class="diagram-container">
<pre class="mermaid">
graph TB
  subgraph App["<b>src/ (application)</b>"]
    TEX["textures/sources.ts"]
    APP_CODE["… other modules …"]
  end
  subgraph Build["<b>scripts/ (build)</b>"]
    PULL["pull-reference.mjs"]
    BUILD["build-model.mjs"]
  end
  subgraph Mixed["<b>src/scripts/ (build inside app)</b>"]
    COMPILE["compile-model.ts ← imports TEX"]
    PATHS["lib/paths.ts"]
  end
  TEX -.->|"reverse dep"| COMPILE
  COMPILE --> PATHS
  style COMPILE fill:#3b1a1a,stroke:#5c2a2a
</pre>
      </div>
    </div>
    <div class="after-box">
      <div class="text-xs font-semibold text-emerald-400 mb-2 uppercase tracking-wider">After</div>
      <div class="diagram-container">
<pre class="mermaid">
graph TB
  subgraph App2["<b>src/ (application)</b>"]
    TEX2["textures/manifest.json"]
    APP_CODE2["… imports .json via Vite"]
  end
  subgraph Build2["<b>scripts/ (build)</b>"]
    PULL2["pull-reference.mjs"]
    BUILD2["build-model.mjs"]
    COMPILE2["compile-model.ts"]
    PATHS2["lib/paths.ts"]
  end
  TEX2 -.->|"both read"| BUILD2
  TEX2 -.->|"both read"| COMPILE2
  style TEX2 fill:#0a3a0a,stroke:#1a5a1a
  style COMPILE2 fill:#0a3a0a,stroke:#1a5a1a
</pre>
      </div>
    </div>
  </div>

  <div class="mt-4 grid grid-cols-3 gap-4">
    <div class="text-sm">
      <div class="text-emerald-400 font-semibold">Leverage</div>
      <div class="text-slate-400 text-xs leading-relaxed">One manifest format serves both build and runtime. New scripts don't need to import application code.</div>
    </div>
    <div class="text-sm">
      <div class="text-emerald-400 font-semibold">Locality</div>
      <div class="text-slate-400 text-xs leading-relaxed">All build logic in <code>scripts/</code>. <code>src/</code> contains only what ships to the browser.</div>
    </div>
    <div class="text-sm">
      <div class="text-emerald-400 font-semibold">Testability</div>
      <div class="text-slate-400 text-xs leading-relaxed">The manifest is pure data — tests load it as JSON and assert on structure. No module mocking needed.</div>
    </div>
  </div>
</div>

<!-- Candidate 4: Wave Surface Module -->
<div class="card mb-6" id="candidate-4">
  <div class="flex items-start justify-between mb-4">
    <div>
      <div class="flex items-center gap-3 mb-1">
        <h2 class="text-xl font-semibold text-white">4. Deepen Wave Surface into a Module</h2>
        <span class="badge-explore">Worth exploring</span>
      </div>
      <p class="text-sm text-slate-400">A deep module that owns wave state, sampling, and ocean-grid updates behind one interface</p>
    </div>
  </div>

  <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
    <div>
      <div class="text-slate-500 mb-1">Files</div>
      <div class="space-y-0.5">
        <div class="file-link">src/environment/waves.ts</div>
        <div class="file-link">src/entity/ocean-entity.ts</div>
        <div class="file-link">src/entity/ship-entity.ts</div>
      </div>
    </div>
    <div>
      <div class="text-slate-500 mb-1">Cost</div>
      <div>Create 1 module, refactor 2 entities, delete 1 inline pattern</div>
    </div>
  </div>

  <div class="mb-4">
    <h3 class="text-sm font-semibold text-slate-300 mb-2">Problem</h3>
    <ul class="text-sm text-slate-400 space-y-1.5 list-disc list-inside">
      <li><strong class="text-slate-300">Ocean entity owns both grid geometry AND wave sampling</strong> — it builds the vertex grid, stores base positions, samples waves every frame, and writes displaced vertices. The ship entity re-samples the exact same waves via <code>sampleOcean</code>/<code>sampleNormal</code> (same constants, same <code>WAVE_SPEED</code>).</li>
      <li><strong class="text-slate-300">Duplicated time source</strong> — both entities read <code>worldClock.elapsed * WAVE_SPEED</code> independently. The WAVE_SPEED constant is duplicated (once in ocean-entity.ts, once in ship-entity.ts).</li>
      <li><strong class="text-slate-300">Deletion test</strong> — delete <code>waves.ts</code>: the wave computation doesn't vanish, it just moves into ocean-entity.ts and ship-entity.ts. That means <code>waves.ts</code> is earning its keep as a shared computation, but the <em>stateful surface</em> (grid + displacement + time) has no module at all — it's scattered.</li>
    </ul>
  </div>

  <div class="mb-4">
    <h3 class="text-sm font-semibold text-slate-300 mb-2">Solution</h3>
    <p class="text-sm text-slate-400 leading-relaxed">
      Introduce a <strong>WaveSurface</strong> module. Its interface: <code>sample(x, z) → { height, dispX, dispZ, normal }</code>. Behind the interface it owns the wave parameters, the time accumulator, and (optionally) the ocean grid. The ocean entity becomes a thin adapter: it passes its grid vertices through <code>waveSurface.sample()</code> and updates the BufferGeometry. The ship entity just calls <code>waveSurface.sample()</code>. Both read from the same time source — no WAVE_SPEED constant in either entity.
    </p>
  </div>

  <div class="grid grid-cols-2 gap-6">
    <div class="before-box">
      <div class="text-xs font-semibold text-red-400 mb-2 uppercase tracking-wider">Before</div>
      <div class="diagram-container">
<pre class="mermaid">
graph TB
  WAVES["waves.ts<br/>pure functions"]
  OC["ocean-entity.ts<br/>- builds grid<br/>- stores basePos<br/>- samples per vertex<br/>- writes positions"]
  SHIP["ship-entity.ts<br/>- samples ocean<br/>- samples normal<br/>- computes rotation"]
  WCLOCK["worldClock"]
  WCLOCK --> OC
  WCLOCK --> SHIP
  OC --> WAVES
  SHIP --> WAVES
  style OC fill:#3b1a1a,stroke:#5c2a2a
  style SHIP fill:#3b1a1a,stroke:#5c2a2a
</pre>
      </div>
    </div>
    <div class="after-box">
      <div class="text-xs font-semibold text-emerald-400 mb-2 uppercase tracking-wider">After</div>
      <div class="diagram-container">
<pre class="mermaid">
graph TB
  WS["WaveSurface<br/>- owns wave params<br/>- owns time<br/>- sample(x,z) returns {h,dx,dz,n}"]
  OC2["ocean-entity.ts<br/>- builds grid<br/>- delegates to WS"]
  SHIP2["ship-entity.ts<br/>- delegates to WS"]
  WS --> WS_INTERNAL["waves.ts (private)"]
  OC2 --> WS
  SHIP2 --> WS
  style WS fill:#0a3a0a,stroke:#1a5a1a
  style OC2 fill:#0a3a0a,stroke:#1a5a1a,stroke-dasharray: 3 3
  style SHIP2 fill:#0a3a0a,stroke:#1a5a1a,stroke-dasharray: 3 3
</pre>
      </div>
    </div>
  </div>

  <div class="mt-4 grid grid-cols-3 gap-4">
    <div class="text-sm">
      <div class="text-emerald-400 font-semibold">Leverage</div>
      <div class="text-slate-400 text-xs leading-relaxed">All wave behaviour behind <code>sample(x, z)</code>. Future entities (buoys, floating objects) call one function. Wave parameter tuning changes one module.</div>
    </div>
    <div class="text-sm">
      <div class="text-emerald-400 font-semibold">Locality</div>
      <div class="text-slate-400 text-xs leading-relaxed">WAVE_SPEED lives in one place. Time synchronization is the module's responsibility, not duplicated across consumers.</div>
    </div>
    <div class="text-sm">
      <div class="text-emerald-400 font-semibold">Testability</div>
      <div class="text-slate-400 text-xs leading-relaxed">WaveSurface is pure-math — test <code>sample()</code> with known inputs, assert height/normal. Ocean and ship entities test with a mock WaveSurface.</div>
    </div>
  </div>
</div>

<!-- Candidate 5: Event Bus Decoupling -->
<div class="card mb-6" id="candidate-5">
  <div class="flex items-start justify-between mb-4">
    <div>
      <div class="flex items-center gap-3 mb-1">
        <h2 class="text-xl font-semibold text-white">5. Decouple EventBus from Three.js</h2>
        <span class="badge-speculative">Speculative</span>
      </div>
      <p class="text-sm text-slate-400">Remove the THREE.Vector3/Quaternion types from event payloads</p>
    </div>
  </div>

  <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
    <div>
      <div class="text-slate-500 mb-1">Files</div>
      <div class="file-link">src/event-bus.ts</div>
    </div>
    <div>
      <div class="text-slate-500 mb-1">Cost</div>
      <div>1 file modified, 2 consumers updated (spray, wake)</div>
    </div>
  </div>

  <div class="mb-4">
    <h3 class="text-sm font-semibold text-slate-300 mb-2">Problem</h3>
    <ul class="text-sm text-slate-400 space-y-1.5 list-disc list-inside">
      <li><strong class="text-slate-300">Framework bleed</strong> — the event bus imports <code>import * as THREE from 'three'</code> to use <code>Vector3</code> and <code>Quaternion</code> in payload types.</li>
      <li><strong class="text-slate-300">Consumers already convert</strong> — spray-entity and wake-entity reconstruct Vector3/Quaternion from the event payload. The conversion is trivial, proving the abstraction should be plain data.</li>
      <li><strong class="text-slate-300">Deletion test</strong> — delete the Three.js dependency from EventBus: the three event types become <code>{x,y,z}</code>/<code>{x,y,z,w}</code> tuples. The delenda is pure mechanical. This is a small fix, not a restructuring.</li>
    </ul>
  </div>

  <div class="grid grid-cols-2 gap-6">
    <div class="before-box">
      <div class="text-xs font-semibold text-red-400 mb-2 uppercase tracking-wider">Before</div>
      <div class="diagram-container">
<pre class="mermaid">
graph LR
  BUS["event-bus.ts<br/>import * as THREE"]
  BUS --> POS["EntityPositionEvent<br/>position: THREE.Vector3"]
  SPRAY["spray-entity.ts<br/>copies .x,.y,.z to local"]
  WAKE["wake-entity.ts<br/>.applyQuaternion()"]
  style BUS fill:#3b1a1a,stroke:#5c2a2a
</pre>
      </div>
    </div>
    <div class="after-box">
      <div class="text-xs font-semibold text-emerald-400 mb-2 uppercase tracking-wider">After</div>
      <div class="diagram-container">
<pre class="mermaid">
graph LR
  BUS2["event-bus.ts<br/>no THREE import"]
  BUS2 --> POS2["EntityPositionEvent<br/>x,y,z,qx,qy,qz,qw: number"]
  SPRAY2["spray-entity.ts<br/>new Vector3(ev.x, ev.y, ev.z)"]
  WAKE2["wake-entity.ts<br/>new Quaternion(ev.qx, ev.qy, ev.qz, ev.qw)"]
  style BUS2 fill:#0a3a0a,stroke:#1a5a1a
</pre>
      </div>
    </div>
  </div>
</div>

<!-- Candidate 6: worldClock Side Effect -->
<div class="card mb-6" id="candidate-6">
  <div class="flex items-start justify-between mb-4">
    <div>
      <div class="flex items-center gap-3 mb-1">
        <h2 class="text-xl font-semibold text-white">6. Extract worldClock.update() from EntityManager</h2>
        <span class="badge-speculative">Speculative</span>
      </div>
      <p class="text-sm text-slate-400">Move the clock update to the application layer for a pure-facade EntityManager</p>
    </div>
  </div>

  <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
    <div>
      <div class="text-slate-500 mb-1">Files</div>
      <div class="file-link">src/entity/manager.ts</div>
      <div class="file-link">src/main.ts</div>
    </div>
    <div>
      <div class="text-slate-500 mb-1">Cost</div>
      <div>2 lines moved, zero behavioural change</div>
    </div>
  </div>

  <div class="mb-4">
    <h3 class="text-sm font-semibold text-slate-300 mb-2">Problem</h3>
    <ul class="text-sm text-slate-400 space-y-1.5 list-disc list-inside">
      <li><strong class="text-slate-300">Hidden side effect</strong> — <code>entityManager.update(dt)</code> calls <code>worldClock.update(dt)</code> before iterating entities. A caller who just wants to step entities also advances global time.</li>
      <li><strong class="text-slate-300">The clock isn't an entity</strong> — it's a cross-cutting dependency that every entity reads. The manager shouldn't be the thing that ticks it.</li>
    </ul>
  </div>

  <div class="grid grid-cols-2 gap-6">
    <div class="before-box">
      <div class="text-xs font-semibold text-red-400 mb-2 uppercase tracking-wider">Before</div>
      <div class="diagram-container">
<pre class="mermaid">
graph LR
  MAIN["main.ts loop"]
  MAIN --> EM["entityManager.update(dt)"]
  EM --> WC["worldClock.update(dt) (hidden)"]
  EM --> ENTITIES["entities.onUpdate(dt)"]
  style EM fill:#3b1a1a,stroke:#5c2a2a
</pre>
      </div>
    </div>
    <div class="after-box">
      <div class="text-xs font-semibold text-emerald-400 mb-2 uppercase tracking-wider">After</div>
      <div class="diagram-container">
<pre class="mermaid">
graph LR
  MAIN2["main.ts loop"]
  MAIN2 --> WC2["worldClock.update(dt) (explicit)"]
  MAIN2 --> EM2["entityManager.update(dt)"]
  EM2 --> ENTITIES2["entities.onUpdate(dt)"]
  style EM2 fill:#0a3a0a,stroke:#1a5a1a
</pre>
      </div>
    </div>
  </div>
</div>

<!-- Top Recommendation -->
<div class="card mt-8 border-emerald-800" id="top-recommendation">
  <h2 class="text-xl font-semibold text-emerald-400 mb-4">Top Recommendation</h2>

  <div class="flex items-start gap-6">
    <div class="w-2/3">
      <h3 class="text-lg font-semibold text-white mb-2">Phase 1: Complete the GLB Runtime Seam</h3>
      <p class="text-sm text-slate-400 leading-relaxed mb-4">
        Tackle candidates <strong>1 + 2 + 3</strong> as a single wave. They share the same motivation — "build artifacts should not be source" — and the same fix pattern. The compile-GLB pipeline already exists; you just need to connect it to the runtime.
      </p>
      <div class="text-sm text-slate-400 space-y-2">
        <div class="flex gap-3"><span class="text-emerald-400 font-semibold shrink-0">Week 1</span> <span>Add GlbLoader adapter. Switch ModelConfig to accept glbPath. Create LoadedModelEntity wrapper. <code>createModel</code> becomes async.</span></div>
        <div class="flex gap-3"><span class="text-emerald-400 font-semibold shrink-0">Week 2</span> <span>Move <code>src/scripts/</code> → <code>scripts/</code>. Convert textures/sources.ts → manifest.json. Wire manifest into compile-model.ts directly.</span></div>
        <div class="flex gap-3"><span class="text-emerald-400 font-semibold shrink-0">Week 3</span> <span>Gitignore <code>public/textures/</code>. Generate 2K fallback in build step. Verify ship renders identically via GLB path.</span></div>
      </div>
      <div class="mt-4 text-sm text-slate-400 bg-slate-800/50 rounded-lg p-3">
        <strong class="text-slate-200">Why this order:</strong> the entity lifecycle (ADR-002) and model abstraction (ADR-001) are already designed for this. The GLB loader is a new <em>adapter</em> at an existing seam — it doesn't break any pattern. And it's the only candidate that <strong>removes more code than it adds</strong>.
      </div>
    </div>
    <div class="w-1/3 bg-slate-800/50 rounded-xl p-4">
      <div class="text-xs text-slate-500 uppercase tracking-wider mb-3">Impact Summary</div>
      <div class="space-y-3">
        <div><div class="text-emerald-400 font-semibold">-18 MB</div><div class="text-xs text-slate-500">JS bundle (no more Float32Array literals)</div></div>
        <div><div class="text-emerald-400 font-semibold">-358 MB</div><div class="text-xs text-slate-500">git repo size</div></div>
        <div><div class="text-emerald-400 font-semibold">-29 files</div><div class="text-xs text-slate-500">source files deleted</div></div>
        <div><div class="text-emerald-400 font-semibold">+1</div><div class="text-xs text-slate-500">new adapter module (GlbLoader)</div></div>
        <div><div class="text-emerald-400 font-semibold">+3-5×</div><div class="text-xs text-slate-500">geometry compression (Draco/meshopt)</div></div>
      </div>
    </div>
  </div>
</div>

<!-- Secondary Recommendations -->
<div class="mt-8">
  <h2 class="text-lg font-semibold text-white mb-4">After Phase 1</h2>
  <div class="grid grid-cols-2 gap-4">
    <div class="card">
      <h3 class="text-sm font-semibold text-white mb-2">WaveSurface Module</h3>
      <p class="text-xs text-slate-400 leading-relaxed">Once the ship and ocean both use the GLB pipeline, the wave surface is the remaining shared state. Deepen after Phase 1 — it's independent work and the entities are already refactored.</p>
    </div>
    <div class="card">
      <h3 class="text-sm font-semibold text-white mb-2">EventBus + worldClock polish</h3>
      <p class="text-xs text-slate-400 leading-relaxed">These are small, non-breaking improvements. Do them anytime — they don't depend on Phase 1 and each takes under an hour.</p>
    </div>
  </div>
</div>

</div>
</body>
</html>`;

fs.writeFileSync(filePath, html);
console.log(filePath);
