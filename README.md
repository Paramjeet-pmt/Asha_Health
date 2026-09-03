# Project Structure

This project contains multiple healthcare-related web interfaces and modules for the ASHA (Accredited Social Health Activist) patient portal and rural health management system.

## Root Files

- **asha-navigation.css** - Global navigation stylesheet (back button styling)
- **asha-navigation.js** - Global navigation JavaScript (back button functionality)
- **index.html** - Main hub/launcher for all modules
- **README.md** - Project documentation

## Project Organization

The project is organized into **4 main categories** with **15 total modules**:

### 📱 Authentication & Onboarding (`auth/`)
Entry points and welcome screens for all user types:

- **admin_login/** - Secure mobile login for administrators
  - `index.html` - Admin authentication interface
  - `styles.css` - Admin login styling

- **patient_login_variant_1/** - Primary patient login interface
  - `index.html` - Feature-rich login with multiple methods (OTP, ABHA, QR, Voice)
  - `styles.css` - Login styling

- **patient_login_variant_2/** - Alternative patient login variant
  - `index.html` - Secondary login interface
  - `styles.css` - Variant styling

- **welcome_patient_portal/** - Patient portal welcome screen
  - `index.html` - Onboarding for ASHA patient portal
  - `styles.css` - Welcome styling

- **welcome_rural_connect/** - Rural health system welcome screen
  - `index.html` - Onboarding for rural health connect
  - `styles.css` - Welcome styling

- **loading_screen/** - ASHA cinematic loading screen
  - `index.html` - Branded loading animation
  - `styles.css` - Loading screen styling

### 👥 Patient Features (`patient/`)
End-user interfaces and patient-centric functionality:

- **dashboard/** - Patient home screen and health summary
  - `index.html` - Main patient dashboard with quick actions
  - `styles.css` - Dashboard styling and layouts

- **health_records/** - Personal health records management
  - `index.html` - View and manage personal health data
  - `styles.css` - Health records styling

- **doctor_queue/** - Doctor-patient queue management
  - `index.html` - Queue status and appointment tracking
  - `styles.css` - Queue interface styling

- **health_assistant/** - AI-powered health assistance
  - `index.html` - AI chatbot and health query interface
  - `styles.css` - Assistant UI styling

- **referral_journey/** - Patient referral tracking system
  - `index.html` - Track and manage referrals
  - `styles.css` - Referral interface styling

### 🏛️ Administration (`admin/`)
District-level analytics and management tools:

- **command_center/** - Responsive analytics dashboard
  - `index.html` - Selects the desktop or mobile design based on screen width
  - `desktop.html` / `desktop.css` - Desktop analytics dashboard
  - `mobile.html` / `mobile.css` - Mobile-optimized command center

### 🔧 Worker Tools (`workers/`)
Tools for frontline health workers and offline operations:

- **frontline_hub/** - Health worker management portal
  - `index.html` - Tools and resources for frontline ASHA workers
  - `styles.css` - Worker hub styling

- **sync_offline/** - Offline synchronization center
  - `index.html` - Connectivity management and offline sync features
  - `styles.css` - Sync center styling
## System Overview

This is a comprehensive healthcare management system designed to serve rural communities in India with features including:

- **Patient Management** - Registration, login, and health record management
- **Doctor Coordination** - Queue management and patient assignment
- **Health Workers** - Tools for frontline ASHA workers
- **Administrative** - Secure login and district-level command center
- **AI Assistance** - Health-related queries and assistance
- **Offline Capability** - Synchronization center for offline operations
- **Referral System** - Tracking and managing patient referrals

## Technology Stack

- **Frontend**: HTML5 + Tailwind CSS (CDN)
- **Icons**: Material Symbols (Google Fonts)
- **Typography**: Inter (body text), Geist (headings)
- **Design System**: Material Design 3 inspired with custom healthcare theme

## Getting Started

1. Open the main `index.html` in a web browser to view the module launcher
2. Click on any module card to open that specific page
3. Use the "Back" button (top-left, auto-injected) to return to the previous page
4. Each module is self-contained and works independently

## Navigation System

The project includes a global navigation layer:

- **asha-navigation.js** - Automatically injects a back button on every page
  - Intelligently hides on splash/login screens
  - Uses browser history for navigation
  - Fallback navigation when history is unavailable

- **asha-navigation.css** - Styles the global back button
  - Fixed position with glassmorphism effect
  - Responsive design for mobile and desktop
  - Accessible with keyboard navigation

## File Structure Pattern

Each module follows a consistent structure:

```
category/
└── module-name/
    ├── index.html         (HTML markup + inline Tailwind config)
    └── styles.css         (Module-specific overrides)
```

All modules reference the global navigation files:
- `../../asha-navigation.js`
- `../../asha-navigation.css`

## Design System & Color Palette

Custom Material Design 3 theme with semantic colors:

- **Primary**: `#001f3c` (Dark blue) - Main actions and branding
- **Secondary**: `#006b5f` (Teal) - Secondary actions and health indicators
- **Tertiary**: `#361500` (Brown) - Accent elements
- **Error**: `#ba1a1a` (Red) - Alerts and critical states
- **AI Purple**: `#3F0099` - AI features and insights
- **Admin Amber**: `#B45309` - Admin-specific UI elements
- **Sync/Offline**: `#727780` - Connectivity indicators

## Key Features

✅ **Mobile-First Design** - Responsive layouts optimized for all screen sizes  
✅ **Multilingual Support** - Language selection (English, हिंदी, मराठी)  
✅ **Offline Capability** - Sync center for low-connectivity scenarios  
✅ **AI Integration** - AI health assistant with purple branding  
✅ **Accessibility** - ARIA labels, semantic HTML, keyboard navigation  
✅ **Modern UI** - Glassmorphism effects, smooth animations, Material Design  
✅ **Status Indicators** - Real-time connectivity and operational status displays  

## User Roles & Workflows

### 1. Patient Workflow
- Welcome → Login (OTP/ABHA/QR) → Dashboard → Health Records → AI Assistant → Referrals

### 2. Administrator Workflow
- Admin Login → Command Center → Analytics & Reports → Facility Management

### 3. Frontline Worker Workflow
- Worker Hub → Patient Queue → Referral Management → Offline Sync

### 4. Doctor Workflow
- Patient Queue → Health Records → Referral Assignments

## Notes

- This is a **static prototype** with no backend API integration
- All data is demonstrative and not persisted
- Features are designed to work in both online and offline modes
- The navigation layer ensures consistent UX across all modules
- Each module can be deployed independently or as a complete system
