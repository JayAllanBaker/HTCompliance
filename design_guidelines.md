# BizGov Help Center - Design Guidelines

## Design Approach
**Selected Framework:** Material Design (adapted for enterprise compliance software)
**Rationale:** Information-dense documentation requires proven patterns for readability, hierarchical navigation, and progressive disclosure. Material's elevation system and structured layouts excel at organizing complex help content.

**Core Principles:**
- Clarity over creativity - users need answers fast
- Scannable content with clear visual hierarchy
- Progressive complexity (overview → detailed guides)
- Consistent structure across all documentation

## Color System

**Primary Palette:**
- Primary: 217 41% 30% (Dark Blue) - Headers, navigation, primary actions
- Accent: 38 99% 50% (Orange) - CTAs, highlights, interactive elements
- Secondary: 198 61% 36% (Dark Teal) - Supporting elements, badges, info callouts

**Functional Colors:**
- Success: 142 76% 36% - Completion indicators
- Warning: 38 92% 50% - Important notices
- Error: 0 84% 60% - Warnings, errors
- Info: 217 41% 45% - Tips, additional context

**Neutrals (Dark Mode Primary):**
- Background: 220 13% 9%
- Surface: 220 13% 12%
- Surface Elevated: 220 13% 16%
- Border: 220 13% 24%
- Text Primary: 0 0% 98%
- Text Secondary: 0 0% 70%
- Text Muted: 0 0% 50%

## Typography

**Font Stack:** Inter (via Google Fonts CDN) for all text

**Type Scale:**
- Hero/Section Headers: 3xl/4xl, font-bold, tracking-tight
- Page Titles: 2xl, font-semibold
- Article Headers (H2): xl, font-semibold
- Subsection Headers (H3): lg, font-medium
- Body Text: base, font-normal, leading-relaxed
- Code/Technical: sm, font-mono (JetBrains Mono)
- Captions/Meta: sm, text-muted

## Layout System

**Spacing Units:** Consistently use 4, 6, 8, 12, 16, 24 (Tailwind units)

**Grid Structure:**
- Sidebar Navigation: Fixed 280px width on desktop, collapsible on mobile
- Main Content Area: max-w-4xl with generous horizontal padding (px-8 to px-12)
- Two-column layouts for comparison guides: grid-cols-1 lg:grid-cols-2 gap-8

**Section Rhythm:**
- Page top padding: pt-8
- Section spacing: space-y-12 for major sections, space-y-6 for subsections
- Component spacing: space-y-4 for related elements

## Component Library

**Navigation Sidebar:**
- Sticky positioned, full-height with overflow-scroll
- Collapsible category groups (accordions)
- Active state: background surface-elevated, left border in accent orange
- Hover state: subtle background lift
- Icons from Heroicons (outline style for inactive, solid for active)

**Search Bar:**
- Prominent placement at sidebar top
- Background surface-elevated, border subtle
- Magnifying glass icon (Heroicon search)
- Placeholder: "Search documentation..."
- Focus state: border-accent with subtle glow

**Content Cards:**
- Surface background with subtle border
- Rounded corners (rounded-lg)
- Padding: p-6
- Icon + Title + Description pattern
- Hover: slight elevation increase (shadow-md to shadow-lg)

**Step-by-Step Guides:**
- Numbered badges (1, 2, 3) in accent orange with white text
- Each step in its own card or section
- Screenshots/images at 16:9 ratio with rounded corners
- Code blocks with syntax highlighting using subtle dark background

**Code Blocks:**
- Background: darker than surface (220 13% 8%)
- Border: subtle accent color at 20% opacity
- Padding: p-4
- Font: JetBrains Mono
- Copy button in top-right corner

**Callout Boxes:**
- Info: Border-left-4 in info blue, light blue background tint
- Warning: Border-left-4 in warning orange, light orange background tint
- Success: Border-left-4 in success green, light green background tint
- Each with appropriate icon (Heroicons: information-circle, exclamation-triangle, check-circle)

**Quick Reference Cards:**
- Compact grid layout (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Icon + Title + Brief description
- Clickable entire card
- Border on hover with accent color

**Breadcrumbs:**
- Top of content area
- Text-sm with chevron separators
- Last item in accent color, others muted
- Clickable navigation trail

**Table of Contents (TOC):**
- Right sidebar on desktop (hidden on mobile)
- Sticky positioned
- Links to H2/H3 headers in article
- Active section highlighted in accent
- Smooth scroll behavior

**Video Embeds:**
- 16:9 aspect ratio containers
- Rounded corners matching design system
- Play button overlay before interaction

## Page Layouts

**Help Center Home:**
- Hero: 400px height with gradient overlay (primary to secondary), search bar centered
- Category grid below: 3 columns on desktop, featuring top 6-9 categories
- Popular articles section: List format with icons
- Quick start guide: Prominent card with CTA

**Article/Guide Page:**
- Left sidebar navigation
- Main content (max-w-4xl)
- Right TOC sidebar (desktop only)
- Article header: Title, last updated date, reading time estimate
- Related articles footer section

**Category Browse:**
- Grid of article cards
- Filtering options at top
- Sort dropdown (Most Recent, Most Popular, A-Z)

**Search Results:**
- List view with snippet previews
- Relevance indicators
- Category tags for each result

## Images Section

**Required Images:**

1. **Hero Background (Help Center Home):**
   - Abstract geometric pattern with brand colors (dark blue, teal, orange accents)
   - Subtle gradient overlay
   - 1920x400px
   - Placement: Full-width hero section background

2. **Tutorial Screenshots:**
   - Actual application interface showing specific features
   - 1200x800px (3:2 ratio)
   - Light drop shadow for depth
   - Placement: Within step-by-step guides, centered in content flow

3. **Category Icons/Illustrations:**
   - Simple line-art illustrations representing each help category
   - Consistent style across all categories
   - 200x200px
   - Colors: Accent orange on dark surface backgrounds
   - Placement: Category cards on home page

4. **Video Tutorial Thumbnails:**
   - Custom frames from videos with play button overlay
   - 16:9 ratio (960x540px)
   - Placement: Video embed sections

**Note:** No large hero image dominates - this is utility-focused documentation where content clarity trumps visual drama.

## Interaction Patterns

**Animations:** Minimal - only for feedback
- Sidebar collapse/expand: 200ms ease
- Card hover elevations: 150ms ease
- Search results appearing: Stagger 50ms per item
- Smooth scroll to anchors: 300ms ease

**States:**
- Links: Accent color, underline on hover
- Buttons: Solid accent background, slight darken on hover
- Cards: Elevation increase on hover (shadow-md → shadow-lg)

This design creates a professional, highly functional documentation experience that prioritizes user success in learning the compliance system while maintaining Health Trixss brand identity.