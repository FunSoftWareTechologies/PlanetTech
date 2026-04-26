import * as THREE from 'three'
import { CubePrimitive } from "../engine/primitive.js"
 
export class SphereMesh extends THREE.BatchedMesh{
     
  
    constructor(params,material){
      
      // cant call super(0,0,0) i get a warning and it fails

      super(1,1,1,material)

        this.__maxInstanceCount = 0
  
        this.__maxVertexCount   = 0
  
        this.__maxIndexCount    = 0
  
      const nodeCreated  = params.nodeCreated
     
      params.nodeCreated = ( node, blueprint ) => { nodeCreated( node, blueprint, this ) }

      this.primitive = new CubePrimitive(params)

      this.add(this.primitive)
     }

    draw(node,blueprint){

        const size = node.bounds.getSize(new THREE.Vector3())

        const geometry = blueprint.config.arraybuffers[size.x].geometryData.geometry 

        const vertexCount = geometry.attributes.position.count;

        const indexCount  = geometry.index.count;

        this.__maxInstanceCount += 1

        this.__maxVertexCount   += vertexCount 
    
        this.__maxIndexCount    += indexCount 

        this.setInstanceCount( this.__maxInstanceCount )
  
        this.setGeometrySize ( this.__maxVertexCount, this.__maxIndexCount )
  
        const geometryId = this.addGeometry( geometry );
        
        const id = this.addInstance( geometryId );

        this.setMatrixAt( id, node.transformMatrix );
  
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