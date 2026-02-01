# Ronz Encrypt-Pad

## Overview

Ronz Encrypt-Pad is a client-side encrypted notepad application built with React and Vite. The application provides secure text storage using AES encryption, allowing users to create and manage encrypted notes directly in the browser. All encryption/decryption happens locally using the crypto-js library, with data persisted in localStorage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Framework
- **Framework**: React 19 with Vite 7 as the build tool
- **Styling**: Tailwind CSS loaded via CDN, with additional utility classes from `tailwind-merge` and `clsx` for conditional class management
- **Animations**: Framer Motion for UI animations and transitions
- **Icons**: Lucide React for iconography

### Encryption Architecture
- **Library**: crypto-js for AES encryption/decryption
- **Storage**: All encrypted data stored in browser localStorage
- **Default Password**: "ronzpad125" (stored in localStorage, user can change it)
- **Encryption Detection**: Encrypted strings are identified by the "U2FsdGVkX1" prefix (standard CryptoJS format)

### Key Design Decisions

1. **Client-Side Only Encryption**
   - All encryption/decryption occurs in the browser
   - No server-side processing of sensitive data
   - Password stored locally, not transmitted anywhere

2. **localStorage Persistence**
   - Notes and password persist across browser sessions
   - No backend database required
   - Simple but limited to single-device usage

3. **Vite Development Server**
   - Configured to run on port 5000
   - Host set to '0.0.0.0' for Replit compatibility
   - All hosts allowed for development purposes

### File Structure
- `src/main.jsx` - Application entry point (not yet created)
- `src/index.css` - Tailwind base styles and custom scrollbar styling
- `src/utils/crypto.js` - Encryption utilities (encrypt, decrypt, password management)

## External Dependencies

### Core Libraries
| Package | Purpose |
|---------|---------|
| react / react-dom | UI framework |
| vite | Build tool and dev server |
| @vitejs/plugin-react | React plugin for Vite |

### Styling & UI
| Package | Purpose |
|---------|---------|
| tailwindcss (CDN) | Utility-first CSS framework |
| tailwind-merge | Merge Tailwind classes without conflicts |
| clsx | Conditional class name builder |
| framer-motion | Animation library |
| lucide-react | Icon components |

### Security
| Package | Purpose |
|---------|---------|
| crypto-js | AES encryption/decryption |

### Storage
- **localStorage**: Browser-based persistence for encrypted notes and user password
- No external database or backend services required