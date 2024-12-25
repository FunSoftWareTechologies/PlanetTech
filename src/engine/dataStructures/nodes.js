import * as THREE from 'three/tsl'
import { project, createLocations, isWithinBounds, cordinate,generateKey } from '../utils.js';

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

        this.neighbors = new Set()

        this.meshNodeKey = undefined

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

                const A = this.localToWorld( new THREE.Vector3(...e)).add(primitive.position) 

                this.boundingBox.expandByPoint(A.divideScalar(2))

                this.boundingBox._boundingPoints.push(A.clone())

                M.add(A)
            })

            M.divideScalar(4) 

            this.boundingBox.expandByPoint(M)

            this.boundingBox._boundingPoints.push(M.clone())

            this.position.copy(M)

        }

        this.meshNodeKey = generateKey(this)

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



export class OctreeNode extends Node{
  constructor(bounds, minNodeSize) {
      super()
      this.objIDs = [];
      this.nodeBounds = bounds;
      this.minSize = minNodeSize;

      // Calculate bounds for child nodes
      const boundsSize = this.nodeBounds.getSize(new THREE.Vector3());
      const halfSize = boundsSize.y / 2;
      const quarterSize = boundsSize.y / 4;
      const childSize = new THREE.Vector3(halfSize, halfSize, halfSize);
      const center = this.nodeBounds.getCenter(new THREE.Vector3());

      // Generate child bounds
      this.childBounds = Array(8)
          .fill(null)
          .map((_, i) => {
              const offset = new THREE.Vector3(
                  ((i & 1) === 0 ? -1 : 1) * quarterSize,
                  ((i & 2) === 0 ? 1 : -1) * quarterSize,
                  ((i & 4) === 0 ? -1 : 1) * quarterSize
              );
              const childCenter = center.clone().add(offset);
              return new THREE.Box3().setFromCenterAndSize(childCenter, childSize);
          });

      this.children = [];
  }

  addObject(obj) {
      this.divideAndAdd(obj);
  }

  divideAndAdd(obj) {
      const box = obj.boundingBox;

      const boundsSize = this.nodeBounds.getSize(new THREE.Vector3());
      if (boundsSize.y <= this.minSize) {
          this.objIDs.push(obj.uuid);
          obj.octreeCells.push({ objID: this.objIDs, nodeBounds: this.nodeBounds });
          return;
      }

      if (this.children.length === 0) {
          this.children = Array(8).fill(null);
      }

      let isDivided = false;
      this.childBounds.forEach((childBound, i) => {
          if (childBound.intersectsBox(box)) {
              if (!this.children[i]) {
                  this.children[i] = new OctreeNode(childBound, this.minSize);
              }
              this.children[i].divideAndAdd(obj);
              isDivided = true;
          }
      });

      if (!isDivided) {
          this.children = [];
      }
  }

  draw(octTree) {
    octTree.add(new THREE.Box3Helper(this.nodeBounds, 'green'));
      this.children.forEach((child) => {
          if (child) child.draw(octTree);
      });
  }
}