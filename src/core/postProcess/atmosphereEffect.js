import { Effect, EffectAttribute, WebGLExtension} from "postprocessing";
import {Uniform,HalfFloatType} from "three";



const calculateScatteringBlock = `
vec3 calculate_scattering(
	vec3 start, 				// the start of the ray (the camera position)
    vec3 dir, 					// the direction of the ray (the camera vector)
    float max_dist, 			// the maximum distance the ray can travel (because something is in the way, like an object)
    vec3 scene_color,			// the color of the scene
    vec3 light_dir, 			// the direction of the light
    vec3 light_intensity,		// how bright the light is, affects the brightness of the atmosphere
    vec3 ray_light_color,  //mod
    vec3 mie_light_color,  //mod
    vec3 planet_position, 		// the position of the planet
    float planet_radius, 		// the radius of the planet
    float atmo_radius, 			// the radius of the atmosphere
    vec3 beta_ray, 				// the amount rayleigh scattering scatters the colors (for earth: causes the blue atmosphere)
    vec3 beta_mie, 				// the amount mie scattering scatters colors
    vec3 beta_absorption,   	// how much air is absorbed
    vec3 beta_ambient,			// the amount of scattering that always occurs, cna help make the back side of the atmosphere a bit brighter
    float g, 					// the direction mie scatters the light in (like a cone). closer to -1 means more towards a single direction
    float height_ray, 			// how high do you have to go before there is no rayleigh scattering?
    float height_mie, 			// the same, but for mie
    float height_absorption,	// the height at which the most absorption happens
    float absorption_falloff,	// how fast the absorption falls off from the absorption height
    int steps_i, 				// the amount of steps along the 'primary' ray, more looks better but slower
    int steps_l 				// the amount of steps along the light ray, more looks better but slower
) {
    // add an offset to the camera position, so that the atmosphere is in the correct position
    start -= planet_position;
    // calculate the start and end position of the ray, as a distance along the ray
    // we do this with a ray sphere intersect
    float a = dot(dir, dir);
    float b = 2.0 * dot(dir, start);
    float c = dot(start, start) - (atmo_radius * atmo_radius);
    float d = (b * b) - 4.0 * a * c;
    
    // stop early if there is no intersect
    if (d < 0.0) return scene_color;
    
    // calculate the ray length
    vec2 ray_length = vec2(
        max((-b - sqrt(d)) / (2.0 * a), 0.0),
        min((-b + sqrt(d)) / (2.0 * a), max_dist)
    );
    
    // if the ray did not hit the atmosphere, return a black color
    if (ray_length.x > ray_length.y) return scene_color;
    // prevent the mie glow from appearing if there's an object in front of the camera
    bool allow_mie = max_dist > ray_length.y;
    // make sure the ray is no longer than allowed
    ray_length.y = min(ray_length.y, max_dist);
    ray_length.x = max(ray_length.x, 0.0);
    // get the step size of the ray
    float step_size_i = (ray_length.y - ray_length.x) / float(steps_i);
    
    // next, set how far we are along the ray, so we can calculate the position of the sample
    // if the camera is outside the atmosphere, the ray should start at the edge of the atmosphere
    // if it's inside, it should start at the position of the camera
    // the min statement makes sure of that
    float ray_pos_i = ray_length.x + step_size_i * 0.5;
    
    // these are the values we use to gather all the scattered light
    vec3 total_ray = vec3(0.0); // for rayleigh
    vec3 total_mie = vec3(0.0); // for mie
    
    // initialize the optical depth. This is used to calculate how much air was in the ray
    vec3 opt_i = vec3(0.0);
    
    // also init the scale height, avoids some vec2's later on
    vec2 scale_height = vec2(height_ray, height_mie);
    
    // Calculate the Rayleigh and Mie phases.
    // This is the color that will be scattered for this ray
    // mu, mumu and gg are used quite a lot in the calculation, so to speed it up, precalculate them
    float mu = dot(dir, light_dir);
    float mumu = mu * mu;
    float gg = g * g;
    float phase_ray = 3.0 / (50.2654824574 /* (16 * pi) */) * (1.0 + mumu);
    float phase_mie = allow_mie ? 3.0 / (25.1327412287 /* (8 * pi) */) * ((1.0 - gg) * (mumu + 1.0)) / (pow(1.0 + gg - 2.0 * mu * g, 1.5) * (2.0 + gg)) : 0.0;
    
    // now we need to sample the 'primary' ray. this ray gathers the light that gets scattered onto it
    for (int i = 0; i < steps_i; ++i) {
        
        // calculate where we are along this ray
        vec3 pos_i = start + dir * ray_pos_i;
        
        // and how high we are above the surface
        float height_i = length(pos_i) - planet_radius;
        
        // now calculate the density of the particles (both for rayleigh and mie)
        vec3 density = vec3(exp(-height_i / scale_height), 0.0);
        
        // and the absorption density. this is for ozone, which scales together with the rayleigh, 
        // but absorbs the most at a specific height, so use the sech function for a nice curve falloff for this height
        // clamp it to avoid it going out of bounds. This prevents weird black spheres on the night side
        float denom = (height_absorption - height_i) / absorption_falloff;
        density.z = (1.0 / (denom * denom + 1.0)) * density.x;
        
        // multiply it by the step size here
        // we are going to use the density later on as well
        density *= step_size_i;
        
        // Add these densities to the optical depth, so that we know how many particles are on this ray.
        opt_i += density;
        
        // Calculate the step size of the light ray.
        // again with a ray sphere intersect
        // a, b, c and d are already defined
        a = dot(light_dir, light_dir);
        b = 2.0 * dot(light_dir, pos_i);
        c = dot(pos_i, pos_i) - (atmo_radius * atmo_radius);
        d = (b * b) - 4.0 * a * c;

        // no early stopping, this one should always be inside the atmosphere
        // calculate the ray length
        float step_size_l = (-b + sqrt(d)) / (2.0 * a * float(steps_l));

        // and the position along this ray
        // this time we are sure the ray is in the atmosphere, so set it to 0
        float ray_pos_l = step_size_l * 0.5;

        // and the optical depth of this ray
        vec3 opt_l = vec3(0.0);
            
        // now sample the light ray
        // this is similar to what we did before
        for (int l = 0; l < steps_l; ++l) {

            // calculate where we are along this ray
            vec3 pos_l = pos_i + light_dir * ray_pos_l;

            // the heigth of the position
            float height_l = length(pos_l) - planet_radius;

            // calculate the particle density, and add it
            // this is a bit verbose
            // first, set the density for ray and mie
            vec3 density_l = vec3(exp(-height_l / scale_height), 0.0);
            
            // then, the absorption
            float denom = (height_absorption - height_l) / absorption_falloff;
            density_l.z = (1.0 / (denom * denom + 1.0)) * density_l.x;
            
            // multiply the density by the step size
            density_l *= step_size_l;
            
            // and add it to the total optical depth
            opt_l += density_l;
            
            // and increment where we are along the light ray.
            ray_pos_l += step_size_l;
            
        }
        
        // Now we need to calculate the attenuation
        // this is essentially how much light reaches the current sample point due to scattering
        vec3 attn = exp(-beta_ray * (opt_i.x + opt_l.x) - beta_mie * (opt_i.y + opt_l.y) - beta_absorption * (opt_i.z + opt_l.z));

        // accumulate the scattered light (how much will be scattered towards the camera)
        total_ray += density.x * attn;
        total_mie += density.y * attn;

        // and increment the position on this ray
        ray_pos_i += step_size_i;
    	
    }
    
    // calculate how much light can pass through the atmosphere
    vec3 opacity = exp(-(beta_mie * opt_i.y + beta_ray * opt_i.x + beta_absorption * opt_i.z));
    
	// calculate and return the final color
    return (
        	phase_ray * beta_ray * total_ray * ray_light_color// rayleigh color
       		+ phase_mie * beta_mie * total_mie * mie_light_color// mie
            + opt_i.x * beta_ambient // and ambient
    ) * light_intensity + scene_color * opacity; // now make sure the background is rendered correctly
}
`
const screenToWorldBlock = `
vec3 _ScreenToWorld(vec3 posS) {
  vec2 uv = posS.xy;
  float z = posS.z;
  float nearZ = 0.01;
  float farZ = cameraFar;
  float depth = pow(2.0, z * log2(farZ + 1.0)) - 1.0;
    vec3 direction = (inverseProjection * vec4(vUv * 2.0 - 1.0, 0.0, 1.0)).xyz; //vUv bug
    direction = (inverseView * vec4(direction, 0.0)).xyz;
    direction = normalize(direction);
  direction /= dot(direction, uCameraDir);
  return uCameraPosition + direction * depth;
}

`

