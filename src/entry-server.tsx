import {
  StartServer,
  createHandler,
  renderAsync,
} from "solid-start/entry-server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const rateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(1, "5s"),
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
