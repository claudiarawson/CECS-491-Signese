# Firebase rules for “Add Sign” (community uploads)

Paste rules in the **Firebase Console** for your project.

| Product | Where to paste |
|--------|------------------|
| **Storage** | Firebase Console → **Build** → **Storage** → **Rules** |
| **Firestore** | Firebase Console → **Build** → **Firestore Database** → **Rules** |

After editing, click **Publish**.

---

## Storage rules (important syntax)

Firebase Storage rules must use **`match /b/{bucket}/o`** (letter **`o`**, the object root).  
If you use `objects` by mistake, rules may not apply and **every upload will be denied**.

The app uploads videos under **`community_signs/`** (underscores, no spaces) as  
`community_signs/communitysign_{timestamp}_{word}.mp4`.

Merge this with your existing rules if you already have other `match` blocks.

**Start with this minimal version** (signed-in users only, `.mp4` only). Rules that check `request.resource.contentType` often **deny valid uploads** on web or React Native because metadata can be missing or `application/octet-stream`. You can tighten later.

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // --- Community sign uploads (Add Sign in the app) ---
    match /community_signs/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && fileName.matches('.*\\.mp4$');
    }

    // --- Bucket root: WLASL-style videos e.g. "07068.mp4" (read-only from clients) ---
    match /{fileName} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

**Stricter (optional)** — only after the minimal rules work:

```
allow write: if request.auth != null
  && fileName.matches('.*\\.mp4$')
  && request.resource.size < 120 * 1024 * 1024
  && (
    request.resource.contentType.matches('video/.*')
    || request.resource.contentType == 'application/octet-stream'
  );
```

**Checklist if uploads still fail**

1. **Publish** rules after editing (Storage → Rules → **Publish**).
2. User must be **signed in** (the app calls `getIdToken(true)` before upload).
3. Path in code is exactly **`community_signs/...`** (see `communitySignSubmit.ts`).
4. Rules file must use **`match /b/{bucket}/o`** — not `objects`.
5. In the console **Storage → Files**, confirm new files appear under folder **`community_signs`** after a successful upload.

---

## Firestore rules

Allow **create** only for community submissions with the fields the app sends. Tighten `allow read` if you require authentication for the dictionary.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /dictionarySigns/{docId} {
      allow read: if true;

      allow create: if request.auth != null
        && request.resource.data.isCommunitySign == true
        && request.resource.data.communitySign == true
        && request.resource.data.isCommunity == true
        && request.resource.data.contributorUid == request.auth.uid
        && request.resource.data.isActive == true
        && request.resource.data.word is string
        && request.resource.data.definition is string
        && request.resource.data.howToSign is string
        && request.resource.data.notes is string
        && request.resource.data.storagePath is string
        && request.resource.data.videoPath is string
        && request.resource.data.storagePath == request.resource.data.videoPath
        && request.resource.data.storagePath.matches('^community_signs/communitysign_[0-9]+_[a-z0-9\\-_]+\\.mp4$');

      allow update, delete: if false;
    }

    // … your other collections (users, etc.)
  }
}
```

**Notes**

- If **`allow create` fails** after Storage succeeds, the app deletes the uploaded file; fix Firestore rules and try again.
- **WLASL / bulk imports** usually use the **Admin SDK** (bypasses rules). Client-side seed scripts need different rules or a Cloud Function.

---

## Quick test checklist

1. Signed-in user submits Add Sign → file appears under Storage **`community_signs/`**.
2. Firestore document exists with `isCommunitySign` / `contributorUid`.
3. Unsigned user cannot upload or create docs.
