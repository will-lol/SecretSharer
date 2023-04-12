import { APIEvent, json } from "solid-start/api";
import "dotenv/config";
import { connect } from "@planetscale/database";
import { z } from "zod";
import { Receiver } from "@upstash/qstash";

export const config = {
  host: process.env.DATABASE_HOST,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  runtime: "edge",
};

const dbReturn = z.object({
  SecretID: z.string(),
  Data: z.string(),
});

const tokenShape = z.object({ current: z.string(), next: z.string() });
const res = fetch("https://qstash.upstash.io/v1/keys", {headers: { Authorization: `Bearer ${process.env.QSTASH_TOKEN}` }}).then((res) => res.json()).then((res) => tokenShape.parse(res));

export async function GET({ params }: APIEvent) {
  const parameter = params.id;
  const conn = connect(config);
  const results = await conn.execute(
    'SELECT * FROM Secrets WHERE SecretID="' + parameter + '"'
  );
  const resultsDelete = await conn.execute(
    'DELETE FROM Secrets WHERE SecretID="' + parameter + '"'
  );

  if (results.rows[0] && resultsDelete.rowsAffected == 1) {
    const resultFinal = dbReturn.safeParse(results.rows[0]);
    if (resultFinal.success) {
      return json(resultFinal.data);
    }
  }

  return new Response("ID not found", { status: 404 });
}

export async function POST(event: APIEvent) {
  console.log(JSON.stringify(event));
  const params = event.params;
  const keys = tokenShape.safeParse(await res);
  let r: Receiver
  if (keys.success) {
    r = new Receiver({
      currentSigningKey: keys.data.current,
      nextSigningKey: keys.data.next
    });
  } else {
    console.log("Couldn't get keys");
    return new Response("Couldn't get keys", {status: 500});
  }

  const signature = event.request.headers.get("Upstash-Signature");
  if (!signature) {
    console.log("Couldn't get signature")
    return new Response("Couldn't get signature", {status: 400});
  }
  const body = await event.request.text();

  const isValid = await r.verify({
    signature: signature,
    body: body
  })

  if (isValid) {
    const parameter = params.id;
    const conn = connect(config);
    const resultsDelete = await conn.execute(
      'DELETE FROM Secrets WHERE SecretID="' + parameter + '"'
    );
    if (resultsDelete.rowsAffected == 1) {
      return new Response("Success", { status: 200 });
    } else {
      return new Response("ID not found", { status: 404 });
    }
  }
}
