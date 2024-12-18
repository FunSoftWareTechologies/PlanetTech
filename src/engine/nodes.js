import * as THREE from 'three/tsl'
import { isSphere } from './primitives.js'
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

        this. boundingBox = new THREE.Box3();

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
            
            let radius =  this.params.quadTreeController.config.radius

            const axis = this.params.direction.includes('z') ? 'z' : this.params.direction.includes('x') ? 'x' : 'y';

            createLocations(size, this.params.offset, axis).forEach(e=>{

                const A = this.localToWorld( new THREE.Vector3(...e) )

                project(A,radius,new THREE.Vector3().copy(primitive.position))

                this. boundingBox.expandByPoint(A)

                M.add(A)
            })

            M.divideScalar(4) 
            
            project( M,radius,new THREE.Vector3().copy(primitive.position)) 

            this.bounds = M

        }else{

            let M = new THREE.Vector3() 
            
            const axis = this.params.direction.includes('z') ? 'z' : this.params.direction.includes('x') ? 'x' : 'y';

            createLocations(size, this.params.offset.map(v=>v ), axis).forEach(e=>{

                const A = this.localToWorld( new THREE.Vector3(...e) )

                this. boundingBox.expandByPoint(A.divideScalar(2))

                M.add(A)
            })

            M.divideScalar(4) 

            this.bounds = M.add(new THREE.Vector3().copy(primitive.position))  

        }

    }

    insert(OBJECT3D,primitive){

        var distance = this.bounds.distanceTo(OBJECT3D.position)
      
        if ( isWithinBounds(distance,primitive,this.params.size) ) {
      
            if (this._children.length === 0) { this.subdivide(primitive) }
     
            for (const child of this._children) { child.insert(OBJECT3D,primitive) } 
        }

    }

    subdivide(primitive){
        let { direction, matrixRotationData, size, offset,index } = this.params;
        let depth  = this.params.depth + 1

        let axis = direction.includes('z') ? 'z' : direction.includes('x') ? 'x' : 'y';
        let segments = primitive.quadTreeController.config.arrybuffers[(size/2)].geometryData.parameters.widthSegments
        let quadTreeController = primitive.quadTreeController
        size = (size/2)
        let locations = createLocations( (size/2), offset, axis) 

        locations.forEach((location,idx) => {

        let params={
            index:`${index} -> ${cordinate(idx)}`, 
            offset:location,  
            direction,
            depth,
            segments,
            quadTreeController,
            size,
            matrixRotationData
        }  

        let quadtreeNode = new QuadTreeNode(params, isSphere(primitive))

        primitive.add(quadtreeNode)

        quadtreeNode.setBounds(primitive)

        primitive.quadTreeController.config.callBacks.onQuadTreeNodeCreation(quadtreeNode)

        this._children.push(quadtreeNode)

        });
    
    }


    visibleNodes(OBJECT3D,primitive){

        const nodes = [] 
    
        const traverse = ( node ) => {
            
            var distance = node.bounds.distanceTo(OBJECT3D.position)

            if( isWithinBounds( distance, primitive, node.params.size ) ){

                for (const child of node._children) { traverse(child)  }

            }else{

                nodes.push(node);

            }
        }
    
        traverse(this)

        return nodes
    }

}