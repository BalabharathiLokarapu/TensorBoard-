/* Copyright 2022 The TensorFlow Authors. All Rights Reserved.

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
 * The start and end time to define a time selection, used for linked time and step selector.
 */
export interface TimeSelection {
  start: {step: number};
  end: {step: number} | null;
}

/**
 * The direction of the axis used to control the fob movements.
 */
export enum AxisDirection {
  HORIZONTAL,
  VERTICAL,
}

/**
 * These helper functions are intended to be used in the card that has a
 * CardFobControllerComponent.
 *
 * Each helper function will have some sort of Scale that is used to convert from
 * pixel to step so that the fob lines up with the axis properly. In future
 * comments this scale will be refered to as ImplementerScale.
 *
 * These helper functions use ImplementerScale, minMax, and axisSize from the card to
 * determine the step. The changes of minMax and axisSize will not be reflected as changes
 * of functions. (Functions are like pointers and as far as Angular concerns, it does not
 * get changed even thought the return values might be cahnged based on minMax, and axisSize.)
 *
 * It also allows cards to implement the dragging functionality in different
 * ways. By deciding which step to return in the getStepHigherThanMousePosition
 * and getStepLowerThanMousePosition functions the implementer can decide if the
 * fob "snaps" to certain steps or drags in in a smooth continuous way.
 */
export interface CardFobGetStepFromPositionHelper {
  /**
   * Uses ImplementerScale to determine the step that is at the current mouse
   * position or the closest step that is higher than the current mouse position.
   * @param position The mouse position relative to the start of the axis
   */
  getStepHigherThanAxisPosition(position: number): number;

  /**
   * Uses ImplementerScale to determine the step that is at the current mouse
   * position or the closest step that is lower than the current mouse position.
   * @param position The mouse position relative to the start of the axis
   */
  getStepLowerThanAxisPosition(position: number): number;
}
