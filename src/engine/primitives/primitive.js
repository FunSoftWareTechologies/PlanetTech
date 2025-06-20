 
import * as THREE from 'three'
import { QuadTree } from './../dataStructures/quadtree.js'
import { geometrySelector } from '../geometries/geometry.js'
import { workersSRC } from '../system/threading/source.js'
import { QuadTreeNode,QuadTreeMeshNode,QuadTreeSpatialNode } from './../dataStructures/nodes/quadtreeNode.js'
import { Infrastructure } from './../system/infrastructure.js'
import { bufferInit,geometryInit,meshInit } from './../utils/geometryUtils.js'
import { threadingInit } from './../utils/threadingUtils.js'
import { isSphere,whichDimensionFn }  from './../utils/primitiveUtils.js'
import { setTextures,createUVObject } from './../utils/textureUtils.js'



/*export class Tile extends THREE.Object3D{
  constructor(params){
    super()
    this.quadTreeNode = new QuadTreeNode(params)
    this.add(this.quadTreeNode)
  }
}*/



export class Primitive extends THREE.Object3D {
  static __type = 'Primitive'

  constructor(params, infrastructure = new Infrastructure()) {

    let {size, dimension, resolution } = params
    
    super()

    this.parameters = { size, dimension, resolution, depth: 0 };

    this.quadTreeCollections = new Map();

    this.infrastructure      = infrastructure;

    this._createMeshNodes    = () => {}
  }


  addNode(bounds, node) {
    this.quadTreeCollections.set(bounds, node);
  }

  update(object3D) {
    this.quadTree.update(object3D, this);
  }

  createQuadTree({ levels }) {
    const { size, resolution, dimension } = this.parameters;

    Object.assign(this.infrastructure.config, {
      maxLevelSize: size,
      minLevelSize: size / Math.pow(2, levels - 1),
      minPolyCount: resolution,
      dimensions:   dimension,
    });

    this.infrastructure.levels(levels);
    this.infrastructure.createArrayBuffers();
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

    const { material } = this.infrastructure.config;

    const { buffers, views } = bufferInit(this.infrastructure.config.arrybuffers[size].geometryData, geometryClass);
    
    const textureObj = {textureSrc:{},uv:createUVObject().update(meshNode)}

    this.infrastructure.events.trigger('loadTexture',textureObj)
 
    const threadarchitecture  = threadingInit(geometryClass, workersSRC);
    threadarchitecture.setPayload({
      direction,
      matrixRotationData,
      offset,
      size,
      resolution,
      UV:{offset:textureObj.uv.getOffset(),scale:textureObj.uv.getScale()},
      ...buffers,
      ...additionalPayload,
      //...this.infrastructure.events.trigger('setTextures'),
    });

    return new Promise((resolve) => {
      threadarchitecture.getPayload((payload) => {

        const geometry = geometryInit({ size, resolution, additionalPayload, geometryClass, views });
 
        const mesh = meshInit(geometry, material, payload.data.centerdPosition);
        mesh.position.copy(meshNode.position.clone().negate())

        if( Object.values(textureObj.textureSrc).length !== 0){

          setTextures({
            meshNode,
            mesh,
            srcs:textureObj.textureSrc,
            infrastructure:this.infrastructure,
            promiseResolve:resolve,
          })
          
        }else{

          meshNode.add(mesh)
          this.infrastructure.events.trigger('afterMeshCreation',meshNode,{uv:createUVObject().update(meshNode)}) 
          resolve(meshNode);

        }
 
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
      infrastructure: this.infrastructure
    })

    this.add(quadTreeNode)

    return quadTreeNode
  }

  createSpatialNode( quadTreeNode ) {
    
    const spatialNode = new QuadTreeSpatialNode( quadTreeNode.sharderParameters, isSphere(this));

    quadTreeNode.add(spatialNode)

    quadTreeNode.getSpatialNode().setBounds(this);

    quadTreeNode.getSpatialNode().generateKey()
    
    this.infrastructure.events.trigger('afterSpatialNodeCreation',quadTreeNode.getSpatialNode()) 
    
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


 


