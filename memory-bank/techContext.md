# Technical Context: Luminous Verses

## Technology Stack

### Core Framework
- **Next.js 15.3.3**: React App Router architecture
- **React 19.0.0**: Latest React with concurrent features
- **TypeScript 5**: Full type safety throughout the application
- **Node.js**: Runtime environment for build and development

### Styling & Design
- **Tailwind CSS 4**: Utility-first CSS framework with latest features
- **PostCSS**: CSS processing pipeline
- **Custom CSS Variables**: Design token system for consistent theming
- **Google Fonts**: Geist Sans, Geist Mono, and Amiri (Arabic) font families

### Development Tools
- **ESLint 9**: Modern linting with Next.js configuration
- **TypeScript**: Strict type checking and IntelliSense
- **VS Code**: Primary development environment
- **Git**: Version control and collaboration

## Architecture Decisions

### Framework Choice: Next.js App Router
**Why Chosen:**
- Server-side rendering for performance and SEO
- App Router provides modern file-based routing
- Built-in optimization for fonts, images, and bundles
- Excellent TypeScript integration
- Strong React 19 support

**Trade-offs:**
- App Router learning curve vs Pages Router
- More complex caching behavior to understand
- Newer pattern with evolving best practices

### State Management: React Context + Custom Hooks
**Why Chosen:**
- Lighter weight than Redux for application scope
- Native React patterns for better tree-shaking
- Excellent TypeScript integration
- Easier testing and debugging

**Implementation Pattern:**
```typescript
// Context providers for global state
AudioContext → Audio playback management
SettingsContext → User preferences
UserGestureContext → Browser audio unlock tracking

// Custom hooks for business logic
useAudio → Audio controls and state
useSurahDescription → Quran metadata
```

### Styling: Tailwind CSS 4
**Why Chosen:**
- Utility-first approach for rapid development
- Excellent responsive design utilities
- Built-in design system consistency
- Great development experience with IntelliSense
- Version 4 brings CSS-in-JS performance improvements

**Custom Extensions:**
```css
- Glass morphism utilities (.glass-morphism, .glass-morphism-dark)
- Gradient text utilities (.text-gradient-gold, .text-gradient-purple)
- Custom color palette (desert theme, gold accents)
- Animation utilities (twinkle, float, glow effects)
```

## Development Environment

### Project Structure
```
luminous-verses/
├── src/app/                 # Next.js App Router
│   ├── components/         # Reusable UI components
│   ├── contexts/          # React Context providers
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── globals.css        # Global styles and design tokens
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Landing page component
├── memory-bank/           # Project documentation and context
├── public/               # Static assets
└── package.json          # Dependencies and scripts
```

### Build System
- **Build Command**: `next build` - Production optimization
- **Dev Server**: `next dev` - Hot reload development
- **Type Checking**: Integrated TypeScript compilation
- **Linting**: ESLint with Next.js recommended rules

### Package Management
- **npm**: Primary package manager
- **Lock File**: package-lock.json for consistent installs
- **Scripts**: Standard Next.js development workflow

## External Dependencies

### Core Dependencies
```json
{
  "next": "15.3.3",           // React framework
  "react": "^19.0.0",         // UI library
  "react-dom": "^19.0.0"      // DOM bindings
}
```

### Development Dependencies
```json
{
  "typescript": "^5",                    // Type safety
  "@types/node": "^20",                  // Node.js types
  "@types/react": "^19",                 // React types
  "@types/react-dom": "^19",             // React DOM types
  "@tailwindcss/postcss": "^4",          // Tailwind integration
  "tailwindcss": "^4",                   // CSS framework
  "eslint": "^9",                        // Code linting
  "eslint-config-next": "15.3.3",       // Next.js ESLint rules
  "@eslint/eslintrc": "^3"               // ESLint configuration
}
```

## API Integration

### Quran Data Source
- **Primary API**: `https://luminous-verses-api-tan.vercel.app/api/v1/`
- **Endpoints Used**:
  - `GET /get-metadata?type=surah-list` - Surah metadata
  - `GET /get-verses?surah={id}&translation=true` - Verse data
- **Authentication**: None required (public API)
- **Rate Limiting**: Not specified, handled gracefully
- **Caching Strategy**: Browser-level caching + fallback data

### Data Flow Pattern
```typescript
// API call → Custom hook → Context → Component → UI
fetch(api) → useSurahs() → SurahListModal → UI rendering
```

## Browser Compatibility

### Target Browsers
- **Modern browsers**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Mobile browsers**: iOS Safari, Chrome Mobile, Samsung Internet
- **Accessibility**: WCAG 2.1 Level AA compliance targeted

### Progressive Enhancement
- **Core functionality**: Works without JavaScript for basic content
- **Audio features**: Require JavaScript but gracefully degrade
- **Animations**: Respect user motion preferences
- **Offline capability**: Planned for Phase 2

## Performance Considerations

### Bundle Optimization
- **Code splitting**: Automatic with App Router
- **Tree shaking**: Enabled by default
- **Font optimization**: Next.js automatic font optimization
- **Image optimization**: Built-in Next.js image component (when used)

### Runtime Performance
- **React 19 features**: Concurrent rendering for smooth interactions
- **Audio optimization**: Pool management for memory efficiency
- **Animation performance**: CSS transforms and GPU acceleration
- **Memory management**: Proper cleanup in useEffect hooks

## Security & Privacy

### Content Security
- **No user data collection**: Privacy-first approach
- **Local storage only**: User preferences stored locally
- **HTTPS enforcement**: Production deployment security
- **Content integrity**: Verified Quran text sources

### Child Safety
- **Safe content**: Religious educational content only
- **No external links**: Contained learning environment
- **No user-generated content**: Curated experience only
- **Family-friendly**: Appropriate for all ages

## Development Workflow

### Local Development
```bash
# Start development server
npm run dev

# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Production build
npm run build
```

### Code Quality
- **TypeScript strict mode**: Enabled for type safety
- **ESLint rules**: Next.js recommended + custom rules
- **File organization**: Feature-based component structure
- **Naming conventions**: Descriptive, TypeScript-friendly names

## Deployment Architecture

### Target Platform
- **Vercel**: Optimized for Next.js applications
- **CDN**: Global edge network for performance
- **Automatic deployments**: Git-based CI/CD
- **Environment variables**: Secure configuration management

### Build Output
- **Static assets**: Optimized for CDN delivery
- **Server functions**: Edge runtime where applicable
- **Bundle analysis**: Performance monitoring built-in

## Known Technical Constraints

### Audio Limitations
- **Browser policies**: Require user gesture for audio playback
- **iOS Safari**: Specific audio unlock requirements
- **Mobile bandwidth**: Consider audio file sizes
- **Offline mode**: Audio files not cached yet

### API Dependencies
- **External API**: Single point of failure for Quran data
- **Rate limiting**: Potential throttling on heavy usage
- **Data freshness**: No real-time updates needed
- **Fallback strategy**: Static data for core verses

## Future Technical Considerations

### Scalability Planning
- **Offline mode**: Service worker for core content
- **Audio caching**: Progressive download of recitations
- **Search functionality**: Full-text search implementation
- **User accounts**: Optional user data synchronization

### Monitoring & Analytics
- **Performance monitoring**: Core Web Vitals tracking
- **Error tracking**: Production error monitoring
- **Usage analytics**: Privacy-compliant user engagement
- **A/B testing**: Feature optimization framework

This technical foundation supports the spiritual mission while ensuring modern web standards, performance, and maintainability.