import * as THREE from 'three'
import { uniform } from 'three/tsl';



    let vertexShader = /* glsl */`
      #include <common>
      
      #include <logdepthbuf_pars_vertex>

      #include <batching_pars_vertex>

      vec4 primitive;
      
      varying vec2 vUv;
      varying vec4 vPrimitive;
      //inject varying
       

      //inject uniforms

      void vertMain(){}

      void main() {

        #include <batching_vertex>   
 
        primitive = batchingMatrix * vec4(position, 1.0);

        vUv = uv;

        vPrimitive = primitive;

        //inject in main
 
        vertMain();

        gl_Position = projectionMatrix * modelViewMatrix * primitive;

        #include <logdepthbuf_vertex>
      }
    `;
 
    let fragmentShader = /* glsl */`
      #include <common>
      #include <logdepthbuf_pars_fragment>

      varying vec2 vUv;
      varying vec4 vPrimitive;
      //inject varying

      vec4 primitiveColor;

      void fragMain(){}

      void main() {

        #include <logdepthbuf_fragment>

        fragMain();

        gl_FragColor = primitiveColor;
      }
    `;
 

export class QuadMaterial extends THREE.ShaderMaterial{
  constructor( params = {}){

    const _params = Object.assign({
      vertMain : 'void vertMain(){}', 
      fragMain : 'void fragMain(){}', 
      uniforms : {}
    },params)

    vertexShader   = vertexShader.replace('void vertMain(){}',_params.vertMain )
    fragmentShader = fragmentShader.replace('void fragMain(){}',_params.fragMain )

    super({
      fragmentShader ,
      vertexShader , 
      uniforms:_params.uniforms
    })
  }
}



export class SphereMaterial extends THREE.ShaderMaterial{

  constructor( params = {} ){

    const _params = Object.assign({
      vertMain : 'void vertMain(){}', 
      fragMain : 'void fragMain(){}', 
      uniforms : {radius:{value:0}}
    },params)

    vertexShader   = vertexShader.replace('//inject varying',`
    varying vec3  vWorldNormal;
    //inject varying
    `)
    vertexShader   = vertexShader.replace('//inject uniforms',`
    uniform float radius;
    //inject uniforms
    `)
    vertexShader   = vertexShader.replace('//inject in main',`
    primitive = vec4(normalize(primitive.xyz) * radius, 1.0);
    vWorldNormal = normalize(mat3(modelMatrix) * primitive.xyz);
    //inject in main`)
    vertexShader   = vertexShader.replace('void vertMain(){}',_params.vertMain )
    fragmentShader = fragmentShader.replace('void fragMain(){}',_params.fragMain )
    fragmentShader   = fragmentShader.replace('//inject varying',`
    varying vec3  vWorldNormal;
    //inject varying
    `)
    super({
      fragmentShader ,
      vertexShader , 
      uniforms:_params.uniforms
    })
  }
}