const postFragmentShader =
  `
         struct Atmospheres {
                vec3 PLANET_CENTER;
                vec3 lightDir;
                float PLANET_RADIUS;
                float ATMOSPHERE_RADIUS;
                float G;
                int PRIMARY_STEPS;
                int LIGHT_STEPS;
                vec3 ulight_intensity;
                vec3 AMBIENT_BETA;
                vec3 ABSORPTION_BETA;
                float HEIGHT_RAY;
                float HEIGHT_MIE;
                float HEIGHT_ABSORPTION;
                float ABSORPTION_FALLOFF;
                float textureIntensity;
                float AmbientLightIntensity;
                vec3 groundDiffuseColor;
                float groundAlbedoIntensity;
            };

            uniform sampler2D tDiffuse;
            uniform sampler2D tDepth;
 
            uniform mat4 inverseProjection;
            uniform mat4 inverseView;
            uniform vec3 uCameraPosition;
            uniform vec3 uCameraDir;
            uniform Atmospheres atmospheres[1];
 
            
             

            // Wavelengths in micrometers
            const float WAVELENGTH_RED = 0.680; 
            const float WAVELENGTH_GREEN = 0.550;
            const float WAVELENGTH_BLUE = 0.450;

            // Base scattering constants, derived from typical atmospheric values
            const float K_RAYLEIGH = 9.185e-4; 
            const float K_MIE = 1.2789e-2; 

            vec3 calculate_scattering(
                vec3 start,
                vec3 dir,
                float max_dist,
                vec3 scene_color,
                vec3 light_dir,
                vec3 light_intensity,
                vec3 planet_position,
                float planet_radius,
                float atmo_radius,
                vec3 beta_absorption,
                vec3 beta_ambient,
                float g,
                float height_ray,
                float height_mie,
                float height_absorption,
                float absorption_falloff,
                int steps_i,
                int steps_l
            ) {
                start -= planet_position;
                
                float a = dot(dir, dir);
                float b = 2.0 * dot(dir, start);
                float c = dot(start, start) - (atmo_radius * atmo_radius);
                float d = (b * b) - 4.0 * a * c;
                
                if (d < 0.0) return scene_color;
                
                vec2 ray_length = vec2(
                    max((-b - sqrt(d)) / (2.0 * a), 0.0),
                    min((-b + sqrt(d)) / (2.0 * a), max_dist)
                );
                
                if (ray_length.x > ray_length.y) return scene_color;
                
                bool allow_mie = max_dist > ray_length.y;
                ray_length.y = min(ray_length.y, max_dist);
                ray_length.x = max(ray_length.x, 0.0);
                
                float step_size_i = (ray_length.y - ray_length.x) / float(steps_i);
                float ray_pos_i = ray_length.x + step_size_i * 0.5;
                
                vec3 total_ray = vec3(0.0);
                vec3 total_mie = vec3(0.0);
                vec3 opt_i = vec3(0.0);
                
                vec2 scale_height = vec2(height_ray, height_mie);
                
                float mu = dot(dir, light_dir);
                float mumu = mu * mu;
                float gg = g * g;
                float phase_ray = 3.0 / (50.2654824574) * (1.0 + mumu); // ~ (3/16pi) * (1 + cos^2(theta))
                float phase_mie = allow_mie ? 3.0 / (25.1327412287) * ((1.0 - gg) * (mumu + 1.0)) / (pow(1.0 + gg - 2.0 * mu * g, 1.5) * (2.0 + gg)) : 0.0; // ~ (3/8pi) * (1-g^2)*(1+cos^2(theta))/(1+g^2-2gcos(theta))^1.5 (for g != 0)
                
                // Calculate wavelength-dependent beta values
                vec3 beta_ray = vec3(
                    K_RAYLEIGH / pow(WAVELENGTH_RED, 4.0),
                    K_RAYLEIGH / pow(WAVELENGTH_GREEN, 4.0),
                    K_RAYLEIGH / pow(WAVELENGTH_BLUE, 4.0)
                );

                vec3 beta_mie = vec3(
                    K_MIE / pow(WAVELENGTH_RED, 0.84),
                    K_MIE / pow(WAVELENGTH_GREEN, 0.84),
                    K_MIE / pow(WAVELENGTH_BLUE, 0.84)
                );

                for (int i = 0; i < 32; ++i) { // Max 32 steps for primary ray
                    if (i >= steps_i) break;
                    
                    vec3 pos_i = start + dir * ray_pos_i;
                    float height_i = length(pos_i) - planet_radius;
                    
                    vec3 density = vec3(exp(-height_i / scale_height), 0.0);
                    
                    float denom = (height_absorption - height_i) / absorption_falloff;
                    density.z = (1.0 / (denom * denom + 1.0)) * density.x; // Absorption density
                    density *= step_size_i;
                    
                    opt_i += density; // Optical depth along primary ray
                    
                    a = dot(light_dir, light_dir);
                    b = 2.0 * dot(light_dir, pos_i);
                    c = dot(pos_i, pos_i) - (atmo_radius * atmo_radius);
                    d = (b * b) - 4.0 * a * c;

                    // Calculate light ray segment length within atmosphere
                    float step_size_l = (-b + sqrt(d)) / (2.0 * a * float(steps_l));
                    float ray_pos_l = step_size_l * 0.5;
                    vec3 opt_l = vec3(0.0); // Optical depth along light ray
                        
                    for (int l = 0; l < 16; ++l) { // Max 16 steps for light ray
                        if (l >= steps_l) break;
                        
                        vec3 pos_l = pos_i + light_dir * ray_pos_l;
                        float height_l = length(pos_l) - planet_radius;
                        
                        vec3 density_l = vec3(exp(-height_l / scale_height), 0.0);
                        float denom_l = (height_absorption - height_l) / absorption_falloff;
                        density_l.z = (1.0 / (denom_l * denom_l + 1.0)) * density_l.x;
                        density_l *= step_size_l;
                        opt_l += density_l;
                        ray_pos_l += step_size_l;
                    }
                    
                    // Attenuation from light source to current point
                    vec3 attn = exp(-beta_ray * (opt_i.x + opt_l.x) - beta_mie * (opt_i.y + opt_l.y) - beta_absorption * (opt_i.z + opt_l.z));
                    total_ray += density.x * attn;
                    total_mie += density.y * attn;
                    ray_pos_i += step_size_i;
                }
                
                // Overall opacity from camera to scene intersection
                vec3 opacity = exp(-(beta_mie * opt_i.y + beta_ray * opt_i.x + beta_absorption * opt_i.z));
                
                return (
                    phase_ray * beta_ray * total_ray // Rayleigh scattering
                    + phase_mie * beta_mie * total_mie // Mie scattering
                    + opt_i.x * beta_ambient // Ambient light (simple falloff)
                ) * light_intensity + scene_color * opacity; // Combine with scene color
            }

 vec3 _ScreenToWorld(vec3 posS) {
  vec2 uv = posS.xy;
  float z = posS.z;
  float nearZ = 0.01;
  float farZ = cameraFar;
  float depth = pow(2.0, z * log2(farZ + 1.0)) - 1.0;
    vec3 direction = (inverseProjection * vec4(vUv * 2.0 - 1.0, 0.0, 1.0)).xyz; //vUv bug
    direction = (inverseView * vec4(direction, 0.0)).xyz;
    direction = normalize(direction);
  direction /= dot(direction, uCameraDir);
  return uCameraPosition + direction * depth;
}

  void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {

    float d           = texture2D(depthBuffer, uv).x;
    vec3 posWS        = _ScreenToWorld(vec3(uv, d));
    vec3 rayOrigin    = uCameraPosition;
    vec3 rayDirection = normalize(posWS - uCameraPosition);
    float sceneDepth  = length(posWS.xyz - uCameraPosition);
    vec3 addColor     = inputColor.xyz;
    vec3 col          = vec3(0.0);


    Atmospheres currentAtmospheres = atmospheres[0];
    vec3 lightDirection = normalize(currentAtmospheres.lightDir);

    addColor *= currentAtmospheres.textureIntensity;

     col = calculate_scattering(
        rayOrigin,
        rayDirection,
        sceneDepth,
        addColor.rgb,
        lightDirection,
        currentAtmospheres.ulight_intensity,
        currentAtmospheres.PLANET_CENTER,
        currentAtmospheres.PLANET_RADIUS,
        currentAtmospheres.ATMOSPHERE_RADIUS,
        currentAtmospheres.ABSORPTION_BETA,
        currentAtmospheres.AMBIENT_BETA,
        currentAtmospheres.G,
        currentAtmospheres.HEIGHT_RAY,
        currentAtmospheres.HEIGHT_MIE,
        currentAtmospheres.HEIGHT_ABSORPTION,
        currentAtmospheres.ABSORPTION_FALLOFF,
        currentAtmospheres.PRIMARY_STEPS,
        currentAtmospheres.LIGHT_STEPS
    );

    col = 1.0 - exp(-col);

    outputColor = vec4(col, 1.0);
  }
`;

