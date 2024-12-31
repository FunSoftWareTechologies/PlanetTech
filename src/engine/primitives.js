 
import { Controller,QuadTree } from './dataStructures/quadtree.js'
import { geometrySelector } from './geometry.js'
import { workersSRC } from './webWorker/workerThread.js'
import { MeshNode,QuadTreeNode } from './dataStructures/nodes.js'
import { createCanvasTexture,bufferInit,threadingInit,geometryInit,meshInit,createDimensions,createDimension } from './utils.js'
 
import * as _THREE from 'three'
import * as TSL from 'three/tsl'
import * as WG from 'three/webgpu'

const THREE = {..._THREE,...TSL,...WG}

export const isSphere = (obj) => obj.type === 'Sphere';

const setTypeProperty = (primitive,value) =>{
  Object.defineProperty(primitive, 'type', {
    value: value,       
    writable: false,     
    configurable: false  
  });
}
 
export class Primitive extends THREE.Object3D {

  constructor(params) {

    super()

    this.parameters = { ...params, depth: 0 };

    this.quadTreeCollections = new Map();

    this.controller = new Controller();

    this._createMeshNodes = () => {}
  }


  addNode(bounds, node) {
    this.quadTreeCollections.set(bounds, node);
  }

  update(object3D) {
    this.quadTree.update(object3D, this);
  }

  createQuadTree({ levels }) {
    const { size, resolution, dimension } = this.parameters;

    Object.assign(this.controller.config, {
      maxLevelSize: size,
      minLevelSize: size / Math.pow(2, levels - 1),
      minPolyCount: resolution,
      dimensions:   dimension,
    });

    this.controller.levels(levels);
    this.controller.createArrayBuffers();
    this.quadTree = new QuadTree();
  }

  createPlane({ quadTreeNode, meshNode, parent }) {
    const { geometryClass, additionalPayload } = geometrySelector(this);
    const {
      size,
      matrixRotationData,
      offset,
      direction,
      segments: resolution,
    } = quadTreeNode.params;
    const { material, callBacks } = this.controller.config;
    const { buffers, views }      = bufferInit(this.controller.config.arrybuffers[size].geometryData, geometryClass);

    const threadController  = threadingInit(geometryClass, workersSRC);
    threadController.setPayload({
      direction,
      matrixRotationData,
      offset,
      size,
      resolution,
      ...buffers,
      ...additionalPayload,
      ...callBacks.setTextures(),
    });

    return new Promise((resolve) => {
      threadController.getPayload((payload) => {

        const geometry = geometryInit({ size, resolution, additionalPayload, geometryClass, views });
        createCanvasTexture(callBacks.setTextures(), material, payload.data.imageBitmapResult);

        const mesh = meshInit(geometry, material, payload.data.centerdPosition);
        parent.add(meshNode.add(mesh));

        callBacks.afterMeshNodeCreation(meshNode);
        resolve(meshNode);
      });
    });
  }

  createQuadtreeNode({ matrixRotationData, offset, index, direction, initializationData = this.parameters }) {
    const { depth, size, resolution: segments } = initializationData;
    const quadTreeNode = new QuadTreeNode(
      { index, offset, direction, depth, matrixRotationData, size, segments, controller: this.controller },
      isSphere(this)
    );

    quadTreeNode.setBounds(this.add(quadTreeNode));
    this.controller.config.callBacks.afterQuadTreeNodeCreation(quadTreeNode);
    return quadTreeNode;
  }

  createMeshNodes() {
    this._createMeshNodes = ({ quadTreeNode, initialState = 'active', parent = this }) => {
      let meshNode = new MeshNode(quadTreeNode.params, initialState) 
      meshNode = this.createPlane({ quadTreeNode, meshNode, parent }) 
      quadTreeNode.addMeshNode(meshNode)
      this.addNode(quadTreeNode.meshNodeKey,quadTreeNode)
      return quadTreeNode.meshNode;
    };
  }

  createDimensions() {
    const { size: w, dimension: d } = this.parameters;
    const k = (w / 2) * d;
    const creation = this.type === 'Quad' ? createDimension : createDimensions;

    for (let i = 0; i < d; i++) {
      const i_ = i * (w - 1) + i - (w / 2) * (d - 1);
      for (let j = 0; j < d; j++) {
        const j_ = j * (w - 1) + j - (w / 2) * (d - 1);
        creation({ i_, j_, k, _index: String(i * d + j), primitive: this });
      }
    }
  }
}


