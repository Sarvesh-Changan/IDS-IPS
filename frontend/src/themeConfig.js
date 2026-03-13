/**
 * Centralized Color Configuration for IDS-IPS Security System
 * Following the 60-30-10 Rule for Professional UI/UX
 */

export const THEME_COLORS = {
    // 60% Dominant: Backgrounds and large surfaces
    dominant: {
        background: '#0B0F19', // Deep Navy Charcoal (Main background)
        sidebar: '#070A13',    // Darker variant for sidebar
        surface: '#0B0F19',    // General surface color
        text: '#F0F6FC',       // High contrast text (WCAG 2.1 AAA)
    },

    // 30% Secondary: Cards, panels, UI components, and borders
    secondary: {
        card: '#161E2D',       // Deep Blue Steel (Card background)
        panel: '#1C2533',      // Slightly lighter for nested panels
        border: '#2D3748',     // Steel Gray border
        hover: '#1F2937',      // Hover state for interactive items
        textMuted: '#8B949E',  // Muted text for secondary information
    },

    // 10% Accent: Critical interactive elements and security alerts
    accent: {
        primary: '#00F0FF',    // Electric Cyan (Primary buttons, Active states)
        danger: '#FF3131',     // Security Alert Red (Critical alerts)
        warning: '#FF9100',    // Warning Orange (Suspicious activity)
        success: '#00E676',    // Success Green (Clean state/resolution)
        info: '#00B0FF',       // Info Blue (System status)
    }
};

export const COLOR_USAGE_GUIDELINES = {
    dominant: "Use for body backgrounds and sidebars. Occupies ~60% of visual space.",
    secondary: "Use for cards, table rows, and borders. Occupies ~30% of visual space.",
    accent: "Use for CTA buttons, status badges, and critical alerts. Occupies ~10% of visual space.",
    accessibility: "Maintain minimum 4.5:1 contrast ratio. Current palette exceeds this (AA/AAA)."
};

export default THEME_COLORS;
