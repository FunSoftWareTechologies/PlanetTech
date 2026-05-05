import * as THREE from 'three'
import { CubePrimitive,QuadPrimitive } from "../../engine/spatialObjects/spatialPrimitive.js"
import { SphereMaterial, QuadMaterial } from '../materials/material.js';
 
export class Mesh extends THREE.BatchedMesh{
     
  constructor( callBacks, material, primitive ){

    super(1,1,1,material)

    this.frustumCulled = false;

    this.perObjectFrustumCulled = false;

    this.__maxInstanceCount = 0

    this.__maxVertexCount   = 0

    this.__maxIndexCount    = 0

    this._frustum     = new THREE.Frustum();

    this._pMat        = new THREE.Matrix4();

    this._scratchBox  = new THREE.Box3();

    this._sphere      = new THREE.Sphere();

    this.primitive    = primitive

    this.updateWorldMatrix(true, false);

    const nodeCreated  = callBacks.nodeCreated
    
    callBacks.nodeCreated = ( node, blueprint ) => { nodeCreated( node, blueprint, this ) }
 
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

    this.queryFrustum( camera )

    super.onBeforeRender( renderer, scene, camera, geometry, material, group )

  }

  queryFrustum( camera ){
 
    /*camera.updateMatrixWorld();

    this._pMat.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);

    this._frustum.setFromProjectionMatrix(this._pMat);

    const groupWorldMatrix = this.matrixWorld;
    */

  }
  
}


export class SphereMesh extends Mesh{
    
  constructor(config, callBacks){
    
    super(callBacks,new SphereMaterial())

    this.primitive = new CubePrimitive(config, callBacks)

    this.add(this.primitive)

  }

}
  

export class QuadMesh extends Mesh{
    
  constructor( config, callBacks ){
    
    super(callBacks ,new QuadMaterial())

    this.primitive = new QuadPrimitive(config, callBacks)

    this.add(this.primitive)

  }

}