import { createSignal, Switch, Match, Show } from "solid-js";
import { createFileUploader, UploadFile } from "@solid-primitives/upload";
import A from "../components/A";

interface payload {
  type: "file" | "text";
  metadata?: {
    name: string;
  };
  data: string;
}

export interface payloadParcel {
  iv: number[];
  data: string;
}

export interface linkData {
  key: JsonWebKey;
  uuid: string;
}

export function toBinaryString(array: Uint8Array) {
  const stringArray: string[] = [];
  for (const i of array) {
    stringArray.push(String.fromCharCode(i));
  }
  return stringArray.join("");
}

export function toUintArray(string: string) {
  const array = new Uint8Array(string.length);
  for (let i = 0; i < string.length; i++) {
    array[i] = string.charCodeAt(i);
  }
  return array;
}

export default function Sharer() {
  let button: HTMLButtonElement;
  let textArea: HTMLTextAreaElement;

  const [text, setText] = createSignal("");
  const [submitState, setSubmitState] = createSignal("idle");
  const [link, setLink] = createSignal("");
  const [error, setError] = createSignal("");

  const { files, selectFiles } = createFileUploader({
    multiple: false,
  });

  function textValidator(text: string): boolean {
    return text.length > 0 && text.length < 5000;
  }

  function filesValidator(files: UploadFile[]): boolean {
    if (files.length != 1) {
      return false;
    } else if (files[0].size < 1000000) {
      return true;
    } else {
      return false;
    }
  }

  async function submit(e: Event) {
    e.preventDefault();
    setSubmitState("submitting");

    let payload: string;
    if (filesValidator(files())) {
      const submittedFile = files()[0];
      const string = toBinaryString(new Uint8Array(await submittedFile.file.arrayBuffer()));
      
      const data: payload = {
        type: "file",
        metadata: {
          name: submittedFile.name,
        },
        data: string,
      };
      payload = JSON.stringify(data);
    } else if (textValidator(textArea.value)) {
      const submittedText = textArea.value;
      const data: payload = {
        type: "text",
        data: submittedText,
      };
      payload = JSON.stringify(data);
    } else {
      setSubmitState("error");
      setError("Couldn't validate your input — Please ensure your file is below 1MB or text is below 5000 characters");
      return;
    }

    //encode
    const encoder = new TextEncoder();
    const payloadBuffer = encoder.encode(payload);
    const key = await globalThis.crypto.subtle.generateKey(
      { name: "AES-GCM", length: 128 },
      true,
      ["encrypt", "decrypt"]
    );
    const exportedKey = await globalThis.crypto.subtle.exportKey("jwk", key);
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await globalThis.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      payloadBuffer
    );
    const encryptedArray = new Uint8Array(encrypted);
    const encryptedB64String = btoa(toBinaryString(encryptedArray));

    const finalPayload: payloadParcel = {
      iv: Array.from(iv),
      data: encryptedB64String,
    };

    const result = await fetch("api/secrets", {
      method: "POST",
      body: JSON.stringify({ data: btoa(JSON.stringify(finalPayload)) }),
    });
    const UUID = await result.json() as { UUID: string };
    if (result.status == 200) {
      const link = new URL(window.location.origin + "/receive/");
      const data: linkData = { key: exportedKey, uuid: UUID.UUID };
      link.searchParams.set("data", btoa(JSON.stringify(data)));
      navigator.clipboard.writeText(link.href);
      setLink(link.href);
      setSubmitState("submitted");
    } else {
      setSubmitState("error");
      setError("Couldn't send request")
    }
  }

  return (
    <form onSubmit={submit}>
      <div class="w-full h-96 relative flex justify-center items-center ">
        <textarea
          ref={textArea}
          autocomplete="off"
          disabled={filesValidator(files()) || submitState() != "idle"}
          onKeyPress={(el) => {
            if (!el.currentTarget.value) {
              setText("");
            } else {
              setText(el.currentTarget.value);
            }
          }}
          placeholder="Paste or type here"
          class="disabled:placeholder-transparent disabled:text-transparent dark:bg-gray-800 peer w-full h-full border border-solid dark:border-black shadow-inner p-3"
        ></textarea>
        <Switch>
          <Match when={submitState() == "idle"}>
            <Show when={!(text().length > 0)}>
              <div class="peer-focus:hidden block w-full h-full pointer-events-none bg-gray-500  bg-opacity-10 absolute"></div>
              <div class="p-10 peer-focus:hidden absolute text-gray-600 dark:text-gray-100">
                <Switch>
                  <Match when={!filesValidator(files())}>
                    <div class="text-center">
                      Click the text box or{" "}
                      <A
                        onClick={() => {
                          selectFiles((files) => {});
                        }}
                      >
                        browse
                      </A>{" "}
                      for file
                    </div>
                    <div class="text-gray-500 dark:text-gray-400 text-center text-sm">
                      Max. 5000 characters or 1MB file
                    </div>
                    <Show when={files()[0] && !filesValidator(files())}>
                        <div class="text-red-600 dark:text-red-400 text-center text-sm">
                          File too large.
                        </div>
                    </Show>
                  </Match>
                  <Match when={filesValidator(files())}>
                    <div class="flex justify-center items-center flex-col">
                      <img class="w-20" src="fileIcon.svg" alt="" />
                      <span class="mt-4">{files()[0].name}</span>
                    </div>
                  </Match>
                </Switch>
              </div>
            </Show>
          </Match>
          <Match when={submitState() == "submitted"}>
            <div class="absolute text-gray-600 dark:text-gray-100 max-w-sm text-center break-all m-4">
              <div class="whitespace-nowrap overflow-x-scroll p-4 max-w-lg relative">
                <input type="text" value={link()} onClick={(ev) => {ev.currentTarget.select()}} class="z-0 p-1 bg-transparent"></input> 
              </div>
            </div>
          </Match>
        </Switch>
      </div>
      <button
        disabled={submitState() != "idle" || !(textValidator(text()) || filesValidator(files()))}
        ref={button}
        class="w-full h-10 bg-blue-500 text-white font-bold inline-flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-slate-400 disabled:pointer-events-none dark:focus:ring-offset-slate-900 data-[state=open]:bg-slate-100 dark:data-[state=open]:bg-slate-800"
      >
        <Switch>
          <Match when={submitState() == "submitting"}>
            Submitting...{" "}
            <img class="ml-3 w-4 animate-spin" src="loader.svg" alt="" />
          </Match>
          <Match when={submitState() == "idle"}>Submit</Match>
          <Match when={submitState() == "submitted"}>
            Submitted and link copied!
          </Match>
          <Match when={submitState() == "error"}>
            {error()}
          </Match>
        </Switch>
      </button>
    </form>
  );
}
