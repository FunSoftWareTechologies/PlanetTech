import * as THREE from 'three'
import { CubePrimitive } from "../engine/primitive.js"
 
export class SphereMesh extends THREE.Object3D{
     
  
    constructor(params,material){
      
      // cant call super(0,0,0) i get a warning and it fails

      super( )

      this.count = 0

      const nodeCreated  = params.nodeCreated
     
      params.nodeCreated = ( node, blueprint ) => { nodeCreated( node, blueprint, this ) }

      this.primitive = new CubePrimitive(params,material)

      this.add(this.primitive,...Object.values(this.primitive.blueprint.config.instanceObject))
      
     }

    draw(node,blueprint){

      const size = node.bounds.getSize(new THREE.Vector3())

      //todo ugly

      const idx = Object.keys(blueprint.config.arraybuffers).indexOf(String(size.x))
 
      const instnaceMesh = Object.values(blueprint.config.instanceObject)[idx]
      
      instnaceMesh.setMatrixAt(this.count, node.transformMatrix);

      this.count +=1 

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