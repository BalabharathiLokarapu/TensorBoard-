/* Copyright 2020 The TensorFlow Authors. All Rights Reserved.

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
/**
 * Unit tests for the Timeline Container.
 */

import {getExecutionDigestForDisplay} from './timeline_container';

describe('getExecutionDigestForDisplay', () => {
  for (const [opType, strLen, expectedShortOpType] of [
    ['MatMul', 1, 'M'],
    ['MatMul', 2, 'Ma'],
    ['MatMul', 3, 'Mat'],
    ['MatMul', 100, 'MatMul'],
    ['__inference_batchnorm_1357', 1, 'b'],
    ['__forward_batchnorm_1357', 2, 'ba'],
    ['__backward_attention_1357', 3, 'att'],
    ['__backward_attention_1357', 99, 'attention_1357'],
  ] as Array<[string, number, string]>) {
    it('outputs correct results for individual TensorFlow op', () => {
      const display = getExecutionDigestForDisplay(
        {
          op_type: opType,
          output_tensor_device_ids: ['d0'],
        },
        strLen
      );
      expect(display.short_op_type).toEqual(expectedShortOpType);
    });
  }
});
