 
import { Controller,QuadTree } from './dataStructures/quadtree.js'
import { geometrySelector } from './geometry.js'
import { workersSRC } from './webWorker/workerThread.js'
import { MeshNode,QuadTreeNode,SpatialNode } from './dataStructures/nodes.js'
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

export class Primitive extends THREE.Object3D {
  static __type = 'Primitive'

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

  createPlane({ meshNode }) {

    const { geometryClass, additionalPayload } = geometrySelector(this);

    const {
      size,
      matrixRotationData,
      offset,
      direction,
      resolution,
    } = meshNode.params

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
      controller: this.controller
    })

    this.add(quadTreeNode)

    return quadTreeNode
  }

  createSpatialNode( quadTreeNode ) {
    
    const spatialNode = new SpatialNode( quadTreeNode.sharderParameters, isSphere(this));

    quadTreeNode.add(spatialNode)

    quadTreeNode.getSpatialNode().setBounds(this);

    quadTreeNode.getSpatialNode().generateKey()
    
    this.controller.config.callBacks.afterSpatialNodeCreation(quadTreeNode.getSpatialNode())

   return quadTreeNode.getSpatialNode();
  }

  createMeshNodes() {

    this._createMeshNodes = ({ quadTreeNode, initialState = 'active' }) => {

      let meshNode = new MeshNode(quadTreeNode.sharderParameters, initialState) 

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

    if(isSphere(this)) this.controller.config.radius = params.radius
    
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

    let polyPerLevel = this.controller.config.levels.polyPerLevel

     this.controller.config.callBacks.afterMeshCreation = node => {
 
        const parent = node.parent;

        parent.remove( node );

        const geometry  = node.mesh().geometry 

        const depth     = node.params.depth 

        let vertex      = polyPerLevel[depth] 

        let vertexCount = ((vertex+1)*(vertex+1))

        let indexCount  = ((vertex**2)*6)

        let maxInstanceCount = batchedMesh.maxInstanceCount + 1

        let maxVertexCount   = batchedMesh._maxVertexCount  + vertexCount // doc shows _maxVertexCount without the undscore

        let maxIndexCount    = batchedMesh._maxIndexCount   + indexCount // doc shows _maxIndexCount without the undscore

        batchedMesh.setInstanceCount(maxInstanceCount)

        batchedMesh.setGeometrySize(maxVertexCount,maxIndexCount)
 
        const geometryId = batchedMesh.addGeometry( geometry );
        
        const id =  batchedMesh.addInstance( geometryId );

        const matrix = new THREE.Matrix4();

        matrix.premultiply(new THREE.Matrix4().makeTranslation(...parent.position.toArray()));

        batchedMesh.setMatrixAt( id, matrix );

        batchedMesh.setColorAt ( id, new THREE.Color( Math.random() * 0xffffff ) )

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
    this.controller.config.radius = params.radius
  }
}
