Navigate to the signese folder before commencing with the following.

Install Dependencies:
```npx install```

Start the Development Server:
```npx expo start```


```Signese/
  app/
    _layout.tsx
    (auth)/
      login.tsx
      signup.tsx
      forgot-password.tsx
    (tabs)/
      _layout.tsx
      index.tsx                 # Home
      translate.tsx
      learn.tsx
      dictionary.tsx
      account.tsx
    account/
      edit-profile.tsx          # profile pic/icon, account info
      achievements.tsx          # badges, stars
      saved-signs.tsx
    settings/
      index.tsx
      accessibility.tsx
      about.tsx
      feedback.tsx
    dictionary/
      [signId].tsx
      add-dialect.tsx           # dialect/phrases form (Story 4)
    learn/
      [lessonId].tsx

  src/
    features/

      auth/                     # Stories 23,24,26,49 + session
        api.ts
        service.ts              # login/logout/register/forgot
        validators.ts
        types.ts

      translate/                 # Stories 2,16,36-44,48 + confidence + reports
        camera/
          permissions.ts
          useCamera.ts
          cameraControls.ts      # front/rear toggle (48)
        model/
          interpreter.ts         # converts model output -> signId/text
          pipeline.ts            # frame -> model -> output
          supportedSigns.ts      # 2-3+ signs list (43)
          types.ts
        ui/
          TranslationOverlay.tsx
          TranslationHistory.tsx
          ConfidenceBadge.tsx    # (28)
          ReportButton.tsx       # (32)
          SpeakButton.tsx        # (38)
        state.ts                 # session history, current translation
        utils.ts

      learn/                     # Stories 18,27,29,30,47 + stars rewards (8,34)
        data/
          lessons.ts             # lesson metadata, prereqs, star rewards
        progress/
          progress.service.ts    # completed, resume point (47)
          unlocks.service.ts     # prereqs (30) + star locks (12)
          types.ts
        ui/
          LessonMap.tsx          # scrollable map (27)
          LessonNode.tsx
          LessonProgressBar.tsx  # (29)
        state.ts

      dictionary/                # Stories 19,25,31,4
        data/
          signs.ts               # 5–10 initial signs (Sprint 1)
          categories.ts
        search/
          search.service.ts      # text search + category filter (31)
        saved/
          saved.service.ts       # save/unsave (25)
        dialect/
          dialect.service.ts     # submit dialect phrase (4)
          types.ts
        ui/
          SignCard.tsx
          CategoryFilter.tsx
        types.ts

      gamification/              # Stories 6-13,33-35,45-46
        stars.service.ts         # earn, spend, persist (7,8,9,12,34)
        streak.service.ts        # login streak (6,33)
        badges.service.ts        # achievements (45)
        notification.service.ts  # reminder notifications (46)
        types.ts

      account/                   # Stories 5,10,17,11
        profile.service.ts       # pic/icon update (5,10)
        account.service.ts       # update info (17)
        types.ts

      settings/                  # Stories 14,22,35 + settings search
        accessibility.service.ts
        settingsSearch.service.ts
        types.ts

      feedback/                  # Story 21
        feedback.service.ts
        types.ts

    components/
      ui/
        AppButton.tsx
        AppInput.tsx
        AppText.tsx
        Loading.tsx
        EmptyState.tsx
      layout/
        Screen.tsx
        Header.tsx
      common/
        ErrorBanner.tsx

    services/
      storage/
        secureStore.ts           # tokens/session (SecureStore)
        asyncStore.ts            # progress/saved signs (AsyncStorage)
        keys.ts
      api/
        client.ts                # fetch wrapper (or axios)
      logging/
        logger.ts

    state/
      store.ts                   # Zustand/Redux root (optional)
      authStore.ts
      userStore.ts
      settingsStore.ts

    theme/
      colors.ts
      spacing.ts
      typography.ts
      theme.ts                   # light/dark + font scaling

    assets/
      icons/
      images/

  package.json
  app.json
  tsconfig.json
