"use strict";
/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidTopic = exports.isValidTopicFilter = exports.DEFAULT_KEEP_ALIVE = exports.normalize_payload_to_buffer = exports.normalize_payload = void 0;
/**
 * @packageDocumentation
 */
/**
 * Converts payload to Buffer or string regardless of the supplied type
 * @param payload The payload to convert
 * @internal
 */
function normalize_payload(payload) {
    if (payload instanceof Buffer) {
        // pass Buffer through
        return payload;
    }
    if (typeof payload === 'string') {
        // pass string through
        return payload;
    }
    if (ArrayBuffer.isView(payload)) {
        // return Buffer with view upon the same bytes (no copy)
        const view = payload;
        return Buffer.from(view.buffer, view.byteOffset, view.byteLength);
    }
    if (payload instanceof ArrayBuffer) {
        // return Buffer with view upon the same bytes (no copy)
        return Buffer.from(payload);
    }
    if (typeof payload === 'object') {
        // Convert Object to JSON string
        return JSON.stringify(payload);
    }
    if (!payload) {
        return "";
    }
    throw new TypeError("payload parameter must be a string, object, or DataView.");
}
exports.normalize_payload = normalize_payload;
/**
 * Converts payload to Buffer only, regardless of the supplied type
 * @param payload The payload to convert
 * @internal
 */
function normalize_payload_to_buffer(payload) {
    let normalized = normalize_payload(payload);
    if (typeof normalized === 'string') {
        // pass string through
        return Buffer.from(normalized);
    }
    return normalized;
}
exports.normalize_payload_to_buffer = normalize_payload_to_buffer;
/** @internal */
exports.DEFAULT_KEEP_ALIVE = 1200;
function isValidTopicInternal(topic, isFilter) {
    if (topic.length === 0 || topic.length > 65535) {
        return false;
    }
    let sawHash = false;
    for (let segment of topic.split('/')) {
        if (sawHash) {
            return false;
        }
        if (segment.length === 0) {
            continue;
        }
        if (segment.includes("+")) {
            if (!isFilter) {
                return false;
            }
            if (segment.length > 1) {
                return false;
            }
        }
        if (segment.includes("#")) {
            if (!isFilter) {
                return false;
            }
            if (segment.length > 1) {
                return false;
            }
            sawHash = true;
        }
    }
    return true;
}
function isValidTopicFilter(topicFilter) {
    if (typeof (topicFilter) !== 'string') {
        return false;
    }
    let topicFilterAsString = topicFilter;
    return isValidTopicInternal(topicFilterAsString, true);
}
exports.isValidTopicFilter = isValidTopicFilter;
function isValidTopic(topic) {
    if (typeof (topic) !== 'string') {
        return false;
    }
    let topicAsString = topic;
    return isValidTopicInternal(topicAsString, false);
}
exports.isValidTopic = isValidTopic;
//# sourceMappingURL=mqtt_shared.js.map