"use strict";
/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hmac_sha256 = exports.Sha256Hmac = exports.hash_sha1 = exports.Sha1Hash = exports.hash_sha256 = exports.Sha256Hash = exports.hash_md5 = exports.Md5Hash = void 0;
/**
 * A module containing support for a variety of cryptographic operations.
 *
 * @packageDocumentation
 * @module crypto
 * @mergeTarget
 */
var Crypto = __importStar(require("crypto-js"));
/**
 * CryptoJS does not provide easy access to underlying bytes.
 * As a workaround just dump it to a string and then reinterpret chars as individual bytes.
 * Note: we are using Latin1 here because its a static sized 8 bit encoding so each char maps directly to a byte value.
 * TODO: long term we would probably want to move to WebCrypto for SHA's and some other 3p for crc's and md5.
 * @param hash
 * @returns
 */
function wordArrayToUint8Array(hash) {
    return Uint8Array.from(hash.toString(Crypto.enc.Latin1).split('').map(function (c) { return c.charCodeAt(0); }));
    ;
}
var BaseHash = /** @class */ (function () {
    function BaseHash(hasher) {
        this.hasher = hasher;
    }
    /**
     * Hashes additional data
     * @param data Additional data to hash
     */
    BaseHash.prototype.update = function (data) {
        this.hasher.update(data.toString());
    };
    /**
     * Completes the hash computation and returns the final hash digest.
     *
     * @param truncate_to The maximum number of bytes to receive. Leave as undefined or 0 to receive the entire digest.
     *
     * @returns the final hash digest
     */
    BaseHash.prototype.finalize = function (truncate_to) {
        var hashBuffer = wordArrayToUint8Array(this.hasher.finalize());
        var truncated = hashBuffer.slice(0, truncate_to ? truncate_to : hashBuffer.length);
        return new DataView(truncated.buffer);
        ;
    };
    return BaseHash;
}());
/**
 * Object that allows for continuous MD5 hashing of data.
 *
 * @category Crypto
 */
var Md5Hash = /** @class */ (function (_super) {
    __extends(Md5Hash, _super);
    function Md5Hash() {
        return _super.call(this, Crypto.algo.MD5.create()) || this;
    }
    return Md5Hash;
}(BaseHash));
exports.Md5Hash = Md5Hash;
/**
 * Computes an MD5 hash. Use this if you don't need to stream the data you're hashing and can load the entire input
 * into memory.
 *
 * @param data The data to hash
 * @param truncate_to The maximum number of bytes to receive. Leave as undefined or 0 to receive the entire digest.
 *
 * @returns the data's hash digest
 *
 * @category Crypto
 */
function hash_md5(data, truncate_to) {
    var md5 = new Md5Hash();
    md5.update(data);
    return md5.finalize(truncate_to);
}
exports.hash_md5 = hash_md5;
/**
 * Object that allows for continuous SHA256 hashing of data.
 *
 * @category Crypto
 */
var Sha256Hash = /** @class */ (function (_super) {
    __extends(Sha256Hash, _super);
    function Sha256Hash() {
        return _super.call(this, Crypto.algo.SHA256.create()) || this;
    }
    return Sha256Hash;
}(BaseHash));
exports.Sha256Hash = Sha256Hash;
/**
 * Computes an SHA256 hash. Use this if you don't need to stream the data you're hashing and can load the entire input
 * into memory.
 *
 * @param data The data to hash
 * @param truncate_to The maximum number of bytes to receive. Leave as undefined or 0 to receive the entire digest.
 *
 * @returns the data's hash digest
 *
 * @category Crypto
 */
function hash_sha256(data, truncate_to) {
    var sha256 = new Sha256Hash();
    sha256.update(data);
    return sha256.finalize(truncate_to);
}
exports.hash_sha256 = hash_sha256;
/**
 * Object that allows for continuous SHA1 hashing of data.
 *
 * @category Crypto
 */
var Sha1Hash = /** @class */ (function (_super) {
    __extends(Sha1Hash, _super);
    function Sha1Hash() {
        return _super.call(this, Crypto.algo.SHA1.create()) || this;
    }
    return Sha1Hash;
}(BaseHash));
exports.Sha1Hash = Sha1Hash;
/**
 * Computes an SHA1 hash. Use this if you don't need to stream the data you're hashing and can load the entire input
 * into memory.
 *
 * @param data The data to hash
 * @param truncate_to The maximum number of bytes to receive. Leave as undefined or 0 to receive the entire digest.
 *
 * @returns the data's hash digest
 *
 * @category Crypto
 */
function hash_sha1(data, truncate_to) {
    var sha1 = new Sha1Hash();
    sha1.update(data);
    return sha1.finalize(truncate_to);
}
exports.hash_sha1 = hash_sha1;
/**
 * Object that allows for continuous hashing of data with an hmac secret.
 *
 * @category Crypto
 */
var Sha256Hmac = /** @class */ (function (_super) {
    __extends(Sha256Hmac, _super);
    /**
     * Constructor for the Sha256Hmac class type
     * @param secret secret key to seed the hmac process with
     */
    function Sha256Hmac(secret) {
        // @ts-ignore types file doesn't have this signature of create()
        return _super.call(this, Crypto.algo.HMAC.create(Crypto.algo.SHA256, secret)) || this;
    }
    return Sha256Hmac;
}(BaseHash));
exports.Sha256Hmac = Sha256Hmac;
/**
 * Computes an SHA256 HMAC. Use this if you don't need to stream the data you're hashing and can load the entire input
 * into memory.
 *
 * @param secret The key to use for the HMAC process
 * @param data The data to hash
 * @param truncate_to The maximum number of bytes to receive. Leave as undefined or 0 to receive the entire digest.
 *
 * @returns the data's hmac digest
 *
 * @category Crypto
 */
function hmac_sha256(secret, data, truncate_to) {
    var hmac = new Sha256Hmac(secret);
    hmac.update(data);
    return hmac.finalize(truncate_to);
}
exports.hmac_sha256 = hmac_sha256;
//# sourceMappingURL=crypto.js.map