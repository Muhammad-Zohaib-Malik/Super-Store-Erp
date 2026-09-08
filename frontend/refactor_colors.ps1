$replacements = @{
    "\bbg-slate-50\b" = "bg-base"
    "\bbg-white\b" = "bg-surface"
    "\bborder-slate-200\b" = "border-divider"
    "\bborder-slate-100\b" = "border-divider-light"
    "\btext-slate-900\b" = "text-content"
    "\btext-slate-700\b" = "text-content"
    "\btext-slate-500\b" = "text-content-muted"
    "\btext-slate-400\b" = "text-content-subtle"
    "\btext-slate-200\b" = "text-content-inverse"
    "\bhover:text-slate-700\b" = "hover:text-content"
    "\bhover:text-slate-300\b" = "hover:text-content-inverse"
    "\bhover:text-slate-200\b" = "hover:text-content-inverse"
    "\bhover:bg-slate-100\b" = "hover:bg-surface-hover"
    "\bhover:bg-slate-50\b" = "hover:bg-surface-hover"
    "\bbg-slate-800\b" = "bg-sidebar-hover"
}

Get-ChildItem -Path .\src -Recurse -Include *.jsx,*.js | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $modified = $false
    foreach ($key in $replacements.Keys) {
        if ($content -match $key) {
            $content = $content -replace $key, $replacements[$key]
            $modified = $true
        }
    }
    if ($modified) {
        Set-Content -Path $_.FullName -Value $content
        Write-Host "Updated $($_.Name)"
    }
}
