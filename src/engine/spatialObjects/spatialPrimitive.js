 
import * as THREE from 'three'
import { Blueprint } from './bluePrint.js'
import { QuadTree } from './spatialStructure.js'


export class Primitive extends QuadTree { 

  constructor( params, list = [], depth = 0 ) { 

    const bluePrint = new Blueprint(params)

    super( bluePrint ) 

    this.createDimensions(list, depth)

  } 

}
 
export class QuadPrimitive extends Primitive { 

  constructor( params ) {  
    
    super( params, [0] , 0) 
  
  } 

}

export class CubePrimitive extends Primitive { 

  constructor( params ) {  

    const { size: w, dimension: d  } = params
    
    super( params, [0,1,2,3,4,5] , (w / 2) * d ) 
  
  } 

}


