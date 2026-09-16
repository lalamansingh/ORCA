# Progressive Web App Offline Architecture

## Caching Strategy
- **Static App Shell**: Cache-first for HTML, JS, CSS, icons, and fonts.
- **Dynamic Marine Weather**: Network-first with local fallback cache up to 3 hours.
- **Offline SOS Queue**: IndexedDB/localStorage backed queue with exponential backoff retry.
