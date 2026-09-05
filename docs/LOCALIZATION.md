# Language and interface checks

KitBack defaults to Turkish. Home's TR / EN buttons save the choice to a separate
SQLite settings database. Changing language returns to Home; saved equipment and
active shoot progress are unaffected. User names and barcode values are never translated.
App-owned messages are translated; Android permission dialogs follow the system language,
and unexpected native error details may retain their original language.

## Physical-device verification

- Reload Expo Go and check the light background, dark text and active-shoot panel.
- Switch TR → EN → TR. Open each screen and check navigation labels, alerts and scan feedback.
- Restart the app after choosing EN; English should persist. Repeat for Turkish.
- Resume an existing shoot and scan two different labels; duplicate scans must not increase progress.
- Increase Android font size and verify controls remain readable and reachable by scrolling.
- Confirm long equipment names, empty kits and manual code entry remain usable.

TypeScript, repository tests and Android export pass. The updated interface still needs
physical-device visual verification; successful bundling does not verify layout or camera hardware.
