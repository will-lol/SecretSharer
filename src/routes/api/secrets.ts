import { APIEvent } from "solid-start";
import { json } from "solid-start/api";
import { z } from "zod";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../../s3Client";

const request = z.object({
  data: z.string(),
});

export const response = z.object({
  UUID: z.string(),
});

export async function POST(event: APIEvent) {
  const requestFetch = request.safeParse(await event.request.json());
  if (!requestFetch.success) {
    return new Response("Malformed request", { status: 400 });
  }
  const requestData = requestFetch.data.data;
  if (requestData.length > 4000000) {
    return new Response("File too large", { status: 400 });
  }
  const UUID = globalThis.crypto.randomUUID();
  try {
    await s3Client.send(new PutObjectCommand({Bucket: process.env.S3_BUCKET_ID, Body: requestData, Key: UUID}));
    return json({UUID: UUID});
  } catch(err) {
    return new Response("Internal server error", { status: 500 });
  }
}

