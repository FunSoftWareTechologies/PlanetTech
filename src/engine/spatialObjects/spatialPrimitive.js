import * as THREE from 'three'
import { QuadTree } from './spatialStructure.js'
import { Policy } from './policy.js'

export class Primitive extends THREE.Object3D { 

  constructor( ) { 

    super( )

    this.spatialPrimitive = null

  } 

  quadtree(params, callBacks , list = [], offset = 0 ){

    //todo check parent  for any primitive and remove it 

    this.spatialPrimitive  = new QuadTree(new Policy(params).createQuadtreePolicy())

    const _nodeCreated     = callBacks._nodeCreated

    callBacks._nodeCreated = (node) => _nodeCreated(node,this.spatialPrimitive.policy)

    this.spatialPrimitive.createDimensions(list, offset, callBacks._nodeCreated)

    this.add(this.spatialPrimitive)

  }

  octree(params){

    //todo check parent  for any primitive and remove it 

    this.spatialPrimitive = new OcTree(new Policy(params).createOctreePolicy())

    this.add(this.spatialPrimitive)

  }

}
 
export class QuadPrimitive extends Primitive { 

  constructor( params, callBacks ) {  
    
    super( ) 

    this.quadtree( params, callBacks, [0], 0 )
  
  } 

}

export class CubePrimitive extends Primitive { 

  constructor( params, callBacks ) {  

    super( ) 

    const { size: w, dimension: d } = params
    
    this.quadtree( params, callBacks, [0,1,2,3,4,5] , (w / 2) * d ) 
  
  } 

}