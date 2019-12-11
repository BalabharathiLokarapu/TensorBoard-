// Copyright 2019 The TensorFlow Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// =============================================================================

import * as Components from './components.js';

/**
 * The main entry point of any TensorBoard iframe plugin.
 * It builds UI in this form:
 *   <link rel="stylesheet" href="./static/style.css" />
 *
 *   <h1>Example plugin - Select a run</h1>
 *   <select class="run-selector"></select>
 *   <div>${previewElements}</div>
 */
export async function render() {
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = './static/style.css';

  const header = document.createElement('h1');
  header.textContent = 'Example plugin - Select a run';

  const previewContainer = document.createElement('div');
  const runSelector = await Components.createRunSelector((selectedRun) => {
    updatePreview(previewContainer, selectedRun);
  });

  document.body.appendChild(stylesheet);
  document.body.appendChild(header);
  document.body.appendChild(runSelector);
  document.body.appendChild(previewContainer);

  /**
   * Update the container with scalar data from `createPreviews`.
   * @param {!Element} container
   * @param {string} run
   */
  async function updatePreview(container, run) {
    container.textContent = 'Loading...';
    const preview = await Components.createPreviews(run);

    // Cancel the update if the UI has a different run selected.
    if (runSelector.value !== run)
      return;
    container.textContent = '';
    container.appendChild(preview);
  }
}
