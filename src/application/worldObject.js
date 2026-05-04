import * as THREE from 'three'
import { OcTree } from '../engine/spatialObjects/spatialStructure.js'


export class WorldObject extends THREE.Mesh {

    constructor(){
        super()
    }

    initOctree( params ){
        this.octree = new OcTree(params)
    }

    initPhysics( ){

    }

    onBeforeRender(){
        
    }
}