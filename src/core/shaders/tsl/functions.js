import * as THREE from 'three/tsl'
import { vec3, Fn} from 'three/tsl';
import { FBM } from './noise.js';


export  const defaultLight = Fn(({ lightDirection })=>{

    const _lightDirection = THREE.normalize(lightDirection);

    const normalMapColor  = THREE.normalLocal;    

    const grayscale = THREE.dot(normalMapColor.rgb, vec3(0.125, 0.125, 0.125)); 

    const grayColor = THREE.vec4(grayscale, grayscale, grayscale, 1.0);

    const lightIntensity = THREE.dot(normalMapColor.rgb, _lightDirection); 

    return  grayColor.mul(lightIntensity)
   })


export const tangentNormal = Fn(({vars, normalUnifroms, noiseUnifroms} )=>{

    let u = vars.position.toVar();
    let w = vars.position.toVar();

    const center = FBM(vars.position,noiseUnifroms)//.mul(0.5).add(0.5)
  
    u.addAssign(vec3(normalUnifroms.epsilon.x,0.,0.));
    let nu = FBM(u,noiseUnifroms).sub(center)
  
    w.addAssign(vec3(0.,normalUnifroms.epsilon.y,0.));
    let nw = FBM(w,noiseUnifroms).sub(center)
  
    let tangent   = THREE.normalize(vec3(1.0, 0.0, nu.mul(normalUnifroms.normalScale.x)))
  
    let bitangent = THREE.normalize(vec3(0.0, 1.0, nw.mul(normalUnifroms.normalScale.y)))
  
    let normal    = THREE.cross(tangent, bitangent)
  
    normal = normal.mul(0.5).add(0.5)

    return normal 
  })




export  const sphereNoise = Fn(({ vars, noiseUnifroms})=>{//should be a loop
  
    const center = FBM(vars.position,noiseUnifroms)//.mul(0.5).add(0.5)
    let z = vars.directionVectors.mul(center).toVar()
    vars._position.addAssign(z)
  
    return vars._position
  })