---
title: Senseful, an English vocabulary app I built to replace Anki
description: I built a vocabulary app where you don't rate difficulty or type in words. You just translate example sentences. Here is what I handed to Claude and what I didn't.
date: 2026-10-23
---

I was studying English vocabulary with Anki, and two things kept bothering me.

- Every card asks me to pick Again, Hard, Good or Easy myself.
- I have to look up and type in the words, meanings and example sentences myself.

So I built an app where all I do is answer. It's called [Senseful](https://senseful.vercel.app), because you learn a word one sense at a time.

![Three Senseful screens (in Korean): a study card where you type a Korean translation of an English sentence, a "correct" verdict with the model translation and the reason, and the home screen with today's study and the last 7 days](./images/screens.jpg)

## How you study

1. You see an English example sentence and type a Korean translation.
2. Claude grades it right or wrong and shows the model translation and its reason. If you disagree, you can override the verdict right away.
3. The final verdict sets the next review date.

The app decides what to learn, whether you got it right, and when you see it again. My only job is translating.

The app is for Korean speakers, so its screens are in Korean.

## One sense, one card

"Run" as in "to run on foot" and "run" as in "to run a business" are separate cards. If a whole word were one card, knowing its easiest sense would be enough to move on. Senses also differ in difficulty, so cards start from the easiest level (A1). There are about 13,500 senses from A1 to C1.

## What I didn't hand to Claude: picking senses and levels

At first I wanted Claude to take a word and a level and list every sense up to that level. I tested this before building it. Only 87% of the senses that should have been there came out, and only 67% at A1. Claude doesn't know the official level of each sense, so it missed senses and mixed in senses above the level at the same time.

So I split the work.

- The list of senses and their levels is fixed ahead of time from the dictionary's official CEFR labels.
- Claude only writes, for each sense, its Korean meaning, an English example sentence and its translation.

I also set a rule. Missing a few senses is acceptable, but teaching something wrong is not. I generated a test set of 186 cards with several models and picked Opus, which had no flagged errors and the fewest awkward examples.

## I set the grading standard myself

A translation is right if it means the same thing. Different word order or tone is fine. Getting only the target word right while the rest means something else is wrong.

To see whether Claude follows this, I made 47 test answers. Claude drafted the answers, and I labeled each one right or wrong myself. If Claude had labeled them too, the labels would lean the same way as the grading model, and I couldn't catch where it disagrees with me. As it turned out, I was stricter than the drafts assumed. I marked translations that dropped a modifier like "small" or "about", or changed the tense, as wrong, and typos as right.

I set a separate bar for each kind of mistake.

- Grading a wrong answer as right: zero allowed. If the app says you're right, you won't check again, and you learn it wrong.
- Grading a right answer as wrong: two or fewer. The override button covers these.

I ran each model three times. In all three runs, Opus graded zero wrong answers as right and one right answer as wrong. A grade costs about 1.4 cents. An answer identical to the stored translation is marked right without calling the API.

I tuned the prompt while looking at the same 47 answers, so it may fit that set too well. Every override is logged, and I'm checking it with real use.

## FSRS with two buttons

Reviews are scheduled by FSRS (`ts-fsrs`), the spaced repetition algorithm that Anki also ships with, using only two grades: right is Good, wrong is Again. Get it right and the interval grows. Get it wrong and the card comes back in a few minutes.

I added one rule. Cards for other senses of the same word are held back so they don't show up on the same day. Otherwise one card's example sentence could give away the answer to the next.

## From a personal tool to a public app

At first it ran only on my Mac, with no login, a local database, and a Dock icon that started the server. After a few days of daily use, I wanted to study on my phone too, so I turned it into a web app with Google sign-in and made it public.

- Next.js 16, Neon Postgres, Drizzle ORM, Vercel
- Cards are shared by everyone, and study progress is kept per person.
- Fixed costs are zero. A daily grading limit keeps the Claude API bill in check.

I built it with Claude Code. I wrote down the reason for each decision, and for large pieces of work I wrote a spec first and had Claude implement it to the end. The tests above came out of that process.

## Try it

- Site: [senseful.vercel.app](https://senseful.vercel.app)
- Code: [GitHub](https://github.com/mivomad33/senseful)

It's a beta with a daily grading limit.
