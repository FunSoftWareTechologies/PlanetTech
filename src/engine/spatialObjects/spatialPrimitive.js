 
import * as THREE from 'three'
import { Blueprint } from './bluePrint.js'
import { QuadTree } from './spatialStructure.js'


export class Primitive extends QuadTree { 

  constructor( config, callBacks, list = [], depth = 0 ) { 

    const bluePrint = new Blueprint(config)

    super( bluePrint, callBacks ) 

    this.createDimensions(list, depth)

  } 

}
 
export class QuadPrimitive extends Primitive { 

  constructor( config, callBacks ) {  
    
    super( config, callBacks, [0] , 0) 
  
  } 

}

export class CubePrimitive extends Primitive { 

  constructor( config, callBacks ) {  

    const { size: w, dimension: d  } = config
    
    super( config, callBacks, [0,1,2,3,4,5] , (w / 2) * d ) 
  
  } 

}


