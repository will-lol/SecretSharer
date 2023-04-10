import { JSX } from "solid-js";

interface props extends JSX.HTMLAttributes<HTMLButtonElement> {
    buttonType?: string;
    disabled?: boolean;
}

export default function Button(props: props) {
    let classList = "";
    if (!props.buttonType) {
        classList = "disabled:pointer-events-none disabled:opacity-70 px-3 py-1 border border-solid dark:text-white dark:bg-gray-700 dark:border-gray-900 border-gray-200 shadow-sm active:scale-95 transition-all hover:shadow-md text-black"
    } else if (props.buttonType == "destructive") {
        classList = "disabled:pointer-events-none disabled:opacity-70 px-3 py-1 border border-solid border-red-600 shadow-sm active:scale-95 transition-all hover:shadow-md bg-red-500 text-white"
    }
  return (
    <button {...props} disabled={props.disabled} class={classList}></button>
  );
}
