---
name: Parallax
description: Public GitHub work, compared through a Material atlas.
colors:
  ink: '#302a3b'
  muted: '#716b7a'
  smalltext: '#695e74'
  line: '#dedbe5'
  paper: '#fff'
  ground: '#f4f3f7'
  purple: '#6e548a'
  sidebar: '#292336'
  series-a: '#a94235'
  series-b: '#16776b'
  series-a-soft: '#f5e5e0'
  series-b-soft: '#e0eeea'
  landscape: '#eae7f0'
  focus: '#9477b5'
  nav-active: '#473953'
  nav-hover: '#393046'
  primary-hover: '#4b3b5b'
  button-hover: '#ebe7f1'
  segmented-ground: '#eeebf3'
  table-heading: '#f9f8fb'
  warning-ground: '#f4e8ce'
  warning-text: '#695125'
  error-ground: '#fae8e3'
  error-text: '#8a382e'
typography:
  display:
    fontFamily: "'Manrope Variable', sans-serif"
    fontSize: '30px'
    fontWeight: 730
    lineHeight: 1.25
    letterSpacing: '-0.04em'
  headline:
    fontFamily: "'Manrope Variable', sans-serif"
    fontSize: '17px'
    fontWeight: 700
    letterSpacing: '-0.025em'
  title:
    fontFamily: "'Manrope Variable', sans-serif"
    fontSize: '14px'
    fontWeight: 700
    letterSpacing: '-0.02em'
  body:
    fontFamily: "'Manrope Variable', sans-serif"
    fontSize: '12px'
    fontWeight: 400
    lineHeight: 1.9
  label:
    fontFamily: "'Manrope Variable', sans-serif"
    fontSize: '10px'
    fontWeight: 400
  button:
    fontFamily: "'Manrope Variable', sans-serif"
    fontSize: '12px'
    fontWeight: 650
    lineHeight: 1.3
  metric:
    fontFamily: "'Manrope Variable', sans-serif"
    fontSize: '24px'
    fontWeight: 650
    letterSpacing: '-0.03em'
rounded:
  badge: '4px'
  segment: '5px'
  identity: '6px'
  compact-control: '7px'
  control: '8px'
  field: '9px'
  surface: '12px'
spacing:
  tight: '4px'
  compact: '6px'
  control: '8px'
  inline: '10px'
  small: '12px'
  related: '16px'
  mobile-gutter: '20px'
  panel: '26px'
  medium-gutter: '28px'
  section: '30px'
  desktop-gutter: '42px'
components:
  button-primary:
    backgroundColor: '{colors.sidebar}'
    textColor: '{colors.paper}'
    typography: '{typography.button}'
    rounded: '{rounded.control}'
    padding: '12px 17px'
  button-primary-hover:
    backgroundColor: '{colors.primary-hover}'
  button-secondary:
    backgroundColor: '{colors.paper}'
    textColor: '{colors.ink}'
    typography: '{typography.button}'
    rounded: '{rounded.control}'
    padding: '12px 17px'
  button-secondary-hover:
    backgroundColor: '{colors.button-hover}'
  button-ghost:
    backgroundColor: 'transparent'
    textColor: '{colors.ink}'
    typography: '{typography.button}'
    rounded: '{rounded.control}'
    padding: '12px 17px'
  handle-field:
    backgroundColor: '{colors.paper}'
    textColor: '{colors.ink}'
    rounded: '{rounded.field}'
    padding: '8px 12px'
  identity-a:
    backgroundColor: '{colors.series-a-soft}'
    textColor: '{colors.series-a}'
    rounded: '{rounded.identity}'
    size: '25px'
  identity-b:
    backgroundColor: '{colors.series-b-soft}'
    textColor: '{colors.series-b}'
    rounded: '{rounded.identity}'
    size: '25px'
  navigation-active:
    backgroundColor: '{colors.nav-active}'
    textColor: '{colors.paper}'
    rounded: '{rounded.control}'
    padding: '13px 14px'
  view-switch:
    backgroundColor: '{colors.segmented-ground}'
    rounded: '{rounded.control}'
    padding: '3px'
  information-panel:
    backgroundColor: '{colors.paper}'
    textColor: '{colors.ink}'
    rounded: '{rounded.surface}'
    padding: '26px'
  repository-landscape:
    backgroundColor: '{colors.landscape}'
    rounded: '{rounded.surface}'
    height: '345px'
---

# Design System: Parallax

## Overview

**Creative North Star: "Material atlas"**

The Material atlas makes two public bodies of work tangible. Aubergine navigation organizes a cool lilac workspace; coral and teal consistently identify the two sides. Compact typography, aligned quantities and conventional controls keep the interface useful for close comparison.

Depth belongs to the repository landscape. Its paired plinths and rounded columns are rendered from loaded repository data, while exact values remain available in tables. The identity is code-led: an authored geometric SVG mark, self-hosted Manrope and real data geometry. Public GitHub avatars are externally loaded identity images; there are no shipped decorative raster assets.

