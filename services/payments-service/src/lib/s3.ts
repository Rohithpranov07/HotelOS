import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { config, hasS3 } from '../config.js';

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: config.aws.region,
      credentials:
        config.aws.accessKeyId && config.aws.secretAccessKey
          ? {
              accessKeyId: config.aws.accessKeyId,
              secretAccessKey: config.aws.secretAccessKey,
            }
          : undefined,
    });
  }
  return _client;
}

export interface UploadResult {
  url: string;
  key: string;
  bucket: string;
}

/**
 * Upload an invoice PDF to S3 and return its (virtual-hosted-style) URL.
 * When S3 is not configured, falls back to a local data URL marker so the
 * rest of the flow can still proceed in dev / tests.
 */
export async function uploadInvoice(
  reservationId: string,
  pdf: Buffer,
): Promise<UploadResult> {
  const key = `invoices/${reservationId}.pdf`;
  if (!hasS3) {
    return { url: `local://${key}`, key, bucket: 'local' };
  }
  const bucket = config.aws.s3Bucket!;
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: pdf,
      ContentType: 'application/pdf',
      CacheControl: 'private, max-age=3600',
    }),
  );
  return {
    url: `https://${bucket}.s3.${config.aws.region}.amazonaws.com/${key}`,
    key,
    bucket,
  };
}
