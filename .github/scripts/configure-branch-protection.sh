#!/usr/bin/env bash
# One-time setup: require the CI workflow to pass before merging into main/master.
#
# Prerequisites:
#   - GitHub CLI: https://cli.github.com/
#   - Admin access to the repository
#   - At least one successful CI run on the default branch (so the check appears)
#
# Usage:
#   ./.github/scripts/configure-branch-protection.sh [branch]
#   ./.github/scripts/configure-branch-protection.sh master

set -euo pipefail

BRANCH="${1:-master}"
REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
CHECK_NAME="Build and test"

echo "Configuring branch protection for ${REPO}@${BRANCH}"
echo "Required status check: ${CHECK_NAME}"
echo ""
echo "Note: Run this after CI has completed at least once on ${BRANCH},"
echo "      otherwise '${CHECK_NAME}' may not appear in GitHub's check list."
echo ""

gh api \
  --method PUT \
  "repos/${REPO}/branches/${BRANCH}/protection" \
  --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "checks": [
      {
        "context": "${CHECK_NAME}",
        "app_id": -1
      }
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF

echo ""
echo "Branch protection enabled on ${BRANCH}."
echo "Pull requests cannot merge until '${CHECK_NAME}' passes."