export class AtmosphereEffect{
    constructor() { 
      this.cameraDir = new THREE.Vector3();
    }
  
    createcomposer(params,camera_){
         class _AtmosphereEffect extends Effect {
          constructor() {
            camera_.getWorldDirection(cameraDir);
            super("AtmosphereEffect", postFragmentShader, {
              uniforms: new Map([
                ["atmospheres",       new Uniform(params)],
                ["uCameraPosition",   new Uniform(camera_.position)],
                ["inverseProjection", new Uniform(camera_.projectionMatrixInverse)],
                ["inverseView",       new Uniform(camera_.matrixWorld)],
                ["uCameraDir",        new Uniform(cameraDir)],
              ]),
              attributes: EffectAttribute.DEPTH,
              extensions: new Set([WebGLExtension.DERIVATIVES]),
            });
          }
        }
         
        this.effect = new _AtmosphereEffect();
      }
      
      run(camera_) {
        camera_.getWorldDirection(this.cameraDir);
        this.effect.uniforms.get('uCameraPosition')  .value = camera_.position
        this.effect.uniforms.get('inverseProjection').value = camera_.projectionMatrixInverse
        this.effect.uniforms.get('inverseView')      .value = camera_.matrixWorld
        this.effect.uniforms.get('uCameraDir')       .value = cameraDir
      };

}