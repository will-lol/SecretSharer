import { createSignal, createEffect, Switch, Match, Show } from "solid-js";
import { createFileUploader, UploadFile } from "@solid-primitives/upload";

interface payload {
  type: "file" | "text";
  metadata?: {
    name: string;
  };
  data: string;
}

interface payloadParcel {
  iv: number[],
  data: string
}

function toBinaryString(array: Uint8Array) {
  const stringArray: string[] = [];
  for (const i of array) {
    stringArray.push(String.fromCharCode(i));
  }
  return stringArray.join("");
}

function compareArray(array1: any[], array2: any[]) {
  if (array1.length != array2.length) {
    return false;
  }
  if (array1 == array2) {
    return true;
  }
  let flag = false;
  let num = 0;
  while (!flag) {
    if (!(array1[num] == array2[num])) {
      flag = true;
    }
    if (num > array1.length-1) {
      break;
    }
    num++
  }
  return flag;
}

function toUintArray(string: string) {
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
    } else if (textValidator(textArea.value)) {
      const submittedText = textArea.value;
      const data: payload = {
        type: "text",
        data: submittedText,
      };
      payload = JSON.stringify(data);
    } else {
      console.log("Something went wrong.");
      return;
    }

    //encode
    const encoder = new TextEncoder();
    const payloadBuffer = encoder.encode(payload);
    const key = await globalThis.crypto.subtle.generateKey({ name: "AES-GCM", length: 128 }, true, ["encrypt", "decrypt"]);
    const exportedKey = await globalThis.crypto.subtle.exportKey("jwk", key);
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await globalThis.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, payloadBuffer);
    const encryptedArray = new Uint8Array(encrypted);
    const encryptedB64String = btoa(toBinaryString(encryptedArray));

    const finalPayload: payloadParcel = {
      iv: Array.from(iv),
      data: encryptedB64String
    }

    /*const deb64 = atob(encryptedB64String);
    const decodedArray = toUintArray(deb64);

    const importedKey = await globalThis.crypto.subtle.importKey("jwk", exportedKey, "AES-GCM", true, ["encrypt", "decrypt"]);
    const decrypted = await globalThis.crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, importedKey, decodedArray);

    const decoder = new TextDecoder();
    const decryptedString = decoder.decode(decrypted);

    console.log(decryptedString);*/
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
          ref={textArea}
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
