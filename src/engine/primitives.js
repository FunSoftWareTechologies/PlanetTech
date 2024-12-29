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
    this.quadTreeCollections  = new Map();
    this.controller = new Controller();
    this._createMeshNodes = () => {}; // NooOp Placeholder to avoid undefined errors
   }


  addNode(bounds, node) {
    this.quadTreeCollections.set(bounds, node);
  }

  update(object3D) {
    this.quadTree.update(object3D, this);
  }

  createQuadTree({ levels }) {
    const { size, resolution, dimension } = this.parameters;

    /*let maxVertexCount   = ((resolution + 1) * (resolution + 1)) * (dimension * dimension) * 6
    let maxIndexCount    = (resolution * resolution * 6) * (dimension * dimension) * 6
    let maxInstanceCount = (dimension  * dimension) * 6*/

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


 
export class BatchedPrimitive extends THREE.BatchedMesh{

  constructor( primitive ){

    let material = new THREE.MeshStandardMaterial()

    function initBatchedMeshData() {

      const length = primitive.controller.config.levels.numOflvls
      const result = [];
      let maxVertexCount   = primitive.controller.config.levels.maxLevelVertexCount
      let maxIndexCount    = primitive.controller.config.levels.maxLevelIndexCount
      let maxInstanceCount = primitive.controller.config.levels.maxLevelInstanceCount
     
      for (let i = 0; i < length; i++) {
        result.push(maxIndexCount[i] + maxVertexCount[i] + maxInstanceCount[i]);
      }
    
      return result;
    }

    super(...initBatchedMeshData(),material)

    return this.#_transferGeometry(primitive)

    }

  #_transferGeometry(primitive){

    this.primitive = primitive

    let promises = []

    this.primitive.quadTreeCollections.forEach((value) => promises.push(value.meshNode) )

    return Promise.all(promises).then(p=>{

      p.forEach(node=>{

        const parent = node.parent;

        parent.remove( node );
  
        let geometry = node.mesh().geometry 
  
        const geometryId = this.addGeometry( geometry );
        
        const id = this.addInstance( geometryId );

        const matrix = new THREE.Matrix4();

        matrix.premultiply(new THREE.Matrix4().makeTranslation(...node.mesh().position.toArray()));

        this.setMatrixAt( id, matrix );

        this.setColorAt( id, new THREE.Color( Math.random() * 0xffffff ) );

      })

      return this

    })

  }

}  