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

use tonic::transport::Server;

use rustboard_core::proto::tensorboard::data::tensor_board_data_provider_server::TensorBoardDataProviderServer;
use rustboard_core::server::DataProviderHandler;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let addr = "[::0]:6806".parse::<std::net::SocketAddr>()?;
    let handler = DataProviderHandler;
    Server::builder()
        .add_service(TensorBoardDataProviderServer::new(handler))
        .serve(addr)
        .await?;
    Ok(())
}
