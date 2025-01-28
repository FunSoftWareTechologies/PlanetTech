// @vitest-environment jsdom

import * as THREE from 'three';
import { Primitive } from '../src/engine/primitives.js';
import { Controller, QuadTree  } from '../src/engine/dataStructures/quadtree.js';
import { expect, test, describe, vi, beforeEach } from 'vitest'

//vi.mock('../src/engine/quadtree.js'); 
//vi.mock('../src/engine/geometry.js');

describe('Quad Class', () => {
  let primitive;

  beforeEach(() => {
    primitive = new Primitive({
      size: 10,
      resolution: 4,
      dimension: 2,
    });
  });

  test('should initialize with correct parameters', () => {
    expect(primitive.parameters).toEqual({
      size: 10,
      resolution: 4,
      dimension: 2,
      depth:0
    });
    expect(primitive.quadTreeCollections) .toBeInstanceOf(Map);
    expect(primitive.controller ) .toBeDefined();
    expect(primitive.controller ) .toBeInstanceOf(Controller);
  });

  test('should configure QuadTree with createQuadTree', () => {
    primitive.createQuadTree({ levels: 3 });
    expect(primitive.controller.config.maxLevelSize).toBe(10);
    expect(primitive.controller.config.minLevelSize).toBe(2.5);
    expect(primitive.controller.config.minPolyCount).toBe(4);
    expect(primitive.controller.config.dimensions)  .toBe(2);
   });
  
  test('should create dimensions and call the callback correctly', () => {
    let offset = [[-5,5,10],[-5,-5,10],[5,5,10],[5,-5,10]]
    primitive.createQuadTree({ levels: 3 });
    primitive.createDimensions();
    expect(primitive.quadTreeCollections.size).toEqual(4);
    Object.values(primitive.quadTreeCollections).forEach((instance, index) => {
       expect(instance.params.metaData.index).toBe(index);
       expect(instance.params.metaData.direction).toBe('+z');
       expect(instance.params.metaData.offset).toStrictEqual(offset[index]);
    })
  })
    /*it('should create a plane with the correct properties', () => {
    const mockMaterial = new THREE.MeshBasicMaterial();
    const plane = quad.createPlane({
      material: mockMaterial,
      size: 10,
      resolution: 4,
      matrix: new THREE.Matrix4(),
      offset: [0, 0, 0],
    });

    expect(plane).toBeInstanceOf(THREE.Mesh);
    expect(plane.geometry.parameters).toMatchObject({
      width: 10,
      height: 10,
      widthSegments: 4,
      heightSegments: 4,
    });
    expect(plane.material).toBe(mockMaterial);
  });

  it('should configure QuadTree with createQuadTree', () => {
    quad.createQuadTree({ levels: 3 });

    expect(quad.quadTreeController.config.maxLevelSize).toBe(10);
    expect(quad.quadTreeController.config.minLevelSize).toBe(10 / 4);
    expect(quad.quadTreeController.config.minPolyCount).toBe(4);
    expect(quad.quadTreeController.config.dimensions).toBe(2);
  });

  it('should create a new quad with correct properties', () => {
    const mockShardedData = {
      parameters: { width: 5, widthSegments: 4 },
    };

    const quadInstance = quad.createNewQuad({
      shardedData: mockShardedData,
      matrix: new THREE.Matrix4(),
      offset: [1, 2, 3],
    });

    expect(quadInstance.plane).toBeInstanceOf(THREE.Mesh);
    expect(quadInstance.plane.geometry.parameters).toMatchObject({
      width: 5,
      height: 5,
      widthSegments: 4,
      heightSegments: 4,
    });
  });

  it('should create dimensions and call the callback correctly', () => {
    const mockCallback = jest.fn();
    quad.createDimensions(mockCallback);

    expect(mockCallback).toHaveBeenCalled();
    expect(quad.instances.length).toBeGreaterThan(0);

    quad.instances.forEach((instance, index) => {
      expect(instance.metaData.index).toBe(index);
      expect(instance.metaData.direction).toBe('+z');
    });
  });*/
});
