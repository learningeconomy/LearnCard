#!/usr/bin/env sh
set -e

if [ -z "$NX_PROJECT_NAME" ] && [ -z "$NX_FILE_CHANGES" ]; then
  exit 0
fi

should_build=true

filtered_files=""

if [ -n "$NX_FILE_CHANGES" ]; then
  should_build=false

  for file in $NX_FILE_CHANGES; do
    case "$file" in
      */dist/*|*/build/*|*/coverage/*|*/.nx/*|*/node_modules/*)
        ;;
      *)
        should_build=true
        filtered_files="$filtered_files $file"
        ;;
    esac
  done
fi

if [ "$should_build" != "true" ]; then
  exit 0
fi

projects="$NX_PROJECT_NAME"

if [ -z "$projects" ] && [ -n "$filtered_files" ]; then
  projects=$(pnpm exec nx print-affected --files="$filtered_files" --select=projects | tr ',' ' ')
fi

for project in $projects; do
  if [ -z "$project" ] || [ "$project" = "learn-card-app" ]; then
    continue
  fi

  echo "[nx-watch] rebuilding $project"
  pnpm exec nx run "$project:build"
done
