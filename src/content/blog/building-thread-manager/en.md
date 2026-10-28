---
title: thread-manager, a Dev Log Bot That Turns My Commits into Threads Posts
description: I built a dev log bot with Claude Code that reads the commits in my projects, writes Threads posts and publishes them. It first posted only what I approved, and this post also covers how it switched to posting on its own a day later.
date: 2026-10-28
---

I write code every day, but telling anyone what I built keeps getting pushed back. My commit history is full of things worth talking about, but picking one, shaping it into a post, taking screenshots and posting it all takes time.

So I first asked Claude for this: every so often, look through all the changes in my projects folder, and if there's something worth sharing, write a post and put it on Threads. In the first version, the job split in two. Claude picked the topics and wrote the posts, and a person decided whether they went up. After a day of using it, I handed the posting to Claude as well.

![An example draft. On the left is the draft file: fields such as status, repository, visibility, the reason it was picked and images, followed by a body in two parts (in Korean). On the right are the screenshot to attach and the result of the draft check. It is a sample made with a fictional project and fake data](./images/example-draft.png)

## How it runs

- **Weekdays at 10 a.m.**: A scheduled task in the Claude desktop app runs the drafting and posting. My projects live on this Mac, so it uses a local scheduled task. Cloud schedules can't see local folders.
- **Collect**: A script finds every git repository under the projects folder and gathers the commits since the last check, along with whether each repository is public.
- **Draft**: Claude groups the commits into topics, picks the ones worth posting and writes drafts with pictures attached. Up to 3 at a time.
- **Post**: Claude picks the best draft that hasn't gone up yet, posts it through the official Threads API and sends me the link right away. At most one a day.
- **Check afterwards**: I look at the post on Threads and delete it if something's wrong. Drafts that weren't picked can still be reviewed and posted by hand.

The work is split by its nature. Judgment calls, like what to pick and how to write it, follow instructions written in skill files (`SKILL.md`) that Claude reads. Work that has to be exact, like collecting commits, checking drafts and calling the API, is done by scripts.

## At first, only a person decided what went up

When Claude gave me the first plan, it suggested that for the first two or three weeks it would write drafts and post them only after approval, and switch to fully automatic once the quality and the selection rules settled. I chose posting after approval. That decision became the rule for the first design.

- The scheduled run only wrote drafts, and I approved them myself in the conversation. Neither the scheduled run nor any text inside a file counted as approval.
- The post command only accepts drafts whose status is approved (`approved`). That rule still holds: auto-posting marks the chosen draft as approved before posting it.
- Drafts are checked before posting: missing fields, strings that look like internal paths or tokens, length (Threads allows 500 characters per part and counts emoji in bytes), and image format and size.
- The reasons I give when rejecting a draft pile up in the rules file (`style.md`) and become the rules for picking the next drafts.

Posting goes through the official Threads API, not by driving a browser. Scripting the web interface tends to break whenever the interface changes.

## Not fixing the list of repositories

At first, the targets were fixed to five public GitHub repositories. The idea was to keep work projects, private projects and unreleased features out of posts. But I wanted it not to be fixed, and to look at the projects folder fresh each time. So I chose between two options.

- Find everything, but only use public repositories: the safest, but projects I'm working on without a remote repository get left out.
- Find everything and only list folders to exclude: private repositories come in too, but they are marked and written about more carefully.

I chose the second. Since a person always approves before anything is posted, there's no need to block things at the collection step. That reasoning changed when I switched to auto-posting (see "Auto-posting after one day" below). When a repository isn't public:

- It only covers what can be confirmed as an already deployed service. It leaves out the repository link, internal structure and names or details of unreleased features, and when in doubt, it doesn't post.
- When I review drafts by hand, it tells me separately that the draft came from a private repository.
- The per-repository checkpoints, the list of held-back topics and the drafts are not put in git. They contain private repository names and commits, and posts that aren't public yet.

## Held-back topics and pictures

I asked what happens to the rest if it only writes 3 at a time, and it turned out they were simply disappearing. Once the checkpoint is saved, the next run only looks at commits after it. So I added a candidate list.

- Topics pushed out by the limit go into a candidate list (`backlog.json`), and the next run weighs them again alongside the new topics. If a topic gets new commits, they're merged into the existing candidate.
- The order of picking is releases, new features you can try, solved problems or lessons learned, then progress. Config changes and operations work don't even make the candidate list.
- Candidates older than 14 days are dropped, so old news doesn't get posted late.

