import * as THREE from 'three'
 

class Node extends THREE.Object3D{
  constructor(eventObject){
    super()
  }
}


export class OctreeNode extends Node{

  constructor(config,callBack) {

    super(callBack)

    const {center, size, depth, maxDepth, capacity, looseness } = this.config = config

    const _center = center.clone();
 
    this.items = [];

    this.children = null;

    const strictHalf = size / 2;

    this.strictBox = new THREE.Box3(
      new THREE.Vector3(_center.x - strictHalf, _center.y - strictHalf, _center.z - strictHalf),
      new THREE.Vector3(_center.x + strictHalf, _center.y + strictHalf, _center.z + strictHalf)
    );

    const looseHalf = (size / 2) * this.looseness;
    this.looseBox = new THREE.Box3(
      new THREE.Vector3(_center.x - looseHalf, _center.y - looseHalf, _center.z - looseHalf),
      new THREE.Vector3(_center.x + looseHalf, _center.y + looseHalf, _center.z + looseHalf)
    );

    callBack(this) 
  }

  insert(item) {
    /*

    if(children){
    children.forEach(child=>{
      if(child.looseBox.containsBox(item.bounds)){
      child.insert(item)
      return
      }
    }) 
    }

    item.node = this
    items.push(item)

    const {center, size, depth, maxDepth, capacity, looseness } = this.config

    const currentCapacity = items.length

    if(currentCapacity > capacity && depth < maxDepth ){
    
    }

    */
  }

  queryFrustum(frustum, onIntersectCallback) {}

  traverse(callback) {}

  split() { }
}

export class OcTree extends THREE.Object3D{

  constructor(config,callBack){
    super()

    this.dynamicItems = new Set()

    this.staticItems  = new Set()

    this.ocTreeNode = new OctreeNode(config,callBack)
  }

  insert( item ){

    item.dynamic ? this.dynamicItems.add(item) : this.staticItems.add(item)

    const items = this.dynamicItems.union(this.staticItems) // todo 

    // WARNING very expensive shouldn't get called in a loop

    if(!this.ocTreeNode.looseBox.containsBox(item.bounds)){  

      const totalBound = new THREE.Box3()
      
      items.forEach( it => totalBound.union( it.bounds ) ) 

      const center = totalBound.getCenter(new THREE.Vector3())

      const _size  = totalBound.getSize(new THREE.Vector3())

      const size   = Math.max(_size.x, _size.y, _size.z);

      const prevNode = this.ocTreeNode

      this.ocTreeNode = new OctreeNode({
        center, 
        size, 
        depth:0, 
        maxDepth:     prevNode.config.maxDepth, 
        capacity:     prevNode.config.capacity, 
        looseness:    prevNode.config.looseness,
        nodeCreated:  prevNode.config.nodeCreated
      },
      Object.fromEntries(prevNode.events.eventHandlers))

      items.forEach(it=>this.ocTreeNode.insert(it))

    }else{

      this.ocTreeNode.insert(item)

    }
  }

  traverse(callBack){
    this.ocTreeNode.traverse(callBack)
  }
}

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

export class QuadTreeNode extends THREE.Object3D{

  constructor(
    bounds, 
    level, 
    transformMatrix, 
    direction, 
    index,
    projectionRadius,
    callBack) {

    super();

    this.bounds           = bounds;
    this.level            = level;
    this.transformMatrix  = transformMatrix;
    this.direction        = direction;
    this.index            = index;
    this.projectionRadius = projectionRadius
    
    this._children       = [];
    this.isSubdivided    = false;
    this.disposeTimer    = null;
    this.worldData       = undefined

    callBack(this)
  }

  generateKey (position) {
    const { index, direction } = this;
    const { x, y, z } = position;
    return `${index}_${direction}_${Math.round(x)}_${Math.round(y)}_${Math.round(z)}`;
  }

  buildWorldBox( ) {
    
    const radius = this.projectionRadius
    
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

  drawWorldBox(scene,color = new THREE.Color(Math.random(),Math.random(),Math.random())){
    const helper = new THREE.Box3Helper(this.worldData.box, color);
    scene.add(helper);
    this.userData.debugBounds = helper;
    return this
  }

}


export class QuadTree extends THREE.Object3D {

  constructor(policy) {

    super()

    this.rootNodes = new Map();

    this.policy = policy

  }

  #_createNode(rootBounds, numOfLvls, matrix, direction, idx, callBack){
    
    const projectionRadius = this.policy.config.projectionRadius

    const spatialNode = new QuadTreeNode(rootBounds, numOfLvls, matrix, direction, idx, projectionRadius, callBack) 
     
    this.add(spatialNode)

    return spatialNode
    
  }

  createDimensions(faceIdxArray, offset, callBack){ 
    const { maxLevelSize: w, dimensions: d, scale: s } = this.policy.config;
    const k_ = offset
    const numOfLvls = this.policy.config.levels.numOflvls - 1

    for (let i = 0; i < d; i++) {
      const i_ = i * (w - 1) + i - (w / 2) * (d - 1);
      for (let j = 0; j < d; j++) {
        const j_ = j * (w - 1) + j - (w / 2) * (d - 1);

          faceIdxArray.forEach(idx=>{

            const spatialIdx = i * d + j

            const {pos, direction, matrix, rootBounds} = this.policy.getFaceData(idx, i_, j_, k_)

            const spatialNode = this.#_createNode(rootBounds, numOfLvls, matrix, direction, spatialIdx, callBack)

            this.rootNodes[spatialNode.generateKey(pos)] = spatialNode

          })
          
      }
    }
  }
 
}


 