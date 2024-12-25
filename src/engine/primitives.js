import * as THREE from 'three/tsl'
import { Controller,QuadTree } from './dataStructures/quadtree.js'
import { geometrySelector } from './geometry.js'
import { workersSRC } from './webWorker/workerThread.js'
import { MeshNode,QuadTreeNode } from './dataStructures/nodes.js'
import { createCanvasTexture,bufferInit,threadingInit,geometryInit,meshInit,createDimensions,createDimension } from './utils.js'
 
export const isSphere = (obj) => obj instanceof Sphere;

export class Primitive extends THREE.Object3D {
  constructor({ size, resolution, dimension }) {
    super();
    this.parameters = { size, resolution, dimension, depth: 0 };
    this.meshNodes  = new Map();
    this.controller = new Controller();
    this._createMeshNodes = () => {}; // NooOp Placeholder to avoid undefined errors
  }

  update(object3D) {
    this.quadTree.update(object3D, this);
  }

  addNode(bounds, node) {
    this.meshNodes.set(bounds, node);
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
    this._createMeshNodes = ({ quadTreeNode, parent = this }) => {
      const meshNode = new MeshNode(quadTreeNode.params, 'active');
      const createdNode = this.createPlane({ quadTreeNode, meshNode, parent });
      this.addNode(quadTreeNode.meshNodeKey, createdNode);
      return createdNode;
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