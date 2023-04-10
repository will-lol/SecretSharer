import { APIEvent } from "solid-start";
import { z } from "zod";
import { connect } from "@planetscale/database";

const request = z.object({
  data: z.string(),
});

const config = {
  host: process.env.DATABASE_HOST,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
};

export const response = z.object({
  UUID: z.string(),
});

export async function POST(event: APIEvent) {
  const requestFetch = request.safeParse(await event.request.json());
  if (!requestFetch.success) {
    return new Response("Malformed request", { status: 400 });
  }
  const requestData = requestFetch.data.data;
  const UUID = globalThis.crypto.randomUUID();
  const conn = connect(config);
  const results = await conn.execute(
    `INSERT INTO Secrets VALUES ("${UUID}", "${requestData}");`
  );
  return new Response(JSON.stringify({ UUID: UUID }), { status: 200 });
}
