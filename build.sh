#!/bin/bash

# Vibe AI Agent - Complete Build Script
# This script builds the Android APK from scratch

set -e

echo "🤖 Vibe AI Agent - Build Script"
echo "================================"

# Check prerequisites
check_prerequisites() {
    echo "📋 Checking prerequisites..."
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js not found. Please install Node.js 18+"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo "❌ npm not found. Please install npm"
        exit 1
    fi
    
    echo "✅ Node.js $(node -v)"
    echo "✅ npm $(npm -v)"
}

# Install dependencies
install_deps() {
    echo "📦 Installing dependencies..."
    npm install
}

# Create www directory and copy files
copy_files() {
    echo "📁 Copying web files..."
    mkdir -p www
    cp index.html www/
    cp styles.css www/
    cp app.js www/
    cp manifest.json www/
    cp sw.js www/
    cp icon-*.png www/ 2>/dev/null || echo "⚠️ Icons not found, will be generated"
}

# Generate icons if not exist
generate_icons() {
    if [ ! -f "icon-192.png" ]; then
        echo "🎨 Generating icons..."
        # Create simple placeholder icons using ImageMagick or Node
        if command -v convert &> /dev/null; then
            convert -size 192x192 xc:'#667eea' -fill white -gravity center \
                -pointsize 80 -annotate 0 'V' icon-192.png
            convert -size 512x512 xc:'#667eea' -fill white -gravity center \
                -pointsize 200 -annotate 0 'V' icon-512.png
        else
            echo "⚠️ ImageMagick not found. Please add icon-192.png and icon-512.png manually"
        fi
    fi
}

# Initialize Capacitor
init_capacitor() {
    echo "⚡ Initializing Capacitor..."
    if [ ! -d "android" ]; then
        npx cap add android
    fi
}

# Sync web files to Android
sync_android() {
    echo "🔄 Syncing with Android..."
    npx cap sync android
}

# Build Android APK
build_apk() {
    echo "🔨 Building Android APK..."
    cd android
    
    # Check for gradle wrapper
    if [ ! -f "gradlew" ]; then
        echo "❌ Gradle wrapper not found"
        exit 1
    fi
    
    chmod +x gradlew
    
    # Build debug APK
    ./gradlew assembleDebug
    
    cd ..
    
    # Copy APK to root
    APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
    if [ -f "$APK_PATH" ]; then
        cp "$APK_PATH" "./vibe-ai-agent.apk"
        echo "✅ APK built successfully!"
        echo "📍 Location: ./vibe-ai-agent.apk"
        ls -lh ./vibe-ai-agent.apk
    else
        echo "❌ APK not found at expected location"
        exit 1
    fi
}

# Build release APK
build_release() {
    echo "🔨 Building Release APK..."
    cd android
    ./gradlew assembleRelease
    cd ..
    
    RELEASE_APK="android/app/build/outputs/apk/release/app-release-unsigned.apk"
    if [ -f "$RELEASE_APK" ]; then
        cp "$RELEASE_APK" "./vibe-ai-agent-release.apk"
        echo "✅ Release APK built!"
        echo "📍 Location: ./vibe-ai-agent-release.apk"
        echo "⚠️ Note: Release APK needs to be signed before distribution"
    fi
}

# Main execution
main() {
    echo ""
    echo "Choose build option:"
    echo "1) Full build (install deps + build debug APK)"
    echo "2) Quick build (just rebuild APK)"
    echo "3) Release build"
    echo "4) Web only (no APK)"
    echo ""
    
    read -p "Enter option (1-4): " option
    
    case $option in
        1)
            check_prerequisites
            install_deps
            generate_icons
            copy_files
            init_capacitor
            sync_android
            build_apk
            ;;
        2)
            copy_files
            sync_android
            build_apk
            ;;
        3)
            copy_files
            sync_android
            build_release
            ;;
        4)
            copy_files
            echo "✅ Web files ready in ./www/"
            echo "Run 'npx serve www' to test locally"
            ;;
        *)
            echo "Invalid option"
            exit 1
            ;;
    esac
    
    echo ""
    echo "🎉 Build complete!"
}

# Run if executed directly
if [ "$1" == "--auto" ]; then
    check_prerequisites
    install_deps
    generate_icons
    copy_files
    init_capacitor
    sync_android
    build_apk
else
    main
fi
