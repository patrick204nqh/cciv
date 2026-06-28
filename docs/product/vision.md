# CCIV — Product Vision

## What is CCIV?

A **3D ship viewer and environment editor** built with Three.js + Vite + TypeScript. The user explores a fully realized vessel in a dynamic ocean scene with stormy atmosphere, ship's log telemetry, and a dual-mode editor/viewer interface.

## Core experience

- **Play mode** — navigate the vessel through a living ocean with wave physics, spray, wake, and dynamic lighting. Camera follows the active vessel.
- **Edit mode** — manipulate the scene: move objects, tweak materials, switch locations, inspect the scene graph. Physics freezes while editing.

## Target audience

Engineers and technical artists who want a code-native environment for prototyping 3D scenes — no 3D modeling tools required, everything generated from TypeScript.

## Long-term direction

- Expand the model library (buoys, islands, structures, flora)
- Rich location presets with distinct environments
- Material presets — save/load material tweaks as shareable JSON
- Multi-vessel scenarios
- Standalone desktop deployment

## Non-goals

This is NOT a game engine, a WebGPU demo, or a ship simulator. It is an **engineering workbench** for building and exploring 3D environments through code — where the vessel is the protagonist and the ocean is the stage.
