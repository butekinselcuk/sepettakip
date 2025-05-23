# Toast Provider Düzeltme Scripti
Write-Host "Toast Provider sorunlarını düzeltme işlemi başlatılıyor..." -ForegroundColor Cyan

# Root layout'ın ToastProvider içerdiğinden emin olalım
$rootLayoutPath = "app/layout.tsx"
$rootLayoutContent = Get-Content $rootLayoutPath -Raw -Encoding UTF8

if (-not $rootLayoutContent.Contains("import { ToastProvider }")) {
    Write-Host "Root layout dosyasını kontrol edin, ToastProvider import edilmemiş!" -ForegroundColor Red
    exit 1
}

if (-not $rootLayoutContent.Contains("<ToastProvider>")) {
    Write-Host "Root layout dosyasını kontrol edin, ToastProvider bileşeni kullanılmamış!" -ForegroundColor Red
    exit 1
}

# Tüm dosyaları tara ve iç içe ToastProvider kullanımlarını düzelt
$allTsxFiles = Get-ChildItem -Path . -Filter "*.tsx" -Recurse | Where-Object { $_.FullName -notlike "*node_modules*" }

$issueCounts = @{
    "MultipleImports" = 0
    "NestedProviders" = 0
    "FixedFiles" = 0
}

foreach ($file in $allTsxFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $modified = $false
    
    # Root layout dışında ve AdminLayout dışında ToastProvider içeren dosyaları bul
    if ($file.FullName -ne (Resolve-Path $rootLayoutPath).Path -and $file.Name -ne "AdminLayout.tsx" -and 
        $content.Contains("<ToastProvider>") -and $content.Contains("</ToastProvider>")) {
        
        Write-Host "İç içe ToastProvider kullanımı bulundu: $($file.FullName)" -ForegroundColor Yellow
        
        # ToastProvider çıkarılmış yeni içeriği hazırla
        $newContent = $content -replace '<ToastProvider>([\s\S]*?)</ToastProvider>', '$1'
        
        if ($newContent -ne $content) {
            $content = $newContent
            $modified = $true
            $issueCounts["NestedProviders"]++
        }
    }
    
    # Toaster bileşeninin içinden ToastProvider kullanımını kaldır
    if ($file.Name -eq "toaster.tsx" -and $content.Contains("ToastProvider") -and 
        $content.Contains("<ToastProvider>")) {
        
        Write-Host "Toaster içinde ToastProvider kullanımı bulundu: $($file.FullName)" -ForegroundColor Yellow
        
        # ToastProvider import'unu çıkar
        $newContent = $content -replace "import \{(\s*[\w,\s]+,)?\s*ToastProvider\s*(,[\w,\s]+)?\s*\} from ['""].*['""];", 'import {$1$2} from "./toast";'
        
        # ToastProvider etiketlerini Fragment ile değiştir
        $newContent = $newContent -replace '<ToastProvider>([\s\S]*?)</ToastProvider>', '<>$1</>'
        
        if ($newContent -ne $content) {
            $content = $newContent
            $modified = $true
            $issueCounts["MultipleImports"]++
        }
    }
    
    # Düzeltilmiş içeriği dosyaya yaz
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8
        $issueCounts["FixedFiles"]++
        Write-Host "Dosya düzeltildi: $($file.FullName)" -ForegroundColor Green
    }
}

Write-Host "`nDüzeltme işlemi tamamlandı!" -ForegroundColor Cyan
Write-Host "Toplam düzeltilen dosya sayısı: $($issueCounts["FixedFiles"])" -ForegroundColor Green
Write-Host "İç içe provider sorunları: $($issueCounts["NestedProviders"])" -ForegroundColor Yellow
Write-Host "Çoklu import sorunları: $($issueCounts["MultipleImports"])" -ForegroundColor Yellow 