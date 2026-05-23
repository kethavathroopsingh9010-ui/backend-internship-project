const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3ClientNode = new S3Client({
  region: process.env.AWS_PRODUCTION_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

class ObjectStorageService {
  static secureMimeWhitelist = ['image/jpeg', 'image/png', 'application/pdf'];

  static async requestSecureUploadSignature(userId, filename, mimeType, folder) {
    if (!this.secureMimeWhitelist.includes(mimeType)) {
      throw new Error('Unsupported asset format properties.');
    }

    const uniqueAssetKey = `${folder}/${userId}-${Date.now()}-${filename}`;
    
    const commandPayload = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: uniqueAssetKey,
      ContentType: mimeType,
      Metadata: { trackingUploaderId: userId }
    });

    const executionPresignedPutUrl = await getSignedUrl(s3ClientNode, commandPayload, { expiresIn: 900 });

    return {
      uploadGatewayEndpointTarget: executionPresignedPutUrl,
      resolvedAssetStorageKey: uniqueAssetKey
    };
  }
}

module.exports = ObjectStorageService;