# Admin Overview

**Mode:** Operate<br>
**Thesis:** A disciplined operations index makes tenant, support, and provider-health areas easy to scan while data remains unconnected.<br>
**Story:** A platform administrator signs in, sees the connection state, and can navigate to the three operational areas without mistaking empty states for live data.<br>
**First viewport:** Showoff Admin masthead, Overview title, connection status, horizontal navigation, and three equal panels.
**Form:** The user-selected admin comp at `../mocks/selected.png` is the visual reference.

## Quality Bar

- The admin access check runs before the overview is shown.
- Not-connected and unavailable states are stated in text.
- Do not invent tenants, incidents, provider metrics, or health values.
- Desktop uses three balanced columns; mobile wraps navigation and stacks panels without clipping.
