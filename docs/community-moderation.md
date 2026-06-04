# Community moderation

Coco's peer-support **circles** are user-generated content (UGC). Apple
Guideline 1.2 and Google Play's UGC policy require, before public launch:

- a content filter for objectionable material,
- a way to **report** content,
- a way to **block** abusive users,
- a published point of contact, and
- the developer **acting on reports within 24 hours** (removing content,
  ejecting repeat offenders).

All five mechanisms are built. The 24-hour review is **operational** — someone
has to actually work the queue. This doc is how.

## Data model (Firestore, project `coco-sih`)

| Path | What | Who can read | Who can write |
| --- | --- | --- | --- |
| `posts/{postId}` | A circle post: `circleId, authorUid, authorHandle, body, createdAtMs, createdAt, reportCount, removed` | any signed-in user | author creates; anyone bumps `reportCount` by 1; author **or moderator** sets `removed` / deletes |
| `reports/{reportId}` | An abuse report: `postId, circleId, reporterUid, reason, createdAt` | **moderators only** | any signed-in user creates; moderators delete |

Circles themselves are a fixed catalog in code (`lib/data.ts` → `circleCatalog`),
not Firestore. Posts are keyed to a circle by `circleId`.

### How content gets hidden

1. **Auto-hide on reports.** The client hides any post with
   `reportCount >= 3` (`REPORT_HIDE_THRESHOLD` in `lib/community.ts`), pending
   review. The post still exists; it's just not shown.
2. **Moderator removal.** Setting `removed: true` hides a post from every feed.
   Reversible (clear the flag) — the post is not destroyed.
3. **Author deletion.** Authors can hard-delete their own posts.
4. **Server pre-filter.** `api/moderate.ts` rejects crisis / self-harm-method /
   pro-ED / peer-abuse text *before* a post is created (same guardrails as the
   chat pipeline). Crisis text is never posted — the user is shown SOS.

> **Enforcement note.** Posts are written client → Firestore directly (matching
> the rest of the app), gated by `/api/moderate` and the security rules. A
> modified client could skip the pre-filter, so the report queue + auto-hide +
> human review are the backstop. Hard server-side enforcement would mean routing
> writes through a Firebase Admin endpoint — a reasonable future upgrade.

## Becoming a moderator

Moderation is **off by default** (`isAdmin()` in `firestore.rules` has an empty
allowlist). To turn it on for your account:

1. In the app, open **Connect → Community**, then deep-link to the moderation
   screen (`/community/moderate`). It shows **YOUR ACCOUNT UID** — copy it.
2. Add that UID in two places:
   - `app.json` → `expo.extra.adminUids: ["<your-uid>"]` (shows the in-app
     queue + the "Moderation queue" link).
   - `firestore.rules` → `isAdmin()` allowlist (authorizes reading `/reports`
     and removing posts).
3. Deploy rules and rebuild the app:
   ```bash
   npx firebase deploy --only firestore:rules,firestore:indexes
   # then a normal app build, e.g. fastlane ios release / android release
   ```

Once listed, the **Moderation queue** link appears on the Community screen
(visible only to moderators), and the queue is readable in-app.

## Working the queue (the 24h obligation)

Open **Community → Moderation queue**. Each entry shows the reported post, the
reason, and two actions:

- **Remove post** — hides it everywhere (`removed: true`) and clears the report.
- **Dismiss** — false alarm; clears the report, leaves the post up.

You can also work the queue from the
[Firebase console](https://console.firebase.google.com/project/coco-sih/firestore)
(`reports` and `posts` collections) if you prefer a desktop view.

**Repeat offenders:** there's no automated ban yet. To stop an abusive author,
note their `authorUid` from a report and either remove their posts or (future
work) add a server-side block list. Users can already **block** authors
individually from the post menu.

## Deploys

- **Rules + indexes:** `npx firebase deploy --only firestore:rules,firestore:indexes`
- **Moderation API (`/api/moderate`):** ships with the Vercel deploy
  (`vercel --prod --archive=tgz`), live at `coco-api-nine.vercel.app/api/moderate`.

## Files

- `firestore.rules` — access control (`isAdmin()`, posts, reports)
- `firestore.indexes.json` — `posts` composite index (`circleId` + `createdAtMs`)
- `api/moderate.ts` — pre-post content filter
- `lib/community.ts` — client data layer (posts, report, block, moderation)
- `app/community/` — circles list, feed, guidelines gate, moderation screen
