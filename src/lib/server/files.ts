import {
	CLOUDFLARE_ACCOUNT_ID,
	CLOUDFLARE_R2_ACCESS_KEY_ID,
	CLOUDFLARE_R2_BUCKET_NAME,
	CLOUDFLARE_R2_SECRET_ACCESS_KEY,
} from '$env/static/private';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import mime from 'mime';
import type { Readable } from 'stream';

const s3Client = new S3Client({
	region: 'ENAM',
	endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID,
		secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY,
	},
});

/**
 * Generates a signed URL for uploading a file to Cloudflare R2.
 * The signed URL is valid for 1 hour.
 * The file is stored in the specified bucket.
 * The filename is stored as a tag on the object.
 * @param filename the name of the file to upload. It will be stored as a tag on the object.
 * @returns an object with the presigned url to upload the file and the fileKey that will be used to access the file in R2.
 */
export async function getUploadPresignedUrl(filename: string): Promise<{ url: string; fileKey: string }> {
	const fileKey = randomUUID();
	const presignedUrl = await getSignedUrl(
		s3Client,
		new PutObjectCommand({
			Bucket: CLOUDFLARE_R2_BUCKET_NAME,
			Key: fileKey,
			Tagging: `filename=${filename}&createdAt=${Date.now()}`,
		}),
		{ expiresIn: 3600 }
	);
	return { url: presignedUrl, fileKey };
}

/**
 * Generates a signed URL for accessing an object in Cloudflare R2
 * @param {string} fileKey The key of the object in R2.
 * @returns {Promise<string>} The signed URL that can be used to access the object.
 */
export async function getFileSignedUrl(fileKey: string): Promise<string> {
	const signedUrl = await getSignedUrl(
		s3Client,
		new GetObjectCommand({
			Bucket: CLOUDFLARE_R2_BUCKET_NAME,
			Key: fileKey,
		}),
		{ expiresIn: 3600 }
	);
	return signedUrl;
}

export async function uploadReadableStream(filename: string, stream: Readable): Promise<string> {
	const fileKey = randomUUID();

	const upload = new Upload({
		client: s3Client,
		params: {
			Bucket: CLOUDFLARE_R2_BUCKET_NAME,
			Key: fileKey,
			Body: stream,
			ContentType: mime.getType(filename) || 'application/octet-stream',
		},
	});

	const response = await upload.done();

	if (response.$metadata.httpStatusCode !== 200 || !response.Key)
		throw new Error(`Error al guardar el archivo descargado. Código de error: ${response.$metadata.httpStatusCode}`);

	return response.Key;
}
