import * as THREE from 'three/tsl'
import { project, createLocations, isWithinBounds, cordinate,generateKey } from '../utils.js';

class Node extends THREE.Object3D{ 

    constructor(params){ 
      super() 
      this.params = params
      this._children = []
    }

}


export class QuadTreeNode extends Node{

    constructor(params, normalize){ 

        super(params)
        
        this.boundingInfo = {
            boundingBox : new THREE.Box3(),
            boundingPoints : [],
            boundingHalfPoints : []
        }

        this.neighbors   = new Set()

        this.meshNodeKey = undefined

        this.normalize   = normalize

        this.initializeTransform() 
    }


    addMeshNode(meshNode){
        this.meshNode  = meshNode
    }


    initializeTransform() {
        const { matrixRotationData, offset } = this.params;
        const matrix = this.createTransformationMatrix(matrixRotationData, offset);
        this.position.applyMatrix4(matrix);
    }


    createTransformationMatrix(matrixRotationData, offset) {
        const matrix = new THREE.Matrix4();
        if (matrixRotationData?.propMethod) {
            matrix[matrixRotationData.propMethod](matrixRotationData.input);
        }
        matrix.premultiply(new THREE.Matrix4().makeTranslation(...offset));
        return matrix;
    }

    setBounds(primitive){

        let size = this.params.size

        let M = new THREE.Vector3() 

        const axis = this.params.direction.includes('z') ? 'z' : this.params.direction.includes('x') ? 'x' : 'y';

        const {points,averages} = createLocations(size, this.params.offset, axis)
        
        if(this.normalize){
            
            let radius =  this.params.controller.config.radius
            
            points.forEach((e,i)=>{

                const A = this.localToWorld( new THREE.Vector3(...e) )

                project(A,radius,new THREE.Vector3().copy(primitive.position))

                this.boundingInfo.boundingBox.expandByPoint(A)

                this.boundingInfo.boundingPoints.push(A.clone())

                M.add(A)

                const B = this.localToWorld( new THREE.Vector3(...averages[i]) )

                project(B,radius,new THREE.Vector3().copy(primitive.position))

                this.boundingInfo.boundingHalfPoints.push(B.clone())

            })

            M.divideScalar(4) 
            
            project( M,radius,new THREE.Vector3().copy(primitive.position)) 

            this.boundingInfo.boundingBox.expandByPoint(M)

            this.boundingInfo.boundingPoints.push(M.clone())

            this.position.copy(M)

        }else{


            points.forEach((e,i)=>{

                const A = this.localToWorld( new THREE.Vector3(...e)).add(primitive.position) 

                this.boundingInfo.boundingBox.expandByPoint(A.divideScalar(2))

                this.boundingInfo.boundingPoints.push(A.clone())

                M.add(A)

                const B = this.localToWorld( new THREE.Vector3(...averages[i]) ).add(primitive.position).divideScalar(2)

                this.boundingInfo.boundingHalfPoints.push(B.clone())

            })

            M.divideScalar(4) 

            this.boundingInfo.boundingBox.expandByPoint(M)

            this.boundingInfo.boundingPoints.push(M.clone())

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

        let {points,averages }= createLocations((size/2), offset, axis) 

        points.forEach((location,idx) => {

            index = `${index} -> ${cordinate(idx)}`

            let quadtreeNode = primitive.createQuadtreeNode({ matrixRotationData, offset:location, index, direction, initializationData:{ size, resolution, depth }})
 
            this._children.push(quadtreeNode)

        });
    
    }


    visibleNodes(OBJECT3D, primitive) {
        const nodes = [];
        const traverse = (node) => {
            const distance = node.position.distanceTo(OBJECT3D.position);
            if (isWithinBounds(distance, primitive, node.params.size)) {
                node._children.forEach(traverse);
            } else {
                nodes.push(node);
            }
        };
        traverse(this);
        return nodes;
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


export class MeshNode extends Node{ 

    constructor(params,state = 'active'){ 
        super(params)
        this.state = state 
     }
    
    add(mesh){
        if (this.state !== 'active')  mesh.material.visible = false;
        super.add(mesh)
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

