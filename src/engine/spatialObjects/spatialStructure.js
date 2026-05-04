import * as THREE from 'three'


export class OctreeNode {
  /**
   * @param {THREE.Vector3} center - Center point of this node
   * @param {number} size - Base dimension size of the node
   * @param {number} depth - Current tree depth
   * @param {number} maxDepth - Maximum allowed splits
   * @param {number} capacity - Items before splitting
   * @param {number} looseness - Expansion factor (e.g. 1.5 = 50% larger loose bounds)
   */
  constructor(center, size, depth, maxDepth, capacity, looseness = 1.25) {
    this.center = center.clone();
    this.size = size;
    this.depth = depth;
    this.maxDepth = maxDepth;
    this.capacity = capacity;
    this.looseness = looseness;

    this.items = [];
    this.children = null;

    // Calculate Strict Bounds: For visual representation of the perfect grid
    const strictHalf = this.size / 2;
    this.strictBox = new THREE.Box3(
      new THREE.Vector3(center.x - strictHalf, center.y - strictHalf, center.z - strictHalf),
      new THREE.Vector3(center.x + strictHalf, center.y + strictHalf, center.z + strictHalf)
    );

    // Calculate Loose Bounds: Used for intersection testing and insertion
    // By making the bounds larger than the strict size, objects can straddle 
    // the mathematical center without breaking the tree.
    const looseHalf = (this.size / 2) * this.looseness;
    this.looseBox = new THREE.Box3(
      new THREE.Vector3(center.x - looseHalf, center.y - looseHalf, center.z - looseHalf),
      new THREE.Vector3(center.x + looseHalf, center.y + looseHalf, center.z + looseHalf)
    );
  }

 
  insert(item) {
    this.items.push(item)
  }

 
  queryFrustum(frustum, onIntersectCallback) {
 
  }

 
  traverse(callback) {

     
      callback(this)
      if(this.children)
      this.children.forEach(c=>c.traverse(callBack(c)))
    
 
  }

  _split() {
    this.children = [];
    const quarter = this.size / 4;
    const childSize = this.size / 2;

    for (let i = 0; i < 8; i++) {
      // Bitwise check to calculate the 8 different octant offsets
      const offsetX = (i & 1) ? quarter : -quarter;
      const offsetY = (i & 2) ? quarter : -quarter;
      const offsetZ = (i & 4) ? quarter : -quarter;

      const childCenter = new THREE.Vector3(
        this.center.x + offsetX,
        this.center.y + offsetY,
        this.center.z + offsetZ
      );

      this.children.push(
        new OctreeNode(childCenter, childSize, this.depth + 1, this.maxDepth, this.capacity, this.looseness)
      );
    }
  }
}

export class OcTree extends THREE.Object3D{

  constructor(center, size, depth, maxDepth, capacity, looseness){
    super()

    this.items = [] //todo make weakrefs

    this.ocTreeNode = new OctreeNode(center, size, depth, maxDepth, capacity, looseness)

  }

  insert( item ){

    this.items.push(item)

    item.i = this.items.length

    if(!this.ocTreeNode.looseBox.containsBox(item.bounds)){

      const totalBound = new THREE.Box3()
      
      this.items.forEach(it=>totalBound.union(it.bounds)) 

      const center = totalBound.getCenter(new THREE.Vector3())

      const size = totalBound.getSize(new THREE.Vector3())

      const amortizedSize = Math.max(size.x, size.y, size.z) * 1.5;

      this.ocTreeNode = new OctreeNode(
        center, 
        amortizedSize, 
        0, 
        this.ocTreeNode.maxDepth, 
        this.ocTreeNode.capacity, 
        this.ocTreeNode.looseness)

      this.items.forEach(it=>this.ocTreeNode.insert(it))

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

}


export class QuadTree extends THREE.Object3D {

  constructor(blueprint) {

    super()

    this.rootNodes = new Map();

    this.blueprint = blueprint
 
  }

  #_createNode(rootBounds, numOfLvls, matrix, direction, idx){ 

    const spatialNode = new QuadTreeNode(rootBounds, numOfLvls, matrix, direction, idx) 
     
    this.blueprint.config.nodeCreated(spatialNode,this.blueprint) 

    this.add(spatialNode)

    return spatialNode
    
  }

  createDimensions(faceIdxArray, depth){ 
    const { maxLevelSize: w, dimensions: d, scale: s } = this.blueprint.config;
    const k_ = depth
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


 