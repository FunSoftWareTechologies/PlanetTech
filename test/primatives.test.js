import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { Primitive } from '../src/engine/primitives';
import { Infrastructure } from '../src/engine/system/infrastructure';

let primitive;

beforeEach(() => {
  primitive = new Primitive({
    size: 100,
    dimension: 2,
    resolution: 10,
  });
  primitive.createQuadTree({ levels: 4 });
});

describe('Primitive Class', () => {
  it('should initialize with correct parameters', () => {
    expect(primitive.parameters.size).toBe(100);
    expect(primitive.parameters.dimension).toBe(2);
    expect(primitive.parameters.resolution).toBe(10);
    expect(primitive.quadTreeCollections.size).toBe(0);
  });

  it('should create a quadtree with specified levels', () => {
    

    const config = primitive.infrastructure.config;
    expect(config.maxLevelSize).toBe(100);
    expect(config.minLevelSize).toBe(12.5); // 100 / 2^3
    expect(config.levels.numOflvls).toBe(4);
    expect(config.levels.levelsArray.length).toBe(4);
  });

  /*it('should create a plane mesh with correct attributes', async () => {

    const mockMeshNode = {
      params: {
        size: 50,
        resolution: 10,
        direction: new THREE.Vector3(1, 0, 0),
        matrixRotationData: new THREE.Matrix4(),
        offset: [0, 0, 0],
      },
      position: new THREE.Vector3(0, 0, 0),
    };
 
    const plane = await primitive.createPlane({ meshNode: mockMeshNode });

    expect(plane.geometry.attributes.position.count).toBeGreaterThan(0);
    expect(plane.material).toBeInstanceOf(THREE.MeshStandardMaterial);
  });*/

  it('should add nodes to the quadTreeCollections', () => {
    const mockNode = { id: 1 };
    primitive.addNode('testBounds', mockNode);

    expect(primitive.quadTreeCollections.size).toBe(1);
    expect(primitive.quadTreeCollections.get('testBounds')).toBe(mockNode);
  });

  it('should update the quadtree with a 3D object', () => {
    const mockObject3D = new THREE.Object3D();
    primitive.createQuadTree({ levels: 4 });

    // Mock update logic for quadtree
    primitive.quadTree = {
      update: (object, primitiveInstance) => {
        expect(object).toBe(mockObject3D);
        expect(primitiveInstance).toBe(primitive);
      },
    };

    primitive.update(mockObject3D);
  });
});

describe('Infrastructure Integration', () => {
  it('should create levels with appropriate configurations', () => {
    const architecture = new Infrastructure({
      maxLevelSize: 100,
      minLevelSize: 25,
      dimensions: 2,
      minPolyCount: 10,
    });

    architecture.levels(3);

    expect(architecture.config.levels.numOflvls).toBe(3);
    expect(architecture.config.levels.levelsArray).toEqual([100, 50, 25]);
  });
});
