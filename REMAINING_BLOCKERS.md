# Remaining Blockers

## 1. Metro export on Windows host
- Status: BLOCKED in this Windows environment
- Symptom: `node:sea` path cannot be created on NTFS
- Impact: Cannot fully validate production Metro bundle end-to-end here
- Workaround needed on developer machine:
  - Use WSL2/macOS for EAS/local export verification
  - Or pre-install/resolve the `node:sea` externalizable module chain in the project config if supported by the installed Expo CLI version
- Code fixes around this path are already applied; this is an environment/runtime validation gap only

## 2. Shared package type errors
- Status: IN PROGRESS
- Symptom: `@namma/ui` components pass `className` to RN primitives which are not in `ViewProps`/`TextProps` types
- Fix approach: update shared components to be type-safe WITHOUT changing runtime behavior

## 3. Rider / Driver env / EAS config
- Status: PENDING
- Missing `.env` and `eas.json` for client apps
