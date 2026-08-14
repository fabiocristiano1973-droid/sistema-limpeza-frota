<#
Watchdog de producao do Sistema de Inspecao da Limpeza da Frota.
Mantem "next start" rodando na porta 3000, reiniciando automaticamente se o
processo cair. Pensado para ser chamado pelo Agendador de Tarefas do Windows
(gatilho "ao fazer logon"), sem depender de terminal ou sessao do Claude aberta.
#>

$ErrorActionPreference = "Stop"

$ProjectDir = "C:\Users\Rota\OneDrive\Meus Documentos Pessoais\Sistema_Limpeza_Frota"
$LogDir = "$env:LOCALAPPDATA\SistemaLimpezaFrota\logs"
$Port = 3000

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

$LogFile = Join-Path $LogDir ("watchdog-{0}.log" -f (Get-Date -Format "yyyy-MM-dd"))

# IMPORTANTE: SourceExists() pode lancar SecurityException quando o processo
# nao tem privilegio para enumerar TODOS os logs de evento (ex.: Security,
# State ficam bloqueados para usuario comum). Com $ErrorActionPreference =
# "Stop" isso derrubava o watchdog inteiro silenciosamente antes mesmo de
# registrar a primeira linha de log — bug real encontrado em producao.
# Todo o bloco precisa estar dentro do try/catch, nao so o New-EventLog.
try {
    if (-not [System.Diagnostics.EventLog]::SourceExists("SistemaLimpezaFrotaWatchdog")) {
        New-EventLog -LogName Application -Source "SistemaLimpezaFrotaWatchdog" -ErrorAction SilentlyContinue
    }
} catch {
    # Sem permissao para checar/criar a fonte de eventos: seguimos sem o
    # fallback de EventLog. O log em arquivo (Write-Log abaixo) continua
    # funcionando normalmente.
}

function Write-Log {
    param([string]$Message)
    $line = "{0} {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message
    $written = $false
    for ($i = 0; $i -lt 3 -and -not $written; $i++) {
        try {
            Add-Content -Path $LogFile -Value $line -ErrorAction Stop
            $written = $true
        } catch {
            Start-Sleep -Milliseconds 200
        }
    }
    if (-not $written) {
        try {
            Write-EventLog -LogName Application -Source "SistemaLimpezaFrotaWatchdog" -EventId 1 -EntryType Warning -Message "Falha ao gravar log em arquivo: $line"
        } catch {}
    }
}

Set-Location $ProjectDir

Write-Log "Watchdog iniciado (PID $PID)."

$attempt = 0
while ($true) {
    $attempt++
    $stdoutLog = Join-Path $LogDir ("next-stdout-{0}.log" -f (Get-Date -Format "yyyy-MM-dd"))
    $stderrLog = Join-Path $LogDir ("next-stderr-{0}.log" -f (Get-Date -Format "yyyy-MM-dd"))

    Write-Log "Iniciando 'next start' (tentativa $attempt)..."

    $proc = Start-Process -FilePath "node" `
        -ArgumentList @("node_modules/next/dist/bin/next", "start", "-p", "$Port") `
        -WorkingDirectory $ProjectDir `
        -RedirectStandardOutput $stdoutLog `
        -RedirectStandardError $stderrLog `
        -PassThru `
        -WindowStyle Hidden

    Write-Log "Processo 'next start' rodando com PID $($proc.Id)."
    Wait-Process -Id $proc.Id -ErrorAction SilentlyContinue

    Write-Log "Processo 'next start' encerrou (ExitCode=$($proc.ExitCode)). Reiniciando em 5s..."
    Start-Sleep -Seconds 5
}
