import Receiver from "../components/Receiver";

export default function Receive() {
  return (
    <main class="container mx-auto px-4 pb-4 sm:px-0">
      <div class="flex-col flex sm:items-center sm:mb-10 mb-5 sm:mt-20 mt-6">
        <h1 class="font-bold text-5xl sm:mb-6 mb-4 sm:text-center">
          You've got secrets!
        </h1>
        <p class="max-w-2xl sm:text-center">
          Someone sent you an encrypted secret. You must unlock the secret to view it. <b>Once unlocked, you cannot unlock the secret again</b> as it is deleted from our servers at this point. The secret is automatically deleted one day after its initial creation. If you experience an unlock failure, please verify that the URL was copied intact. If the service reports that the secret does not exist, it is irrecoverable.
        </p>
      </div>
      <Receiver />
    </main>
  );
}
