// @vitest-environment jsdom

import { QuadGeometry, NormalizedQuadGeometry } from "../src/engine/geometry.js"
import { expect, test,describe } from 'vitest'
import * as THREE from 'three';


describe('QuadGeometry', () => {

    test('should initialize with default parameters', () => {
        const quad = new QuadGeometry();
        expect(quad.parameters).toEqual({
            width: 1,
            height: 1,
            widthSegments: 1,
            heightSegments: 1,
        });
    });

    test('should correctly generate vertices and attributes', () => {
        const quad = new QuadGeometry(2, 2, 1, 1);
        quad._setMatrix({matrix: new THREE.Matrix4()})
        quad._setOffset({offset:[0,0,0]})
        quad._build();

        // Check positions
        const positions = quad.getAttribute('position').array;
        expect(positions).toEqual(new Float32Array([
            -1,  1, 0,
             1,  1, 0,
            -1, -1, 0,
             1, -1, 0,
        ]));

        // Check normals
        const normals = quad.getAttribute('normal').array;
        expect(normals).toEqual(new Float32Array([
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
        ]));

        // Check UVs
        const uvs = quad.getAttribute('uv').array;
        expect(uvs).toEqual(new Float32Array([
            0, 1,
            1, 1,
            0, 0,
            1, 0,
        ]));

        // Check indices
        const indices = quad.getIndex().array;
        expect(indices).toEqual(new Uint16Array([
            0, 2, 1,
            2, 3, 1,
        ]));
    });


    test('should apply matrix transformations to vertices', () => {
        const quad = new QuadGeometry(2, 2, 1, 1);
        quad._setMatrix({ matrix: new THREE.Matrix4().makeRotationZ(Math.PI / 2) });
        quad._setOffset({offset:[0,0,0]})
        quad._build();

        const positions = quad.getAttribute('position').array;

        // Rotated vertices around Z-axis 90 degrees
        expect(positions).toEqual(new Float32Array([
            -1, -1, 0,
            -1,  1, 0,
             1, -1, 0,
             1,  1, 0,
        ]));
    });

    test('should apply offset to vertices', () => {
        const quad = new QuadGeometry(2, 2, 1, 1);
        quad._setMatrix({matrix: new THREE.Matrix4()})
        quad._setOffset({ offset: [1, 1, 0] });
        quad._build();

        const positions = quad.getAttribute('position').array;

        // Vertices with offset [1, 1, 0]
        expect(positions).toEqual(new Float32Array([
             0,  2, 0,
             2,  2, 0,
             0,  0, 0,
             2,  0, 0,
        ]));
    });

    test('should copy geometry parameters', () => {
        const quad1 = new QuadGeometry(2, 2, 2, 2);
        const quad2 = new QuadGeometry().copy(quad1);

        expect(quad2.parameters).toEqual(quad1.parameters);
    });

    test('should create geometry from JSON', () => {
        const data = {
            width: 3,
            height: 3,
            widthSegments: 2,
            heightSegments: 2,
        };

        const quad = QuadGeometry.fromJSON(data);
        expect(quad.parameters).toEqual(data);
    });


});



describe('NormalizedQuadGeometry', () => {

    test('should initialize with default parameters', () => {
        const quad = new NormalizedQuadGeometry();
        expect(quad.parameters).toEqual({
            width: 1,
            height: 1,
            widthSegments: 1,
            heightSegments: 1,
            radius: 1
        });
    });

    test('should correctly generate vertices and attributes', () => {
        const quad = new NormalizedQuadGeometry(4, 4, 1, 1, 2);
        quad._setMatrix({matrix: new THREE.Matrix4()})
        quad._setOffset({offset:[0,0,0]})
        quad._build();

        // Check positions
        const positions = quad.getAttribute('position').array;
        expect(positions).toEqual(new Float32Array([
            -2.1213202476501465,  2.1213202476501465, 0,
            2.1213202476501465,  2.1213202476501465, 0,
            -2.1213202476501465, -2.1213202476501465, 0,
            2.1213202476501465, -2.1213202476501465, 0,
        ]));

        // Check normals
        const normals = quad.getAttribute('normal').array;
        expect(normals).toEqual(new Float32Array([
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
        ]));

        // Check UVs
        const uvs = quad.getAttribute('uv').array;
        expect(uvs).toEqual(new Float32Array([
            0, 1,
            1, 1,
            0, 0,
            1, 0,
        ]));

        // Check indices
        const indices = quad.getIndex().array;
        expect(indices).toEqual(new Uint16Array([
            0, 2, 1,
            2, 3, 1,
        ]));
    });


    test('should apply matrix transformations to vertices', () => {
        const quad = new NormalizedQuadGeometry(4, 4, 1, 1, 2);
        quad._setMatrix({ matrix: new THREE.Matrix4().makeRotationZ(Math.PI / 2) });
        quad._setOffset({offset:[0,0,0]})
        quad._build();

        const positions = quad.getAttribute('position').array;

        // Rotated vertices around Z-axis 90 degrees
        expect(positions).toEqual(new Float32Array([
            -2.1213202476501465, -2.1213202476501465, 0,
            -2.1213202476501465,  2.1213202476501465, 0,
            2.1213202476501465, -2.1213202476501465, 0,
             2.1213202476501465,  2.1213202476501465, 0,
        ]));
    });

    test('should apply offset to vertices', () => {
        const quad = new NormalizedQuadGeometry(4, 4, 1, 1, 2);
        quad._setMatrix({matrix: new THREE.Matrix4()})
        quad._setOffset({ offset: [1, 1, 0] });
        quad._build();

        const positions = quad.getAttribute('position').array;

        // Vertices with offset [1, 1, 0]
        expect(positions).toEqual(new Float32Array([
            -0.9486833214759827,  2.8460497856140137, 0,
            2.1213202476501465,  2.1213202476501465, 0,
            -2.1213202476501465,  -2.1213202476501465, 0,
            2.8460497856140137,  -0.9486833214759827, 0,
        ]));
    });

    test('should copy geometry parameters', () => {
        const quad1 = new NormalizedQuadGeometry(4, 4, 1, 1, 2);
        const quad2 = new NormalizedQuadGeometry().copy(quad1);

        expect(quad2.parameters).toEqual(quad1.parameters);
    });

    test('should create geometry from JSON', () => {
        const data = {
            width: 3,
            height: 3,
            widthSegments: 2,
            heightSegments: 2,
            radius: 2,
        };

        const quad = NormalizedQuadGeometry.fromJSON(data);
        expect(quad.parameters).toEqual(data);
    });


});