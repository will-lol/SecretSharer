import { createSignal, createEffect, Switch, Match, Show } from "solid-js";
import { createFileUploader, UploadFile } from "@solid-primitives/upload";

function toBinaryString(string: string) {
  const codeUnits = Uint16Array.from(
    { length: string.length },
    (element, index) => string.charCodeAt(index)
  );
  const charCodes = new Uint8Array(codeUnits.buffer);

  let result = "";
  charCodes.forEach((char) => {
    result += String.fromCharCode(char);
  });
  return result;
}

function fromBinaryString(binary: string) {
  const bytes = Uint8Array.from({ length: binary.length }, (element, index) =>
    binary.charCodeAt(index)
  );
  const charCodes = new Uint16Array(bytes.buffer);

  let result = "";
  charCodes.forEach((char) => {
    result += String.fromCharCode(char);
  });
  return result;
}

export default function Sharer() {
  let button: HTMLButtonElement;

  const [text, setText] = createSignal("");
  const [submitting, setSubmitting] = createSignal(false);

  const { files, selectFiles } = createFileUploader({
    multiple: false,
  });

  function textValidator(text: string): boolean {
    return text.length > 0 && text.length < 5000;
  }

  function filesValidator(files: UploadFile[]): boolean {
    if (files.length != 1) {
      return false;
    } else if (files[0].size < 5000) {
      return true;
    } else {
      return false;
    }
  }

  interface payload {
    type: "file" | "text";
    metadata?: {
      name: string;
    };
    data: string;
  }

  async function submit(e: Event) {
    e.preventDefault();
    setSubmitting(true);

    let payload: string;
    if (filesValidator(files())) {
      const submittedFile = files()[0];
      const data: payload = {
        type: "file",
        metadata: {
          name: submittedFile.name,
        },
        data: await submittedFile.file.text(),
      };
      payload = JSON.stringify(data);
    } else if (textValidator(text())) {
      const submittedText = text();
      const data: payload = {
        type: "text",
        data: submittedText,
      };
      payload = JSON.stringify(data);
    } else {
      console.log("Something went wrong.");
      return;
    }

    const encoder = new TextEncoder();
    const payloadBuffer = encoder.encode(payload);
    const key = await globalThis.crypto.subtle.generateKey({ name: "AES-GCM", length: 128 }, true, ["encrypt", "decrypt"]);
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await globalThis.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, payloadBuffer);
    const decoder = new TextDecoder();
    const encryptedData = decoder.decode(encrypted);
    const b64Encoded = btoa(toBinaryString(encryptedData));
    const exportedKey = await globalThis.crypto.subtle.exportKey("jwk", key);

    const b64Decoded = fromBinaryString(atob(b64Encoded));
    const decodedBuffer = encoder.encode(b64Decoded);
    const importedKey = await globalThis.crypto.subtle.importKey("jwk", exportedKey, "AES-GCM", true, ["encrypt", "decrypt"]);
    const decrypted = await globalThis.crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, importedKey, decodedBuffer);

    console.log(decrypted);
  }

  createEffect(() => {
    if (textValidator(text()) || filesValidator(files())) {
      button.disabled = false;
    } else {
      button.disabled = true;
    }
  });

  return (
    <form onSubmit={submit}>
      <div class="w-full h-96 relative flex justify-center items-center ">
        <textarea
          autocomplete="off"
          disabled={filesValidator(files()) || submitting()}
          onKeyPress={(el) => {
            if (!el.currentTarget.value) {
              setText("");
            } else {
              setText(el.currentTarget.value);
            }
          }}
          placeholder="Paste or type here"
          class="disabled:placeholder-transparent disabled:text-transparent peer w-full h-full border border-solid shadow-inner p-4"
        ></textarea>
        <div class="peer-focus:hidden block w-full h-full pointer-events-none bg-gray-500  bg-opacity-10 absolute"></div>
        <div class="p-10 peer-focus:hidden absolute text-gray-600">
          <Switch>
            <Match when={!filesValidator(files())}>
              <div>
                Click the text box or{" "}
                <a
                  class="underline text-black cursor-pointer"
                  onClick={() => {
                    selectFiles((files) => {});
                  }}
                >
                  browse
                </a>{" "}
                for file
              </div>
              <div class="text-gray-500 text-center text-sm">
                Max. 5000 characters or 5kb file
              </div>
            </Match>
            <Match when={filesValidator(files())}>
              <div class="flex justify-center items-center flex-col">
                <img class="w-20" src="fileIcon.svg" alt="" />
                <span class="mt-4">{files()[0].name}</span>
              </div>
            </Match>
          </Switch>
        </div>
      </div>
      <button
        disabled={submitting()}
        ref={button}
        class="w-full h-10 bg-blue-500 text-white font-bold inline-flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-slate-400 disabled:pointer-events-none dark:focus:ring-offset-slate-900 data-[state=open]:bg-slate-100 dark:data-[state=open]:bg-slate-800"
      >
        <Switch>
          <Match when={submitting()}>
            Submitting...{" "}
            <img class="ml-3 w-4 animate-spin" src="loader.svg" alt="" />
          </Match>
          <Match when={!submitting()}>Submit</Match>
        </Switch>
      </button>
    </form>
  );
}
