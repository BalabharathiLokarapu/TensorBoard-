/* Copyright 2019 The TensorFlow Authors. All Rights Reserved.

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

// import * as tf from '@tensorflow/tfjs-core';
import * as tensorWidget from '../tensor-widget';
import {TensorViewSlicingSpec} from '../types';

// TODO(cais): Find a way to import tfjs-core here.
declare const tf: any;

console.log('In demo.ts,', tf);  // DEBUG

/**
 * Convert a TensorFlow.js tensor to a TensorView.
 */
export function tensorToTensorView(x: any): tensorWidget.TensorView {
  // TODO(cais): Do this lazily.
  const buffer = x.bufferSync();

  return {
    spec: {
      dtype: x.dtype as string,
      shape: x.shape as tensorWidget.Shape,
    },
    get: async (...indices: number[]) => {
      if (indices.length !== x.rank) {
        throw new Error(
            `indices length ${indices.length} does not match ` +
            `rank ${x.rank}`);
      }
      return buffer.get(...indices);
    },
    view: async (slicingSpec: TensorViewSlicingSpec) => {
      if (slicingSpec.depthDim != null) {
        throw new Error(`depthDim view is not supported yet.`);
      }

      const slicingDims = slicingSpec.slicingDimsAndIndices.map(
        dimAndIndex => dimAndIndex.dim);
      const slicingIndices = slicingSpec.slicingDimsAndIndices.map(
        dimAndIndex => dimAndIndex.index);

      const begins: number[] = [];
      const sizes: number[] = [];
      if (x.rank === 1) {
        begins.push(slicingSpec.verticalRange[0]);
        sizes.push(slicingSpec.verticalRange[1] - slicingSpec.verticalRange[0]);
      } else if (x.rank > 1) {
        for (let i = 0; i < x.rank; ++i) {
          if (slicingDims.indexOf(i) !== -1) {
            // This is a slicing dimension. Get the slicing index.
            begins.push(slicingIndices[slicingDims.indexOf(i)]);
            sizes.push(1);
          } else {
            // This is one of the viewing dimension(s).
            const viewDimIndex = slicingSpec.viewingDims.indexOf(i);
            if (viewDimIndex === 0) {
              begins.push(slicingSpec.verticalRange[0]);
              sizes.push(slicingSpec.verticalRange[1] -
                         slicingSpec.verticalRange[0]);
            } else {
              begins.push(slicingSpec.horizontalRange[0]);
              sizes.push(slicingSpec.horizontalRange[1] -
                         slicingSpec.horizontalRange[0]);
            }
          }
        }
      }
      // TODO(cais): Doesn't work when slicing dimensions is not the first few
      // yet.
      const sliced = x.rank === 0 ? x : tf.tidy(() => {
        let output = x.slice(begins, sizes);
        if (slicingDims != null) {
          output = output.squeeze(slicingDims);
        }
        return output;
      });

      const retval =
          (await sliced.array()) as
          boolean|number|string|boolean[][]|number[][]|string[][];
      if (sliced !== x) {
        tf.dispose(sliced);
      }
      // TODO(cais): Check memory leak.
      return retval;
    },
    getHealthPill: async () => {
      // return calculateHealthPill(x);
      throw new Error('Not implemented yet.');
    }
  };
}

function demo() {
  document.getElementById('tensor-widget-version').textContent =
    tensorWidget.VERSION;

  // Render tensor1: a float32 scalar.
  const tensorDiv0 = document.getElementById('tensor0') as HTMLDivElement;
  // TODO(cais): Replace this with a TensorFlow.js-based TensorView.
  const tensorView0 = tensorToTensorView(tf.scalar(28));
  const tensorWidget0 = tensorWidget.tensorWidget(
    tensorDiv0,
    tensorView0,
    {name: 'scalar1'}
  );
  tensorWidget0.render();

  // Render tensor1: a 1D int32 tensor.
  const tensorDiv1 = document.getElementById('tensor1') as HTMLDivElement;
  // TODO(cais): Replace this with a TensorFlow.js-based TensorView.
  const tensorView1 = tensorToTensorView(tf.randomUniform([100]));
  const tensorWidget1 = tensorWidget.tensorWidget(
    tensorDiv1,
    tensorView1,
    {name: 'Tensor1DOutputByAnOpWithAVeryLongName:0'}
  );
  tensorWidget1.render();

  // Render tensor2: a 2D float32 scalar.
  const tensor2Div = document.getElementById('tensor2') as HTMLDivElement;
  const tensorView2 = tensorToTensorView(tf.randomNormal([512, 1024]));
  const tensorWidget2 = tensorWidget.tensorWidget(
    tensor2Div,
    tensorView2,
    {name: 'Float32_2D_Tensor:0'}
  );
  tensorWidget2.render();

  // Render tensor3: a 3D float32 scalar, without the optional name.
  const tensorDiv3 = document.getElementById('tensor3') as HTMLDivElement;
  // TODO(cais): Replace this with a TensorFlow.js-based TensorView.
  const tensorView3: any = {
    spec: {
      dtype: 'float32',
      shape: [64, 32, 50],
    },
  };
  const tensorWidget3 = tensorWidget.tensorWidget(
    tensorDiv3,
    tensorView3
  ); // No name.
  tensorWidget3.render();
}

demo();
