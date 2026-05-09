import * as THREE from 'three'


export class VTTexture extends THREE.DataTexture{
     _isVTTexture = true

    constructor(...args){
        super(...args)
        this.needsUpdate = true

        this.primitive   =  null
    }

    setPrimitive(primitive){
        this.primitive = primitive
    }

}