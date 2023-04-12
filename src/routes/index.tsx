import Sharer from "../components/Sharer"

export default function Home() {
  return (
    <main class="container mx-auto px-4 pb-4 sm:px-0">
      <div class="flex-col flex items-center mb-10 mt-20">
        <h1 class="font-bold text-5xl mb-6 text-center">Secret Sharer 5000</h1>
        <p class="max-w-2xl text-center">The secret sharer 5000 is the next big thing. Using advanced encryption technology and general coolness, the Secret Sharer 5000 is able to facilitate encrypted sharing of small files and text with trusted individuals. The service is free to use but please do not abuse. Since the service is encrypted I can't monitor what you send, but please do not send anything you think I wouldn't like (please). All that is left to do now is to put all your secrets in the box below, copy a link and send to a trusted individual. The <b>link</b>  itself <b>contains the keys to open your secret</b>. Please be mindful of how you send the link. The secret will <b>disappear once unlocked</b> by a recipient. If not unlocked by a recipient within <b>1 day</b>, the secret will be <b>deleted</b></p> 
      </div>
      <Sharer/>
    </main>
  );
}