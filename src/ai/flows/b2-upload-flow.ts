'use server';
/**
 * @fileOverview A flow to handle file uploads to Backblaze B2.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import axios, { AxiosProgressEvent } from 'axios';
import * as crypto from 'crypto';

// 1. Define Input and Output Schemas
const B2UploadInputSchema = z.object({
  fileBuffer: z.any().describe('The file content as a Buffer.'),
  fileName: z.string().describe('The name of the file.'),
  fileType: z.string().describe('The MIME type of the file.'),
});
type B2UploadInput = z.infer<typeof B2UploadInputSchema>;

const B2UploadOutputSchema = z.object({
  fileName: z.string(),
  fileId: z.string(),
  contentSha1: z.string(),
});
type B2UploadOutput = z.infer<typeof B2UploadOutputSchema>;

// Helper function to get B2 authorization and API URL
async function getB2Auth() {
  const keyId = process.env.B2_KEY_ID;
  const applicationKey = process.env.B2_APPLICATION_KEY;

  if (!keyId || !applicationKey) {
    throw new Error('Backblaze B2 credentials are not set in environment variables.');
  }

  const authString = `Basic ${Buffer.from(`${keyId}:${applicationKey}`).toString('base64')}`;
  
  const response = await axios.get('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
    headers: { 'Authorization': authString },
  });

  return {
    apiUrl: response.data.apiUrl,
    authorizationToken: response.data.authorizationToken,
    recommendedPartSize: response.data.recommendedPartSize,
  };
}

// Genkit Flow Definition
const uploadToB2Flow = ai.defineFlow(
  {
    name: 'uploadToB2Flow',
    inputSchema: B2UploadInputSchema,
    outputSchema: B2UploadOutputSchema,
  },
  async ({ fileBuffer, fileName, fileType }) => {
    try {
      const { apiUrl, authorizationToken } = await getB2Auth();
      const bucketId = '4762c4740e53a333c5e90e13'; // Hardcoded Bucket ID for 'quickly-study'

      // Step 1: Get Upload URL
      const getUploadUrlResponse = await axios.post(
        `${apiUrl}/b2api/v2/b2_get_upload_url`,
        { bucketId },
        { headers: { 'Authorization': authorizationToken } }
      );
      const { uploadUrl, authorizationToken: uploadAuthToken } = getUploadUrlResponse.data;

      // Step 2: Calculate SHA1 checksum
      const sha1 = crypto.createHash('sha1').update(fileBuffer).digest('hex');

      // Step 3: Upload the file
      const uploadResponse = await axios.post(uploadUrl, fileBuffer, {
        headers: {
          'Authorization': uploadAuthToken,
          'X-Bz-File-Name': encodeURI(fileName),
          'Content-Type': fileType,
          'Content-Length': fileBuffer.length,
          'X-Bz-Content-Sha1': sha1,
        },
      });

      return uploadResponse.data;

    } catch (error: any) {
        console.error('B2 Upload Error:', error.response?.data || error.message);
        const errorMessage = error.response?.data?.message || 'Failed to upload file to Backblaze B2.';
        throw new Error(errorMessage);
    }
  }
);


// 2. Client-side wrapper function
export async function uploadFile(file: File, onUploadProgress: (progressEvent: AxiosProgressEvent) => void): Promise<B2UploadOutput> {
    // This function will run on the client
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // To call a Genkit flow from the client, we need a different approach.
    // The flow itself runs on the server. We will create a Next.js API route to call the flow.
    // For now, let's simulate the flow call for the client-side logic.
    // In a real scenario, this would be an API call to a Next.js route handler
    // that invokes `uploadToB2Flow`.
    // Let's create the backend logic directly and call it from an API route.
    
    // For this implementation, we will directly call the B2 API from a server action (this flow).
    // This is possible because Genkit flows run on the server.

    try {
        const { apiUrl, authorizationToken } = await getB2Auth();
        const bucketId = '4762c4740e53a333c5e90e13';

        const getUploadUrlResponse = await axios.post(
            `${apiUrl}/b2api/v2/b2_get_upload_url`,
            { bucketId },
            { headers: { 'Authorization': authorizationToken } }
        );
        const { uploadUrl, authorizationToken: uploadAuthToken } = getUploadUrlResponse.data;

        const sha1 = crypto.createHash('sha1').update(fileBuffer).digest('hex');

        const uploadResponse = await axios.post(uploadUrl, fileBuffer, {
            headers: {
                'Authorization': uploadAuthToken,
                'X-Bz-File-Name': encodeURI(file.name),
                'Content-Type': file.type,
                'Content-Length': file.size,
                'X-Bz-Content-Sha1': sha1,
            },
            onUploadProgress
        });

        return uploadResponse.data;
    } catch (error: any) {
        console.error('B2 Upload Error (Client Wrapper):', error.response?.data || error.message);
        const errorMessage = error.response?.data?.message || 'Failed to upload file to Backblaze B2.';
        throw new Error(errorMessage);
    }
}
