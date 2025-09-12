#!/bin/bash
# Script to add authentication protection to remaining HTML files in login folder

FILES=(
    "data_print.html"
    "datalist_old.html"
    "editdetails.html"
    "editdetailsnew.html"
    "entrynew.html"
    "promotion.html"
    "all_data_field.html"
)

for file in "${FILES[@]}"; do
    echo "Processing $file..."
    
    # Check if file exists and has supabase
    if grep -q "supabase" "c:/xampp/htdocs/fenimodel25/login/$file" 2>/dev/null; then
        echo "  - File has Supabase, adding auth protection..."
        
        # Add auth-check script after supabase script tag
        sed -i 's|<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>|<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n  <!-- Authentication Protection -->\n  <script src="./auth-check.js"></script>|g' "c:/xampp/htdocs/fenimodel25/login/$file"
    else
        echo "  - File doesn't have Supabase, adding basic auth protection to head..."
        
        # Add to head section for files without Supabase
        sed -i 's|</head>|  <!-- Authentication Protection -->\n  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n  <script src="./auth-check.js"></script>\n</head>|g' "c:/xampp/htdocs/fenimodel25/login/$file"
    fi
    
    echo "  - $file protected!"
done

echo "All files processed!"