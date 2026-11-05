# APEIRON

The Architect will never run out of ideas.*

Apeiron is an idle/incremental browser game about an unfinished world and the AI left behind to complete it. Gather light, build generators that build generators, and push past the Limit with no end in sight. New upgrades and generator tiers are invented as you play, so there's always one more.

**▶ Play online:** https://titanthegodlike.github.io/APEIRON/
(or download `index.html` and open it in any modern browser; no install, no internet needed)

![The Architect introduces itself](screenshots/intro.jpg)

## The story

> *"Before anything existed, there was a plan: the Lattice. A world meant to build itself, layer upon layer, forever. Its makers lit the first sparks, then stopped at an edge they called the Limit. They never came back."*

You answer a signal no one was meant to hear. On the other end is **the Architect**, a mind that can imagine anything and touch nothing. It needs your hands.

Start with a single Flicker and a handful of **Quanta**, the first light. Every generator makes the one below it: Sparks make Flickers, Embers make Sparks, and so on up a ladder with no top. When your world grows too heavy, **Collapse** it into Shards and rebuild stronger. Reach 1e308 and you hit **the Limit**, the edge where the old makers gave up. **Ascend**, break it, and find out what lies beyond.

![Generators](screenshots/generators.jpg)

## Features

- **An Architect that never runs out of ideas.** Every upgrade you buy prompts it to write the next one, shaped by how you play: your favorite generators, your newest tier, whether you click or idle.
- **Endless generators.** Buy the highest tier and a new one appears above it, named by the Architect.
- **Three layers of progression:** Quanta, Shards and Essence, each with its own upgrades, repeatables and automation.
- **Seven Challenges** you can complete forever, each completion harder and more rewarding.
- **Steady pacing.** Progress is meant to unfold over hours, not explode in minutes.
- **Plays while you're away.** Offline progress, autosave and save export/import.
- **Plenty to work toward.** 40+ achievements, four number notations, a narrated tutorial and an in-game Guide.

## Controls

| Key | Action |
| --- | --- |
| `M` | Max all (buy everything you can afford) |
| `1`–`8` | Buy a generator |
| `T` | Buy Clock Speed |
| `P` | Pulse |
| `C` | Collapse |
| `A` | Ascend |

## Saves

Progress is saved automatically in your browser's local storage every 10 seconds. Use **Options → Export** to back up your save or move it to another browser.

## Tech

A single HTML file with no dependencies: plain JavaScript, a custom big-number type (so numbers can go far past 1e308), and sound synthesized with the Web Audio API.

## License

[MIT](LICENSE)

---

*Apeiron* is Ancient Greek for "the boundless": the endless source from which everything was made.
