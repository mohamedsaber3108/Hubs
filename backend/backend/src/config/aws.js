'use strict';
const { S3Client } = require('@aws-sdk/client-s3');
const { SESClient } = require('@aws-sdk/client-ses');

// Credentials resolution:
//  - If AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY are BOTH set (e.g. local dev),
//    use those explicit static credentials.
//  - Otherwise OMIT `credentials` so the AWS SDK default provider chain runs,
//    which on EC2 picks up the attached IAM INSTANCE ROLE (no static keys on the
//    box). Passing credentials:{accessKeyId:undefined,...} would instead BREAK the
//    chain, so we must leave the key out entirely when env vars are absent.
const awsConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
};
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  awsConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

const s3Client = new S3Client(awsConfig);
const sesClient = new SESClient(awsConfig);

module.exports = { s3Client, sesClient, awsConfig };
