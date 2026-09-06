#!/usr/bin/env bash
#
# Push the flashcards API's environment variables into Vercel.
#
# The deployed site cannot reach DynamoDB until these four exist, which is why
# /api/health reports CredentialsProviderError on a fresh project. This reads
# the AWS key pair straight from ~/.aws/credentials and pipes it to the Vercel
# CLI, so the secret is never typed into a terminal, pasted into a chat, or
# written to a file in this repo.
#
#   vercel login            # once
#   ./scripts/setup-vercel-env.sh
#
# Options:
#   AWS_PROFILE=<name>      which ~/.aws/credentials profile to read (default: default)
#   ANKI_REGION=<region>    table region (default: ap-southeast-2)
#   ANKI_TABLE=<name>       table name  (default: AnkiFlashcards)

set -euo pipefail

cd "$(dirname "$0")/.."

PROFILE="${AWS_PROFILE:-default}"
REGION="${ANKI_REGION:-ap-southeast-2}"
TABLE="${ANKI_TABLE:-AnkiFlashcards}"
CREDS="$HOME/.aws/credentials"
ENVIRONMENTS=(production preview development)

vercel() { npx --no-install vercel "$@"; }

die() { printf '\n✗ %s\n' "$1" >&2; exit 1; }

# ----------------------------------------------------------- preflight ---

command -v npx >/dev/null || die "npx not found — install Node.js first."

if ! vercel whoami >/dev/null 2>&1; then
  die "Not logged in to Vercel. Run:  npx vercel login"
fi
printf '✓ Vercel account: %s\n' "$(vercel whoami 2>/dev/null | tail -1)"

if [ ! -d .vercel ]; then
  printf '\nThis directory is not linked to a Vercel project yet.\n'
  vercel link || die "vercel link failed."
fi

[ -f "$CREDS" ] || die "No $CREDS. Create it with:  aws configure"

# Read the pair without ever echoing it.
read_cred() {
  awk -v profile="[$PROFILE]" -v key="$1" '
    $0 == profile { inside = 1; next }
    /^\[/         { inside = 0 }
    inside && $1 == key { sub(/^[^=]*=[[:space:]]*/, ""); print; exit }
  ' "$CREDS"
}

KEY_ID="$(read_cred aws_access_key_id)"
KEY_SECRET="$(read_cred aws_secret_access_key)"

[ -n "$KEY_ID" ]     || die "No aws_access_key_id under [$PROFILE] in $CREDS."
[ -n "$KEY_SECRET" ] || die "No aws_secret_access_key under [$PROFILE] in $CREDS."

printf '✓ AWS profile [%s], key id %s…\n' "$PROFILE" "${KEY_ID:0:8}"
printf '✓ Target: table %s in %s\n' "$TABLE" "$REGION"

# ------------------------------------------------------------ optional ---

printf '\nA passcode gates every write to your decks. Without one, anyone who\n'
printf 'opens the deployed site can edit or delete your cards.\n'
read -r -p 'Set a study passcode now? [Y/n] ' answer
PASSCODE=""
if [[ ! "$answer" =~ ^[Nn] ]]; then
  read -r -s -p 'Passcode: ' PASSCODE; printf '\n'
  [ -n "$PASSCODE" ] || printf '  (empty — skipping)\n'
fi

# --------------------------------------------------------------- write ---

# `vercel env add` refuses to overwrite, so drop any existing value first.
# Older CLI versions prompt for confirmation instead of taking a flag, so the
# answer is piped in rather than passed as one.
set_var() {
  local name="$1" value="$2" env
  for env in "${ENVIRONMENTS[@]}"; do
    printf 'y\n' | vercel env rm "$name" "$env" >/dev/null 2>&1 || true
    printf '%s' "$value" | vercel env add "$name" "$env" >/dev/null 2>&1 || die \
      "Could not set $name for $env. Add it by hand at
   Vercel → your project → Settings → Environment Variables."
  done
  printf '  set %s\n' "$name"
}

printf '\nWriting environment variables (values are never printed):\n'
set_var ANKI_AWS_ACCESS_KEY_ID     "$KEY_ID"
set_var ANKI_AWS_SECRET_ACCESS_KEY "$KEY_SECRET"
set_var AWS_REGION_ANKI            "$REGION"
set_var ANKI_TABLE_NAME            "$TABLE"
[ -n "$PASSCODE" ] && set_var STUDY_PASSCODE "$PASSCODE"

# ------------------------------------------------------------- deploy ---

printf '\nEnvironment variables only take effect on the next deployment.\n'
read -r -p 'Deploy to production now? [Y/n] ' answer
if [[ ! "$answer" =~ ^[Nn] ]]; then
  vercel --prod || die "Deploy failed — trigger one from the Vercel dashboard instead."
fi

printf '\nVerify with:\n'
printf '  curl -s https://www.pprabin.com.np/api/health\n'
printf '\n"ok": true means the table is reachable. If it still reports\n'
printf 'CredentialsProviderError, the deployment predates these variables —\n'
printf 'redeploy once more.\n'
