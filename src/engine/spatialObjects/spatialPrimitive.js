 
import * as THREE from 'three'
import { Blueprint } from './bluePrint.js'
import { QuadTree } from './spatialStructure.js'
 
export class QuadPrimitive extends QuadTree { 

  constructor( params ) { 

    const bluePrint = new Blueprint(params)

    super( bluePrint ) 

    this.createDimensions([0])

  } 

}

export class CubePrimitive extends QuadTree { 

  constructor( params ) { 

    const bluePrint = new Blueprint(params)

    super( bluePrint ) 

    this.createDimensions([0,1,2,3,4,5])

  } 

}