**Key Characteristics:**

- Cool lilac ground with a dark aubergine navigation rail.
- Coral and teal paired with explicit owner labels.
- Compact Manrope typography and tabular numeric alignment.
- Data-bound 3D beside conventional tables and controls.

This document records the implemented system in `src/pages/index.astro`, `src/styles/global.css`, `src/scripts/app.ts` and `src/lib/landscape.ts`. Surface composition and direction provenance remain in `.impeccable/surfaces/src-pages-index-astro.md`; this is not a whole-product accessibility or visual certification.

## Colors

Muted material colors give the workspace a quiet ground and keep the two comparison identities readable.

### Primary

- **Aubergine** (`sidebar`) anchors navigation and the primary action; its hover tone lightens the action without changing its identity.
- **Plum** (`purple`) marks repository-link hover and input carets. **Lavender focus** (`focus`) is the distinct keyboard focus color.

### Secondary

- **Burnt coral** (`series-a`) identifies the first profile in text, metrics, language bars and activity bars. **Coral wash** (`series-a-soft`) backs its A chip.
- **Deep teal** (`series-b`) serves the equivalent second-profile roles. **Teal wash** (`series-b-soft`) backs its B chip.
- Scene materials use lit coral and teal variants rather than text colors; their exact renderer values live in the sidecar. Lighting changes their visible appearance.

### Neutral

- **Ink** (`ink`) is the principal text; **Muted ink** (`muted`) supports descriptions. **Small-text plum** (`smalltext`) is used for metric labels, version copy, VS, landscape instructions and table values.
- **Cool lilac** (`ground`) is the workspace, **Paper** (`paper`) backs controls and information panels, and **Landscape lilac** (`landscape`) grounds 3D data.
- **Fine lilac** (`line`) separates rows and contains controls. Active and hovered navigation use distinct aubergine tones.
- Warning and error text sit on their matching pale status backgrounds; messages retain literal explanatory text.

**The Identity with Labels Rule.** Series color reinforces an owner name or A/B identifier; it does not replace that label.

## Typography

**Display and body font:** self-hosted Manrope Variable, with sans-serif fallback. The root enables `ss01` and disables synthesized faces. There is no separate display or monospace family.

The variable weight range keeps dense information precise without making every label bold. Headings use modest negative tracking; metrics and table quantities use tabular numerals. Frontmatter roles record actual representative styles, not a uniform ratio imposed on the implementation.

- **Display:** main heading; its base role becomes 34px on wide screens and 26px at tablet/mobile widths. Mobile line height is 1.32.
- **Headline:** section headings. Profile names share the size with slightly tighter tracking; mobile section headings are 15px and profile names 13px.
- **Title:** overview subsections, with 15px subsections on mobile. Detail headings use 13px.
- **Body:** explanatory panel prose uses the body token, constrained to 65ch. Profile biographies and event content use 11px with 1.7 line height; repository descriptions use 10px with 1.6 line height.
- **Label:** compact contextual labels. Dense metadata is 9px; these observed sizes are not a prescription to shrink long-form reading text.
- **Metric:** primary comparison numbers; intermediate widths use 21px, mobile restores 24px in the two-column strip.

**The Comparable Quantities Rule.** Align numbers with tabular figures and give each comparative column an explicit owner.

## Layout

The desktop shell uses a fixed 222px left rail and a workspace offset by that width. Its topbar is 76px tall; the centered main region has a 1580px maximum width, 42px horizontal gutters and 36px top padding. Sections use aligned edges, restrained separators and 8–16px local gaps; larger 25–35px spaces distinguish groups.

Profiles occupy equal columns separated by a narrow VS column. The main comparison strip has four equal metric cells. Language and supporting comparison sections share a two-column region; activity and community each use two equal profile columns. Repository records use a fixed-layout semantic table with horizontal overflow rather than removing essential columns.

Responsive behavior follows the existing breakpoints:

- At **1500px and wider**, the main top padding is 42px and the landscape is 390px tall.
- At **1150px and narrower**, the rail contracts to 190px, main gutters to 28px and profile avatars to 42px. Secondary profile metadata and the version line are reduced.
- At **900px and narrower**, the rail becomes a 75px icon rail. The topbar is 65px; repository tables keep a 680px minimum width and the compact scene table 500px.
- At **650px and narrower**, navigation becomes a static branded top band with labeled tabs, workspace offset disappears and gutters become 20px. The two handle fields share a row; the visible **Compare** button spans the next full row. Swap is hidden. Profiles remain side by side, the metric strip becomes two columns, and overview, activity, community and detail sections stack. The landscape is 300px tall; tables scroll within their containers. The supporting insights table remains fluid with a 44% measure column and wrapping owner headers.

## Elevation & Depth

Flat tonal surfaces and fine borders carry most hierarchy. Small shadows identify a selected view segment, a floating scene tooltip and a transient toast. They are functional exceptions to the flat workspace, not the default treatment for panels.

