import * as NODE from 'three/nodes';



const permute = NODE.glslFn(
    `
    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
    `)

const taylorInvSqrt = NODE.glslFn(
    `
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
    `)

const orthogonal = NODE.glslFn(`
    vec3 orthogonal(vec3 v) {
      return normalize(abs(v.x) > abs(v.z) ? vec3(-v.y, v.x, 0.0)
      : vec3(0.0, -v.z, v.y));
    }
    `)   

export const snoise3D = NODE.glslFn(
    `
      float snoise3D(vec3 v){ 
        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
      
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 =   v - i + dot(i, C.xxx) ;
      
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );
      
        vec3 x1 = x0 - i1 + 1.0 * C.xxx;
        vec3 x2 = x0 - i2 + 2.0 * C.xxx;
        vec3 x3 = x0 - 1. + 3.0 * C.xxx;
      
        i = mod(i, 289.0 ); 
        vec4 p = permute( permute( permute( 
                   i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                 + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                 + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
      
        float n_ = 1.0/7.0; 
        vec3  ns = n_ * D.wyz - D.xzx;
      
        vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  
      
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ ); 
      
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
      
        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );
      
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
      
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
      
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
      
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
      
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                      dot(p2,x2), dot(p3,x3) ) );
      }
      `,[permute,taylorInvSqrt]
  )
  
export const  fbmNoise = NODE.glslFn(`
float fbm(vec3 v_, float seed_, float scale_,float persistance_,float lacunarity_,float redistribution_,int octaves_, int iteration_,bool terbulance_, bool ridge_  ) {
  vec3 v = v_; 
  v += (seed_ * 100.0);
  float persistance = persistance_;
  float lacunarity = lacunarity_;
  float redistribution = redistribution_;
  int octaves = octaves_;
  bool terbulance = terbulance_;
  bool ridge = terbulance_ && ridge_;

  float result = 0.0;
  float amplitude = 1.0;
  float frequency = 1.0;
  float maximum = amplitude;

  for (int i = 0; i < iteration_; i++) {
    if (i >= octaves)
      break;

    vec3 p = v * frequency * scale_;

    float noiseVal = snoise3D(p);

    if (terbulance)
      noiseVal = abs(noiseVal);

    if (ridge)
      noiseVal = -1.0 * noiseVal;

    result += noiseVal * amplitude;

    frequency *= lacunarity;
    amplitude *= persistance;
    maximum += amplitude;
  }

  float redistributed = pow(result, redistribution);
  return redistributed / maximum;
}
`,[snoise3D])


export  const  displacementNormalNoiseFBM = NODE.glslFn(`
  
  vec3 displacementNormalNoiseFBM(
    vec3 wp, vec3 vn, 
    float seed0, float scale0, float postionScale0, float persistance0 ,float lacunarity0,float redistribution0, int octaves0, int iteration0,bool terbulance0, bool ridge0,
    float seed1, float scale1, float postionScale1, float persistance1 ,float lacunarity1,float redistribution1, int octaves1, int iteration1,bool terbulance1, bool ridge1, 
    float seed2, float scale2, float postionScale2, float persistance2 ,float lacunarity2,float redistribution2, int octaves2, int iteration2,bool terbulance2, bool ridge2
    ){
    
    vec3 displacedPosition = wp + vn * fbm(wp*postionScale0,  seed0,  scale0, persistance0 , lacunarity0, redistribution0,  octaves0,  iteration0, terbulance0,  ridge0);
    float offset = float(${100 / 550});
    vec3 tangent = orthogonal(vn);
    vec3 bitangent = normalize(cross(vn, tangent));
    vec3 neighbour1 = wp + tangent * offset;
    vec3 neighbour2 = wp + bitangent * offset;
    vec3 displacedNeighbour1 = neighbour1 + vn * fbm(neighbour1*postionScale1, seed1,  scale1, persistance1 , lacunarity1, redistribution1,  octaves1,  iteration1, terbulance1,  ridge1 );
    vec3 displacedNeighbour2 = neighbour2 + vn * fbm(neighbour2*postionScale2, seed2,  scale2, persistance2 , lacunarity2, redistribution2,  octaves2,  iteration2, terbulance2,  ridge2 );
    vec3 displacedTangent = displacedNeighbour1 - displacedPosition;
    vec3 displacedBitangent = displacedNeighbour2 - displacedPosition;
    vec3 displacedNormal = normalize(cross(displacedTangent, displacedBitangent));
    return displacedNormal;
  }

  `,[orthogonal,fbmNoise])


