
## Run tasks

To run the dev server for your app, use:

```sh
nx serve api-server 
```

To serve teh front-end use: 
```sh
nx serve front-end
```

To create a production bundle:

```sh
nx build front-end
```

To run both the `api-server` and `front-end` at the same time run: 
```sh
nx run-many -t serve --projects=api-server,front-end
```

### New Features Added

## Auth Work Flow

- Added User registration and login.
- Restricted access to gallery pages for unauthenticated users.

## New Media Support

- Support for new `mediaType` field 
- Displays a grid of media items (images/videos), renders `<img>` or `<video>` elements based on `mediaType`.
- Videos auto-play on hover
- Media detail view supports:
  - Editing media description
  - Adding and viewing comments
  - Viewing tags and updating them

## Tagging

- Tags can be added to each media item.
- User can see existing tags for the media item.
- Users can search media by tag.
- Initially all media items are loaded without tags


## Pagination

- Added support for pagination by moving pgae params to route
- Remembers page and last scroll context on back navigation


