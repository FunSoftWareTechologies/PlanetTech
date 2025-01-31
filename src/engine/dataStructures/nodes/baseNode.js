import * as THREE from 'three'
import * as TSL from 'three/tsl'
import * as WG from 'three/webgpu'

 
export class Node extends THREE.Object3D{ 
    #mesh = null

    constructor(params,state){ 
      super() 
      this.params = params
      this.state  = state      
    }

    add(mesh){
        if (this.state !== 'active') mesh.layers.set( 1 )
        this.#mesh = mesh
        super.add(mesh)
        return this
    }

    attach(mesh){
        if (this.state !== 'active') mesh.layers.set( 1 )
        this.#mesh = mesh
        super.attach(mesh)
        return this
    }

    mesh(){ return this.#mesh }

    showMesh() {
        if (this.state !== 'active') {
         if (this.mesh())  this.mesh().layers.set( 0 )
        this.state = 'active';
        }
      }

    hideMesh() {
        if (this.state == 'active') {
            if (this.mesh()) this.mesh().layers.set( 1 ) 
            this.state = 'inactive';
        }
    }

}





 