export  const  patternNoise = NODE.glslFn(`
  float pattern(vec3 p, float seed, float scale, float persistance ,float lacunarity,float redistribution, int octaves, int iteration,bool terbulance, bool ridge)
  {
      vec3 q = vec3(fbm(p + vec3(8.0, 3.0, 4.0), seed,  scale, persistance, lacunarity, redistribution,  octaves,  iteration, terbulance,  ridge),
                    fbm(p + vec3(5.2, 1.3, 0.0), seed,  scale, persistance, lacunarity, redistribution,  octaves,  iteration, terbulance,  ridge),
                    fbm(p + vec3(1.7, 9.2, 0.0), seed,  scale, persistance, lacunarity, redistribution,  octaves,  iteration, terbulance,  ridge));
      

      return        fbm(p + 4.0 * q, seed,  scale, persistance, lacunarity, redistribution,  octaves,  iteration, terbulance,  ridge);
  }

  `,[fbmNoise])

export  const  patternNormal = NODE.glslFn(`
  vec3 patternNormal(
    vec3 wp, vec3 vn, 
    float seed0, float scale0, float postionScale0, float persistance0 ,float lacunarity0,float redistribution0, int octaves0, int iteration0,bool terbulance0, bool ridge0,
    float seed1, float scale1, float postionScale1, float persistance1 ,float lacunarity1,float redistribution1, int octaves1, int iteration1,bool terbulance1, bool ridge1, 
    float seed2, float scale2, float postionScale2, float persistance2 ,float lacunarity2,float redistribution2, int octaves2, int iteration2,bool terbulance2, bool ridge2
    ){
    vec3 displacedPosition = wp + vn * pattern(wp*postionScale0,  seed0,  scale0, persistance0 , lacunarity0, redistribution0,  octaves0,  iteration0, terbulance0,  ridge0);
    float offset = float(${100 / 550});
    vec3 tangent = orthogonal(vn);
    vec3 bitangent = normalize(cross(vn, tangent));
    vec3 neighbour1 = wp + tangent * offset;
    vec3 neighbour2 = wp + bitangent * offset;
    vec3 displacedNeighbour1 = neighbour1 + vn * pattern(neighbour1*postionScale1, seed1,  scale1, persistance1 , lacunarity1, redistribution1,  octaves1,  iteration1, terbulance1,  ridge1 );
    vec3 displacedNeighbour2 = neighbour2 + vn * pattern(neighbour2*postionScale2, seed2,  scale2, persistance2 , lacunarity2, redistribution2,  octaves2,  iteration2, terbulance2,  ridge2 );
    vec3 displacedTangent = displacedNeighbour1 - displacedPosition;
    vec3 displacedBitangent = displacedNeighbour2 - displacedPosition;
    vec3 displacedNormal = normalize(cross(displacedTangent, displacedBitangent));
    return displacedNormal;
  }

  `,[orthogonal,patternNoise])

export  const  light = NODE.glslFn(`
    vec3 light(vec3 displacedNormal,vec3 ld){
        float  lightAmbient  = 0.65;
        float  lightDiffuse  = 0.9;
        vec3  n = displacedNormal;
        n.r *= 0.1;
        n.g *= 0.1;
        n.b *= 0.5;
        vec3  lightDir  = vec3(0.,1.,1.);
        vec3  nn = normalize(n);
        float  diffuse  = max(dot(nn, lightDir), 0.0);
        float grey   = 0.5 * n.r + 0.8 * n.g + 0.05 * n.b;
        float coloru = (lightAmbient + lightDiffuse * diffuse) * grey ;
        return vec3(coloru,coloru,coloru);
    }
  
    `)


