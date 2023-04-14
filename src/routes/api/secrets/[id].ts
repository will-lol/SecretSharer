import { APIEvent, json } from "solid-start/api";
import "dotenv/config";
import { z } from "zod";
import { GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../../../s3Client";

const dbReturn = z.object({
  SecretID: z.string(),
  Data: z.string(),
});

export async function GET({ params }: APIEvent) {
  const UUID = params.id;
  
  let download: string | undefined;
  try {
    download = await s3Client.send(new GetObjectCommand({Bucket: process.env.S3_BUCKET_ID, Key: UUID})).then((res) => res.Body?.transformToString());
    if (download == undefined) {
      throw("Object undefined");
    }
  } catch {
    return new Response("Couldn't fetch object", {status: 404});
  }
  try {
    await s3Client.send(new DeleteObjectCommand({Bucket: process.env.S3_BUCKET_ID, Key: UUID}));
  } catch {
    return new Response("Couldn't delete object", {status: 500});
  }

  const returnObj = {SecretID: UUID, Data: download} as ReturnType<typeof dbReturn.parse>;
  return json(returnObj);
}