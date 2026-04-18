'use strict';
const multer   = require('multer');
const ApiError = require('../utils/ApiError');

const MAX_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024;

const IMAGE_TYPES    = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const DOCUMENT_TYPES = ['application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
const ALL_TYPES = IMAGE_TYPES.concat(DOCUMENT_TYPES);

const storage = multer.memoryStorage();

const makeFilter = (allowed) => function(req, file, cb) {
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(ApiError.badRequest("File type '" + file.mimetype + "' not allowed"), false);
};

const upload = {
  single: function(field, type) {
    const allowed = type === 'image' ? IMAGE_TYPES : type === 'document' ? DOCUMENT_TYPES : ALL_TYPES;
    return multer({ storage, limits: { fileSize: MAX_SIZE }, fileFilter: makeFilter(allowed) }).single(field);
  },
  array: function(field, maxCount) {
    maxCount = maxCount || 5;
    return multer({ storage, limits: { fileSize: MAX_SIZE, files: maxCount }, fileFilter: makeFilter(ALL_TYPES) }).array(field, maxCount);
  },
};

module.exports = upload;
