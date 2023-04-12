import Receiver from "../components/Receiver";

export default function Receive() {
  return (
    <main class="container mx-auto px-4 pb-4 sm:px-0">
        <div class="flex-col flex sm:items-center sm:mb-10 mb-5 sm:mt-20 mt-6">
          <h1 class="font-bold text-5xl sm:mb-6 mb-4 sm:text-center">You've got secrets!</h1>
        <p class="max-w-2xl sm:text-center">It's me the Secret Sharer 5000. Someone has sent you a secret. I have carefully cradled the secret across the ocean and now, I am handing it over. Be wary of the secret though, you cannot see it again after you close this tab. Unlock the secret by clicking the big red button. As soon as you unlock the secret, it is gone.</p>
      </div>
      <Receiver />
    </main>
  );
}
