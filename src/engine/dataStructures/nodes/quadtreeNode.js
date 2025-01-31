import * as THREE from 'three'
import { Node } from './baseNode.js' 
import { project, createLocations, generateKey,coordinate} from '../../utils/boundingBoxUtils.js'




export class QuadTreeNode extends THREE.Object3D{
    #_meshNode    = null
    #_spatialNode = null

    constructor(sharderParameters){
        super()
        this._children = []
        this.sharderParameters = sharderParameters
    }

    add(mesh){
        if (( mesh instanceof QuadTreeMeshNode )){ this.#_meshNode = mesh}
        else if (mesh instanceof QuadTreeSpatialNode) {this.#_spatialNode = mesh}
        super.add(mesh)
        return this
    }

    getSpatialNode(){
        return this.#_spatialNode   
    }

    getMeshNode(){
        return this.#_meshNode  
    }

    setSpatialNode(node){
        this.#_spatialNode = node
    }

    setMeshNode(node){
       this.#_meshNode = node
    }

    subdivide(primitive){

        let { 
            matrixRotationData, 
            index, 
            depth, 
            direction, 
            resolution, 
            size, 
            points } = this.getSpatialNode().getSpatialAnalysis(primitive)

        points.forEach((location,idx) => {

            index = `${index} -> ${coordinate(idx)}`

            let quadTreeNode = primitive.createQuadTreeNode({ matrixRotationData, offset:location, index, direction, initializationData:{ size, resolution, depth }})

            primitive.createSpatialNode(quadTreeNode)

            quadTreeNode.getSpatialNode().hideMesh()

            this._children.push(quadTreeNode)

        });
    }

    async hideChildren() {
        const meshNodes = await Promise.all(this._children.map((child) => child.getMeshNode()));
        meshNodes.forEach((node) => node?.hideMesh());
    
        this._children.forEach((child) => {
            const spatialNode = child.getSpatialNode();
            spatialNode?.hideMesh();
        });
    
        const meshNode    = await this.getMeshNode();
        const spatialNode = this.getSpatialNode();
    
        meshNode?.showMesh();
        spatialNode?.showMesh();
    }


    async showChildren(){

        const meshNodes = await Promise.all(this._children.map((child) => child.getMeshNode()));
        meshNodes.forEach((node) => node?.showMesh());

        this._children.forEach((child) => {
            const spatialNode = child.getSpatialNode();
            spatialNode?.showMesh();
        });

        const meshNode    = await this.getMeshNode();
        const spatialNode = this.getSpatialNode();
    
        meshNode?.hideMesh();
        spatialNode?.hideMesh();

    }

} 


export class QuadTreeMeshNode extends Node{ 
    constructor(params,state = 'active'){ 
        super(params,state)
      }
}


export class QuadTreeSpatialNode extends Node{

    constructor(params, normalize, state = 'active'){ 

        super(params, state)
        
        this.boundingInfo = {
            boundingBox : new THREE.Box3(),
            boundingPoints : [],
            boundingHalfPoints : []
        }

        this.nodekey     = null

        this.neighbors   = new Set()

        this.normalize   = normalize

        this.initializeTransform() 
    }

    generateKey(){ this.nodekey = generateKey(this) }

 

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
            
            let radius =  this.params.infrastructure.config.radius
            
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

            this.boundingInfo.boundingBox.translate(this.position.clone().negate())

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

            this.boundingInfo.boundingBox.translate(this.position.clone().negate())

        }

    }

    getSpatialAnalysis(primitive){

        let { direction, matrixRotationData, size, offset,index } = this.params;

        let depth = this.params.depth + 1

        let axis  = direction.includes('z') ? 'z' : direction.includes('x') ? 'x' : 'y';

        let resolution = primitive.infrastructure.config.arrybuffers[( size / 2 )].geometryData.parameters.widthSegments
         
        size = ( size / 2 )

        let { points, averages }= createLocations(( size / 2 ), offset, axis) 

        return { matrixRotationData, index, depth, direction, resolution, size, points }
    }

}


 