export const computeNormal = NODE.glslFn( `
vec3 computeNormal(vec2 uv, sampler2D textureMap ) {
  float texelSize = 1.0 / float(textureSize(textureMap, 0).x);
  float hL = texture2D(textureMap, uv + vec2(-texelSize, 0)).r;
  float hR = texture2D(textureMap, uv + vec2(texelSize, 0)).r;
  float hU = texture2D(textureMap, uv + vec2(0, -texelSize)).r;
  float hD = texture2D(textureMap, uv + vec2(0, texelSize)).r;
  vec3 outNormal = vec3(hL - hR, hD - hU, 2.0 * texelSize);
  return normalize(outNormal);
}
`,[]);




export const displacemntTexture = (texture_,newUV) =>{

  function displace(vUv) {
    return NODE.texture(texture_, vUv)
  }

  var texelSize = 1.0 / 500.0; // temporarily hardcoding texture resolution
  var offset = 0.1;

 var normal  =  NODE.normalLocal
 var position=  NODE.positionWorld

  var displacedPosition = position.add(normal).mul(displace(newUV));
  var tangent = orthogonal.call({v:normal});
  var bitangent = (NODE.cross(normal, tangent)).normalize();
  var neighbour1 = tangent.mul(offset).add(position);
  var neighbour2 = bitangent.mul(offset).add(position);

  var neighbour1uv = newUV.add(NODE.vec2(-texelSize, 0));
  var neighbour2uv   = newUV.add(NODE.vec2(0, -texelSize));
  var displacedNeighbour1 =  normal.mul(displace(neighbour1uv)).add(neighbour1);
  var displacedNeighbour2 =  normal.mul(displace(neighbour2uv)).add(neighbour2);

  var displacedTangent = displacedNeighbour1.sub(displacedPosition);
  var displacedBitangent = displacedNeighbour2.sub(displacedPosition);

  var displacedNormal = (NODE.cross(displacedTangent, displacedBitangent)).normalize();

return displacedNormal
}



export const displacemntNormalV2 = (texture_,newUV) =>{
  var scale    = 0.9;   // Adjust this to control the amount of displacement
  var epsilon  = 0.01;  // Small value for calculating gradients
  var strength = 1.0;                   
  var center = NODE.texture(texture_,newUV).r; // Sample displacement map
  var dx = NODE.texture(texture_, newUV.add(NODE.vec2(epsilon, 0.0))).r .sub(center);  // Calculate gradients in the X  directions
  var dy = NODE.texture(texture_, newUV.add(NODE.vec2(0.0, epsilon))).r .sub(center);  // Calculate gradients in the Y directions
  var normalMap = NODE.vec3(dx.mul(scale), dy.mul(scale), 1.0).normalize();               // Calculate the normal vector
  normalMap = normalMap.mul(strength);                                                       // Apply strength to the normal vector
  return NODE.vec4(normalMap.mul(.5).add(.5), 1.0);                                     // Output the resulting normal as a color
}


export const displacemntNormalV3 = (texture_,newUV) =>{
  var scale    = 2.9;   // Adjust this to control the amount of displacement
  var strength = 2.; 
  var displacementMap = texture_ 
  var vUv = newUV                   
                  
  var center = NODE.texture(displacementMap, vUv).r; // Sample displacement map
  var dx = NODE.texture(displacementMap, vUv.add(NODE.dFdx(vUv))).r.sub(center);  // Calculate gradients in the X  directions
  var dy = NODE.texture(displacementMap, vUv.add(NODE.dFdy(vUv))).r.sub(center);  // Calculate gradients in the Y directions
  var normalMap = NODE.vec3(dx.mul(scale), dy.mul(scale), 1.0).normalize(); 
  normalMap = normalMap.mul(strength);                                                       // Apply strength to the normal vector
  return NODE.vec4(normalMap.mul(.5).add(.5), 1.0);  }