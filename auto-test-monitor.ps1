# SepetTakip Otomatik Test İzleme Sistemi
# Bu script, sayfaları düzenli aralıklarla test eder ve raporları günceller

$testInterval = 3600  # Default: Her saat (saniye cinsinden)
$reportFile = "auto-test-monitor-log.md"
$watchingDirs = @("app", "components", "lib", "styles")

function Write-Log {
    param (
        [string]$message,
        [string]$type = "INFO"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$type] $message"
    
    Write-Host $logMessage
    Add-Content -Path $reportFile -Value $logMessage
}

function Check-Docker {
    try {
        $dockerVersion = docker --version
        Write-Log "Docker detected: $dockerVersion"
        return $true
    }
    catch {
        Write-Log "Docker not installed or not running" "ERROR"
        return $false
    }
}

function Get-PageFiles {
    $pageFiles = Get-ChildItem -Path $watchingDirs -Filter "page.tsx" -Recurse
    return $pageFiles
}

function Calculate-Hash {
    param (
        [string]$filePath
    )
    
    $fileHash = Get-FileHash -Path $filePath -Algorithm MD5
    return $fileHash.Hash
}

function Update-FileHashes {
    $pages = Get-PageFiles
    $hashes = @{}
    
    foreach ($page in $pages) {
        $hashes[$page.FullName] = Calculate-Hash -filePath $page.FullName
    }
    
    return $hashes
}

function Run-Tests {
    Write-Log "Starting test process..." "TEST"
    
    if (Test-Path "run-production-tests.bat") {
        Write-Log "Running batch script..."
        cmd.exe /c run-production-tests.bat
    }
    else {
        Write-Log "Batch script not found. Testing with Docker directly..."
        
        if (Check-Docker) {
            try {
                # Clean up existing containers
                docker-compose down -v
                
                # Build and start production environment
                docker-compose --profile prod up -d
                
                # Wait for app to start
                Write-Log "Waiting for application to start..."
                Start-Sleep -Seconds 10
                
                # Run tests
                docker-compose --profile test up --abort-on-container-exit
                
                # Copy test results
                docker cp sepettakip-test-pages:/app/playwright-report ./
                docker cp sepettakip-test-pages:/app/test-results ./
                
                # Update reports
                docker exec sepettakip-test-pages node /app/scripts/update-test-reports.js
                
                # Clean up
                docker-compose down -v
                
                Write-Log "Testing completed successfully" "SUCCESS"
            }
            catch {
                Write-Log "Error during test process: $_" "ERROR"
            }
        }
    }
}

function Monitor-Changes {
    Write-Log "Starting automated monitoring..."
    
    # İlk dosya hash'lerini al
    $fileHashes = Update-FileHashes
    $lastTestTime = Get-Date
    
    while ($true) {
        $currentTime = Get-Date
        $timeElapsed = ($currentTime - $lastTestTime).TotalSeconds
        
        # Dosya değişikliklerini kontrol et
        $currentHashes = Update-FileHashes
        $changesDetected = $false
        
        foreach ($file in $currentHashes.Keys) {
            if (-not $fileHashes.ContainsKey($file) -or $fileHashes[$file] -ne $currentHashes[$file]) {
                $changesDetected = $true
                $relPath = $file.Replace("$PWD\", "")
                Write-Log "Change detected in file: $relPath" "CHANGE"
            }
        }
        
        # Zamanlayıcı veya değişiklik durumuna göre test başlat
        if ($changesDetected -or $timeElapsed -ge $testInterval) {
            Write-Log "Running tests due to: $(if ($changesDetected) {'file changes'} else {'scheduled interval'})"
            
            # Referansları güncelle
            $fileHashes = $currentHashes.Clone()
            $lastTestTime = Get-Date
            
            # Testleri çalıştır
            Run-Tests
        }
        
        # 10 saniye bekle
        Start-Sleep -Seconds 10
    }
}

# Ana fonksiyon
function Start-Monitoring {
    Clear-Host
    
    # Başlangıç banner'ı
    $banner = @"
===== SepetTakip Otomatik Test İzleme Sistemi =====

Bu sistem, sayfaları otomatik olarak izler ve değişiklik 
olduğunda veya belirli aralıklarla test eder.

İzlenen Klasörler: $($watchingDirs -join ", ")
Test Aralığı: $($testInterval / 60) dakika
"@

    Write-Host $banner -ForegroundColor Cyan
    
    # Log dosyasını başlat
    if (-not (Test-Path $reportFile)) {
        "# SepetTakip Otomatik Test İzleme Raporu`n" | Out-File $reportFile
        "Başlangıç Zamanı: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")`n" | Add-Content $reportFile
    }
    
    # Docker kontrolü
    if (-not (Check-Docker)) {
        Write-Host "`nDikkat: Docker kurulu değil veya çalışmıyor. Docker kurulumunu tamamladıktan sonra tekrar çalıştırın." -ForegroundColor Yellow
        exit
    }
    
    # İzlemeyi başlat
    Monitor-Changes
}

# Ana fonksiyonu çağır
Start-Monitoring 