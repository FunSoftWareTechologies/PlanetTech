import * as THREE from 'three'


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

class SpatialQuadTreeNode extends THREE.Object3D{

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

    return this
  }

  drawWorldBox(color = new THREE.Color(Math.random(),Math.random(),Math.random())){
    const helper = new THREE.Box3Helper(this.worldData.box, color);
    this.add(helper);
    this.userData.debugBounds = helper;
    return this
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

    const spatialNode = new SpatialQuadTreeNode(rootBounds, numOfLvls, matrix, direction, idx) 
     
    this.blueprint.config.nodeCreated(spatialNode,this.blueprint) 

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



class OcTreeNode extends THREE.Object3D{

  constructor(box,depth,maxDepth,capacity){
    super()
    this.box      = box 
    this.depth    = depth 
    this.maxDepth = maxDepth
    this.capacity = capacity
    this.items    = []
    this.children = null 
  }

    insert(item){
       
      this.items.push(item)
    }

}


export class OcTree extends THREE.Object3D{

  constructor(box,depth,maxDepth,capacity){
    super()

    this.ocTreeNode = new OcTreeNode(box,depth,maxDepth,capacity)

    this._frustum   = new THREE.Frustum();

    this._pMat      = new THREE.Matrix4();

    this. _scratchBox  = new THREE.Box3();

    this. _sphere      = new THREE.Sphere();

  }

  insert(item){
  this.ocTreeNode.insert(item)
  }

  queryFrustrum(pp,camera,out){
 

    camera.updateMatrixWorld();
    this._pMat.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this._frustum.setFromProjectionMatrix(this._pMat);

    const groupWorldMatrix = pp.matrixWorld;



    for (const it of this.ocTreeNode.items){
          this. _scratchBox.copy(it.wb).applyMatrix4(groupWorldMatrix);
    this.  _scratchBox.getBoundingSphere(this._sphere);
      const x  = it.i 
      if (!this._frustum.intersectsSphere(this._sphere)){ 

      

         const g = Object.values( pp.primitive.blueprint.config.instanceObject)[0]
 const at = g.geometry.getAttribute('instanceVisible')
 
 at.needsUpdate = true;
   
   at.array[x] = 0
 
      } 

       

 


    }
  }

}