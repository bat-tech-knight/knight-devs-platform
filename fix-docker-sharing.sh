#!/bin/bash
# Script to fix Docker Desktop file sharing for Supabase on Linux

echo "=== Docker Desktop File Sharing Fix for Supabase ==="
echo ""

# Check if running as root for system-wide config
if [ "$EUID" -eq 0 ]; then
    ADMIN_SETTINGS="/usr/share/docker-desktop/admin-settings.json"
    echo "Running as root - will create system-wide admin-settings.json"
    
    # Create directory if it doesn't exist
    mkdir -p "$(dirname "$ADMIN_SETTINGS")"
    
    # Create or update admin-settings.json
    cat > "$ADMIN_SETTINGS" << 'EOF'
{
  "filesharingAllowedDirectories": [
    "/home/baymaz"
  ]
}
EOF
    
    echo "✓ Created $ADMIN_SETTINGS"
    echo "✓ Added /home/baymaz to allowed file sharing directories"
    echo ""
    echo "Please restart Docker Desktop for changes to take effect:"
    echo "  systemctl --user restart docker-desktop"
    
else
    echo "This script needs root access to create system-wide settings."
    echo ""
    echo "Option 1: Run with sudo (recommended)"
    echo "  sudo $0"
    echo ""
    echo "Option 2: Manual GUI Configuration (no root needed)"
    echo "  1. Open Docker Desktop application"
    echo "  2. Click Settings (gear icon)"
    echo "  3. Go to Resources → File Sharing"
    echo "  4. Click '+' and add: /home/baymaz"
    echo "  5. Click 'Apply & Restart'"
    echo ""
    echo "Option 3: Use standard Docker instead of Docker Desktop"
    echo "  docker context use default"
    echo "  # Then install standard Docker if needed"
fi

echo ""
echo "After configuration, try: supabase start"
