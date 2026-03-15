# Design System Documentation

## Overview
This design system provides standardized colors, typography, spacing, and component styles for the Signese app. All values use `moderateScale()` for responsive scaling across devices.

## Quick Start

```typescript
import { typography, spacing, colors, componentStyles } from '@/src/theme';
```

## Typography

### Font Families
```typescript
fontFamily.heading  // AvenirNext-Bold (iOS), sans-serif-medium (Android)
fontFamily.body     // AvenirNext-Regular (iOS), sans-serif (Android)
fontFamily.medium   // AvenirNext-DemiBold (iOS), sans-serif-medium (Android)
```

### Text Presets
```typescript
typography.landingTitle     // 40px, 700 weight - for landing page
typography.pageTitle        // 32px, 700 weight - for auth/main pages
typography.pageSubtitle     // 18px, 400 weight - subtitles
typography.label            // 11px, 500 weight - form labels
typography.input            // 13px, 400 weight - input text
typography.buttonPrimary    // 16px, 700 weight - primary CTAs
typography.buttonSecondary  // 18px, 600 weight - secondary buttons
typography.link             // 12px, 600 weight - links
```

### Usage Example
```typescript
<Text style={[typography.pageTitle, { color: colors.semantic.text.primary }]}>
  Welcome Back!
</Text>
```

## Spacing

### Standard Spacing Scale
```typescript
spacing.xs    // 4px
spacing.sm    // 8px
spacing.md    // 12px
spacing.lg    // 16px
spacing.xl    // 24px
spacing.xxl   // 32px
```

### Form Spacing
```typescript
formSpacing.labelMarginBottom  // 3px
formSpacing.inputMarginBottom  // 5px
formSpacing.fieldGap           // 6px
formSpacing.sectionGap         // 10px
```

### Card Spacing
```typescript
cardSpacing.padding           // 14px
cardSpacing.borderRadius      // 24px
```

## Colors

### Brand Colors
```typescript
brandColors.primary      // #4DB3A8 (teal)
brandColors.secondary    // #F7AF97 (coral)
brandColors.dark         // #2F3A40
brandColors.mediumDark   // #6B7280
```

### Semantic Colors
```typescript
semanticColors.text.primary       // Primary text color
semanticColors.text.secondary     // Secondary text
semanticColors.text.link          // Link color
semanticColors.background.card    // Card background
semanticColors.input.background   // Input background
semanticColors.input.border       // Input border
semanticColors.button.primary     // Primary button bg
```

### Page-Specific Colors
```typescript
pageColors.landing   // Landing page colors
pageColors.login     // Login page colors
pageColors.signup    // Signup page colors
```

## Component Styles

### Input Fields
```typescript
<TextInput 
  style={componentStyles.input}
  placeholderTextColor={semanticColors.input.placeholder}
/>
```

### Buttons
```typescript
// Primary CTA
<Pressable style={componentStyles.buttonPrimary}>
  <Text style={[typography.buttonPrimary, { color: semanticColors.button.primaryText }]}>
    Sign In
  </Text>
</Pressable>

// Secondary button
<Pressable style={componentStyles.buttonSecondary}>
  <Text style={[typography.buttonSecondary, { color: semanticColors.button.secondaryText }]}>
    Sign Up
  </Text>
</Pressable>

// Back button
<Pressable style={componentStyles.backButton}>
  <MaterialIcons name="chevron-left" size={24} />
</Pressable>
```

### Cards
```typescript
<View style={componentStyles.card}>
  {/* Content */}
</View>
```

### Layout Helpers
```typescript
<View style={layout.centeredContainer}>
  <View style={layout.formContainer}>
    {/* Form fields */}
  </View>
</View>
```

## Component Dimensions

### Logo Sizes
```typescript
logoSize.landing     // 90px - landing page
logoSize.auth        // 48px - login page
logoSize.authSmall   // 44px - signup page
```

### Input Dimensions
```typescript
inputStyles.height              // 36px - standard
inputStyles.heightSmall         // 34px - compact
inputStyles.borderRadius        // 18px
inputStyles.paddingHorizontal   // 12px
```

### Button Dimensions
```typescript
buttonDimensions.primary        // 42px height, 21px radius
buttonDimensions.secondary      // 50px height, 25px radius
buttonDimensions.small          // 36px circle (back button)
```

## Migration Guide

### Before (inline styles):
```typescript
const titleStyle = {
  fontFamily: Platform.select({
    ios: "AvenirNext-Bold",
    android: "sans-serif-medium",
  }),
  fontSize: moderateScale(32),
  fontWeight: "700",
};
```

### After (using design system):
```typescript
import { typography, colors } from '@/src/theme';

const titleStyle = [
  typography.pageTitle,
  { color: colors.semantic.text.primary }
];
```

## Best Practices

1. **Always import from the main index**: `import { ... } from '@/src/theme'`
2. **Use semantic colors over brand colors**: Prefer `semanticColors.text.primary` over hardcoded hex values
3. **Use spacing scale consistently**: Prefer `spacing.md` over `moderateScale(12)`
4. **Extend typography presets**: Use spread operator to customize: `[typography.pageTitle, { color: myColor }]`
5. **Use component styles as base**: Start with `componentStyles.input` and add overrides only if needed

## Common Patterns

### Full-screen gradient background:
```typescript
<LinearGradient
  colors={[pageColors.login.bgStart, pageColors.login.bgMid, pageColors.login.bgEnd]}
  locations={[0, 0.4, 1]}
  style={layout.screenContainer}
>
  {/* Content */}
</LinearGradient>
```

### Form field with label:
```typescript
<View style={{ gap: formSpacing.labelMarginBottom }}>
  <Text style={[typography.label, { color: semanticColors.text.secondary }]}>
    Email
  </Text>
  <TextInput
    style={componentStyles.input}
    placeholder="Enter your email"
    placeholderTextColor={semanticColors.input.placeholder}
  />
</View>
```

### Centered form container:
```typescript
<ScrollView contentContainerStyle={layout.scrollContent}>
  <View style={layout.centeredContainer}>
    <View style={layout.formContainer}>
      {/* Logo, title, inputs, buttons */}
    </View>
  </View>
</ScrollView>
```
