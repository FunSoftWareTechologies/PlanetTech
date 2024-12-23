import * as THREE from 'three/tsl'
import { project, createLocations, isWithinBounds, cordinate } from './utils.js';

class Node extends THREE.Object3D{ 

    constructor(params){ 
      super() 
      this.params = params
      this._children = []
    }

}

export class MeshNode extends Node{ 

    constructor(params,state = 'active'){ 
        super(params)
        this.state = state 
     }
    
    add(mesh){
        super.add(mesh)
        this.showMesh()
        return this
    }

    mesh(){
        if (this.children[0] instanceof THREE.Mesh) // todo
        return this.children[0]
    }

    showMesh() {
        if (this.state !== 'active') {
            this.mesh().material.visible  = true;
            this.state = 'active';
        }
      }

    hideMesh() {
        if (this.state == 'active') {
            this.mesh().material.visible = false;
            this.state = 'inactive';
        }
    }

}


export class QuadTreeNode extends Node{

    constructor(params, normalize){ 

        super(params) 

        this.boundingBox = new THREE.Box3();

        this.boundingBox._boundingPoints = []

        this.normalize = normalize

        let matrixRotationData = this.params.matrixRotationData

        let offset = this.params.offset

        let matrix = matrixRotationData.propMehtod ? new THREE.Matrix4()[[matrixRotationData.propMehtod]](matrixRotationData.input) : new THREE.Matrix4() 

        matrix.premultiply(new THREE.Matrix4().makeTranslation(...offset)) 
        
        this.position.applyMatrix4(matrix)
    }

    setBounds(primitive){

        let size = this.params.size
        
        if(this.normalize){

            let M = new THREE.Vector3() 
            
            let radius =  this.params.controller.config.radius

            const axis = this.params.direction.includes('z') ? 'z' : this.params.direction.includes('x') ? 'x' : 'y';

            createLocations(size, this.params.offset, axis).forEach(e=>{

                const A = this.localToWorld( new THREE.Vector3(...e) )

                project(A,radius,new THREE.Vector3().copy(primitive.position))

                this. boundingBox.expandByPoint(A)

                this.boundingBox._boundingPoints.push(A.clone())

                M.add(A)
            })

            M.divideScalar(4) 
            
            project( M,radius,new THREE.Vector3().copy(primitive.position)) 

            this. boundingBox.expandByPoint(M)

            this.boundingBox._boundingPoints.push(M.clone())

            this.position.copy(M)

        }else{

            let M = new THREE.Vector3() 
            
            const axis = this.params.direction.includes('z') ? 'z' : this.params.direction.includes('x') ? 'x' : 'y';

            createLocations(size, this.params.offset, axis).forEach(e=>{

                const A = this.localToWorld( new THREE.Vector3(...e).add(primitive.position) )

                this.boundingBox.expandByPoint(A.divideScalar(2))

                this.boundingBox._boundingPoints.push(A.clone())

                M.add(A)
            })

            M.divideScalar(4) 

            this. boundingBox.expandByPoint(M)

            this.boundingBox._boundingPoints.push(M.clone())

            this.position.copy(M)

        }

    }

    subdivide(primitive){

        let { direction, matrixRotationData, size, offset,index } = this.params;

        let depth  = this.params.depth + 1

        let axis = direction.includes('z') ? 'z' : direction.includes('x') ? 'x' : 'y';

        let resolution = primitive.controller.config.arrybuffers[(size/2)].geometryData.parameters.widthSegments
         
        size = (size/2)

        let locations = createLocations((size/2), offset, axis) 

        locations.forEach((location,idx) => {

            index = `${index} -> ${cordinate(idx)}`

            let quadtreeNode = primitive.createQuadtreeNode({ matrixRotationData, offset:location, index, direction, initializationData:{ size, resolution, depth }})
 
            this._children.push(quadtreeNode)

        });
    
    }


    visibleNodes(OBJECT3D,primitive){

        const nodes = [] 
    
        const traverse = ( node ) => {
            
            var distance = node.position.distanceTo(OBJECT3D.position)

            if( isWithinBounds( distance, primitive, node.params.size ) ){

                for (const child of node._children) { traverse(child)  }

            }else{  
                
                nodes.push(node)  
            }
        }
    
        traverse(this)

        return nodes
    }

}