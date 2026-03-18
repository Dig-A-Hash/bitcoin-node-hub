# Maintainer Docs Index

Quick index for internal maintenance documentation.

## Suggested Reading Order

1. `MAINTAINERS_PLAYBOOK.md` - Architecture, data flow, API map, and safe-change guidance.
2. `CODING_STANDARDS.md` - Conventions for API, types, lifecycle, caching, and security.
3. `TROUBLESHOOTING_MATRIX.md` - Symptom-first debugging guide.
4. `RELEASE_CHECKLIST.md` - Pre-release and release gate checklist.
5. `docs/guide/overview.md` - VitePress docs site entry and scope.
6. `docs/guide/local-docker-workflow.md` - Strict Docker docs workflow commands.
7. `docs/guide/deployment-amplify.md` - Docs-only AWS Amplify deployment and subdomain mapping.

## Doc Purposes

- `MAINTAINERS_PLAYBOOK.md`: Primary maintenance reference.
- `CODING_STANDARDS.md`: Rules to keep code changes consistent and safe.
- `TROUBLESHOOTING_MATRIX.md`: Fast diagnosis when behavior breaks.
- `RELEASE_CHECKLIST.md`: Final quality and safety gate before release.
- `docs/guide/overview.md`: Docs site architecture and intent.
- `docs/guide/local-docker-workflow.md`: Required Docker workflow for docs dev/build.
- `docs/guide/deployment-amplify.md`: Amplify docs app setup and publish target.

## Workflow Reminder

- Local workflow is Docker-only for this repository.
- Do not run Node.js or npm directly on the host machine.
- Use README Docker Support commands as the source of truth.
