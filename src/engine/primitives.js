 
import { QuadTree } from './dataStructures/quadtree.js'
import { geometrySelector } from './geometry.js'
import { workersSRC } from './webWorker/workerThread.js'
import { QuadTreeNode,QuadTreeMeshNode,QuadTreeSpatialNode } from './dataStructures/nodes/quadtreeNode.js'
import { Architecture  } from './architecture.js'

import { 
  bufferInit,
  threadingInit,
  geometryInit,
  meshInit,
  createDimensions,
  createDimension,
  createCallBackPayload
 } from './utils.js'
 
import * as _THREE from 'three'
import * as TSL from 'three/tsl'
import * as WG from 'three/webgpu'

const THREE = {..._THREE,...TSL,...WG}

export const isSphere = (primitive) => primitive.constructor.__type === 'Sphere'

export const isCube   = (primitive) => primitive.constructor.__type === 'Cube'

export const whichDimensionFn  = (primitive) => {

  if(isSphere(primitive) || isCube(primitive)){
    return createDimensions
  }else{
    return createDimension
  }

}

export const setBatchDataPropertyOnNode = (node)=>{

  node.batchingData = {}

  return node
}

export class Primitive extends THREE.Object3D {
  static __type = 'Primitive'

  constructor(params) {

    let {size, dimension, resolution } = params
    
    super()

    this.parameters = { size, dimension, resolution, depth: 0 };

    this.quadTreeCollections = new Map();

    this.architecture        = new Architecture();

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

    Object.assign(this.architecture.config, {
      maxLevelSize: size,
      minLevelSize: size / Math.pow(2, levels - 1),
      minPolyCount: resolution,
      dimensions:   dimension,
    });

    this.architecture.levels(levels);
    this.architecture.createArrayBuffers();
    this.quadTree = new QuadTree();
  }

  createPlane({ meshNode }) {

    const { geometryClass, additionalPayload } = geometrySelector(this);

    const {
      size,
      matrixRotationData,
      offset,
      direction,
      resolution,
    } = meshNode.params

    const { material, callBacks } = this.architecture.config;

    const { buffers, views }      = bufferInit(this.architecture.config.arrybuffers[size].geometryData, geometryClass);
 
    const threadarchitecture  = threadingInit(geometryClass, workersSRC);
    threadarchitecture.setPayload({
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
      threadarchitecture.getPayload((payload) => {

        const geometry = geometryInit({ size, resolution, additionalPayload, geometryClass, views });
 
        const mesh = meshInit(geometry, material, payload.data.centerdPosition);
        mesh.position.copy(meshNode.position.clone().negate())
        meshNode.add(mesh)

        const callBackPayload = createCallBackPayload({
          meshNode,
          imageBitmap: payload.data.imageBitmapResult
        })
 
        callBacks.afterMeshCreation(meshNode,callBackPayload);
        
        resolve(meshNode);
      });
    });
  }

  createQuadTreeNode({ matrixRotationData, offset, index, direction, initializationData = this.parameters }){
    const { depth, size, resolution } = initializationData;

    const quadTreeNode = new QuadTreeNode({ 
      index, 
      offset, 
      direction, 
      depth, 
      matrixRotationData, 
      size, 
      resolution, 
      architecture: this.architecture
    })

    this.add(quadTreeNode)

    return quadTreeNode
  }

  createSpatialNode( quadTreeNode ) {
    
    const spatialNode = new QuadTreeSpatialNode( quadTreeNode.sharderParameters, isSphere(this));

    quadTreeNode.add(spatialNode)

    quadTreeNode.getSpatialNode().setBounds(this);

    quadTreeNode.getSpatialNode().generateKey()
    
    this.architecture.config.callBacks.afterSpatialNodeCreation(quadTreeNode.getSpatialNode())

   return quadTreeNode.getSpatialNode();
  }

  createMeshNodes() {

    this._createMeshNodes = ({ quadTreeNode, initialState = 'active' }) => {

      let meshNode = new QuadTreeMeshNode(quadTreeNode.sharderParameters, initialState) 

      meshNode.position.copy(quadTreeNode.getSpatialNode().position)

      quadTreeNode.add(meshNode)
      
      let promiseMeshNode = this.createPlane({ meshNode: quadTreeNode.getMeshNode() }) 
      
      quadTreeNode.setMeshNode(promiseMeshNode)

      return quadTreeNode.getMeshNode();

    };

  }

  createDimensions() {
    const { size: w, dimension: d } = this.parameters;
    const k = (w / 2) * d;
    const creation = whichDimensionFn(this) 

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
  static __type = 'BatchedPrimitive'

  constructor(primitive,params){
    
    super(params)

     this.constructor.__type = primitive.__type // dont like the idea this redefines what the actual type is

    if(isSphere(this)) this.architecture.config.radius = params.radius
    
  }

  createDimensions(){

    let batchedMesh = new THREE.BatchedMesh(0,0,0, new THREE.MeshStandardMaterial())

    this._transferGeometry(batchedMesh)

    super.createDimensions()

    let promises = []

    this.quadTreeCollections.forEach((quadTreeNode) => {promises.push(quadTreeNode.getMeshNode()) })

    this.batchedMesh = Promise.all(promises).then( _ => {

      this.add(batchedMesh)

      return batchedMesh
    
    })

  }

  _transferGeometry(batchedMesh){

    let polyPerLevel = this.architecture.config.levels.polyPerLevel

    let prevAfterMeshCreation = this.architecture.config.callBacks.afterMeshCreation

    this.architecture.config.callBacks.afterMeshCreation = ( node, payload ) => {
 
        const parent = node.parent;

        const visiblity = node.mesh().material.visible

        parent.remove( node );

        const geometry  = node.mesh().geometry 

        const depth     = node.params.depth 

        const vertex    = polyPerLevel[depth] 

        const vertexCount = ( ( vertex + 1 ) * ( vertex + 1 ) )

        const indexCount  = ( ( vertex**2  ) * 6 )

        const maxInstanceCount = batchedMesh.maxInstanceCount + 1

        const maxVertexCount   = batchedMesh._maxVertexCount  + vertexCount // doc shows _maxVertexCount without the undscore

        const maxIndexCount    = batchedMesh._maxIndexCount   + indexCount // doc shows _maxIndexCount without the undscore

        batchedMesh.setInstanceCount( maxInstanceCount )

        batchedMesh.setGeometrySize ( maxVertexCount, maxIndexCount )
 
        const geometryId = batchedMesh.addGeometry( geometry );
        
        const id = batchedMesh.addInstance( geometryId );

        const matrix = new THREE.Matrix4();

        matrix.premultiply(new THREE.Matrix4().makeTranslation(...parent.position.toArray()));

        batchedMesh.setMatrixAt ( id, matrix );

        batchedMesh.setColorAt  ( id, new THREE.Color( Math.random() * 0xffffff ) )

        batchedMesh.setVisibleAt( id, visiblity ) 

        prevAfterMeshCreation(node,batchedMesh,payload)

    } 

  }

}


export class Quad  extends Primitive{
  static __type = 'Quad'
  constructor(params){
    super(params)
   }
}

export class Cube  extends Quad{
  static __type = 'Cube'
  constructor(params){
    super(params) 
   }
}

export class Sphere extends Cube{
  static __type = 'Sphere'
  constructor(params){
    super(params) 
    this.architecture.config.radius = params.radius
  }
}
