import * as NODE      from 'three/nodes';
import * as THREE     from 'three';
import renderer       from './render';
import { Planet }     from './PlanetTech/celestialBodies/planet';
import { nodeFrame }  from 'three/addons/renderers/webgl-legacy/nodes/WebGLNodes.js';
import { FirstPersonControls }  from 'three/examples/jsm/controls/FirstPersonControls';
import { Space } from './WorldSpace/space';
import {SMAAEffect} from "postprocessing";
import Quad from './PlanetTech/engine/quad';
import { Moon } from './PlanetTech/celestialBodies/moon';
import { getRandomColor,hexToRgbA } from './PlanetTech/engine/utils'

import { tileMap,tileMapFront,tileTextuerTop, tileTextuerWorld,tileTextuerFront, tileMapCubeMapFront,tileTextuerLoad} from './examples/tileMap';
import {cubeMap, cubeMapTop,cubeMapFront } from './examples/cubeMap';
import { DynamicTextures, DynamicTileTextureManager} from './cubeMap/dynamicTextures';
import { quadDynamicTileExample,dynamicTileTextureManagerExample,dynamicTextureExample } from './examples/dynamicTileTextureManager';
import { addTextureTiles } from './examples/basic';

class ViewGL {
  constructor() {
  }
  
  render(canvasViewPort) {
    this.rend = renderer;
    this.rend.WebGLRenderer(canvasViewPort);
    this.rend.antialias = false
    this.rend.stencil   = false
    this.rend.depth     = false
    this.rend.scene();
    this.rend.stats();
    this.rend.camera();
    this.rend.updateCamera(0,0,110005*2)
    this.rend.orbitControls()
    this.rend.renderer.setClearColor('white');
    this.space = new Space()
  }
  
  initViewPort(canvasViewPort) {
  this.canvasViewPort = canvasViewPort;
  }

 
  initPlanet() {
    this.planet = new Planet({
      size:            10000,
      polyCount:          30,
      quadTreeDimensions:  1,
      levels:              5,
      radius:          80000,
      displacmentScale: 80.5,
      lodDistanceOffset: 12.4,
      material: new NODE.MeshPhysicalNodeMaterial(),
        },'Terranox')
    //this.planet.textuers(N,D)
    this.planet.light   (NODE.vec3(0.0,8.0,8.0))

    this.space.initComposer()
    this.space.addPlanets(this.planet,{
      PLANET_CENTER:      this.planet.metaData().cnt.clone(),
      PLANET_RADIUS:      this.planet.metaData().radius,
      ATMOSPHERE_RADIUS:  50000*2.0,
      lightDir:           new THREE.Vector3(0,0,1),
      ulight_intensity:   new THREE.Vector3(7.0,7.0,7.0),
      uray_light_color:   new THREE.Vector3(5,5,5),
      umie_light_color:   new THREE.Vector3(5,5,5),
      RAY_BETA:           new THREE.Vector3(5.5e-6, 13.0e-6, 22.4e-6),
      MIE_BETA:           new THREE.Vector3(21e-6, 21e-6, 21e-6),
      AMBIENT_BETA:       new THREE.Vector3(0.0),
      ABSORPTION_BETA:    new THREE.Vector3(2.04e-5, 4.97e-5, 1.95e-6),
      HEIGHT_RAY:        .5e3,
      HEIGHT_MIE:       .25e3,
      HEIGHT_ABSORPTION: 30e3,
      ABSORPTION_FALLOFF: 4e3,
      PRIMARY_STEPS:        8,
      LIGHT_STEPS:          4,
      G:                  0.7,
    })
    this.space.setAtmosphere()
    this.space.addEffects([new SMAAEffect()])

    const light = new THREE.AmbientLight( 0x404040,35 ); // soft white light
    this.rend.scene_.add( light );
    this.rend.scene_.add( this.planet.sphere );
  }
  

  initQuad(){
    const quad = new Quad(100,100,10,10,2)
    quad.createQuadTree(5)
    quad.createDimensions('front')
    let config = quad.quadTreeconfig.config
    console.log(config)
  }

  initPlayer(){
    var boxGeometry        = new THREE.BoxGeometry( 0.01, 0.01, 0.01, 1 )
    var boxMaterial        = new THREE.MeshBasicMaterial({color:'red'});
    this.player            = new THREE.Mesh( boxGeometry, boxMaterial );
    this.player.position.z = 110000
    this.controls               = new FirstPersonControls( this.player, document.body );
    this.controls.movementSpeed = 500
    this.controls.lookSpeed     = 0
    this.clock = new THREE.Clock();
    this.rend.scene_.add(this.player)
  }
  
  async start() {
    this.render(this.canvasViewPort);

    let moon = await quadDynamicTileExample(this.rend.renderer)

    this.rend.scene_.add(moon.sphere)
  }
  

  onWindowResize(vpW, vpH) {
    //this.rend.renderer.setSize(vpW, vpH);
  }

  update(t) {
    requestAnimationFrame(this.update.bind(this));
    this.rend.stats_.begin();
    //if(this.celestialBodie){
      //this.controls.update(this.clock.getDelta())
      //this.celestialBodie.update(this.player)
    //}
    this.rend.renderer.render(this.rend.scene_, this.rend.camera_);
    this.rend.stats_.end();
    nodeFrame.update();
  }

}
  
  
  var viewGL = new ViewGL();
  export default viewGL;