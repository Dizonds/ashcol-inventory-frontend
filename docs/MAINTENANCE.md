# Repository maintenance

## Submission organization

- Grouped screens, styles, and existing tests by feature under `client/src/pages`.
- Grouped shared controls under `components/common` and layout under `components/layout`.
- Updated local imports, lazy imports, and test mocks for the new locations.
- Added repository-level setup, development, build, lint, and test commands.
- Removed duplicate root dependency declarations; application packages belong to `client`.
- Replaced outdated setup documents with instructions matching the current folder names and ports.
- Added editor and Git text-file conventions and expanded generated-file exclusions.

Old documentation, database exports, demo JSON, connection exports, development screenshots, the lockfile-only legacy folder, and duplicate root dependencies were archived outside this Git repository. They are not needed to install or run the frontend. Active application images, public browser assets, and all existing test suites were retained.

Generated build output and dependencies are local artifacts. Recreate them with the commands in the main README rather than adding them to source control. The repository's existing Git history is preserved; removing historical files from the current working tree does not rewrite earlier commits.

## Validation commands

```powershell
npm run lint
npm run test:ci
npm run build
```

The Jest suite uses mocked API responses. Browser smoke checks should also cover login, loading a feature page, refreshing its direct URL, and reaching `/api/health` through the development proxy.

## Cleanup verification

Verified on October 19, 2026:

- ESLint passed with no errors or warnings.
- All 19 Jest suites and 92 tests passed.
- The production build completed successfully.
- Static checks found no missing relative imports, unreachable application files, or broken local documentation links.
- The root setup command passed an npm clean-install dry run.
- Browser checks loaded login and all ten authenticated page routes with mocked account/data responses and no JavaScript errors or failed source-module requests.
- The running backend health endpoint responded successfully through the development proxy.

These checks verify that the file reorganization preserves frontend loading and existing test coverage; mocked browser data does not verify every live database workflow.
