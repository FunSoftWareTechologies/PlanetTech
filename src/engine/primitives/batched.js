import * as THREE from 'three'
 

export class BatchedPrimitive  {
    static __type = 'BatchedPrimitive'
  
    constructor(type,params){
      
 
      
    }
  
    createDimensions(){
 
  
    }
  
    _transferGeometry(batchedMesh){
   
    }
  }
  
//example usage
  /*
  let planet2  = new BatchedPrimitive(122,{
  offset:1/0.5 ,
  levels:1,
  size:1,
  radius:10.0,
  resolution:50,
  dimension:10
})
planet2.infrastructure.config.lodDistanceOffset = 1
planet2.createQuadTree({levels:1})
      
 planet2.createMeshNodes()

planet2.createDimensions()
  */