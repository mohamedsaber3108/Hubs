'use strict';
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const sharp  = require('sharp');
const { v4: uuidv4 } = require('uuid');
const path   = require('path');
const logger = require('../utils/logger');

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET || 'usam-hub-storage';

async function uploadFile(file, folder, options) {
  options = options || {};
  const ext = path.extname(file.originalname).toLowerCase();
  const key = (folder || 'uploads') + '/' + uuidv4() + ext;

  let buffer = file.buffer;

  // Resize images before upload
  if (file.mimetype.startsWith('image/') && !options.skipResize) {
    buffer = await sharp(file.buffer)
      .resize(options.width || 1200, options.height || 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: options.quality || 85 })
      .toBuffer();
  }

  const command = new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    Body:        buffer,
    ContentType: file.mimetype,
    ACL:         options.private ? 'private' : 'public-read',
  });

  await s3.send(command);

  const url = options.private
    ? null
    : 'https://' + BUCKET + '.s3.' + (process.env.AWS_REGION || 'us-east-1') + '.amazonaws.com/' + key;

  logger.info('Uploaded to S3: ' + key);
  return { key, url, size: buffer.length, type: file.mimetype };
}

async function deleteFile(key) {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    logger.info('Deleted from S3: ' + key);
  } catch (err) {
    logger.warn('S3 delete failed for ' + key + ': ' + err.message);
  }
}

async function getPresignedUrl(key, expiresIn) {
  expiresIn = expiresIn || 3600;
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn });
}

async function uploadAvatar(file, userId) {
  const buffer = await sharp(file.buffer)
    .resize(400, 400, { fit: 'cover' })
    .webp({ quality: 90 })
    .toBuffer();

  const key = 'avatars/' + userId + '-' + Date.now() + '.webp';
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET, Key: key,
    Body: buffer, ContentType: 'image/webp', ACL: 'public-read',
  }));

  return {
    key,
    url: 'https://' + BUCKET + '.s3.' + (process.env.AWS_REGION || 'us-east-1') + '.amazonaws.com/' + key,
    size: buffer.length,
    type: 'image/webp',
  };
}

module.exports = { uploadFile, deleteFile, getPresignedUrl, uploadAvatar };
