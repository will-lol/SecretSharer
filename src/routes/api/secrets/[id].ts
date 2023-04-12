import { APIEvent, json } from "solid-start/api";
import "dotenv/config";
import { connect } from "@planetscale/database";
import { z } from "zod";
import { jwtVerify } from "jose";

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

let signingKey: ReturnType<typeof tokenShape.parse> | undefined = undefined;

async function getSigningKeys() {
  return tokenShape.parse(
    await fetch("https://qstash.upstash.io/v1/keys", {
      headers: { Authorization: `Bearer ${process.env.QSTASH_TOKEN}` },
    }).then((res) => res.json())
  );
}

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
  const params = event.params;

  {
    const signature = event.request.headers.get("upstash-signature");
    if (signature) {
      if (signingKey = undefined) {
        signingKey = await getSigningKeys();
      }
      console.log(signingKey);
      const secret = new TextEncoder().encode((signingKey!.current));
      console.log(secret);
      const {payload, protectedHeader} = await jwtVerify(signature, secret);
      console.log(payload);
      console.log(protectedHeader);  
    }
  }

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
