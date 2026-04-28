 
import * as THREE from 'three'
import { Blueprint } from '../system/bluePrint.js'
import { QuadTree } from './spatialStructure.js'
 
export class QuadSpatialPrimitive extends QuadTree { 

  constructor( params,material ) { 

    const bluePrint = new Blueprint(params)

    const count = [0]

    bluePrint.useInstancing(count.length,material)

    super( bluePrint ) 

    this.createDimensions(count)

  } 

}

export class CubeSpatialPrimitive extends QuadTree { 

  constructor( params, material) { 

    const bluePrint = new Blueprint(params)

    const count = [0,1,2,3,4,5]

    bluePrint.useInstancing(count.length,material)

    super( bluePrint ) 

    this.createDimensions(count)

  } 

}

 


