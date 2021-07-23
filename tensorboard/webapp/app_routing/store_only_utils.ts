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
import {parseCompareExperimentStr} from './internal_utils';
import {CompareRouteParams} from './types';

// Ideally, we would not be exposing this utility method this, but there is no
// way to share the structured information to other stores without changing
// contract at the RouteConfig level.
/**
 * Returns experimentId to alias information encoded in CompareRouteParams.
 *
 * Do not use this outside of _redux store.
 */
export function getCompareExperimentIdAliasSpec(
  routeParams: CompareRouteParams
): Map<string, string> {
  const idToDisplayName = new Map<string, string>();
  const nameAndIds = parseCompareExperimentStr(routeParams.experimentIds);
  for (const {id, name} of nameAndIds) {
    idToDisplayName.set(id, name);
  }
  return idToDisplayName;
}
