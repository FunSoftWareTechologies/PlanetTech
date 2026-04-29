import * as THREE from 'three'
import { CubeSpatialPrimitive } from "../engine/spatialPrimitive.js"
 
export class SphereMesh extends THREE.Object3D{
     
  
    constructor(params,material){
      
      super( )

      this.count = 0

      const nodeCreated  = params.nodeCreated
     
      params.nodeCreated = ( node, blueprint ) => { nodeCreated( node, blueprint, this );  this.count +=1  }

      this.primitive = new CubeSpatialPrimitive(params,material)

      this.add(this.primitive,...Object.values(this.primitive.blueprint.config.instanceObject))
      
     }

    draw(node,blueprint){

      const size = node.bounds.getSize(new THREE.Vector3())

      //todo ugly

      const idx = Object.keys(blueprint.config.arraybuffers).reverse().indexOf(String(size.x))
 
      const instnaceMesh = Object.values(blueprint.config.instanceObject)[idx]
      
      instnaceMesh.setMatrixAt(this.count, node.transformMatrix);

    }
  
  }
  