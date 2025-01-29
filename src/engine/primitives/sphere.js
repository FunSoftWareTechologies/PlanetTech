 
   
  import * as THREE from 'three'
  import { Cube } from "./cube.js"
  
  
  export class Sphere extends Cube{
    static __type = 'Sphere'
    constructor(params){
      super(params) 
      this.levelArchitecture.config.radius = params.radius
    }
  }