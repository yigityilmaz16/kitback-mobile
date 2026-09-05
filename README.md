# KitBack · Android V0.1

**Check your gear before leaving the shoot.**

KitBack helps freelance photographers and videographers see which physical items they
have checked after a shoot. It is a small, offline Android utility, not an inventory
suite. Scanning a label records a check; it does **not** prove an item is packed.

## V0.1 features

- Create kits and add, edit, or remove individual physical items.
- Optional local equipment photos; one globally unique identifier per physical item.
- Bind an existing QR/barcode with the camera or enter its exact value.
- Start a shoot with an immutable expected-equipment snapshot.
- Continuous return scanning with progress, flashlight and non-modal feedback.
- Duplicate scans never increase the count, including repeated camera callbacks.
- Separate feedback for unknown labels and known items outside the shoot.
- Photo/name list of equipment not checked yet; undo an accidental check.
- Review success and explicitly complete a fully checked shoot.
- Resume active shoots after restart; review completed shoots.
- Camera permission fallback, manual identifier entry and local error recovery.

No backend, authentication, AI, OCR, analytics, payments, notifications, cloud sync,
RFID, Bluetooth tracking, reservations or label-printing system.

## Stack and layout

Expo SDK 57, React Native 0.86, React 19, TypeScript; React Navigation native stack;
Expo Camera, SQLite, FileSystem, ImagePicker, Haptics and development client.

React Navigation was chosen because five explicit screens need a small typed stack;
file-based routing and deep-link/share-extension configuration are unnecessary here.

| Location                 | Responsibility                                            |
| ------------------------ | --------------------------------------------------------- |
| `App.tsx`                | Database initialization, navigation and recovery boundary |
| `src/data/repository.ts` | Schema, migration, transactions and domain operations     |
| `src/data/photos.ts`     | Copy picker images into persistent app storage            |
| `src/scanner`            | Camera lifecycle/permissions and callback cooldown        |
| `src/screens`            | Kits, equipment, shoot status and return check            |
| `src/ui`                 | Small shared controls, styles and focused data refresh    |
| `tests`                  | Real SQLite repository and scan-gate tests                |
| `docs/TESTING.md`        | Device acceptance checklist and verification limits       |

### SQLite model

- `kits`: name and creation time.
- `equipment`: physical item, kit, unique exact barcode, optional photo filename;
  deletion is soft to reserve physical identity.
- `sessions`: kit name snapshot, status and timestamps. One active session per kit.
- `session_equipment`: copied equipment ID, name, barcode and photo filename.
  No dependency on current equipment values for expected gear.
- `equipment_checks`: one row per snapshot item, enforced by primary key.

Version 1 initializes transactionally via `PRAGMA user_version`; a newer schema is
rejected without resetting data. WAL and foreign keys are enabled. Small synchronous
repository operations keep transaction boundaries explicit; no UI component runs SQL.
This is appropriate for small kits, not thousands of scans per second.

Snapshot creation and completion are transactions. Checks use
`INSERT ... ON CONFLICT DO NOTHING`, so the database is authoritative, not the UI
cooldown. A 1.6-second per-code camera cooldown avoids a stationary label flooding
feedback; another label is accepted immediately. Rescanning later shows Already checked.

Photo files are immutable and referenced by filename, avoiding installation-specific
absolute paths. Existing snapshots retain their original photos after edits/deletion.
Removed identifiers and historical snapshot identifiers cannot be reused for another item.

## Setup

Use Node.js 24 LTS and npm. Run commands at the repository root:

```sh
npm ci
npm run typecheck
npm test
npm run format:check
npm run export:android
```

Tests use Node's SQLite implementation against the **same repository SQL and methods**.
They do not simulate the Android camera or replace device acceptance testing.
`work/` contains ignored test databases, bundles and audit output.
No ESLint configuration is included; checks are TypeScript, Prettier and tests.

## Run on Android

### Quick physical-device test with Expo Go

