import * as THREE from 'three'
import {CelestialBody} from './celestialBody.js' 
import { Sphere } from '../../engine/primitives/sphere.js'


export class Planet extends CelestialBody{
    static __type = 'Planet'

    constructor(params){
        super(params)
     }

 
    initSphere( primitiveData ){

        this.primitive = new Sphere(primitiveData)
    
        this.primitive.levelArchitecture.config.lodDistanceOffset = primitiveData.offset 
        
        this.primitive.createQuadTree({levels:primitiveData.levels})
      
        this.primitive.createMeshNodes()

    }


    setEvents(name, eventHandlers){

        eventHandlers.forEach(fn => { this.primitive.levelArchitecture.events.on(name,fn)  });

    }

 
    create(){

        this.primitive.createDimensions()
      
        this.add(this.primitive)

    }
}