### Shadow Vocabulary

- **Selected segment:** `0 2px 4px #30223a09`.
- **Scene tooltip:** `0 6px 18px #27223520`.
- **Toast:** `0 10px 35px #2e223b25`.

The landscape uses actual Three.js geometry: rounded columns on two low plinths, a hemisphere fill, a directional light and soft shadow reception. Each profile contributes up to 30 loaded original repositories, sorted by the selected metric. Both groups share one `log(1 + value)` scale; a minimum column height preserves visibility of zero values. The metric selector chooses stars, forks or size in KB. This is visual magnitude, not a quality ranking.

Rendering is demand-driven on camera changes, resize or pointer interaction, and pauses while the scene is outside the viewport. There is no automatic orbit. Drag rotates, labeled buttons zoom/reset, a slight hover scale and tooltip identify a column, and selecting it opens repository details. The canvas is hidden from assistive technology; the List view exposes exact values and keyboard actions. Reduced-motion preference initially selects List and minimizes CSS motion. A failed 3D initialization exposes a fallback message.

**The Data Makes the Depth Rule.** The landscape geometry expresses loaded repository measurements; precise values and repository actions remain available outside the canvas.

## Shapes

The recurring surface corner is softly squared at the surface radius. Inputs, buttons and navigation use smaller control radii; identity chips and repository badges are tighter still. Borders are usually one pixel. The profile strips use a two-pixel colored top edge rather than enclosing each person in a raised card. Avatars are rounded squares; dots and the central VS marker are circular. The authored brand mark is a faceted outlined solid, echoed in the code-authored SVG favicon.

## Components

### Buttons and focus

Primary buttons use aubergine, white text, an 8px radius and 12px by 17px padding. Secondary buttons use paper with a fine border and a pale-lilac hover; ghost buttons remove their fill and visible border. Small secondary actions use 10px type and 9px by 12px padding. A disabled button has 0.55 opacity and a wait cursor. Background transitions take 0.2s. All focusable controls receive the global 3px lavender outline with 4px offset. Icon-only actions retain accessible names.

### Fields and identity chips

A handle field is a white bordered flex container with a 9px radius, an A/B chip, an @ prefix and a labeled text input. The input itself is transparent and borderless. A/B chips use the matching series ink and pale fill. Mobile removes the @ prefix and tightens field padding, while the action retains its word label. Search and native selects use the same white-and-lilac control vocabulary; native input and select behavior remains intact.

### Navigation and view switches

Navigation is a vertical button list on the dark rail, with a filled active item and `aria-current`. Mobile restores visible text in the horizontal top navigation. The 3D/List switch uses `aria-pressed`, a pale segmented track and a white selected segment with a small shadow. Community filters use the same explicit pressed-state pattern with a plum selected fill.

### Profile strips and information panels

Profile strips pair an external public GitHub avatar, linked handle, biography and public metadata. A/B color repeats in the top border and handle; visible identifiers establish ownership. Repository details and data methodology use flat white bordered panels with the surface radius and 26px padding, reduced to 20px on mobile.

### Tables, metrics and status

Repository tables have a pale header, fine row separators, compact badges, aligned quantities, links and named detail actions. The supporting insights comparison uses a real table, visible owner headings, `scope="col"` and `scope="row"`, plus a descriptive caption. Owner text and color agree. Language bars count loaded original repositories by primary language and retain numeric counts.

Activity columns use a shared maximum across both loaded daily series and disclose the shared range in text. Daily bars summarize the bounded public-event window; the latest 30 event details are sorted by timestamp. Missing, empty, loading and partial coverage states use literal explanations and available retry/load-more controls. Status and toast announcements use polite live regions; content indicates busy state while loading. The loading spinner is 0.8s linear and is minimized under reduced motion.

### Repository landscape

The landscape is an optional interaction surface, framed by a labeled owner legend, metric selector, 3D/List switch, zoom/reset actions and explanatory coverage. Canvas pointer selection and the corresponding table actions open the same repository detail flow. Its material colors, geometry and lighting are specified in the sidecar; these rendering settings are distinct from flat UI text tokens.

## Do's and Don'ts

### Do:

- **Do** keep coral and teal paired with A/B identifiers or visible profile names.
- **Do** preserve the visible Compare action across viewport sizes.
- **Do** use semantic row and column headers for comparative numbers.
- **Do** disclose loaded coverage and scale beside the visual that uses them.
- **Do** retain the List alternative, visible focus and reduced-motion behavior.
- **Do** use public GitHub avatars only as identity content and keep authored branding as SVG.

### Don't:

- **Don't** interpret stars, event counts or landscape height as a developer ability score.
- **Don't** replace precise repository records with a canvas-only interaction.
- **Don't** silently normalize the two activity charts to different scales.
- **Don't** turn every flat information surface into a floating 3D card.
- **Don't** treat decorative color or hover tooltips as the sole carrier of essential information.