Install an Expo Go version supporting SDK 57. Keep the Android phone and computer on
the same network:

```sh
npx expo start --go --lan
```

Scan the terminal QR code with Expo Go. Allow camera access when scanning equipment.
The modules used for the core flow have Expo Go support in this SDK, but the installed
client must match the SDK. If it does not, use a development or preview build below;
do not substitute a fake scanner.

Expo Go needs Metro to load the development JavaScript. It is not the final offline
distribution format. A preview APK bundles JavaScript and should run without Metro.

### Android development build

With a configured local Android SDK/JDK, emulator or USB-debugging device:

```sh
npx expo run:android --device
```

For an EAS cloud build (Expo login/account required):

```sh
npx eas-cli login
npx eas-cli build --platform android --profile development
npx expo start --dev-client --lan
```

EAS may ask to create/link an Expo project and configure Android signing. These actions
require your account. Never commit credentials, signing files or tokens.
EAS cloud compilation is a build service; the app has no runtime backend or cloud storage.

### Standalone test APK

```sh
npx eas-cli build --platform android --profile preview
```

Install the resulting APK on your Android phone. This build does not need Metro.
Then test cold launch in airplane mode. An APK has **not** been generated or verified
by the current development environment; see the testing report.

## Device acceptance

See [the complete checklist](docs/TESTING.md). The essential flow:

1. Create Wedding Shoot and five separately labeled physical items.
2. Start shoot, enter Return check, scan four: **4 / 5 checked**.
3. Rescan one; count stays 4. Scan an unknown code; count stays 4.
4. View not checked: the fifth item's name/photo must appear.
5. Force-stop and reopen; resume at 4 / 5.
6. Scan the fifth; review success; complete shoot.
7. Reopen; history, kit and equipment remain.

Do this with actual camera scans, not only the manual fallback. Two identical retail
barcodes cannot distinguish two batteries. Give them distinct physical QR labels.

## Data, privacy and limits

- Data stays in app-private SQLite/files. No runtime network calls or analytics.
- Android backup is disabled. Uninstalling or clearing app data removes local records.
  There is **no backup/export product feature** in V0.1.
- Removed equipment remains as an identity tombstone. Historic photos and replaced
  photos are retained; broad media garbage collection is intentionally deferred.
  A process kill during unsaved photo import can leave an unused local image.
- Gallery photos are optional; permissions/lifecycle/haptics require real-device testing.
- Barcode strings are exact, case-sensitive values; leading zeroes are preserved.
  Different scanners may represent UPC/EAN differently, so use the same label format
  for binding and checking. No automatic cross-format identity normalization.
- Only a non-empty, fully checked session can complete. There is no abandon/cancel
  session feature. Existing active sessions can always be resumed.
- Kit editing does not alter an active shoot's expectations. If a physical label is
  replaced mid-shoot, the old identifier remains expected in that shoot.
- Android only is supported/test-targeted. iOS/web are not claimed as supported.
- Bundling does not establish native runtime correctness. Physical acceptance remains pending.
- Dependency audit currently reports moderate upstream findings involving
  `decode-uri-component` and `uuid` chains. No high/critical findings were reported.
  No forced major downgrades or unverified overrides were applied.
- Camera callbacks are paused by unmounting the preview off-screen/in background.
  On resume, data and camera permission are refreshed.

## Development and Git

Work lives on `codex/mvp-v0.1`. Main is not modified. Milestones use Conventional
Commits and are pushed to the feature branch. GitHub Actions runs typecheck, tests,
format checks and Android JavaScript export; it does not produce or device-test an APK.

This project is an **AI-assisted / agentic coding experiment**. The product behavior
and test evidence matter more than that label. Automated and physical checks are
reported separately; generated code is not treated as proof of correctness.

## V0.2 candidate — not implemented

**Local backup and restore**, including photo files and schema/version validation.
Protecting accumulated user data is the next priority before cloud/team expansion.
