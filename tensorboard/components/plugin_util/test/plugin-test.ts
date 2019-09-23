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
import * as pluginHost from '../plugin-host.js';

namespace tf_plugin.test {
  const {expect} = chai;
  const template = document.getElementById(
    'iframe-template'
  ) as HTMLTemplateElement;

  describe('plugin-util', () => {
    beforeEach(function(done) {
      const iframeFrag = document.importNode(template.content, true);
      const iframe = iframeFrag.firstElementChild as HTMLIFrameElement;
      document.body.appendChild(iframe);
      this.guestFrame = iframe;
      this.guestWindow = iframe.contentWindow;
      // Must wait for the JavaScript to be loaded on the child frame.
      this.guestWindow.addEventListener('load', () => done());

      this.sandbox = sinon.sandbox.create();
    });

    afterEach(function() {
      document.body.removeChild(this.guestFrame);
      this.sandbox.restore();
    });

    it('setUp sanity check', function() {
      expect(this.guestWindow.test)
        .to.have.property('sendMessage')
        .that.is.a('function');
      expect(this.guestWindow.test)
        .to.have.property('listen')
        .that.is.a('function');
      expect(this.guestWindow.test)
        .to.have.property('unlisten')
        .that.is.a('function');
    });

    [
      {
        spec: 'host (src) to guest (dest)',
        beforeEachFunc: function() {
          this.listen = this.guestWindow.test.listen;
          this.unlisten = this.guestWindow.test.unlisten;
          this.sendMessage = (type, payload) => {
            return pluginHost.sendMessage(this.guestFrame, type, payload);
          };
          this.getStubDestPostMessage = () =>
            this.sandbox.spy(this.guestWindow.test._guestIPC, 'postMessage');
        },
      },
      {
        spec: 'guest (src) to host (dest)',
        beforeEachFunc: function() {
          this.listen = pluginHost.listen;
          this.unlisten = pluginHost.unlisten;
          this.sendMessage = (type, payload) => {
            return this.guestWindow.test.sendMessage(type, payload);
          };
          this.getStubDestPostMessage = () =>
            this.sandbox.spy(pluginHost._hostIPC, 'postMessage');
        },
      },
    ].forEach(({spec, beforeEachFunc}) => {
      describe(spec, () => {
        beforeEach(beforeEachFunc);

        beforeEach(function() {
          this.onMessage = this.sandbox.stub();
          this.listen('messageType', this.onMessage);
        });

        it('sends a message to dest', async function() {
          await this.sendMessage('messageType', 'hello');
          expect(this.onMessage.callCount).to.equal(1);
          expect(this.onMessage.firstCall.args).to.deep.equal(['hello']);
        });

        it('sends a message a random payload not by ref', async function() {
          const payload = {
            foo: 'foo',
            bar: {
              baz: 'baz',
            },
          };
          await this.sendMessage('messageType', payload);
          expect(this.onMessage.callCount).to.equal(1);

          expect(this.onMessage.firstCall.args[0]).to.not.equal(payload);
          expect(this.onMessage.firstCall.args[0]).to.deep.equal(payload);
        });

        it('resolves when dest replies with ack', async function() {
          const destPostMessage = this.getStubDestPostMessage();
          const sendMessageP = this.sendMessage('messageType', 'hello');

          expect(this.onMessage.callCount).to.equal(0);
          expect(destPostMessage.callCount).to.equal(0);

          await sendMessageP;
          expect(this.onMessage.callCount).to.equal(1);
          expect(destPostMessage.callCount).to.equal(1);
          expect(this.onMessage.firstCall.args).to.deep.equal(['hello']);
        });

        it('triggers, on dest, a cb for the matching type', async function() {
          const barCb = this.sandbox.stub();
          this.listen('bar', barCb);

          await this.sendMessage('bar', 'soap');

          expect(this.onMessage.callCount).to.equal(0);
          expect(barCb.callCount).to.equal(1);
          expect(barCb.firstCall.args).to.deep.equal(['soap']);
        });

        it('supports single listener for a type', async function() {
          const barCb1 = this.sandbox.stub();
          const barCb2 = this.sandbox.stub();
          this.listen('bar', barCb1);
          this.listen('bar', barCb2);

          await this.sendMessage('bar', 'soap');

          expect(barCb1.callCount).to.equal(0);
          expect(barCb2.callCount).to.equal(1);
          expect(barCb2.firstCall.args).to.deep.equal(['soap']);
        });

        it('unregister a callback with unlisten', async function() {
          const barCb = this.sandbox.stub();
          this.listen('bar', barCb);
          await this.sendMessage('bar', 'soap');
          expect(barCb.callCount).to.equal(1);
          this.unlisten('bar');

          await this.sendMessage('bar', 'soap');

          expect(barCb.callCount).to.equal(1);
        });
      });
    });
  });
} // namespace tf_plugin.test
