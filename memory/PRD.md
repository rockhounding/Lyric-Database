# Lyrics Studio - Product Requirements Document

## Original Problem Statement
Create a song lyrics organizer web app for GitHub Pages with Firestore database. Features: dynamic category creation, All Songs view, create new lyrics with title and content, category selection/creation on save, navigation tabs for categories.

## Architecture
- **Frontend**: React (single page app) with Tailwind CSS
- **Database**: Firebase Firestore (client-side)
- **Styling**: "Midnight Studio" dark theme with gold accents

## User Personas
- Musicians and songwriters organizing their lyrics
- Creative individuals tracking song ideas by category

## Core Requirements (Static)
1. View all lyrics in a grid layout
2. Create new lyrics with title and content
3. Dynamic category creation on save
4. Category-based filtering via tabs
5. Edit existing lyrics
6. Delete lyrics with confirmation

## What's Been Implemented (March 2, 2026)
- ✅ Full CRUD for lyrics (create, read, update, delete)
- ✅ Firestore real-time sync
- ✅ Dynamic category tabs
- ✅ Category creation inline during save
- ✅ Beautiful dark theme UI with gold accents
- ✅ Responsive grid layout
- ✅ Toast notifications for feedback
- ✅ Delete confirmation dialog

## Tech Stack
- React 19
- Firebase Firestore
- Tailwind CSS
- Shadcn/UI components
- Lucide React icons

## Prioritized Backlog
### P0 (Done)
- All core features implemented

### P1 (Future)
- Search/filter within lyrics
- Export lyrics to text file
- Sort by date or alphabetically

### P2 (Future)
- User authentication
- Drag and drop category ordering
- Lyrics versioning/history
