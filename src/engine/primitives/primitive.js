 
import * as THREE from 'three'
import { Blueprint } from '../system/bluePrint.js'
 

function cornersFromRect(width, height, center) {
    const hw = width  / 2;
    const hh = height / 2;
    return {
        A: new THREE.Vector3(center.x - hw, center.y - hh, center.z),
        B: new THREE.Vector3(center.x + hw, center.y - hh, center.z),
        C: new THREE.Vector3(center.x + hw, center.y + hh, center.z),
        D: new THREE.Vector3(center.x - hw, center.y + hh, center.z),
    };
}

function projectOnSphere(v, center, radius) {
    return v.clone().sub(center).normalize().multiplyScalar(radius).add(center);
}

function projectCornersOnSphere(A, B, C, D, radius) {
    const center = new THREE.Vector3(0,0,0)
    const pA = projectOnSphere(A, center, radius);
    const pB = projectOnSphere(B, center, radius);
    const pC = projectOnSphere(C, center, radius);
    const pD = projectOnSphere(D, center, radius);
    const M  = new THREE.Vector3().add(pA).add(pB).add(pC).add(pD).multiplyScalar(0.25);
    const pM = projectOnSphere(M, center, radius);
    return { pA, pB, pC, pD, pM };
}

export class SpatialNode extends THREE.Object3D{

  constructor(
    bounds, 
    level, 
    transformMatrix, 
    direction, 
    index) {
    super();
    this.bounds          = bounds;
    this.level           = level;
    this.transformMatrix = transformMatrix;
    this.direction       = direction;
    this.index           = index;
    
    this._children       = [];
    this.isSubdivided    = false;
    this.disposeTimer    = null;
    this.worldData       = undefined
  }

  generateKey (position) {
    const { index, direction } = this;
    const { x, y, z } = position;
    return `${index}_${direction}_${Math.round(x)}_${Math.round(y)}_${Math.round(z)}`;
  }

  buildWorldBox(params={}) {
    
    const radius = params.radius
    
    const center = new THREE.Vector3();
    const size   = new THREE.Vector3();
    this.bounds.getCenter(center);
    this.bounds.getSize(size);

    this.worldData = {}
    
    const { A, B, C, D } = cornersFromRect(size.x, size.y, center);
    [A, B, C, D].forEach(p => p.applyMatrix4(this.transformMatrix));

    if (radius) { //todo falsy zero
      const { pA, pB, pC, pD, pM } = projectCornersOnSphere(A, B, C, D, radius);
      this.worldData.points = [pA, pB, pC, pD, pM]
      this.worldData.box    = new THREE.Box3().setFromPoints(this.worldData.points);
    } else {
      this.worldData.points = [A, B, C, D]
      this.worldData.box    = new THREE.Box3().setFromPoints(this.worldData.points);
    }
  }

  drawWorldBox(){
    const color  = new THREE.Color(Math.random(),Math.random(),Math.random());
    const helper = new THREE.Box3Helper(this.worldData.box, color);
    this.add(helper);
    this.userData.debugBounds = helper;
  }

  /*drawMesh(material){
    const center = new THREE.Vector3();
    const size   = new THREE.Vector3();
    this.bounds.getCenter(center);
    this.bounds.getSize(size);

    const geometry = this.blueprint.config.arraybuffers[size.x].geometryData.geometry

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(center);
    mesh.applyMatrix4(this.transformMatrix);  
    this.add(mesh);
  }*/

}



export class QuadTree extends THREE.Object3D {

  constructor(blueprint) {

    super()

    this.rootNodes = new Map();

    this.blueprint = blueprint

    this.createDimensions([])

  }

   

  #_createNode(rootBounds, numOfLvls, matrix, direction, idx){ 

    const spatialNode = new SpatialNode(rootBounds, numOfLvls, matrix, direction, idx) 
     
    const size = spatialNode.bounds.getSize(new THREE.Vector3());
     
    const geometry = this.blueprint.config.arraybuffers[size.x].geometryData.geometry

    this.blueprint.config.nodeCreated(spatialNode,{geometry}) 

    this.add(spatialNode)

    return spatialNode
    
  }

  
  createDimensions(faceIdxArray){ 
    const { maxLevelSize: w, dimensions: d, scale: s } = this.blueprint.config;
    const k_ = (w / 2) * d;
    const numOfLvls = this.blueprint.config.levels.numOflvls - 1

    for (let i = 0; i < d; i++) {
      const i_ = i * (w - 1) + i - (w / 2) * (d - 1);
      for (let j = 0; j < d; j++) {
        const j_ = j * (w - 1) + j - (w / 2) * (d - 1);

          faceIdxArray.forEach(idx=>{

            const spatialIdx = i * d + j

            const {pos, direction, matrix, rootBounds} = this.blueprint.getFaceData(idx, i_, j_, k_)

            const spatialNode = this.#_createNode(rootBounds, numOfLvls, matrix, direction, spatialIdx)

            this.rootNodes[spatialNode.generateKey(pos)] = spatialNode

          })
          
      }
    }
  }
 
}


export class QuadPrimitive extends QuadTree { 

  constructor( params ) { 

    const bluePrint = new Blueprint(params)

    super( bluePrint ) 

    this.createDimensions([0])

  } 

}

export class CubePrimitive extends QuadTree { 

  constructor( params ) { 

    const bluePrint = new Blueprint(params)

    super( bluePrint ) 

    this.createDimensions([0,1,2,3,4,5])

  } 

}

 


