/**
 * @module features/songs
 * @description Complete song management functionality
 *
 * Exports:
 * - Components: SongsPage, ChordDisplay, ChordEditor, ChordEditorToolbar, ChordEditorPreview
 * - Hooks: useChordTransposition, useChordValidation, useChordEditor
 * - Utils: chord helper functions
 * - Types: ChordDisplay and ChordEditor types and interfaces
 */

// Export all except conflicting names
export { SongsPage, ChordDisplay, ChordEditor, ChordEditorToolbar, ChordEditorPreview } from './components'
export { SongSearch, SearchResults, SearchSkeleton, SearchInputSkeleton, SearchFiltersSkeleton, FilterBottomSheet } from './components/search'
export * from './hooks'
export * from './utils'
export * from './types'

// Explicitly re-export to resolve naming conflicts
export { SearchFilters as SearchFiltersComponent } from './components/search/SearchFilters'
export type { SearchFilters as SearchFiltersType } from './types/search.types'
