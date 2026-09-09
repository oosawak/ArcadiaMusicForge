# Theory Assist integration

Base: `e37fb21ea6d7b95f335f4a981c3a3ada6cd8a784` on `feature/theory-assist`.
The current repository HTML is the implementation base; no v16/reference HTML was substituted.

## Architecture

`song.theory` → ArcadiaTheory root/scale/degree resolution → chord adapter → existing seeded phrase generator.

`generateThematicPhrase`, `generateSupportingPhrase`, `coordinateGeneratedParts`, genre BPM/sound/FX shaping, extra styles, section development, drums and 48-bar arrangement remain active. Pitch folding uses octaves rather than clipping at the piano-roll limits, preserving harmonic pitch classes.

The provided ArcadiaTheory API is embedded in the single HTML and exposed as `window.ArcadiaTheory`. No external script dependency is required. Legacy `CHORDS` remains only for the built-in demo and old serialized symbol progressions. New generation uses resolved chord objects, not a growing symbol lookup table.

## Features

- 12 roots, 17 scales, algorithmic triads/sevenths, degree presets.
- Diminished is the whole–half octatonic scale; melodic minor is the ascending form.
- Major/minor/diminished/augmented, common sevenths, minor-major seventh, augmented-major seventh, sus2/sus4, add9/minAdd9 recognition.
- For five-, six- and eight-note scales, prefer known chords contained in the scale. Otherwise stack distinct scale tones. These are explicitly marked as experimental scale harmonization, not traditional diatonic harmony. Numeric degrees wrap by scale length. Bracket labels give semitone intervals for custom chords.
- `fixed` follows the selected preset; `auto` and B/CLIMAX in `develop` sample genre-tag-matching curated candidates using the existing seeded RNG; `minimal` reduces harmonic changes.
- Chord chips edit one selected bar's harmonic setting. Apply Chords replaces only tracks 2/3/5 in the current pattern after confirmation.
- Individual melody/bass/arpeggio generation replaces only its target track in the current pattern. Tempo, sounds, other tracks and arrangement stay unchanged. Seed and per-part settings are recorded.
- Scale/chord guides are independently switchable, per bar, with chord color taking precedence. Drums are excluded. Out-of-scale notes remain editable.

## State and compatibility

The six requested theory fields are stored per song. `normalizeSongShape` derives missing theory from legacy `song.key`, synchronizes the legacy key, and preserves old pattern harmonies where available. Generated per-section harmonies live in `song.generation.progressions`. JSON/project export and sample serialization remain in place.

Changing root transposes existing non-drum notes and harmonies, folding by octaves into the existing E4–E6 editor range. Scale/seventh/preset changes edit the harmonic settings, not existing notes; use Apply Chords or generation to rewrite notes. The resolved preview/guide describes the current harmonic settings, not automatic chord detection from edited notes.

Pattern rename/delete now preserves or removes associated harmonic metadata and updates arrangement references. Undo history is cleared on switching songs to prevent restoring edits from another song.

## Verification

Run `node tests/theory-assist.test.cjs` (Node 18+; no package install required).

Checks include complete script parsing, duplicate IDs, startup/event bindings with a DOM fixture, all roots/scales/triads/sevenths, seeded generation, all 13 genres × 16 styles, all generation modes, old project migration, per-song save/load, root transposition, backing and individual generation scope, pattern metadata and per-bar guide logic.

The fixtures are not a real browser or audio renderer. Browser layout, audible playback, real MIDI/WAV file playback and audio sample decoding still need interactive verification before merging to main. Existing MIDI/WAV/audio routines were not replaced.

Only `feature/theory-assist` is updated; no deployment or merge to `main` is part of this change.

## Optional lookup, audition and progression history

The expandable Theory Assist explorer performs exact pitch-class-set chord lookup against ArcadiaTheory's chord types and inclusive lookup against its 17 scales in all 12 roots. It does not infer a unique key or copy O-TO's datasets. Select pitch buttons or import selected piano-roll notes; without a selection, the current track/pattern supplies notes. Drums are excluded.

Audition uses isolated triangle oscillators with the current BPM/master volume, one bar per chord. It pauses normal transport and supports cancellation, including cancellation during AudioContext resume. It does not modify notes, track sounds, arrangements or theory settings.

Manual progression history is stored in `song.theoryHistory`, deduplicated and capped at 20 entries. Restoring changes only the current harmonic settings and selected pattern progression, with undo. Existing notes and arrangement remain intact. History is included in project serialization.

Regression tests cover exact-vs-inclusive lookup, deduplication, restore scope, history serialization, scheduled audition and stopping. Audio tests use fixtures; audible output and browser layout remain unverified.
# Optional smooth chord voicing

- `song.theory.smoothVoicing` defaults to false, including migrated projects.
- Enable 「滑らかな和音配置」, audition with 「和音配置を試聴」, then use 「コード配置」 to apply. The existing undo action restores the previous notes.
- Only the strings voicing in manual chord placement changes. Brass and bass keep their original root-based pitches; seeded automatic generation is unchanged.
- Deterministic register selection enumerates one pitch per chord pitch class within MIDI 64–88 and minimizes adjacent sorted-voice movement. This is a local heuristic, not full classical voice-leading or loop-boundary optimization.
- Chord placement still replaces strings/brass/bass notes after confirmation. Audition does not replace notes. The preview uses a neutral sound, not the track instruments.
- Tests cover all roots/scales/triad and seventh settings, pitch-class preservation, determinism, default OFF, unaffected tracks, and project persistence. Actual browser audio quality requires listening verification.
