---
title: I didn't want to memorize, so I had the exam textbook rewritten
description: I built a Claude Code workspace that rewrites a formula-only exam summary book for the Korean Electrical Engineer exam into understanding notes where every concept leads to the next. This is how I decided how far to trust the textbook and how to check notes written by AI.
date: 2026-10-25
---

Most prep books for the written part of Korea's Electrical Engineer certification exam are summary books. They list the formulas, but they don't explain where a formula comes from or how the concepts connect. I dislike memorizing things I don't understand, and what I memorize that way doesn't last.

So I built a workspace that takes one chapter PDF of the textbook and turns that chapter into **understanding notes** written from scratch. A Claude Code skill, `/chapter-note`, writes the notes, and Python and Node scripts handle the textbook PDFs.

## What a note looks like

![Two pages of the handwriting PDF (in Korean): on the left, the first page of chapter 1, starting with the big question and a 13-step story outline; on the right, a page with the derivation of Kirchhoff's law, an exam notation box and a common confusion box. Both pages have a wide margin on the right for handwriting](./images/notes.jpg)

This is the chapter 1 note, written before the rule for adding figures existed, made into a PDF with a handwriting margin on the right.

- It opens with one **big question** the chapter answers. For chapter 1 it is "How does electricity flow in a circuit, and what rules does that flow follow?"
- Then it shows the order in which the chapter answers that question (the story outline), like a table of contents. Each step of the main text answers the question the previous step left open, and it is written in paragraphs, not lists.
- Formulas are derived in full at the point where they are needed. Anything that can't be derived is labeled as either a definition people chose or a measured value from experiment.
- Principles and rules that aren't formulas (for example, a voltmeter goes in parallel and an ammeter in series) are covered along with the "why".
- Places where you are likely to get stuck are flagged right there as **common confusions**, and places where the textbook or the exam uses a different form or symbol are linked as **exam notation**.
- After the main text, an appendix has a review summary, a map from the textbook's sections to the note, explain-it-yourself questions, and links to other chapters.

## From rewriting the textbook to writing a new one

The first guidelines described notes that reorganize the textbook and derive its formulas. On the first day alone, those guidelines changed in four big ways.

1. **From a formula list to a story.** Derivations attached to a list of formulas made the explanation choppy, and there was no place for principles and rules that aren't formulas. So I switched to a structure that follows a big question and a story outline in connected paragraphs, and split the note into the main text (read once to understand) and an appendix (for review).
2. **From textbook order to logical order.** Instead of taking the textbook's order as the default, the skill lays out every concept and designs the order from scratch. Prerequisites come first, then principles before applications, then simple before complex. The result can match the textbook, and it never changes the order just to be different.
3. **The note fills in what the textbook leaves out.** The note explains the background, the intermediate steps and the reasons itself. I saw this as the core value of the notes. Material outside the chapter's scope only goes in as far as it's needed to understand the chapter.
4. **The textbook is not the standard.** By this point the notes were no longer a reorganized textbook but a new textbook written from scratch for that chapter's scope. So I cut the textbook's role down to two things.
   - Scope: what this chapter has to cover, without gaps
   - Exam notation: the form, symbols and terms of formulas as they appear on the exam, so that I don't fail to recognize something on the exam that I understood from the notes

The notes decide the content, order, explanations and symbols themselves. They don't copy the textbook's sentences either.

## How can I trust notes written by AI?

Without the textbook as the standard, there's no way to check the notes against it. So I added separate safeguards for accuracy.

- **If it's not certain, it doesn't go in.** Everything in the notes has to match well-established physics and electrical knowledge.
- **Fresh agents with no context do the checking.** Extracting the scope, checking each part, and reviewing the whole chapter are handed to new agents with no working context, so the writer's mistakes don't slip through unchanged. The part-checking agent recalculates the derivation steps and numerical examples itself.
- **Agents only point out problems, and unapplied findings are reported too.** Agents don't edit the notes. They return a list of findings, and the writer decides what to fix. Findings that weren't applied go into the final report with the reason. If the writer could dismiss them alone, there would be no point in a separate check.
- **Where the notes touch the textbook, check twice.** The notes are written from a scope list extracted from the textbook, not from the textbook itself. That makes the scope list the only output that touches the textbook directly. It is compared against the textbook text for missing sections and terms, and exam notation is checked directly against images of the textbook pages rather than trusting the scope list. Misreading a single subscript during extraction would carry the error all the way into the notes.
- **The textbook is read as images.** In the PDF's text layer, most formulas come out broken. So the text is only used to find the structure and to cross-check, and every page of the main text is read as an image.

The work has four stages: scope extraction → design → writing → wrap-up. A person checks only once, at the design stage. I confirm the big question and the story outline, because a wrong outline means rewriting the whole note. After that, the skill writes to the end without stopping at each part.

A chapter is written in parts of about 10 to 15 textbook pages. Writing it all at once blurs the details from earlier on and turns a final check of everything into a formality.

## Scripts for work that needs no judgment each time

When I built the past-exam sheet generator, the rule was "AI doesn't make the call every time." Rule-based scripts that always give the same result for the same input do the work, and Claude only gets involved to write the script in the first place, check its results, and fix it when an exception shows up. That's how the four PDF tools were built.

- `split-textbook`: cuts the five original books (six subjects) into 54 chapter PDFs. The PDFs have no bookmarks, so it finds chapter boundaries by the cover pages, where a single saturated color covers more than half of the page.
- `exam-sheets`: in the textbook, the explanation and answer sit right below each past exam question, so you can't try it yourself. It makes a question sheet with the explanation boxes and answers covered, and an explanation PDF with an answer table at the front. The question sheet is rebuilt from images, so the covered content doesn't survive even as text. The explanation box color differs between books, so at first it found no questions at all in four subjects. I fixed it to decide the color for each chapter from the boxes right above the answer marks.
- `textbook-figures`: cuts figures out of the textbook and puts them in the notes. The figures are vector drawings, not images, so it finds each region from signals like captions, the font (Batang) and size of figure labels, and table borders. I decided to include every figure. Any rule for choosing would let some figures slip out, and including them all is simpler. Per-subject agents looked through every audit image in three rounds, and the findings went from about 130 to 95 to 45. The rest were fixed by coordinates in `manual.json`.
- `note-pdf`: binds the notes and the past exam sheets into one chapter PDF with a wide handwriting margin on the right. It's for a note-taking app on an iPad, and the bookmarks and links inside the notes work within the PDF.

## No textbook in the public repository

The textbook is copyrighted, and every page has the buyer's information printed on it. So the repository is public, but nothing made from the textbook goes into it.

- Textbook PDFs, rendered page images, cropped figures and exam sheets are all excluded from git. The repository holds only tools, skills and rule documents. `manual.json`, with the hand fixes for figures, holds only coordinates and ids, so it goes in.
- The tools don't print textbook text to logs or output files. The figure tool stops if a region it is about to crop contains anything that looks like buyer information.
- The notes don't copy the textbook's sentences. Everything is written fresh.

## How it's built

The rules live in two places. What a note **should look like** is in `CLAUDE.md`, and **how to make one** is in the skill file. `CLAUDE.md` is loaded in every session, so the steps needed only while writing notes moved into the skill.

- Writing notes: a Claude Code skill
- PDF processing: Python (`uv`, PyMuPDF), Poppler
- Handwriting PDF: Node (markdown-it, KaTeX), printed to PDF with the installed Chrome
- Note format: Markdown with KaTeX math, which renders in the VS Code preview

The tools are tuned to the page layout of a specific Korean prep book series (Dasan Edu's "Sokjeon Sokgyeol" theory books for the Electrical Engineer written exam). This is an unofficial personal study project with no connection to the publisher.

## Code

- [GitHub](https://github.com/mivomad33/electrical-engineer-understanding-notes-generator) (MIT license)

To use it you need to buy the textbook PDF yourself, and the notes are written in Korean.
