# GitHub Actions Workflows

This directory contains the GitHub Actions workflows for the n8n-nodes-markdown-to-telegram-html project.

## Workflows

### CI — test (`ci.yml`)

**Purpose**: Automated testing and quality checks for pull requests and pushes to the master branch.

**Triggers**:
- Pull requests (any branch)
- Pushes to `master` branch

**What it does**:
1. Sets up Node.js (20.19, 22.x, 24.x) - matching n8n compatibility
2. Installs dependencies
3. Runs ESLint for code linting
4. Runs type checking (if available)
5. Runs Jest test suite with coverage
6. Builds the project
7. Generates coverage summary in job output

**Secrets required**: None

**Usage**: This workflow runs automatically. No manual intervention needed.

### Release — publish to npm (`publish.yml`)

**Purpose**: Manual workflow for releasing new versions of the package to npm.

**Triggers**: Manual (`workflow_dispatch`)

**Inputs**:
- `release_type` (choice, optional, default: 'patch'): Auto-increases version (patch/minor/major). Ignored if `custom_version` is set.
- `custom_version` (string, optional): Specify exact version (e.g., 1.2.3 or 1.2.3-beta). If provided, `release_type` is ignored.
- `branch` (string, optional, default: 'master'): Branch to use for release.
- `dry_run` (boolean, optional, default: false): Test mode without publishing.

**What it does**:
1. Checks out the specified branch and verifies working directory is clean
2. Validates that the target version doesn't already exist on npm
3. Calculates next version (auto or custom)
4. Builds the project
5. Runs `npm run release` with the appropriate version argument
   - This uses release-it to: update package.json, generate changelog from commits, create git tag, commit changes, push to GitHub, and publish to npm
6. Verifies the release and generates summary

**Note on versioning**: The workflow passes the version/release type directly to release-it (via `npm run release`), which handles all version bumping, tagging, and changelog generation in a single atomic operation. This prevents double-bumping issues.

**Secrets required**:

#### NPM_TOKEN
npm authentication token for publishing packages.

**How to obtain**:
1. Go to [npmjs.com](https://www.npmjs.com/)
2. Log in to your account
3. Go to "Access Tokens" in your account settings
4. Click "Generate New Token"
5. Choose "Automation" or "Publish" type
6. Copy the generated token

**How to set in repository**:
1. Go to your GitHub repository
2. Click "Settings" tab
3. In the left sidebar, click "Secrets and variables" → "Actions"
4. Click "New repository secret"
5. Name: `NPM_TOKEN`
6. Value: Paste your npm token
7. Click "Add secret"

#### GITHUB_TOKEN
GitHub token for repository access (automatically provided by GitHub Actions).

**No manual setup required** - This is automatically available in workflows.

**Usage**:
1. Go to GitHub Actions tab
2. Select "Release — publish to npm (manual)"
3. Click "Run workflow"
4. Fill in the inputs:
   - For automatic versioning: Choose `release_type`
   - For exact version: Enter `custom_version`
   - Optionally change branch or enable dry_run
5. Click "Run workflow"

**Examples**:
- Patch release (1.0.7 → 1.0.8): Leave defaults
- Minor release (1.0.7 → 1.1.0): Set `release_type` to 'minor'
- Major release (1.0.7 → 2.0.0): Set `release_type` to 'major'
- Custom version: Set `custom_version` to '2.0.0' or '1.2.3-beta.1'
- Dry run: Set `dry_run` to true

**Notes**:
- Custom versions must follow semver format (x.y.z or x.y.z-prerelease)
- The workflow validates custom version format
- Dry run mode tests everything without making changes
- Working directory must be clean (no uncommitted changes)

## Troubleshooting

### Release fails with "version already exists on npm"

**Cause**: The version you're trying to publish already exists on npm.

**Solutions**:
- Check existing versions: `npm view <package-name> versions`
- Use `custom_version` input to specify the next available version
- If you need to republish the same version, you must first unpublish it (not recommended)

### "NPM_TOKEN not found" error

**Cause**: The NPM_TOKEN secret is not configured or has expired.

**Solutions**:
- Verify the token exists in repository Settings → Secrets and variables → Actions
- Generate a new token on npmjs.com if the old one expired
- Ensure the token has "Automation" or "Publish" permissions

### Tests fail in CI but pass locally

**Possible causes**:
- Different Node.js versions (CI tests on 20.19, 22.x, and 24.x)
- Missing dependencies (check if all dev dependencies are in package.json)
- Environment-specific issues

**Solutions**:
- Test locally with the same Node version: `nvm use 20.19` or `nvm use 22`
- Run `npm ci` instead of `npm install` to match CI behavior
- Check CI logs for specific error messages
