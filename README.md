⚠️ **Disclaimer:** PlanetTechJS is currently in its alpha version and is being developed by a single developer. Consequently, it's important to keep in mind that there may be bugs, spelling errors, lack of tests, and occasional inconsistencies in the library. While every effort is being made to provide a stable and enjoyable experience, please approach the library with the understanding that it's a work in progress. Your feedback, bug reports, and contributions are highly appreciated as they play a crucial role in improving the library and ensuring its quality.


# PlanetTechJS (ALPHA V0.0) 
![Example Planet](./public/readmeImg/example-planet.png)

<p align="center">
  <img src="./public/readmeImg/img6.png" />
</p>


**GOAL:**
PlanetTechJS is an open-source JavaScript library built using vanilla THREE.js, accompanied by a React UI for editing planets. Its primary purpose is to generate procedural planets and terrains using a quadtree LOD approach. The aim of this project is not to replicate titles like Star Citizen or No Man's Sky, but rather to provide a toolkit that emulates the tools they might employ for planet creation. The sole focus is on crafting planets, offering a straightforward and adaptable approach to designing realistic and visually captivating 3D planets on a grand scale. The key to the success of this project lies in its ability to handle **scale**, allowing for seamless transitions from the sky to the ground with high resolution. PlanetTechJS will include customizable features such as terrain textures, ground physics, atmospheric effects, and more. Thus, it does not encompass spaceships, weapons, player dynamics, etc.; its sole focus is planet generation.

What sets this library apart is its utilization of the GPU for all tasks. This includes generating textures for each facet, performing displacement, and shaping PlaneGeometries into spherical forms; the entire process occurs on the GPU. Consequently, there is no need for WebWorkers at this stage.

## Getting Started
Download and run the project. Go to http://localhost:3001/. The file for the demo is located at src/lib/viewGL.js. If things aren't working, open an issue, and I will try to correct any problems.


## Features/Ideas
- Procedural planet generation: Create unique and realistic planets using procedural algorithms.
- flexability and speed.
- quadtree sphere.
- CDLOD. (coming soon)
- custom frustum culling. (coming soon)
- raycasting mannequin. (coming soon)
- cubeMap. (threading and instancing coming soon)
- Terrain generation: Generate detailed and customizable terrains with different types of landscapes such as mountains, valleys, and plains.
- Texture mapping: Apply textures to the terrain to enhance visual realism and add visual variety.(coming soon)
- Gpu generated normal map.
- Gpu generated displacement map.
- Atmospheric effects: Simulate atmospheric effects such as clouds, haze, and lighting to create a more immersive environment.(dev complete)
- day and night cycle.(coming soon)
- weather simulation.(coming soon)
- Texture editing / terrain editing. (coming soon)
- Texture Atlas. (dev complete)
- Texture channel packing.(dev complete)
- Texture Splat Map.(dev complete)
- Physics. (coming soon)
- assets.  (coming soon)
- foliage. (coming soon)
- ability to switch from WebGL to WebGPU backended. (dev complete)
- logs.

## Specs
- Recommended GPU is GTX 1060 and above.

## How It Works
The PlanettechJS repository contains two libraries: Planettech itself and Cubemap.

- Planettech: Think of it as the backend. It handles planet system management, mesh creation, as well as the generation of quads and quadtree data structures from the PlanetTech engine.

- Cubemap: This serves as the frontend and primarily handles texture generation.


Let's create a basic quadtree sphere without any textures or displacement, just coloring each dimension to show what's going on under the hood.