# KitBack V0.1 verification

## Executed in this environment

- TypeScript strict typecheck.
- Real SQLite tests against application repository:
  - Five expected items; four checked.
  - Duplicate and unknown identifiers do not change progress.
  - Missing item name and photo reference.
  - Close/reopen database preserves 4/5 and active status.
  - Fifth check, completion and another reopen.
  - Item edit/delete/add does not change the snapshot.
  - Historical identifiers cannot be reassigned.
  - Empty kit rejection and one active session per kit.
  - 100 repeated writes produce one check; undo and completed-session guard.
  - Migration rerun preserves data; future version rejected.
  - Failed snapshot insertion rolls back session creation.
  - Case, leading zeroes, SQL-like text and invalid barcode inputs.
  - Camera callback cooldown with rapid distinct identifiers.
- Metro Android JavaScript export.
- Expo Doctor compatibility inspection.

Node SQLite tests validate database behavior, not Android OS process restoration.
No connected Android device, ADB or configured SDK was found. Camera, UI rendering,
haptics, physical scans, native APK installation and airplane-mode cold launch are
**NOT VERIFIED**.

## Acceptance checklist on Android

Use five physical labels with different identifiers. Any five existing unique codes
work; record the exact values in the equipment editor. Do not use five copies of the
same retail product barcode.

| User criterion                                  | Automated evidence                  | Physical verification          |
| ----------------------------------------------- | ----------------------------------- | ------------------------------ |
| 1. Open application                             | Bundle/typecheck only               | Pending                        |
| 2–4. Create kit and five items with identifiers | Repository writes/uniqueness        | Pending UI and camera binding  |
| 5. Start shoot                                  | Transactional snapshot              | Pending UI                     |
| 6. Open Return check                            | Bundle/typecheck only               | Pending camera                 |
| 7–8. Scan four, display 4/5                     | Repository result                   | Pending camera/UI              |
| 9–10. Duplicate, still 4/5                      | Database idempotence + gate         | Pending camera                 |
| 11. Unknown code                                | No count change/no repository crash | Pending feedback               |
| 12–13. Missing gear                             | Correct missing name/photo filename | Pending actual image rendering |
| 14–16. Kill and resume 4/5                      | SQLite connection close/reopen      | Pending Android force-stop     |
| 17–18. Fifth scan and success                   | Checked count reaches five          | Pending success screen         |
| 19. Finish session                              | Completion guard/timestamp          | Pending button/navigation      |
| 20. Reopen data intact                          | Persistent database verified        | Pending native app restart     |

## Lifecycle tests

1. Start at 4/5; background and resume.
2. Use Android Settings > Apps > KitBack > Force stop (for standalone build).
3. Launch from the app icon; resume from Home at 4/5.
4. Rotate/background while scanning; return without a stuck camera.
5. Deny camera once. Verify fallback/manual entry.
6. Deny permanently; open Android settings, allow it, return and retry.
7. Import a photo, save, restart; photo must render.
8. Edit/delete an item during an active shoot; original expected name/photo/code
   must remain in that shoot.
9. Complete, reopen and check history. Undo must not be available after completion.
10. In a standalone preview APK, use airplane mode and cold launch.

## Scanner tests

- Hold a checked code stationary: no count inflation, no modal flood.
- Scan A then B rapidly: both accepted.
- Move away, wait over 1.6 seconds, rescan A: Already checked.
- Scan a known item from another kit: Not part of this shoot.
- Scan an unrelated QR URL: Unknown identifier (URL is never opened).
- Small label / dim room / torch on / partial occlusion.
- Same model with different physical labels counts separately.
- Two identical identifiers cannot be assigned to different physical items.

## Development commands

```sh
npm ci
npm run typecheck
npm test
npm run format:check
npm run export:android
npx expo-doctor
```

## Dependency audit

At initial installation, npm reported 16 moderate findings in dependency chains,
zero high and zero critical. The two underlying advisories included:

- https://github.com/advisories/GHSA-vcc3-ghjq-m6fr
- https://github.com/advisories/GHSA-w5hq-g745-h8pq

The suggested automatic fix included incompatible major downgrades. Those were not
applied. No runtime deep-link ingestion is configured and scanned codes are never
decoded as URLs. This does not establish that all upstream code is unexploitable.

Run `npm audit` again before a public release; dependency audit results change.
