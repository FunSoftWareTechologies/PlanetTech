import * as THREE from 'three'


export class VirtualTexture extends THREE.DataTexture{
    _isVirtualTexture = true

    constructor(...args){
        super(...args)
        this.needsUpdate = true

        this.onUpdate = ()=>{ 
        this.needsUpdate = true
        console.log('sdhjdhj') 
    }
         
    }

    setPrimitive(primitive){
        this.primitive = primitive
    }



}