import * as THREE from 'three'
import { SphereMesh } from '@funsoftware/spatialprimitives'
import { WorldMaterial } from '../materials/worldMaterial.js'

export class WorldMesh extends SphereMesh{

    constructor( worldMaterial ){ super( worldMaterial ) }

    init(params){
        //todo get dimeons from params to set faceindex
        const faceIndexData = new Float32Array([0, 1, 2, 3, 4, 5]);
        const faceIndexTex = new THREE.DataTexture(faceIndexData, 6, 1, THREE.RedFormat, THREE.FloatType);
        faceIndexTex.needsUpdate = true; 
        this.material.uniforms.u_FaceIndexTexture = { value: faceIndexTex }
        return super.init(params)
    }
}