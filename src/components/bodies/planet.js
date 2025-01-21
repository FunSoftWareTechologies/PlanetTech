import * as THREE from 'three'
import {CelestialBody} from './celestialBody.js' 
import { Sphere } from '../../engine/primitives.js'


export class Planet extends CelestialBody{

    constructor(params){
        super(params)
    }

 
    createSphere( primitiveData, eventHandlers ){

        let primitive = new Sphere(primitiveData)
    
        primitive.levelArchitecture.config.lodDistanceOffset = primitiveData.offset 
          
        eventHandlers.forEach(fn => {

            primitive.levelArchitecture.on(fn.name,fn) 

        });
        

        primitive.createQuadTree({levels:primitiveData.levels})
      
        primitive.createMeshNodes()
      
        primitive.createDimensions()
      
        this.primitive = primitive

        this.add(this.primitive)

    }
}
