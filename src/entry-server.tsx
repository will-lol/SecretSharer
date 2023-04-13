import {
  StartServer,
  createHandler,
  renderAsync,
} from "solid-start/entry-server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const rateLimiter = new Ratelimit({
  redis: new Redis({url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN}),
  limiter: Ratelimit.slidingWindow(2, "10s"),
  prefix: "@upstash/ratelimit",
});

export default createHandler(
  ({ forward }) => {
    return async (event) => {
      const url = new URL(event.request.url);
      if (url.pathname.includes("/api/")) {
        const id = event.clientAddress;
        const rateLimitResult = await rateLimiter.limit(id);

        if (!rateLimitResult.success) {
          return new Response("Couldn't process request", { status: 429 });
        }

        return forward(event);
      } else {
        return forward(event);
      }
    };
  },
  renderAsync((event) => <StartServer event={event} />)
);
