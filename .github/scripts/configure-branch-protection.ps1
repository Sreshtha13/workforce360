# One-time setup: require the CI workflow to pass before merging into main/master.
#
# Prerequisites:
#   - GitHub CLI: https://cli.github.com/
#   - Admin access to the repository
#   - At least one successful CI run on the default branch (so the check appears)
#
# Usage:
#   .\.github\scripts\configure-branch-protection.ps1
#   .\.github\scripts\configure-branch-protection.ps1 -Branch master

param(
    [string]$Branch = "master"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Error "GitHub CLI (gh) is required. Install from https://cli.github.com/ and run 'gh auth login'."
}

$Repo = gh repo view --json nameWithOwner -q .nameWithOwner
$CheckName = "Build and test"

Write-Host "Configuring branch protection for ${Repo}@${Branch}"
Write-Host "Required status check: ${CheckName}"
Write-Host ""
Write-Host "Note: Run this after CI has completed at least once on ${Branch},"
Write-Host "      otherwise '${CheckName}' may not appear in GitHub's check list."
Write-Host ""

$Body = @{
    required_status_checks = @{
        strict = $true
        checks = @(
            @{
                context = $CheckName
                app_id  = -1
            }
        )
    }
    enforce_admins                = $false
    required_pull_request_reviews = $null
    restrictions                  = $null
    required_linear_history       = $false
    allow_force_pushes            = $false
    allow_deletions               = $false
} | ConvertTo-Json -Depth 5 -Compress

$Body | gh api --method PUT "repos/${Repo}/branches/${Branch}/protection" --input -

Write-Host ""
Write-Host "Branch protection enabled on ${Branch}."
Write-Host "Pull requests cannot merge until '${CheckName}' passes."
