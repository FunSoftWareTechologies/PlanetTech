import * as THREE from 'three'



    let vertexShader = /* glsl */`
      #include <common>
      
      #include <logdepthbuf_pars_vertex>

      #include <batching_pars_vertex>
 

      //inject uniforms
 
      void main() {

        #include <batching_vertex>   
 
        vec4 world = batchingMatrix * vec4(position, 1.0);

        //inject
 
        gl_Position = projectionMatrix * modelViewMatrix * world;

        #include <logdepthbuf_vertex>
      }
    `;
 
    let fragmentShader = /* glsl */`
      #include <common>
      #include <logdepthbuf_pars_fragment>

      void main() {

        #include <logdepthbuf_fragment>

        gl_FragColor = vec4(vec3(1,0,1), 1.0);
      }
    `;
 

export class QuadMaterial extends THREE.ShaderMaterial{

    constructor(params){

        super({fragmentShader,vertexShader})

    }

}


export class SphereMaterial extends THREE.ShaderMaterial{

    constructor(params){

        vertexShader = vertexShader.replace('//inject uniforms',`uniform float radius;`)

        vertexShader = vertexShader.replace('//inject',`world = vec4(normalize(world.xyz) * radius, 1.0);`)

        super({fragmentShader,vertexShader,uniforms:{radius:{value:1}}})

    }

}