"use strict";
/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logTrace = exports.logDebug = exports.logInfo = exports.logWarn = exports.logError = exports.logFatal = exports.setLogLevel = exports.LogLevel = exports.SocketDomain = exports.SocketType = exports.TlsVersion = void 0;
/**
 *
 * A module containing a grab bag of support for core network I/O functionality, including sockets, TLS, DNS, logging,
 * error handling, streams, and connection -> thread mapping.
 *
 * Categories include:
 * - Network: socket configuration
 * - TLS: tls configuration
 * - Logging: logging controls and configuration
 * - IO: everything else
 *
 * @packageDocumentation
 * @module io
 */
/**
 * TLS Version
 *
 * @category TLS
 */
var TlsVersion;
(function (TlsVersion) {
    TlsVersion[TlsVersion["SSLv3"] = 0] = "SSLv3";
    TlsVersion[TlsVersion["TLSv1"] = 1] = "TLSv1";
    TlsVersion[TlsVersion["TLSv1_1"] = 2] = "TLSv1_1";
    TlsVersion[TlsVersion["TLSv1_2"] = 3] = "TLSv1_2";
    TlsVersion[TlsVersion["TLSv1_3"] = 4] = "TLSv1_3";
    TlsVersion[TlsVersion["Default"] = 128] = "Default";
})(TlsVersion = exports.TlsVersion || (exports.TlsVersion = {}));
/**
 * @category Network
 */
var SocketType;
(function (SocketType) {
    /**
     * A streaming socket sends reliable messages over a two-way connection.
     * This means TCP when used with {@link SocketDomain.IPV4}/{@link SocketDomain.IPV6},
     * and Unix domain sockets when used with {@link SocketDomain.LOCAL }
      */
    SocketType[SocketType["STREAM"] = 0] = "STREAM";
    /**
     * A datagram socket is connectionless and sends unreliable messages.
     * This means UDP when used with {@link SocketDomain.IPV4}/{@link SocketDomain.IPV6}.
     * {@link SocketDomain.LOCAL} is not compatible with {@link DGRAM}
     */
    SocketType[SocketType["DGRAM"] = 1] = "DGRAM";
})(SocketType = exports.SocketType || (exports.SocketType = {}));
/**
 * @category Network
 */
var SocketDomain;
(function (SocketDomain) {
    /** IPv4 sockets */
    SocketDomain[SocketDomain["IPV4"] = 0] = "IPV4";
    /** IPv6 sockets */
    SocketDomain[SocketDomain["IPV6"] = 1] = "IPV6";
    /** UNIX domain socket/Windows named pipes */
    SocketDomain[SocketDomain["LOCAL"] = 2] = "LOCAL";
})(SocketDomain = exports.SocketDomain || (exports.SocketDomain = {}));
/**
 * The amount of detail that will be logged
 * @category Logging
 */
var LogLevel;
(function (LogLevel) {
    /** No logging whatsoever. */
    LogLevel[LogLevel["NONE"] = 0] = "NONE";
    /** Only fatals. In practice, this will not do much, as the process will log and then crash (intentionally) if a fatal condition occurs */
    LogLevel[LogLevel["FATAL"] = 1] = "FATAL";
    /** Only errors */
    LogLevel[LogLevel["ERROR"] = 2] = "ERROR";
    /** Only warnings and errors */
    LogLevel[LogLevel["WARN"] = 3] = "WARN";
    /** Information about connection/stream creation/destruction events */
    LogLevel[LogLevel["INFO"] = 4] = "INFO";
    /** Enough information to debug the chain of events a given network connection encounters */
    LogLevel[LogLevel["DEBUG"] = 5] = "DEBUG";
    /** Everything. Only use this if you really need to know EVERY single call */
    LogLevel[LogLevel["TRACE"] = 6] = "TRACE";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
let logLevel = LogLevel.NONE;
/**
 * Sets the amount of detail that will be logged
 * @param level - maximum level of logging detail.  Log invocations at a higher level of detail will be ignored.
 *
 * @category Logging
 */
function setLogLevel(level) {
    logLevel = level;
}
exports.setLogLevel = setLogLevel;
/*
 * The logging API is exported to library-internal, but stays private beyond the package boundary, so the following API
 * decisions are not binding.
 */
function logFatal(subject, logLine) {
    if (logLevel < LogLevel.FATAL) {
        return;
    }
    let currentTime = new Date().toISOString();
    console.log(`[FATAL] [${currentTime}] [${subject}] - ${logLine}`);
}
exports.logFatal = logFatal;
function logError(subject, logLine) {
    if (logLevel < LogLevel.ERROR) {
        return;
    }
    let currentTime = new Date().toISOString();
    console.log(`[ERROR] [${currentTime}] [${subject}] - ${logLine}`);
}
exports.logError = logError;
function logWarn(subject, logLine) {
    if (logLevel < LogLevel.WARN) {
        return;
    }
    let currentTime = new Date().toISOString();
    console.log(`[WARN] [${currentTime}] [${subject}] - ${logLine}`);
}
exports.logWarn = logWarn;
function logInfo(subject, logLine) {
    if (logLevel < LogLevel.INFO) {
        return;
    }
    let currentTime = new Date().toISOString();
    console.log(`[INFO] [${currentTime}] [${subject}] - ${logLine}`);
}
exports.logInfo = logInfo;
function logDebug(subject, logLine) {
    if (logLevel < LogLevel.DEBUG) {
        return;
    }
    let currentTime = new Date().toISOString();
    console.log(`[DEBUG] [${currentTime}] [${subject}] - ${logLine}`);
}
exports.logDebug = logDebug;
function logTrace(subject, logLine) {
    if (logLevel < LogLevel.TRACE) {
        return;
    }
    let currentTime = new Date().toISOString();
    console.log(`[TRACE] [${currentTime}] [${subject}] - ${logLine}`);
}
exports.logTrace = logTrace;
//# sourceMappingURL=io.js.map