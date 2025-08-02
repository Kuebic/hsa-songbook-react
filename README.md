# 🎵 HSA Songbook

A responsive, offline-capable worship songbook webapp that empowers worship leaders and musicians to manage, share, and perform chord charts seamlessly across devices. Built with modern web technologies and optimized for real-world worship contexts.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

## ✨ Features

### 🎼 Core Functionality
- **Precise Chord Positioning**: Mid-word chord placement like `encyclo[C#]pedia` with pixel-perfect alignment
- **Real-time Transposition**: Instant chord changes with <50ms response time
- **ChordPro Support**: Full ChordPro format parsing and rendering
- **Multi-theme Display**: Light, dark, and high-contrast stage modes
- **Progressive Web App**: Offline-capable with service worker caching

### 🎭 Performance & User Experience
- **Offline-First Architecture**: Service worker with cache-first strategy
- **Sub-second Loading**: <500ms song loading from network, <100ms from cache
- **Responsive Design**: Mobile-first with touch-optimized interactions
- **Accessible**: WCAG 2.2 AA compliant with screen reader support
- **Type-Safe**: Full TypeScript implementation with strict mode

### 🔧 Developer Experience
- **Vertical Slice Architecture**: Feature-based modules with co-located tests
- **Comprehensive Testing**: Unit, integration, and component tests
- **AI-Friendly Codebase**: Clear documentation and structured patterns
- **Type Safety**: 99%+ TypeScript coverage with strict validation
- **Modern Tooling**: Vite, Vitest, ESLint, and Tailwind CSS

## 🚀 Quick Start

