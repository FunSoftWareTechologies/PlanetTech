import * as THREE from 'three/tsl'
import {  Controller,QuadTree } from './dataStructures/quadtree.js'
import { QuadGeometry, NormalizedQuadGeometry } from './geometry.js'
import { workersSRC } from './webWorker/workerThread.js'
import { MeshNode,QuadTreeNode } from './nodes.js'
import { generateKey,createCanvasTexture,bufferInit,threadingInit,geometryInit,meshInit } from './utils.js'
 
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

  threading(){ this.threaded = true }

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

}

export class Quad extends Primitive{

  constructor(params){
    super(params)
  }

  createPlane({
    quadTreeNode,
    meshNode,
    parent,
    geometryClass = QuadGeometry, // Default to QuadGeometry for parent class
    additionalPayload = {}, // Additional data for child class
  }) {

    const size = quadTreeNode.params.size
    const shardedData = this.controller.config.arrybuffers[size]
    const matrixRotationData = quadTreeNode.params.matrixRotationData
    const offset = quadTreeNode.params.offset
    const direction = quadTreeNode.params.direction
    const resolution = quadTreeNode.params.segments
    const material = this.controller.config.material
    const afterMeshNodeCreation = this.controller.config.callBacks.afterMeshNodeCreation
    const setTextures = this.controller.config.callBacks.setTextures()

    if (this.threaded) {
      
      let { buffers, views } = bufferInit(shardedData.geometryData,geometryClass)
  
      const threadController = threadingInit(geometryClass,workersSRC)
  
      threadController.setPayload({
        direction,
        matrixRotationData,
        offset,
        size,
        resolution,
        ...buffers,
        ...additionalPayload, // Include additional child-class specific data
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
  
    } else {
      // Non-threaded implementation
      // todo needs to load texture and update the geometry and uv scale and offsets
      const matrix = matrixRotationData.propMehtod
        ? new THREE.Matrix4()[[matrixRotationData.propMehtod]](matrixRotationData.input)
        : new THREE.Matrix4();
  
      const geometry = new geometryClass(size, size, resolution, resolution, ...Object.values(additionalPayload));
      geometry._setMatrix({ matrix });
      geometry._setOffset({ offset });
      geometry._build();
  
      const centerdPosition = new THREE.Vector3();
      geometry._restGeometry(centerdPosition);
  
      
      const plane   = new THREE.Mesh(geometry, material);
      plane.position.set(...centerdPosition);
      parent.add(meshNode.add(plane));
      parent.add(meshNode);
      afterMeshNodeCreation(meshNode);
      return meshNode;
    }
  }

  createQuadtreeNode({ matrixRotationData, offset, index, direction, initializationData = this.parameters }){
    const depth    = initializationData.depth
    const size     = initializationData.size
    const segments = initializationData.resolution
    const controller = this.controller
   

    let params = {   
      index,  
      offset,  
      direction,
      depth,
      matrixRotationData,
      size,
      segments,
      controller
     }

    const quadTreeNode = new QuadTreeNode( params , isSphere(this) ) 

    quadTreeNode.setBounds(this.add(quadTreeNode))
    
    this.controller.config.callBacks.afterQuadTreeNodeCreation(quadTreeNode)

    return quadTreeNode
  }
  



  createMeshNode({quadTreeNode, parent = this }){

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

    for (var i = 0; i < d; i++) {
      var i_ = ((i*(w-1))+i)+((-(w/2))*(d-1))
      for (var j = 0; j < d; j++) {
        var j_ = ((j*(w-1))+j)+((-(w/2))*(d-1))

        let _index = String(i * d + j);

        let quadTreeNode = this.createQuadtreeNode({
          matrixRotationData: {propMehtod:'',input:undefined},
          offset: [i_,-j_,k],
          index:_index,
          direction:'+z',
        })

        this.quadTree.rootNodes.push(quadTreeNode)

        this.createMeshNode({quadTreeNode})

      }
    }
  }
}

export class Cube extends Quad{

  constructor({ size, resolution, dimension}){
    super({ size, resolution, dimension }) 
  }

  createDimensions(){

    const w = this.parameters.size
    const d = this.parameters.dimension
    const k = ((w/2)*d)

    for (var i = 0; i < d; i++) {
      var i_ = ((i*(w-1))+i)+((-(w/2))*(d-1))
      for (var j = 0; j < d; j++) {
        var j_ = ((j*(w-1))+j)+((-(w/2))*(d-1))
        let _index = String(i * d + j);

         let quadTreeNodePZ = this.createQuadtreeNode({ 
          matrixRotationData: {propMehtod:'',input:0}, 
          offset: [i_,-j_,k],
          index:_index,
          direction:'+z',
        })
        this.quadTree.rootNodes.push(quadTreeNodePZ)
        this.createMeshNode({quadTreeNode:quadTreeNodePZ})

        let quadTreeNodeNZ = this.createQuadtreeNode({ 
          matrixRotationData:{propMehtod:'makeRotationY',input:Math.PI }, 
          offset:  [i_,-j_,-k],
          index: _index,
          direction:'-z',
        })
        this.quadTree.rootNodes.push(quadTreeNodeNZ)
        this.createMeshNode({quadTreeNode:quadTreeNodeNZ})

        let quadTreeNodePX = this.createQuadtreeNode({ 
          matrixRotationData:{propMehtod:'makeRotationY',input:Math.PI/2 }, 
          offset: [k,-j_,-i_],
          index: _index,
          direction:'+x',
        })
        this.quadTree.rootNodes.push(quadTreeNodePX)
        this.createMeshNode({quadTreeNode:quadTreeNodePX})

        let quadTreeNodeNX = this.createQuadtreeNode({ 
          matrixRotationData:{propMehtod:'makeRotationY',input:-Math.PI/2 }, 
          offset: [-k,-j_,-i_],
          index: _index,
          direction:'-x',
        })
        this.quadTree.rootNodes.push(quadTreeNodeNX)
        this.createMeshNode({quadTreeNode:quadTreeNodeNX})

        let quadTreeNodePY = this.createQuadtreeNode({ 
          matrixRotationData:{propMehtod:'makeRotationX',input:-Math.PI/2 }, 
          offset: [i_,k,j_],
          index: _index,
          direction:'+y',
        })
        this.quadTree.rootNodes.push(quadTreeNodePY)
        this.createMeshNode({quadTreeNode:quadTreeNodePY})

        let quadTreeNodeNY = this.createQuadtreeNode({ 
          matrixRotationData:{propMehtod:'makeRotationX',input:Math.PI/2 },  
          offset: [i_,-k,j_],
          index: _index,
          direction:'-y',
        })
        this.quadTree.rootNodes.push(quadTreeNodeNY)
        this.createMeshNode({quadTreeNode:quadTreeNodeNY})

      }
    }
  }

}

export class Sphere extends Cube{

  constructor({ size, resolution, dimension, radius }){
    super({size, resolution, dimension})
    this.controller.config.radius = radius
  }

  createPlane(params){
   return super.createPlane(Object.assign(params,{ 
      geometryClass: NormalizedQuadGeometry, 
      additionalPayload: { radius: this.controller.config.radius }
    }))
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