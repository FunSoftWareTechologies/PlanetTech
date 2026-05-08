import * as THREE from 'three'
import { QuadTree } from './spatialStructure.js'
import { Policy } from './policy.js'

export class Primitive extends QuadTree { 

  constructor( params, callBacks , list = [], offset = 0 ) { 

    const policy = new Policy(params)

    super( policy ) 

    const _nodeCreated = callBacks._nodeCreated

    callBacks._nodeCreated = (node) => _nodeCreated(node,policy)

    this.createDimensions(list, offset, callBacks._nodeCreated)

  } 

}
 
export class QuadPrimitive extends Primitive { 

  constructor( params, callBacks ) {  
    
    super( params, callBacks, [0], 0) 
  
  } 

}

export class CubePrimitive extends Primitive { 

  constructor( params, callBacks ) {  

    const { size: w, dimension: d  } = params
    
    super( params, callBacks, [0,1,2,3,4,5] , (w / 2) * d ) 
  
  } 

}