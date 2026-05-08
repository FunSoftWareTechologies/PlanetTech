import * as THREE from 'three'
import { CubePrimitive,QuadPrimitive } from "../../engine/spatialObjects/spatialPrimitive.js"
import { SphereMaterial, QuadMaterial } from '../materials/material.js';
 
export class Mesh extends THREE.BatchedMesh{
     
  constructor(material, primitive ){

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

    this.callBacks = {
      _nodeCreated:   (node)=>node,
      _nodeDestroyed: (node)=>node,
      _nodeUpdated:   (node)=>node,
    }
  }

  nodeCreated  (fn){  this.callBacks._nodeCreated   = fn; return this}

  nodeDestroyed(fn){  this.callBacks._nodeDestroyed = fn; return this}

  nodeUpdated  (fn){  this.callBacks._nodeUpdated   = fn; return this}

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
  
  initPrimitive (primitive){
     const nodeCreated  = this.callBacks._nodeCreated
      this.callBacks._nodeCreated = ( node, policy ) => {nodeCreated(node, policy, this)  }
      this.primitive = primitive
      this.add(this.primitive) 
    return this
  }

}


export class SphereMesh extends Mesh{

  constructor(){
    super(new SphereMaterial())
  }

  init (params){  
    console.log(this.material.uniforms)
    this.material.uniforms.radius.value = params.projectionRadius
    return this.initPrimitive(new CubePrimitive( params, this.callBacks )) 
  }
}

export class QuadMesh extends Mesh{
  constructor(){
    super(new QuadMaterial())
  }

  init (params){ 
    return this.initPrimitive(new QuadPrimitive( params, this.callBacks )) 
  }
}

/*
  --example--

  const sphere = new SphereMesh()
  .nodeCreated ((node, policy, mesh)=>{ node.buildWorldBox().drawWorldBox(scene) })
  .nodeDestroyed((node)=>{})
  .nodeUpdated  ((node)=>{})
  .init         ({
    size: 4, 
    resolution: 2, 
    dimension: 10, 
    levels: 4,
    projectionRadius: 10,
  })


*/