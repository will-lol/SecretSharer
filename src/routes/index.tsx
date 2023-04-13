import Sharer from "../components/Sharer"
import A from "../components/A";

export default function Home() {
  return (
    <main class="container mx-auto px-4 pb-4 sm:px-0">
      <div class="flex-col flex sm:items-center sm:mb-10 mb-5 sm:mt-20 mt-6">
        <h1 class="font-bold text-5xl sm:mb-6 mb-4 sm:text-center">Secret Sharer 5000</h1>
        <p class="max-w-2xl sm:text-center">Send small secrets in the form of files and text to a trusted recipient. The <b>link</b>  itself <b>contains the keys to open your secret</b>. Please be mindful of how you send the link. The secret will <b>disappear once unlocked</b> by a recipient. If not unlocked by a recipient within <b>1 day</b>, the secret will be <b>deleted</b>. Your secrets are <A href="https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt#aes-gcm">encrypted on device</A> and stored in <A href="https://aws.amazon.com/s3/">AWS S3</A>.</p> 
      </div>
      <Sharer/>
    </main>
  );
}