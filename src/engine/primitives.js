import * as THREE from 'three/tsl'
import { Controller,QuadTree } from './dataStructures/quadtree.js'
import { QuadGeometry, NormalizedQuadGeometry,geometryType } from './geometry.js'
import { workersSRC } from './webWorker/workerThread.js'
import { MeshNode,QuadTreeNode } from './nodes.js'
import { generateKey,createCanvasTexture,bufferInit,threadingInit,geometryInit,meshInit,createDimensions,createDimension } from './utils.js'
 
export const isSphere = obj => obj instanceof Sphere
 
export class Primitive  extends THREE.Object3D{
  
  constructor({ size, resolution, dimension }){
    super()

    this.parameters = {
      size: size,
      resolution: resolution,
      dimension:  dimension,
      depth:0
    }

    this.nodes = new Map()
    this.controller = new  Controller()
  }

  update(OBJECT3D){ this.quadTree.update(OBJECT3D,this) }

  addNode(bounds,node){ this.nodes.set(bounds,node) }

  createQuadTree({ levels }){
    Object.assign(this.controller.config,{
      maxLevelSize:  this.parameters.size,
      minLevelSize:  this.parameters.size/Math.pow(2,levels-1), 
      minPolyCount:  this.parameters.resolution,
      dimensions:    this.parameters.dimension,
      }
    )
    this.controller.levels(levels)
    this.controller.createArrayBuffers()
    this.quadTree = new QuadTree()
  }
  
  createPlane({
    quadTreeNode,
    meshNode,
    parent,
  }) {

    let {geometryClass ,additionalPayload  } = geometryType(this)

    const size = quadTreeNode.params.size
    const shardedData = this.controller.config.arrybuffers[size]
    const matrixRotationData = quadTreeNode.params.matrixRotationData
    const offset = quadTreeNode.params.offset
    const direction = quadTreeNode.params.direction
    const resolution = quadTreeNode.params.segments
    const material = this.controller.config.material
    const afterMeshNodeCreation = this.controller.config.callBacks.afterMeshNodeCreation
    const setTextures = this.controller.config.callBacks.setTextures()
    const { buffers, views } = bufferInit(shardedData.geometryData,geometryClass)
    const threadController = threadingInit(geometryClass,workersSRC)

    threadController.setPayload({
      direction,
      matrixRotationData,
      offset,
      size,
      resolution,
      ...buffers,
      ...additionalPayload, 
      ...setTextures,
    });

    const promise = new Promise((resolve) => {
      
      threadController.getPayload((payload) => {

        const geometry = geometryInit({ size,  resolution, additionalPayload, geometryClass, views:views })

        createCanvasTexture(setTextures,material,payload.data.imageBitmapResult)

        parent.add(meshNode.add(meshInit(geometry,material,payload.data.centerdPosition)));

        afterMeshNodeCreation(meshNode);
        
        resolve(meshNode);

      });

    });

    promise.uuid = meshNode.uuid;
    
    return promise;
   
  }

  createQuadtreeNode({ matrixRotationData, offset, index, direction, initializationData = this.parameters }){

    const depth      = initializationData.depth
    const size       = initializationData.size
    const segments   = initializationData.resolution
    const controller = this.controller

    const quadTreeNode = new QuadTreeNode({   
      index,  
      offset,  
      direction,
      depth,
      matrixRotationData,
      size,
      segments,
      controller
     }, isSphere(this)) 

    quadTreeNode.setBounds(this.add(quadTreeNode))
    
    this.controller.config.callBacks.afterQuadTreeNodeCreation(quadTreeNode)

    return quadTreeNode

  }
  
  createMeshNode({  quadTreeNode, parent = this }){

    let meshNode = new MeshNode( quadTreeNode.params, 'active' )

    meshNode = this.createPlane({
      quadTreeNode,
      meshNode,
      parent
    })

    this.addNode(generateKey(quadTreeNode),meshNode)

    return meshNode

  }

  createDimensions(){
    const w = this.parameters.size
    const d = this.parameters.dimension
    const k = ((w/2)*d)
    const creation = (this.type === 'Quad') ? createDimension : createDimensions

    for (var i = 0; i < d; i++) {
      var i_ = ((i*(w-1))+i)+((-(w/2))*(d-1))
      for (var j = 0; j < d; j++) {
        var j_ = ((j*(w-1))+j)+((-(w/2))*(d-1))
        let _index = String(i * d + j);
        creation({ i_, j_, k, _index, primitive:this })
      }
    }
  }
}

export class Quad extends Primitive{
  constructor(params){
    super(params)
    this.type = 'Quad'
  }
}

export class Cube extends Quad{
  constructor({ size, resolution, dimension}){
    super({ size, resolution, dimension }) 
    this.type = 'Cube'
  }
}

export class Sphere extends Cube{
  constructor({ size, resolution, dimension, radius }){
    super({size, resolution, dimension})
    this.type = 'Sphere'
    this.controller.config.radius = radius
  }
}

/*
export class BatchedPrimative extends THREE.BatchedMesh{

  constructor( primative ){
    super( 7, 20000, 200000, new THREE.MeshStandardNodeMaterial({color:'red'})  )
    this.primative = primative
    }

  createInstances( callBack = defualtCallBack  ){
    
    this.primative.createDimensions((node)=>{

      const parent = node.parent;

      parent.remove( node );

      let geometry = node.plane().geometry 

      const boxGeometryId = this.addGeometry( geometry );
      
      const id = this.addInstance( boxGeometryId );

      callBack(node)

      //node.matrixWorld.decompose( node.position, node.quaternion, node.scale );

    } )

  }
}*/