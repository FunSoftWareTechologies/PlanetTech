import * as THREE from 'three'
import * as TSL   from 'three/tsl'
import * as THREEWEBGPU from 'three/webgpu'

export const getVisibleMaterial=(node)=>{
    if ( node.constructor.__type === 'meshNode'){
         return node.params.infrastructure.config.meshNodeMaterial
    } else if ( node.constructor.__type === 'spatialNode'){
        return node.params.infrastructure.config.spatialNodeMaterial
    }else{
        console.warn('none existing node type')
    }
}

export class Node extends THREE.Object3D{ 
    #mesh = null
    static __type = 'Node'

    constructor(params,state){ 
      super() 
      this.params = params
      this.state  = state
      this.hiddenMaterial  = new THREEWEBGPU.MeshStandardNodeMaterial({color:'black',visible:false})
      this.visibleMaterial = getVisibleMaterial(this)
     }

    add(mesh){
        if (this.state !== 'active')  mesh.material = this.hiddenMaterial  
        this.#mesh = mesh
        super.add(mesh)
        return this
    }

    attach(mesh){
        if (this.state !== 'active') mesh.material = this.hiddenMaterial 
        this.#mesh = mesh
        super.attach(mesh)
        return this
    }

    mesh(){ return this.#mesh } //todo

    showMesh() {
        if (this.state !== 'active') {
            if (this.mesh())  this.mesh().material =  this.visibleMaterial
            this.state = 'active';
        }
      }

    hideMesh() {
        if (this.state == 'active') {
            if (this.mesh()) this.mesh().material = this.hiddenMaterial
             this.state = 'inactive';
        }
    }

}