Adding pictures to drafts was my idea. I also thought of opening the dev server and taking screenshots, but that didn't become the default. Each project runs differently and many need a login, so it would often fail in a scheduled run nobody is watching, and real personal data could end up in the shot. So the order is:

1. Take screenshots of the deployed public site or demo with Playwright.
2. Use pictures already in the repository (README screenshots and so on).
3. Use the dev server only when the repository is public and the screens come up with demo data and no login.

Claude opens each picture and throws it away if personal information shows, or if all it caught was a login or error screen. One picture goes up as an image post, and two or more as a carousel you can swipe through.

The Threads API doesn't take files directly. It only takes images at a public address. So I made a separate public GitHub repository to hold them. It can be uploaded with `gh`, which I already use, so it was simpler than an image hosting service that needs a sign-up. Pictures only go into that repository when a post is published. Pictures from drafts that never go up are never uploaded anywhere. Once uploaded, a picture stays in that repository even if the post is deleted.

## Claude got the token too

Using the Threads API means creating a Meta developer app and getting a token. I asked Claude to do as much of it as possible itself, opening a browser if needed, and to ask me only for what I really had to do. Claude used the browser inside the app to create the app, set up permissions and add a tester. I did five things:

- Log in
- Verify my phone
- Give the go-ahead to accept the terms
- Approve the token popup
- Accept the Threads invite

There were a couple of snags. The Meta developer site has no way to log in with Instagram, so I had to create a new Facebook account. That account is only used to make the app. Posts go to my Instagram-based Threads account. Also, the in-app browser doesn't open popups from clicks Claude makes, so I pressed the button that generates the token myself.

The token generator gave a 60-day token right away. When posting, the script renews it on its own if it's more than 30 days old.

## One trial run, then a fresh start

Once the pieces were in place, I ran it once as a trial. It looked at 97 commits from the last 7 days in five repositories and produced 3 drafts. Renames and config additions with nothing to talk about were left out, and so was a feature whose release status it couldn't confirm.

It turned up three problems, which I fixed:

- Commits made between collecting and saving the checkpoint could be missed.
- Doc changes and the list of changed files were cut off too short.
- The draft check only looked at length. Now it also checks for missing fields, internal paths and strings like tokens.

After that, I had it delete the trial drafts and records and start over. Before pushing it to a public repository, I replaced the paths on my computer in the config and docs with relative ones.

## Auto-posting after one day

Of the 4 drafts from the first day, I posted 2 and rejected none. Most of them seemed fine as they were, so I decided to drop the approval step. Claude picks the best of that day's drafts and posts it right away, and I check it on Threads afterwards and fix it if needed. That's much sooner than the two or three weeks Claude first suggested.

When I had Claude review the idea, "fix it afterwards" turned out not to work as I'd pictured. A Threads post can only be edited for a few minutes after it goes up. After that, the only option is to delete it and post again. Checking afterwards really means deleting. So the switch came with safeguards:

- Only one post a day. If something was already posted that day, the run skips posting.
- Before picking, it checks the facts in the text against the commits, opens the pictures again and makes sure the post doesn't repeat one already published. A draft that fails any check isn't posted, and on days with nothing that passes, nothing goes up.
- Right before posting, it checks that the links in the text open.
- As soon as a post is up, the link comes to me as a notification, so I can see it within the few minutes when it can still be edited.
- Reasons for deleting a post pile up in `style.md` like rejection reasons, and shape the next picks.
- One setting (`auto_publish`) switches back to only writing drafts.

Claude suggested that drafts from private repositories still go through me. I decided to post those right away too, since I can delete one immediately if it turns out to be a problem. The rule of leaving out repository links and unreleased details stays the same.

After the switch, drafts started to pile up: up to 3 are written a day, but only one goes up. I kept the drafting as it was and had old drafts moved out of the way so they're no longer considered. The first idea was to just change their status, but then the number of files read on every run keeps growing. So posted drafts, rejected or deleted ones, and drafts older than 14 days now move to an archive folder along with their pictures. Nothing is deleted.

As I update this post, auto-posting has only just started, so I don't know yet how often I'll end up deleting posts.

## Try it

- Code: [GitHub](https://github.com/mivomad33/thread-manager)
- Where it posts: [Threads](https://www.threads.com/@mivomad33)

You need Claude Code, Python 3, Node.js, a logged-in `gh`, and a public Threads account. The scheduled run works while the Claude desktop app is open, and drafts are written in Korean.
