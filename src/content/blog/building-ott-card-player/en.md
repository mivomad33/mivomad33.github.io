---
title: One Card, One Episode - an OTT Card Player for My Daughter
description: I built a program that plays exactly one Netflix or Disney+ video when a card is placed on a reader. This post covers what I decided so that when one episode ends, it really ends.
date: 2026-10-26
---

I built this for my daughter. Netflix and Disney+ have countless videos for kids, and I didn't like watching her scroll through those endless lists to pick one. It was just a list on a screen with nothing to hold, so nothing felt like "hers."

At first I wanted to use DVDs. But DVDs are fading out: new titles don't come out on them, and players are hard to find. So I moved only the good parts of DVDs over to streaming. Each video gets its own NFC card, and she just picks the card she wants and puts it on the reader. No menus, no recommendations, no autoplaying the next episode.

![Left: the idle screen showing "All done! Put another card on" (in Korean). Right: two card covers, one with an English badge and one with a Korean badge. The pictures and titles on the covers are a made-up sample](./images/screens.jpg)

## How it works

- Put a card on the reader and that video plays full screen. Take it off and it pauses.
- Put the same card back and it continues where it stopped. Put a different card and it switches to that video.
- After the end credits, it goes back to the idle screen and shows "All done! Put another card on."
- The audio is in the language written on the card, and subtitles are always off. She can't read yet, so there is no reason to turn them on.

Each card (NTAG215) holds a single line with the service, the video ID and the audio language, like `netflix:81387730:en`. A parent starts the program by double-clicking a desktop icon and quits with Alt+F4. I also built a tool that writes cards and a tool that makes card covers.

## When one episode ends, it ends

A card is always exactly one video. No card points to a whole series, and when an episode ends, nothing moves on to the next episode or a recommendation. A few decisions keep it that way.

- **Credits play to the end.** The program closes the next-episode prompt the service shows during the credits. The end is judged by the video's ended signal, not by the time left. Treating it as over one second early would cut off the end of the credits.
- **There is a separate "finished" state.** When a video ends, the card is still on the reader. Going straight back to idle would mean "a card is on the reader, so play it," and the same video would loop forever. So there is a state that means "this card is done; wait until it's removed or replaced." To watch the same video again, take the card off and put it back.
- **Taking a card off waits one second.** That way, a slightly shifted card or a momentary read dropout doesn't make the video stop and start. The same grace period applies after a video is finished. Without it, a brief dropout alone would restart the video she just finished from the beginning.

Disney+ needed one more thing. If she put back the card of a video she had just finished, Disney+ resumed about five seconds before the end, and "All done" appeared five seconds later. That is exactly when a kid puts the card back to watch it "one more time." So when a video opened from a card starts near its end, the program jumps back to the beginning.

## Never leaving her on a service screen

A missing video, a title blocked on the kids profile, a profile picker that pops up out of nowhere, a dropped internet connection. A child can't do anything on screens like these. So there are timeouts that don't care about the cause.

- If a video doesn't start within 20 seconds of opening, the program opens it once more, and if it still doesn't play, it goes back to the idle screen and shows "This card can't be watched right now."
- The same happens if playback stays stuck for more than 30 seconds.
- If it notices the login has expired, it shows "Please call a parent."

Each time the program checks the screen, these decisions to give up come first. If it tried to handle a profile picker it can't use or a credits prompt that won't close first, the timeouts would never be checked while that screen stayed up.

Pausing and playing aren't one-shot commands either. Every second, the program reads what the screen is actually doing and corrects it if it differs from whether the video should be playing or paused. If the card is removed while the page is still loading, a pause command sent before the video exists does nothing, and the video then plays with no card on the reader. I also didn't use the space bar to toggle play and pause. With a toggle, one missed step and everything runs backwards.

## No official API, so experiments first

Netflix and Disney+ don't offer an official way to control playback like this. The program works through their web pages and the requests the sites use internally. So the design was first written on assumptions about how the services would behave, and none of them had been checked.

Before building anything, I ran experiments. The first one checked 14 items against real Netflix, and 4 of them differed from my assumptions enough to change the design.

- The profile picker has the same address as the browse page, so it can't be told apart by address. I switched to recognizing it by an element on the page.
- A missing or blocked video shows an error screen right away, so the program can notice without waiting 20 seconds.
- The credits prompt can be closed.
- When the login expires during use, the site goes to the title's info page, not the login page.

A screen is only recognized when "something that only that screen has is visible." Reasoning "the other screens' markers are missing, so it must be this one" goes wrong while a page is still loading and hasn't drawn them yet.

I also made a mistake while experimenting with the reader. I sent a command I thought would read the card detection setting, but it actually changed it, and the reader's automatic card detection turned off. I set it back right away, and since then the program never sends commands that change the reader's own settings. I also left the reader's beep on. It tells her the card was recognized.

## Covers she can pick by picture

All the cards look the same, so a child who can't read can't tell which video is which. So I added a feature that takes video addresses and makes covers as a printable A4 PDF. Each cover goes into a toploader (a card sleeve) together with its card.

- The background is the title's portrait poster, and for a series episode, a still from that episode goes on top. That way episodes of the same series each get a different picture.
- Every video gets one English cover and one Korean cover, with the language shown as a colored badge at the top right. Instead of asking for a language, there is always a matching cover whichever language the card is written in.
- Each cover is 67×93mm, and nine fit on an A4 sheet. A 100mm scale bar is printed too, so the print scale can be checked with a ruler.
- The information comes from asking the services directly with the logged-in Chrome profile. At first I pulled it from the data exchanged while a video played, but that meant playing the video and possibly leaving it in the watch history, so I switched to asking without playing.

I confirmed the cover size inside the PDF is correct, but I haven't printed one and measured it yet.

## How I built it

- Python 3.13 on Windows 10. The reader is an ACR1252U, and the program talks to it through Windows' standard smart card interface (PC/SC) with `pyscard`. The card memory is read and written directly with reader commands, without a library. The card holds just one text record, so a short piece of code was enough.
- It uses the installed Chrome because Netflix and Disney+ need its DRM. If Playwright launches Chrome, the DRM module may not be ready, so the program launches Chrome itself and Playwright only attaches to control it.
- Reader monitoring, keyboard input and timers only put events into a single event queue, and the state logic handles them one at a time. So things happening at once don't get out of order, and a fake reader driven by the keyboard can replace the real reader without changing anything else.
- The automated tests (`pytest`) never use the real reader. Test results once changed depending on whether a card was sitting on the reader, so the tests plug in a fake that follows the Windows behavior I confirmed with the real reader. Netflix and Disney+ are checked with fake video sites that imitate them, running in real Chrome.

Putting a card back and getting the video playing again actually takes about 0.4 seconds. My daughter loves these cards and uses them a lot. With their covers in, the cards really look like her own video collection.

## Try it

- Code: [GitHub](https://github.com/mivomad33/ott-card-player)

It's a Windows program and needs an NFC reader, cards, and a subscription to each service. It's a personal project not affiliated with Netflix or Disney+, and it may stop working if the services change their pages. The pictures and titles on the covers belong to the services, so the covers are for personal use at home only.
