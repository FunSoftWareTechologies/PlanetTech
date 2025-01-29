import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { QuadGeometry, NormalizedQuadGeometry } from '../src/engine/geometry';

describe('QuadGeometry Class', () => {
  it('should initialize with correct parameters', () => {
    const geometry = new QuadGeometry(100, 100, 10, 10);

    expect(geometry.parameters.width).toBe(100);
    expect(geometry.parameters.height).toBe(100);
    expect(geometry.parameters.widthSegments).toBe(10);
    expect(geometry.parameters.heightSegments).toBe(10);
    expect(geometry.type).toBe('QuadGeometry');
  });

  it('should build geometry with correct attributes', () => {
    const geometry = new QuadGeometry(100, 100, 10, 10);
    geometry._setMatrix({ matrix: new THREE.Matrix4() });
    geometry._setOffset({ offset: [0, 0, 0] });
    geometry._build();

    expect(geometry.attributes.position.count).toBeGreaterThan(0);
    expect(geometry.index.count).toBeGreaterThan(0);
    expect(geometry.attributes.uv.count).toBeGreaterThan(0);
  });

  it('should handle threading build correctly', () => {
    const geometry = new QuadGeometry(100, 100, 10, 10);
    const buffers = {
      positionBuffer: new Float32Array((10 + 1) * (10 + 1) * 3),
      normalBuffer: new Float32Array((10 + 1) * (10 + 1) * 3),
      uvBuffer: new Float32Array((10 + 1) * (10 + 1) * 2),
      indexBuffer: new Uint32Array(10 * 10 * 6),
    };

    geometry._setMatrix({ matrix: new THREE.Matrix4() });
    geometry._setOffset({ offset: [0, 0, 0] });
    geometry._threadingBuild(buffers);

    expect(buffers.positionBuffer.length).toBeGreaterThan(0);
    expect(buffers.indexBuffer.length).toBeGreaterThan(0);
  });

  it('should reset geometry correctly', () => {
    const geometry = new QuadGeometry(100, 100, 10, 10);
    geometry._setMatrix({ matrix: new THREE.Matrix4() });
    geometry._build();

    const centerPosition = new THREE.Vector3();
    geometry._restGeometry(centerPosition);

    expect(centerPosition.length()).toBeCloseTo(0, 5);
  });

  it('should copy the geometry correctly', () => {
    const geometry = new QuadGeometry(100, 100, 10, 10);
    const copy = geometry.copy(geometry);

    expect(copy.parameters).toEqual(geometry.parameters);
    expect(copy.type).toBe('QuadGeometry');
  });

  it('should serialize and deserialize geometry correctly', () => {
    const geometry = new QuadGeometry(100, 100, 10, 10);
    const json = geometry.toJSON();
    const deserialized = QuadGeometry.fromJSON(json);

    expect(deserialized.parameters.width).toBe(100);
    expect(deserialized.parameters.height).toBe(100);
  });
});

describe('NormalizedQuadGeometry Class', () => {
  it('should initialize with correct parameters', () => {
    const geometry = new NormalizedQuadGeometry(100, 100, 10, 10, 50);

    expect(geometry.parameters.width).toBe(100);
    expect(geometry.parameters.height).toBe(100);
    expect(geometry.parameters.widthSegments).toBe(10);
    expect(geometry.parameters.heightSegments).toBe(10);
    expect(geometry.parameters.radius).toBe(50);
    expect(geometry.type).toBe('NormalizedQuadGeometry');
  });

  it('should build geometry with normalized attributes', () => {
    const geometry = new NormalizedQuadGeometry(100, 100, 10, 10, 50);
    geometry._setMatrix({ matrix: new THREE.Matrix4() });
    geometry._setOffset({ offset: [0, 0, 0] });
    geometry._build();

    expect(geometry.attributes.position.count).toBeGreaterThan(0);
    expect(geometry.index.count).toBeGreaterThan(0);
    expect(geometry.attributes.normal.count).toBeGreaterThan(0);
  });

  it('should handle threading build with normalized geometry', () => {
    const geometry = new NormalizedQuadGeometry(100, 100, 10, 10, 50);
    const buffers = {
      positionBuffer: new Float32Array((10 + 1) * (10 + 1) * 3),
      normalBuffer: new Float32Array((10 + 1) * (10 + 1) * 3),
      uvBuffer: new Float32Array((10 + 1) * (10 + 1) * 2),
      indexBuffer: new Uint32Array(10 * 10 * 6),
    };

    geometry._setMatrix({ matrix: new THREE.Matrix4() });
    geometry._setOffset({ offset: [0, 0, 0] });
    geometry._threadingBuild(buffers);

    expect(buffers.positionBuffer.length).toBeGreaterThan(0);
    expect(buffers.normalBuffer.length).toBeGreaterThan(0);
  });

  it('should reset normalized geometry correctly', () => {
    const geometry = new NormalizedQuadGeometry(100, 100, 10, 10, 50);
    geometry._setMatrix({ matrix: new THREE.Matrix4() });
    geometry._build();

    const centerPosition = new THREE.Vector3();
    geometry._restGeometry(centerPosition);

    expect(centerPosition.length()).toBeCloseTo(0, 5);
  });

  it('should copy the normalized geometry correctly', () => {
    const geometry = new NormalizedQuadGeometry(100, 100, 10, 10, 50);
    const copy = geometry.copy(geometry);

    expect(copy.parameters).toEqual(geometry.parameters);
    expect(copy.type).toBe('NormalizedQuadGeometry');
  });

  it('should serialize and deserialize normalized geometry correctly', () => {
    const geometry = new NormalizedQuadGeometry(100, 100, 10, 10, 50);
    const json = geometry.toJSON();
    const deserialized = NormalizedQuadGeometry.fromJSON(json);

    expect(deserialized.parameters.width).toBe(100);
    expect(deserialized.parameters.height).toBe(100);
    expect(deserialized.parameters.radius).toBe(50);
  });
});
