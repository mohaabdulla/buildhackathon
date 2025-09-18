## Epic A — Data Ingestion & Modeling (P0)

*Reimagine menu/review/route data as clues. We’ll load from a local SQLite or CSV export (no web needed).*

* [ ] Import DB dump (CSV/SQLite) into Unity

  * **Accept:** Editor tool reads data at edit time and generates ScriptableObjects **or** stores a local SQLite file in StreamingAssets.
* [ ] Data models (C#)

  * `RestaurantSO`, `MenuItemSO`, `OrderSO`, `DriverSO`, `ReviewSO`, `RouteSegmentSO`, `NeighborhoodSO (optional)`
  * **Accept:** All types serialize; addressables group created.
* [ ] Semantic tagging pipeline

  * Map menu flavors → meanings (e.g., spicy=anger, sweet=affection, bitter=regret).
  * Sentiment from reviews → emotion scores (−1..+1), topic tags (service/price/ambience).
  * Time windows from orders → “life events” heatmap per area/time.
  * **Accept:** Editor script computes and caches tags/scores into SO fields.
* [ ] Identity shard generator

  * Algorithm that converts cross-table intersections (e.g., last 3 midnight orders + same driver + “bitter” menus + sad reviews nearby) → `MemoryShard` objects with clue text + confidence.
  * **Accept:** Pressing a button in an editor window produces a list of 50–100 candidate shards.

**Tables used so far:** restaurants, menus, orders, drivers, reviews, routes (6).

---

## Epic B — World/Map Generation (P0)

* [ ] City graph builder

  * From `RouteSegmentSO` build road graph; bake NavMesh.
  * **Accept:** Player & NPCs can navigate between key POIs.
* [ ] POI spawning

  * Place restaurants as interactable markers (LOD icons + billboard names).
  * **Accept:** 100–1000 POIs render with icons; framerate > 60 on mid hardware.
* [ ] Neighborhood mood overlays

  * GPU instanced quads/URP decals that color areas by dominant emotion/time of day.
  * **Accept:** Toggling “Mood View” overlays the map without >3ms frame cost.

---

## Epic C — Core Loop & Narrative (P0)

* [ ] Scene flow

  * `Boot` → `MainMenu` → `CityHub` → `Endings`.
  * **Accept:** Seamless transitions.
* [ ] Interaction system

  * Focus/Use on POIs; dialogue/notes panel (TMP).
  * **Accept:** E prompt shows; controller & keyboard both work (new Input System).
* [ ] Clue discovery

  * Visiting certain POIs generates contextual `MemoryShards` (from Epic A), displayed in a “Corkboard”.
  * **Accept:** After 5–8 shards, the “Identity Meter” reaches stage 2 (locks new districts).
* [ ] Lock & key progression

  * District gates unlock when player assembles shard sets matching themes (e.g., “Night Owl”, “Sweet Tooth”, “Frugal Wanderer”).
  * **Accept:** At least 3 districts unlockable by different shard combinations.

---

## Epic D — Puzzles from Menus/Routes/Reviews (P0/P1)

*Adds depth beyond “walk and read a note”. These puzzles *use* the data.*

* [ ] Menu Cipher Puzzle (P0)

  * Each dish attribute (spicy/sweet/sour/salty/umami) encodes a letter/symbol. Players decode a phrase tied to a past event.
  * **Accept:** One mandatory cipher in Act 1 with auto-validation.
* [ ] Route Reconstruction Puzzle (P0)

  * Show partial delivery path. Player reconnects segments using time windows & driver shift limits.
  * **Accept:** Puzzle validates based on feasible time/graph constraints.
* [ ] Review Truth-Finder (P1)

  * Conflicting reviews; player labels “reliable/biased” via textual hints (extreme sentiment, rare timestamps, repeated phrases).
  * **Accept:** Correct labeling boosts shard confidence; wrong labels shift identity branch.
* [ ] Order Timeline Jigsaw (P1)

  * Drag cards (orders) onto a timeline using clues (receipt hours, menu types, weather tags if available).
  * **Accept:** Completing reveals a medium-confidence shard and unlocks a gate.

---

## Epic E — Branching Identity & Multiple Endings (P0)

* [ ] Identity model

  * Traits tracked as weighted scores: `Night Owl`, `Health-Conscious`, `Budget Saver`, `Spice Seeker`, `Social Diner`, `Loyal Regular`.
  * **Accept:** Traits update on each interaction; visible in “Identity Meter”.
* [ ] Branch logic

  * 3–5 endings triggered by trait thresholds and final choice.
  * **Accept:** Can reach at least 3 distinct endings in under 40–90 minutes.
* [ ] Contradiction system

  * Some clues fight each other; player chooses which to trust. This permanently tilts traits and locks certain districts.
  * **Accept:** At least 4 irreversible “fork” moments logged to save.

---

## Epic F — Systems & UX (P0)

* [ ] Save/Load (JSON or EasySave)

  * **Accept:** Manual + auto-save on district unlock/endings.
* [ ] UI/UX polish

  * Corkboard (drag pins, strings between clues), Map overlays, Traits HUD, Journal.
  * **Accept:** Controller-friendly; <3 clicks to reach any tab.
* [ ] Audio/Feel

  * Adaptive music by neighborhood emotion; SFX for clue reveals; camera shake on big unlocks.
  * **Accept:** Music layer changes when “Mood View” is active; no clipping.

---

## Epic G — NPCs & City Life (P1)

* [ ] Driver NPC loops

  * A few drivers follow believable routes (based on shifts), can be interviewed for hints.
  * **Accept:** 3 drivers with day/night behaviors.
* [ ] Restaurant staff barks

  * Lightweight dialogue pools tied to review sentiment & menu specialties.
  * **Accept:** Lines change with time of day.

---

## Epic H — Performance & QA (P0/P1)

* [ ] Addressables for POIs/shards

  * **Accept:** City loads in <4s on dev machine; memory stays <1.5 GB during play.
* [ ] NavMesh & culling

  * **Accept:** >60 FPS in dense districts on target hardware.
* [ ] Automated playtest flows

  * **Accept:** Test scene fast-forwards to each puzzle and ending.

---

## Data→Gameplay Mapping Checklist (challenge compliance)

* ✅ **Restaurants**: POIs, staff dialogue, unlock keys.
* ✅ **Menus**: Cipher mechanics, flavor→emotion tags, identity traits.
* ✅ **Orders**: Timeline jigsaw, life-pattern inference, district gates.
* ✅ **Drivers**: NPC routes, shift constraints in route puzzles, interviews.
* ✅ **Reviews**: Emotion heatmaps, Truth-Finder puzzle, narrative contradictions.
* ✅ **Routes**: City graph, mood flow overlays, reconstruction puzzle.
* (Optional) **Neighborhoods/Weather/Events (your own tables)**: boosts mood mapping & time-based gates.

(That’s 6+ tables used meaningfully.)

---