### Prerequisites
- **Node.js** 20+ (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- **npm** 9+ or **pnpm** 8+
- **MongoDB** (local install or [MongoDB Atlas](https://www.mongodb.com/atlas))

### Installation
```bash
# Clone the repository
git clone https://github.com/Kuebic/hsa-songbook-react.git
cd hsa-songbook-react

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### Environment Setup
```bash
# .env
MONGODB_URI="mongodb://localhost:27017/hsa-songbook"
VITE_CLERK_PUBLISHABLE_KEY="pk_test_your_clerk_key"
CLERK_SECRET_KEY="sk_test_your_clerk_secret"
```

## 🏗️ Project Architecture

### Technology Stack
```typescript
// Frontend Core
├── React 19.1.0           // UI framework with concurrent features
├── TypeScript 5.x         // Type safety and developer experience
├── Vite 7.x              // Build tool with HMR and optimizations
├── Tailwind CSS 4.x       // Utility-first CSS framework
└── React Router v7        // Client-side routing

// Chord Management
├── ChordSheetJS 12.3.0    // ChordPro parsing and rendering
├── ChordProject Editor    // Interactive chord editing
└── Custom CSS Flexbox    // Precise chord positioning

// State & Data
├── @tanstack/react-query  // Server state management
├── Zustand               // Client state management
├── IndexedDB            // Offline storage
└── Service Worker       // Caching and offline support

// Backend & Database
├── Node.js + Express     // API server
├── MongoDB + Mongoose    // Database with ODM
├── Clerk Auth           // Authentication and user management
└── Zstd Compression     // Chord data compression
```

### Feature Architecture
```
src/
├── features/                     # Vertical slice modules
│   ├── songs/                   # Song management
│   │   ├── __tests__/          # Co-located tests
│   │   ├── components/         # Song-specific components
│   │   │   ├── ChordDisplay.tsx    # ✨ Precise positioning
│   │   │   ├── ChordEditor.tsx     # ChordPro editor
│   │   │   └── SongSearch.tsx      # Search & filters
│   │   ├── hooks/              # Song-specific hooks
│   │   ├── types/              # TypeScript definitions
│   │   └── index.ts            # Public API
│   ├── setlists/               # Setlist management
│   ├── auth/                   # Authentication
│   └── admin/                  # Administrative features
├── shared/                      # Cross-feature shared code
│   ├── components/UI/          # Reusable UI components
│   ├── hooks/                  # Shared hooks
│   ├── services/               # API services
│   └── utils/                  # Utility functions
└── test/                       # Test utilities and fixtures
```

## 🎵 Chord Positioning Innovation

Our breakthrough **precise chord positioning** feature displays chords exactly where they appear in ChordPro format:

```typescript
// Input ChordPro
"encyclo[C#]pedia [G]wonderful"

// Visual Output
//    C#        G
// encyclopedia wonderful
```

### How It Works
1. **ChordSheetJS Column Structure**: Leverages built-in column-based HTML output
2. **CSS Flexbox Layout**: Modern responsive positioning system
3. **Performance Optimized**: Memoized HTML processing with <50ms updates
4. **Theme Consistent**: Works across light, dark, and stage themes

[📖 Read the full implementation guide](src/features/songs/CHORD-POSITIONING.md)

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test suites
npm test ChordDisplay
npm test ChordPositioning
```

### Test Coverage
- **Unit Tests**: 45+ tests covering all core functionality
- **Component Tests**: React Testing Library for UI components
- **Integration Tests**: Feature-level testing with real data
- **E2E Tests**: Playwright for critical user journeys (planned)

### Key Test Suites
- `ChordDisplay.test.tsx` - 28 tests for chord rendering
- `ChordPositioning.test.tsx` - 11 tests for precise positioning
- `useChordTransposition.test.ts` - 17 tests for transposition logic

## 👥 Contributing

We welcome contributions from developers who want to improve worship music technology! Here's how to get involved:

### 🚀 Quick Contribution Guide

1. **Fork & Clone**: Fork the repository and clone your fork
2. **Read the Docs**: Check [PLANNING.md](.claude/instructions/PLANNING.md) for architecture
3. **Find a Task**: Browse [TASKS.md](.claude/instructions/TASKS.md) for available work
4. **Create a Branch**: Use descriptive names like `feat/chord-audio-playback`
5. **Write Tests First**: Follow TDD approach with co-located tests
6. **Submit PR**: Include comprehensive description and screenshots

### 🎯 Priority Areas for Contributors

#### 🟢 Beginner-Friendly
- **UI Polish**: Improve component styling and animations
- **Documentation**: Add examples and troubleshooting guides
- **Test Coverage**: Write tests for edge cases
- **Accessibility**: Improve ARIA labels and keyboard navigation

#### 🟡 Intermediate
- **Performance**: Optimize bundle size and rendering speed
- **Mobile UX**: Enhance touch interactions and responsive design
- **Search Features**: Advanced filtering and full-text search
- **Offline Sync**: Improve background synchronization

#### 🔴 Advanced
- **Audio Integration**: Synchronized chord highlighting with playback
- **AI Features**: Chord progression analysis and suggestions
- **Real-time Collaboration**: Multi-user setlist editing
- **Advanced Chord Features**: Guitar tabs, Nashville notation

### 🏗️ Development Guidelines

#### Code Style
- **TypeScript First**: All new code must be TypeScript
- **Vertical Slices**: Keep features self-contained
- **Test Co-location**: Tests next to implementation
- **Accessibility**: WCAG 2.2 AA compliance required

#### PR Requirements
- ✅ All tests passing
- ✅ Type safety maintained
- ✅ Documentation updated
- ✅ Performance impact considered
- ✅ Mobile responsiveness verified

#### Architecture Patterns
```typescript
// ✅ Good: Vertical slice with clear boundaries
src/features/songs/
├── __tests__/SongCard.test.tsx
├── components/SongCard.tsx
├── hooks/useSongData.ts
└── index.ts

// ❌ Avoid: Scattered feature logic
src/components/SongCard.tsx
src/hooks/useSongData.ts
test/SongCard.test.tsx
```

### 💡 Getting Help

- **Discord**: Join our [development Discord](https://discord.gg/hsa-songbook) for real-time help
- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Discussions**: GitHub Discussions for architecture questions
- **Docs**: Check `.claude/instructions/` for detailed technical documentation

## 🗺️ Roadmap

### ✅ Phase 1: Foundation (Complete)
- [x] Core UI components and chord display
- [x] Precise chord positioning system
- [x] Real-time transposition
- [x] Offline-first PWA architecture
- [x] Type-safe codebase with comprehensive testing

### 🚧 Phase 2: User Features (In Progress)
- [ ] User authentication and profiles
- [ ] Setlist builder with drag & drop
- [ ] Song sharing and collaboration
- [ ] Advanced search and filtering
- [ ] Comments and rating system

### 📋 Phase 3: Community (Planned)
- [ ] Public song library
- [ ] Arrangement versioning
- [ ] Mashup and medley support
- [ ] Community moderation tools
- [ ] Analytics and usage insights

### 🚀 Phase 4: Advanced Features (Future)
- [ ] Audio playback with synchronized highlighting
- [ ] AI-powered chord suggestions
- [ ] Sheet music generation from ChordPro
- [ ] Real-time collaborative editing
- [ ] Mobile native apps (React Native)
- [ ] Advanced chord notation (Nashville, tabs)

### 🌍 Phase 5: Scale & Polish (Future)
- [ ] Multi-language support (i18n)
- [ ] Advanced performance optimizations
- [ ] Enterprise features for large churches
- [ ] API for third-party integrations
- [ ] Advanced accessibility features

## 📈 Performance Targets

- **Initial Load**: <1s on 3G connection
- **Song Loading**: <100ms from cache, <500ms from network
- **Chord Transposition**: <50ms response time
- **Search Results**: <300ms for full-text search
- **Bundle Size**: <200KB initial JavaScript bundle
- **Lighthouse Score**: >90 for all metrics

## 🏅 Quality Standards

- **Type Safety**: 99%+ TypeScript coverage
- **Test Coverage**: >90% line coverage
- **Accessibility**: WCAG 2.2 AA compliant
- **Performance**: Lighthouse >90 on all metrics
- **Security**: Regular dependency audits and updates

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Acknowledgments

- **ChordSheetJS**: Excellent ChordPro parsing and rendering
- **ChordProject**: Interactive chord editing capabilities
- **React Community**: Amazing ecosystem and tooling
- **Worship Leaders**: Feedback and real-world usage insights

## 📞 Contact

- **Project Lead**: [Your Name](mailto:your.email@example.com)
- **Community**: [Discord Server](https://discord.gg/hsa-songbook)
- **Issues**: [GitHub Issues](https://github.com/Kuebic/hsa-songbook-react/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Kuebic/hsa-songbook-react/discussions)

---

**Built with ❤️ for the worship music community**

*Empowering worship leaders and musicians with modern technology to focus on what matters most: leading others in worship.*