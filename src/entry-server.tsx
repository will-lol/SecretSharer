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
  prefix: "@upstash/ratelimit"
})

export default createHandler(
  ({ forward }) => {
    return async event => {
      console.log(event.clientAddress);
      const req = event.request;
      const id = req.headers.get("x-forwarded-for");
      return forward(event);
    }
  },
  renderAsync((event) => <StartServer event={event} />)
);
