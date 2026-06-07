#!/bin/bash

# update-keys.sh - Utility to generate KEYS.txt content
# Usage: ./update-keys.sh <private_key_file>

PRIVATE_KEY_FILE="$1"

if [ -z "$PRIVATE_KEY_FILE" ]; then
    echo "Usage: $0 <private_key_file>"
    echo "Example: $0 private_key.pem"
    exit 1
fi

if [ ! -f "$PRIVATE_KEY_FILE" ]; then
    echo "Error: Private key file '$PRIVATE_KEY_FILE' not found"
    exit 1
fi

# Detect operating system
detect_os() {
    case "$(uname -s)" in
        Darwin*)              echo "macos" ;;
        Linux*)               echo "linux" ;;
        CYGWIN*|MINGW*|MSYS*) echo "windows" ;;
        *)                    echo "unknown" ;;
    esac
}

# Cross-platform date calculation (add 1 year)
calculate_next_year() {
    local os_type=$(detect_os)
    case "$os_type" in
        "macos")
            date -v +1y +%Y-%m-%d
            ;;
        "linux")
            date -d '+1 year' +%Y-%m-%d
            ;;
        "windows")
            # Try GNU date first (from Git Bash/MSYS2), fall back to PowerShell
            if command -v date >/dev/null 2>&1 && date -d '+1 year' +%Y-%m-%d 2>/dev/null; then
                date -d '+1 year' +%Y-%m-%d
            else
                echo "Error: Date calculation not supported on this Windows environment" >&2
                echo "Please install Git Bash or use WSL" >&2
                exit 1
            fi
            ;;
        *)
            echo "Error: Unsupported operating system" >&2
            exit 1
            ;;
    esac
}

# Cross-platform SHA256 calculation
calculate_sha256() {
    local os_type=$(detect_os)
    case "$os_type" in
        "macos")
            shasum -a 256 | cut -d' ' -f1
            ;;
        "linux")
            sha256sum | cut -d' ' -f1
            ;;
        "windows")
            # Try sha256sum first, fall back to PowerShell
            if command -v sha256sum >/dev/null 2>&1; then
                sha256sum | cut -d' ' -f1
            elif command -v powershell.exe >/dev/null 2>&1; then
                powershell.exe -Command "Get-FileHash -Algorithm SHA256 -InputStream \$input | Select-Object -ExpandProperty Hash" | tr '[:upper:]' '[:lower:]'
            else
                echo "Error: SHA256 calculation not available" >&2
                exit 1
            fi
            ;;
        *)
            echo "Error: Unsupported operating system for SHA256 calculation" >&2
            exit 1
            ;;
    esac
}

echo "Extracting information from $PRIVATE_KEY_FILE..."
echo "Detected OS: $(detect_os)"
echo

# Extract public key
PUBLIC_KEY=$(openssl pkey -in "$PRIVATE_KEY_FILE" -pubout -outform DER | base64 | tr -d '\n')

# Calculate fingerprint
FINGERPRINT=$(echo -n "$PUBLIC_KEY" | base64 -d | calculate_sha256)

# Generate dates
CURRENT_DATE=$(date +%Y-%m-%d)
NEXT_YEAR=$(calculate_next_year)

echo "=== COPY AND PASTE THE FOLLOWING INTO KEYS.txt ==="
echo
echo "Key ID: VT-$(date +%Y)-001"
echo "Valid From: $CURRENT_DATE"
echo "Valid Until: $NEXT_YEAR"
echo "Public Key: $PUBLIC_KEY"
echo "Fingerprint: $FINGERPRINT"
echo
echo "Last Updated: $CURRENT_DATE"
echo
echo "=== END OF COPY/PASTE CONTENT ==="
