"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const pino_1 = require("pino");
exports.logger = (0, pino_1.pino)({
    name: 'membrane',
    level: 'info'
});
