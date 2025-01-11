 
import { isWithinBounds } from '../utils.js'
 
import * as _THREE from 'three'
import * as TSL from 'three/tsl'
import * as WG from 'three/webgpu'

const THREE = {..._THREE,...TSL,...WG}

export class Controller {

  constructor(config = {}) {
    let shardedData = {
      maxLevelSize:1,
      minLevelSize:1,
      minPolyCount:1,
      maxPolyCount:undefined,
      dimensions:1,
      arrybuffers:{},
      scale: 1,
      lodDistanceOffset: 1,
      displacmentScale:1,
      material: new THREE.MeshBasicMaterial({ color: "grey" }),
      callBacks:{
        afterMeshNodeCreation: (node,payload) => undefined,
        afterSpatialNodeCreation: (node,payload) => undefined,
        setTextures: () => undefined,
      },
     }
    this.config = Object.assign( shardedData, config )
  }

  levels(numOflvls) {
    var levelsArray      = [];
    var polyPerLevel     = [];
    let maxLevelVertexCount   = []
    let maxLevelIndexCount    = []
    var maxLevelInstanceCount = [];
    var value        = this.config.maxLevelSize
    var min          = this.config.minLevelSize
    var minPoly      = this.config.minPolyCount
    var dimensions   = (this.config.dimensions ** 2)
     
    for (let i = 0; i < numOflvls; i++) {
        levelsArray           .push( value   )
        polyPerLevel          .push( minPoly )
        maxLevelInstanceCount .push( dimensions * 6)
        maxLevelVertexCount   .push(((minPoly+1)*(minPoly+1))*(dimensions* 6))
        maxLevelIndexCount    .push(((minPoly**2)*6)*(dimensions * 6))

        value   = ( value / 2   )
        minPoly = ( minPoly * 2 )
        dimensions = dimensions * 4
    }

    this.config['levels'] = {
      numOflvls,
      levelsArray,
      polyPerLevel,
      maxLevelIndexCount,
      maxLevelVertexCount,
      maxLevelInstanceCount,

    }

    this.config['maxPolyCount'] = polyPerLevel[polyPerLevel.length - 1]
  }

  createArrayBuffers(){
    for ( var i = 0; i < this.config.levels.numOflvls;  i++ ) {
      const size  = this.config.levels.levelsArray [i]
      const poly  = this.config.levels.polyPerLevel[i]
      this.config.arrybuffers[size] = {
        geometryData:{
          parameters: {
            width: size,
            height:size,
            widthSegments: poly,
            heightSegments:poly
          },
          byteLengthUv:       (poly+1) * (poly+1) * 2 * 4,
          byteLengthPosition: (poly+1) * (poly+1) * 3 * 4,
          byteLengthNormal:   (poly+1) * (poly+1) * 3 * 4,
          byteLengthIndex:    poly * poly * 6 * 4,
        }
      }
    }
  } 

  setCallBacks(callBacks){
    this.config.callBacks = Object.assign(this.config.callBacks,callBacks) 
  }
}




export class QuadTree {

  constructor() {

    this.rootNodes = []

  }
  
  insert(OBJECT3D,primitive,quadTreeNode){

    let spatialNode = quadTreeNode.getSpatialNode()

    let distance = spatialNode.position.distanceTo(OBJECT3D.position)
  
    if ( isWithinBounds(distance, primitive, spatialNode.params.size) ) {
  
        if (spatialNode._children.length === 0)  spatialNode.subdivide(primitive) 
 
          spatialNode._children.forEach(child=>this.insert(OBJECT3D,primitive,child))

     }
  }

  visibleNodes(OBJECT3D, primitive, rootNodeQuadTreeNode) {
    
    const nodes = [];

    const traverse = (quadTreeNode) => {

        let spatialNode = quadTreeNode.getSpatialNode()

        const distance = spatialNode.position.distanceTo(OBJECT3D.position);

        if (isWithinBounds(distance, primitive, spatialNode.params.size)) {

          spatialNode._children.forEach(traverse);

        } else {

            nodes.push(quadTreeNode);

        }

    };

    traverse(rootNodeQuadTreeNode);

    return nodes;
  }


  update(OBJECT3D, primitive) {
      
    const visibleQuadTreeNodes = new Set();

    this.rootNodes.forEach((quadTreeNode) => this.#_update(OBJECT3D, primitive, quadTreeNode, visibleQuadTreeNodes))
    
    for (const [key, value] of primitive.quadTreeCollections.entries()) {

      if (!visibleQuadTreeNodes.has(key)) {
        
        value.showChildren()

      } 
    } 
  }


 #_update(OBJECT3D, primitive, quadTreeNode, visibleQuadTreeNodes) {
    
    this.insert(OBJECT3D, primitive, quadTreeNode);

    const visibleNodes = this.visibleNodes(OBJECT3D, primitive, quadTreeNode);

    for (const node of visibleNodes) {

      const key = node.getSpatialNode().nodekey;
  
      if (!primitive.quadTreeCollections.has(key)) {

        primitive._createMeshNodes({quadTreeNode:node,initialState:'inactive'})

        primitive.addNode(key,node)

        visibleQuadTreeNodes.add(key);

      } else {

        visibleQuadTreeNodes.add(key);

        //todo
        if (quadTreeNode.getSpatialNode().nodekey === key) {
  
          let value = primitive.quadTreeCollections.get(key)
  
          value.hideChildren()
          
        }
      }
    }
  }
}