/* Copyright 2021 The TensorFlow Authors. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/
import {buildEmbeddingDataSet, projectUmap} from './umap';
import {createSampleEmbeddingListing} from '../testing';

describe('umap utils', () => {
  it('builds embedding dataset', () => {
    const embeddingListing = createSampleEmbeddingListing();
    const embeddingDataSet = buildEmbeddingDataSet(embeddingListing);
    expect(embeddingDataSet.points).toEqual(embeddingListing);
    expect(embeddingDataSet.pointKeys).toEqual(Object.keys(embeddingListing));
    expect(embeddingDataSet.shuffledDataIndices.length).toBe(
      Object.keys(embeddingListing).length
    );
    expect(embeddingDataSet.projections).toEqual({});
    expect(embeddingDataSet.hasUmapRun).toBeFalse();
    expect(embeddingDataSet.umapRun).toBe(0);
  });

  it('projects embedding dataset', (done) => {
    const embeddingDataSet = buildEmbeddingDataSet({
      annotation_1: {
        vector: [0.5, 0.6, 0.1],
        name: 'annotation_1',
        index: 0,
        projections: {},
      },
      annotation_2: {
        vector: [-0.2, 0.3, 0.5],
        name: 'annotation_2',
        index: 1,
        projections: {},
      },
      annotation_3: {
        vector: [0.1, -0.5, -0.8],
        name: 'annotation_3',
        index: 2,
        projections: {},
      },
      annotation_4: {
        vector: [0.1, 0.5, 0.8],
        name: 'annotation_4',
        index: 2,
        projections: {},
      },
      annotation_5: {
        vector: [0.3, 0.5, -0.3],
        name: 'annotation_5',
        index: 2,
        projections: {},
      },
    });
    projectUmap(
      embeddingDataSet,
      2,
      0.1,
      [0, 1, 2, 3, 4],
      () => {},
      (resultDataSet) => {
        expect(resultDataSet.projections.umap).toBeTrue();
        expect(resultDataSet.hasUmapRun).toBeTrue();
        for (const key of resultDataSet.pointKeys) {
          expect(resultDataSet.points[key].projections['umap-0']).toBeTruthy();
          expect(resultDataSet.points[key].projections['umap-1']).toBeTruthy();
        }
        done();
      }
    );
  });

  it('does not project if not more data points than neighbors', (done) => {
    const embeddingDataSet = buildEmbeddingDataSet({
      annotation_1: {
        vector: [0.5, 0.6, 0.1],
        name: 'annotation_1',
        index: 0,
        projections: {},
      },
      annotation_2: {
        vector: [-0.2, 0.3, 0.5],
        name: 'annotation_2',
        index: 1,
        projections: {},
      },
      annotation_3: {
        vector: [0.1, -0.5, -0.8],
        name: 'annotation_3',
        index: 2,
        projections: {},
      },
      annotation_4: {
        vector: [0.1, 0.5, 0.8],
        name: 'annotation_4',
        index: 2,
        projections: {},
      },
      annotation_5: {
        vector: [0.3, 0.5, -0.3],
        name: 'annotation_5',
        index: 2,
        projections: {},
      },
    });
    projectUmap(
      embeddingDataSet,
      5,
      0.1,
      [0, 1, 2, 3, 4],
      (errorMessage) => {
        expect(errorMessage).toBe('Error: Please select more data points.');
        done();
      },
      () => {}
    );
  });
});
