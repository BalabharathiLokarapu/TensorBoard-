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
import {TestBed} from '@angular/core/testing';

import {HashDeepLinker} from './hash';

describe('deeplink', () => {
  let deepLinker: HashDeepLinker;
  let setStringSpy: jasmine.Spy;
  let getStringSpy: jasmine.Spy;
  let setUseHashSpy: jasmine.Spy;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [HashDeepLinker],
    }).compileComponents();

    setStringSpy = jasmine.createSpy();
    getStringSpy = jasmine.createSpy();
    setUseHashSpy = jasmine.createSpy();

    // Cannot safely stub out window.location.hash or rely on test framework
    // to not make use of the hash (it does).

    // Do not rely on Polymer bundle in the test.
    const createElement = spyOn(document, 'createElement');
    createElement.withArgs('tf-storage').and.returnValue({
      tf_storage: {
        setString: setStringSpy,
        getString: getStringSpy,
      },
    } as any);
    createElement.withArgs('tf-globals').and.returnValue({
      tf_globals: {
        setUseHash: setUseHashSpy,
      },
    } as any);
    createElement.and.callThrough();

    deepLinker = TestBed.get(HashDeepLinker);
  });

  it('uses real hash', () => {
    expect(setUseHashSpy).toHaveBeenCalledWith(true);
  });

  it('#getString calls tf_storage getString', () => {
    getStringSpy.withArgs('foo').and.returnValue('bar');
    expect(deepLinker.getString('foo')).toBe('bar');
  });

  it('#setString calls tf_storage setString', () => {
    deepLinker.setString('foo', 'bar');
    expect(setStringSpy).toHaveBeenCalledWith('foo', 'bar', undefined);
  });

  it('#getPluginId calls tf_storage getString with predefined key', () => {
    getStringSpy.withArgs('__tab__').and.returnValue('bar');
    expect(deepLinker.getPluginId()).toBe('bar');
  });

  it('#setPluginId calls tf_storage setString with predefined key', () => {
    deepLinker.setPluginId('bar');
    expect(setStringSpy).toHaveBeenCalledWith('__tab__', 'bar', undefined);
  });
});
