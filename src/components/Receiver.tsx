import { createSignal, Match, Switch } from "solid-js";
import { linkData } from "./Sharer";
import { z } from "zod";
import { toUintArray } from "./Sharer";
import Button from "./Button";

const encryptedData = z.object({
  SecretID: z.string(),
  Data: z.string(),
});

const payloadParcelParser = z.object({
  iv: z.array(z.number()),
  data: z.string(),
});

const payload = z.object({
  type: z.string(),
  metadata: z.optional(
    z.object({
      name: z.string(),
    })
  ),
  data: z.string(),
});

export default function Receiver() {
  const [recieveStatus, setRecieveStatus] = createSignal("idle");
  const [data, setData] = createSignal({} as ReturnType<typeof payload.parse>);

  async function recieve() {
    setRecieveStatus("receiving");
    const currentURL = new URL(window.location.href);
    const keyParam = currentURL.searchParams.get("data");
    if (keyParam == null) {
      setRecieveStatus("failed");
      return;
    }
    let dataParamDecoded: linkData
    try {
      dataParamDecoded = JSON.parse(atob(keyParam)) as linkData;
    } catch {
      setRecieveStatus("failed");
      return;
    }
    const keyDecoded = dataParamDecoded.key as JsonWebKey;
    const uuid = dataParamDecoded.uuid;
    const uuidSchema = z.string().uuid();
    if (!uuidSchema.safeParse(uuid).success) {
      setRecieveStatus("failed");
    }
    const fetched = await fetch(
      globalThis.location.origin + "/api/secrets/" + uuid
    );
    if (fetched.status == 404) {
      setRecieveStatus("noexist");
    }
    const dataParsed = encryptedData.safeParse(await fetched.json());
    if (!dataParsed.success) {
      setRecieveStatus("failed");
      return;
    }
    const payloadParcelParsed = payloadParcelParser.safeParse(
      JSON.parse(atob(dataParsed.data.Data))
    );
    if (!payloadParcelParsed.success) {
      setRecieveStatus("failed");
    }
    const payloadParcel = payloadParcelParsed.data;
    const iv = new Uint8Array(payloadParcel.iv);

    const deb64 = atob(payloadParcel.data);
    const decodedArray = toUintArray(deb64);

    const importedKey = await globalThis.crypto.subtle.importKey(
      "jwk",
      keyDecoded,
      "AES-GCM",
      true,
      ["encrypt", "decrypt"]
    );
    const decrypted = await globalThis.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      importedKey,
      decodedArray
    );

    const decoder = new TextDecoder();
    const decryptedObjParsed = payload.safeParse(
      JSON.parse(decoder.decode(decrypted))
    );
    if (!decryptedObjParsed.success) {
      setRecieveStatus("failed");
    }

    setData(decryptedObjParsed.data);
    setRecieveStatus("received");
  }

  function downloadFile() {
    const elem = document.createElement("a");
    const array = toUintArray(data().data);
    const file = new File([array], data().metadata!.name);
    elem.href = URL.createObjectURL(file);
    elem.click();
    URL.revokeObjectURL(elem.href);
  }

  return (
    <>
      <div class="w-full h-96 relative flex justify-center items-center border border-solid dark:border-black dark:bg-gray-800 shadow-inner p-3">
        <Switch>
          <Match when={recieveStatus() != "received"}>
            <div class="absolute w-full h-full bg-gray-400 bg-opacity-20 flex justify-center items-center">
              <Button
                disabled={recieveStatus() != "idle"}
                onClick={recieve}
                buttonType="destructive"
              >
                <Switch>
                  <Match when={recieveStatus() == "idle"}>
                    <span class="sm:w-auto w-40 inline-block">Unlock secret and remove from servers</span>
                  </Match>
                  <Match when={recieveStatus() == "receiving"}>
                    Unlocking...{" "}
                    <img
                      class="inline ml-2 w-4 animate-spin"
                      src={`${window.location.origin}/loader.svg`}
                      alt=""
                    />
                  </Match>
                  <Match when={recieveStatus() == "failed"}>
                    Unlock failed
                  </Match>
                  <Match when={recieveStatus() == "noexist"}>
                    The requested secret does not exist
                  </Match>
                </Switch>
              </Button>
            </div>
          </Match>
          <Match when={recieveStatus() == "received"}>
            <Switch>
              <Match when={data().type == "file"}>
                <div class="w-full h-full flex justify-center items-center ">
                  <div class="flex justify-center items-center flex-col">
                    <img
                      class="w-20"
                      src={`${window.location.origin}/fileIcon.svg`}
                      alt=""
                    />
                    <span class="mt-4 mb-3">{data().metadata?.name}</span>
                    <Button onClick={downloadFile}>Download file</Button>
                  </div>
                </div>
              </Match>
              <Match when={data().type == "text"}>
                <div class="w-full h-full">{data().data}</div>
              </Match>
            </Switch>
          </Match>
        </Switch>
      </div>
    </>
  );
}
