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

//! Client for listing and reading GCS files.

use log::debug;
use reqwest::{blocking::Client as HttpClient, StatusCode, Url};
use std::ops::RangeInclusive;

/// Base URL for direct object reads.
const STORAGE_BASE: &str = "https://storage.googleapis.com";
/// Base URL for JSON API access.
const API_BASE: &str = "https://www.googleapis.com/storage/v1";

/// GCS client.
///
/// Cloning a GCS client is cheap and shares the underlying connection pool, as with a
/// [`reqwest::Client`].
#[derive(Clone)]
pub struct Client {
    http: HttpClient,
}

impl Client {
    /// Creates a new GCS client.
    ///
    /// May fail if constructing the underlying HTTP client fails.
    pub fn new() -> reqwest::Result<Self> {
        let http = HttpClient::builder()
            .user_agent(format!("tensorboard-data-server/{}", crate::VERSION))
            .build()?;
        Ok(Self { http })
    }
}

/// Response from the `/b/<bucket>/o` object listing API.
#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct ListResponse {
    /// Continuation token; only present when there is more data.
    next_page_token: Option<String>,
    /// List of objects, sorted by name.
    #[serde(default)] // `items` omitted entirely when there are no results
    items: Vec<ListResponseItem>,
}
#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct ListResponseItem {
    /// Full GCS object name, possibly including slashes, but not including the bucket.
    name: String,
}

impl Client {
    /// Lists all objects in a bucket matching the given prefix.
    pub fn list(&self, bucket: &str, prefix: &str) -> reqwest::Result<Vec<String>> {
        let mut base_url = Url::parse(API_BASE).unwrap();
        base_url
            .path_segments_mut()
            .unwrap()
            .extend(&["b", bucket, "o"]);
        base_url
            .query_pairs_mut()
            .append_pair("prefix", prefix)
            .append_pair("prettyPrint", "false")
            .append_pair("fields", "nextPageToken,items/name");
        let mut results = Vec::new();
        let mut page_token: Option<String> = None;
        for page in 1.. {
            let mut url = base_url.clone();
            if let Some(t) = page_token {
                url.query_pairs_mut().append_pair("pageToken", t.as_str());
            }
            debug!(
                "Listing page {} of bucket {:?} (prefix={:?})",
                page, bucket, prefix
            );
            let res: ListResponse = self.http.get(url).send()?.error_for_status()?.json()?;
            results.extend(res.items.into_iter().map(|i| i.name));
            if res.next_page_token.is_none() {
                break;
            }
            page_token = res.next_page_token;
        }
        Ok(results)
    }

    /// Reads partial content of an object. (To read the whole thing, pass `0..=u64::MAX`.)
    ///
    /// If the `range` is partially past the end of the object, the result may be shorter than
    /// expected. If it's entirely past the end, the result is an empty vector.
    pub fn read(
        &self,
        bucket: &str,
        object: &str,
        range: RangeInclusive<u64>,
    ) -> reqwest::Result<Vec<u8>> {
        let mut url = Url::parse(STORAGE_BASE).unwrap();
        url.path_segments_mut().unwrap().extend(&[bucket, object]);
        // With "Range: bytes=a-b", if `b >= 2**63` then GCS ignores the range entirely.
        let max_max = (1 << 63) - 1;
        let range = format!("bytes={}-{}", range.start(), range.end().min(&max_max));
        let res = self.http.get(url).header("Range", range).send()?;
        if res.status() == StatusCode::RANGE_NOT_SATISFIABLE {
            return Ok(Vec::new());
        }
        let body = res.error_for_status()?.bytes()?;
        Ok(body.to_vec())
    }
}
