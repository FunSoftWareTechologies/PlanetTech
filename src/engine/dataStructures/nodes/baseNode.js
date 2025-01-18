import * as _THREE from 'three'
import * as TSL from 'three/tsl'
import * as WG from 'three/webgpu'

const THREE = {..._THREE,...TSL,...WG}

export class Node extends THREE.Object3D{ 

    constructor(params,state){ 
      super() 
      this.params = params
      this.state  = state
      
    }

    add(mesh){
        if (this.state !== 'active')  mesh.material.visible = false;
        super.add(mesh)
        return this
    }

    attach(mesh){
        if (this.state !== 'active')  mesh.material.visible = false;
        super.attach(mesh)
        return this
    }

    mesh(){
        return this.children[0] //todo
    }

    showMesh() {
        if (this.state !== 'active') {
            if (this.mesh()) this.mesh().material.visible = true;
            this.state = 'active';
        }
      }

    hideMesh() {
        if (this.state == 'active') {
            if (this.mesh())  this.mesh().material.visible = false;
            this.state = 'inactive';
        }
    }

}