export class BatchedPrimitive extends Primitive{

  constructor(type,params){
    
    super(params)

    this.type = type

    if(isSphere(this)) this.controller.config.radius = params.radius
    
  }

  createDimensions(){

    let batchedMesh = new THREE.BatchedMesh(0,0,0, new THREE.MeshStandardMaterial())

    this._transferGeometry(batchedMesh)

    super.createDimensions()

    let promises = []

    this.quadTreeCollections.forEach((value) => promises.push(value.meshNode) )

    this.batchedMesh = Promise.all(promises).then( _ => {

      this.add(batchedMesh)

      return batchedMesh
    
    })

  }

  _transferGeometry(batchedMesh){

    let polyPerLevel = this.controller.config.levels.polyPerLevel

     this.controller.config.callBacks.afterMeshNodeCreation = node => {
 
        const parent = node.parent;

        parent.remove( node );

        const geometry  = node.mesh().geometry 

        const depth     = node.params.depth 

        let vertex      = polyPerLevel[depth] 

        let vertexCount = ((vertex+1)*(vertex+1))

        let indexCount  = ((vertex**2)*6)

        let maxInstanceCount  =   batchedMesh.maxInstanceCount + 1

        let maxVertexCount    =   batchedMesh._maxVertexCount + vertexCount // doc shows its without the undscore

        let maxIndexCount     =   batchedMesh._maxIndexCount  + indexCount // doc shows its without the undscore

        batchedMesh.setInstanceCount(maxInstanceCount)

        batchedMesh.setGeometrySize(maxVertexCount,maxIndexCount)
 
        const geometryId = batchedMesh.addGeometry( geometry );
        
        const id =  batchedMesh.addInstance( geometryId );

        const matrix = new THREE.Matrix4();

        matrix.premultiply(new THREE.Matrix4().makeTranslation(...node.mesh().position.toArray()));

        batchedMesh.setMatrixAt( id, matrix );

        batchedMesh.setColorAt( id, new THREE.Color( Math.random() * 0xffffff ) )

    } 

  }

}


export class Quad extends Primitive{
  constructor(params){
    super(params)
    setTypeProperty(this,'Quad')
   }
}

export class Cube extends Quad{
  constructor(params){
    super(params) 
    setTypeProperty(this,'Cube')
   }
}

export class Sphere extends Cube{
  constructor(params){
    super(params) 
    setTypeProperty(this,'Sphere')
    this.controller.config.radius = params.radius
  }
}


/*

function initBatchedMeshData(primitive) {

  const length = primitive.controller.config.levels.numOflvls
  const result = [];
  let maxVertexCount   = primitive.controller.config.levels.maxLevelVertexCount
  let maxIndexCount    = primitive.controller.config.levels.maxLevelIndexCount
  let maxInstanceCount = primitive.controller.config.levels.maxLevelInstanceCount
 
  const sumArray = (arr) => arr.reduce((sum, value) => sum + value, 0);
  return [sumArray(maxInstanceCount), sumArray(maxVertexCount), sumArray(maxIndexCount)];

}
 
export class BatchedPrimitive extends THREE.BatchedMesh{

  constructor( primitive ){

    let material = new THREE.MeshStandardMaterial()
 
    super(...initBatchedMeshData(primitive),material)

    this.primitive = primitive

    return this.#_transferGeometry(primitive)

    }

  #_transferGeometry(primitive){

    //let userCallBacks = primitive.controller.config.callBacks.afterMeshNodeCreation

    primitive.controller.config.callBacks.afterMeshNodeCreation = node => {

      const parent = node.parent;

      parent.remove( node );

      let geometry = node.mesh().geometry 

      const geometryId = this.addGeometry( geometry );
      
      const id = this.addInstance( geometryId );

      const matrix = new THREE.Matrix4();

      matrix.premultiply(new THREE.Matrix4().makeTranslation(...node.mesh().position.toArray()));

      this.setMatrixAt( id, matrix );

      this.setColorAt( id, new THREE.Color( Math.random() * 0xffffff ) );

    }

    primitive.createDimensions()

    let promises = []

    this.primitive.quadTreeCollections.forEach((value) => promises.push(value.meshNode) )

    return Promise.all(promises).then(meshNode =>  this)


  }

}  

*/