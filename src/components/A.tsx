import { JSX } from "solid-js";

export default function A(props: JSX.HTMLAttributes<HTMLAnchorElement>) {
  return (
    <a class="underline text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white cursor-pointer" {...props}></a>
  );
}
