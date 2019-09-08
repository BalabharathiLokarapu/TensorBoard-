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

import {TensorWidgetImpl} from './tensor-widget-impl';
import {TensorWidget, TensorWidgetOptions, TensorView} from './types';

export {Shape, TensorView} from './types';
export {VERSION} from './version';

console.log('In tensor-widget.ts'); // DEBUG

/**
 * Create an instance of tensor widget.
 * @param rootElement The element in which the tensor widget will be endered.
 * @param tensor The tensor view of which the content is to be rendered
 *   in the tensor widget.
 * @param options Optional configurations.
 * @returns An instance of a single-tensor tensor widget.
 */
export function tensorWidget(
  rootElement: HTMLDivElement,
  tensor: TensorView,
  options?: TensorWidgetOptions
): TensorWidget {
  return new TensorWidgetImpl(rootElement, tensor, options);
}
