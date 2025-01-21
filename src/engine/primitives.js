 
import * as THREE from 'three'
import { QuadTree } from './dataStructures/quadtree.js'
import { geometrySelector } from './geometry.js'
import { workersSRC } from './threading/sorce.js'
import { QuadTreeNode,QuadTreeMeshNode,QuadTreeSpatialNode } from './dataStructures/nodes/quadtreeNode.js'
import { LevelArchitecture  } from './levelArchitecture.js'
import { bufferInit,geometryInit,meshInit } from './utils/geometryUtils.js'
import { threadingInit } from './utils/threadingUtils.js'
import { isSphere,whichDimensionFn,createCallBackPayload } from './utils/primitiveUtils.js'



export class Primitive extends THREE.Object3D {
  static __type = 'Primitive'

  constructor(params) {

    let {size, dimension, resolution } = params
    
    super()

    this.parameters = { size, dimension, resolution, depth: 0 };

    this.quadTreeCollections = new Map();

    this.levelArchitecture   = new LevelArchitecture();

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

    Object.assign(this.levelArchitecture.config, {
      maxLevelSize: size,
      minLevelSize: size / Math.pow(2, levels - 1),
      minPolyCount: resolution,
      dimensions:   dimension,
    });

    this.levelArchitecture.levels(levels);
    this.levelArchitecture.createArrayBuffers();
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

    const { material } = this.levelArchitecture.config;

    const { buffers, views } = bufferInit(this.levelArchitecture.config.arrybuffers[size].geometryData, geometryClass);
 
    const threadarchitecture  = threadingInit(geometryClass, workersSRC);
    threadarchitecture.setPayload({
      direction,
      matrixRotationData,
      offset,
      size,
      resolution,
      ...buffers,
      ...additionalPayload,
      ...this.levelArchitecture.trigger('setTextures')(),
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
 
      
        this.levelArchitecture.trigger('afterMeshCreation')(meshNode,callBackPayload)
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
      levelArchitecture: this.levelArchitecture
    })

    this.add(quadTreeNode)

    return quadTreeNode
  }

  createSpatialNode( quadTreeNode ) {
    
    const spatialNode = new QuadTreeSpatialNode( quadTreeNode.sharderParameters, isSphere(this));

    quadTreeNode.add(spatialNode)

    quadTreeNode.getSpatialNode().setBounds(this);

    quadTreeNode.getSpatialNode().generateKey()
    
    this.levelArchitecture.trigger('afterSpatialNodeCreation')(quadTreeNode.getSpatialNode())
    
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

    if(isSphere(this)) this.levelArchitecture.config.radius = params.radius
    
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

    let polyPerLevel = this.levelArchitecture.config.levels.polyPerLevel

    let prevAfterMeshCreation = this.levelArchitecture.trigger('afterMeshCreation')  

    this.levelArchitecture.on('afterMeshCreation', ( node, payload ) => {
 
      const parent = node.parent;

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

      batchedMesh.setMatrixAt( id, matrix );

      batchedMesh.setColorAt ( id, new THREE.Color( Math.random() * 0xffffff ) )

      prevAfterMeshCreation(node,batchedMesh,payload)

    }) 

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
    this.levelArchitecture.config.radius = params.radius
  }
}
