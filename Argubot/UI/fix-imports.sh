#!/bin/bash

# Script to fix import statements in UI components
# This removes version numbers from import statements

echo "🔧 Fixing import statements in UI components..."

# Fix imports in all tsx and ts files in components/ui directory
find ./components/ui -name "*.tsx" -o -name "*.ts" | while read file; do
    echo "Processing: $file"
    
    # Remove version numbers from @radix-ui imports
    sed -i '' 's/@radix-ui\/react-[^@]*@[0-9.]*/@radix-ui\/react-\1/g' "$file"
    sed -i '' 's/@radix-ui\/react-slot@[0-9.]*/@radix-ui\/react-slot/g' "$file"
    sed -i '' 's/@radix-ui\/react-context-menu@[0-9.]*/@radix-ui\/react-context-menu/g' "$file"
    sed -i '' 's/@radix-ui\/react-select@[0-9.]*/@radix-ui\/react-select/g' "$file"
    sed -i '' 's/@radix-ui\/react-dialog@[0-9.]*/@radix-ui\/react-dialog/g' "$file"
    sed -i '' 's/@radix-ui\/react-separator@[0-9.]*/@radix-ui\/react-separator/g' "$file"
    sed -i '' 's/@radix-ui\/react-radio-group@[0-9.]*/@radix-ui\/react-radio-group/g' "$file"
    sed -i '' 's/@radix-ui\/react-menubar@[0-9.]*/@radix-ui\/react-menubar/g' "$file"
    sed -i '' 's/@radix-ui\/react-label@[0-9.]*/@radix-ui\/react-label/g' "$file"
    sed -i '' 's/@radix-ui\/react-toggle-group@[0-9.]*/@radix-ui\/react-toggle-group/g' "$file"
    sed -i '' 's/@radix-ui\/react-checkbox@[0-9.]*/@radix-ui\/react-checkbox/g' "$file"
    sed -i '' 's/@radix-ui\/react-collapsible@[0-9.]*/@radix-ui\/react-collapsible/g' "$file"
    sed -i '' 's/@radix-ui\/react-dropdown-menu@[0-9.]*/@radix-ui\/react-dropdown-menu/g' "$file"
    sed -i '' 's/@radix-ui\/react-toggle@[0-9.]*/@radix-ui\/react-toggle/g' "$file"
    sed -i '' 's/@radix-ui\/react-switch@[0-9.]*/@radix-ui\/react-switch/g' "$file"
    sed -i '' 's/@radix-ui\/react-accordion@[0-9.]*/@radix-ui\/react-accordion/g' "$file"
    sed -i '' 's/@radix-ui\/react-alert-dialog@[0-9.]*/@radix-ui\/react-alert-dialog/g' "$file"
    sed -i '' 's/@radix-ui\/react-aspect-ratio@[0-9.]*/@radix-ui\/react-aspect-ratio/g' "$file"
    sed -i '' 's/@radix-ui\/react-avatar@[0-9.]*/@radix-ui\/react-avatar/g' "$file"
    sed -i '' 's/@radix-ui\/react-hover-card@[0-9.]*/@radix-ui\/react-hover-card/g' "$file"
    sed -i '' 's/@radix-ui\/react-navigation-menu@[0-9.]*/@radix-ui\/react-navigation-menu/g' "$file"
    sed -i '' 's/@radix-ui\/react-popover@[0-9.]*/@radix-ui\/react-popover/g' "$file"
    sed -i '' 's/@radix-ui\/react-progress@[0-9.]*/@radix-ui\/react-progress/g' "$file"
    sed -i '' 's/@radix-ui\/react-scroll-area@[0-9.]*/@radix-ui\/react-scroll-area/g' "$file"
    sed -i '' 's/@radix-ui\/react-slider@[0-9.]*/@radix-ui\/react-slider/g' "$file"
    sed -i '' 's/@radix-ui\/react-tabs@[0-9.]*/@radix-ui\/react-tabs/g' "$file"
    sed -i '' 's/@radix-ui\/react-tooltip@[0-9.]*/@radix-ui\/react-tooltip/g' "$file"
    
    # Remove version numbers from class-variance-authority
    sed -i '' 's/class-variance-authority@[0-9.]*/class-variance-authority/g' "$file"
    
    # Fix type imports
    sed -i '' 's/, type VariantProps/, VariantProps/g' "$file"
    sed -i '' 's/, type ClassValue/, ClassValue/g' "$file"
    sed -i '' 's/, type ControllerProps/, ControllerProps/g' "$file"
    sed -i '' 's/, type FieldPath/, FieldPath/g' "$file"
    sed -i '' 's/, type FieldValues/, FieldValues/g' "$file"
    sed -i '' 's/, type UseEmblaCarouselType/, UseEmblaCarouselType/g' "$file"
    sed -i '' 's/, type CarouselApi/, CarouselApi/g' "$file"
done

echo "✅ Import fixes completed!"
