import * as THREE from 'three'
import { CubePrimitive,QuadPrimitive } from "../../engine/spatialObjects/spatialPrimitive.js"
 
 
export class Mesh extends THREE.BatchedMesh{
     
  constructor( params, material, primitive){

    // cant call super(0,0,0) i get a warning and it fails

    super(1,1,1,material)

    this.frustumCulled = false;

    this.perObjectFrustumCulled = false;

    this.__maxInstanceCount = 0

    this.__maxVertexCount   = 0

    this.__maxIndexCount    = 0

    this.primitive = primitive

    this.updateWorldMatrix(true, false);
 
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

  onBeforeRender( renderer, scene, camera, geometry, material, group ) {

    super.onBeforeRender( renderer, scene, camera, geometry, material, group )

  }
  
}


export class SphereMesh extends Mesh{
    
  constructor(params,material){
    
    super(params,material)

    const nodeCreated  = params.nodeCreated
    
    params.nodeCreated = ( node, blueprint ) => { nodeCreated( node, blueprint, this ) }

    this.primitive = new CubePrimitive(params)

    this.add(this.primitive)

  }

}
  

export class QuadMesh extends Mesh{
    
  constructor(params,material){
    
    super(params,material)

    const nodeCreated  = params.nodeCreated
    
    params.nodeCreated = ( node, blueprint ) => { nodeCreated( node, blueprint, this ) }

    this.primitive = new QuadPrimitive(params)

    this.add(this.primitive)

  }

}