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

<<<<<<< HEAD
fn main() {}
=======
use byteorder::{ByteOrder, LittleEndian};

fn main() {
    let ptr = LittleEndian::read_u32(b"\x2e\x68\x63\x73"); // look, a dependency!
    assert_eq!(ptr, 0x7363682e);
    println!("Hello, server! 2 + 2 = {}", rustboard_core::add(2, 2)); // look, a sibling crate!
}
>>>>>>> 78df9b17477e9d114ae31b0c03212e6fec6b89a6
