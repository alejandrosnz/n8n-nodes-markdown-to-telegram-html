# GitHub Actions Workflows

This directory contains the GitHub Actions workflows for the n8n-nodes-markdown-to-telegram-html project.

## Workflows

### CI — test (`ci.yml`)

**Purpose**: Automated testing and quality checks for pull requests and pushes to the master branch.

**Triggers**:
- Pull requests (any branch)
- Pushes to `master` branch

**What it does**:
1. Sets up Node.js 22.x
2. Installs dependencies
3. Runs ESLint for code linting
4. Runs Jest test suite
5. Builds the project

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
1. Checks out the specified branch
2. Calculates next version (auto or custom)
3. Manually bumps version for minor/major/custom releases
4. Builds the project
5. Runs `n8n-node release` to create changelog, tag, and publish to npm
6. Verifies the release

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
- Patch release: Leave defaults
- Minor release: Set `release_type` to 'minor'
- Custom version: Set `custom_version` to '2.0.0'
- Dry run: Set `dry_run` to true

**Notes**:
- Custom versions must follow semver format (x.y.z or x.y.z-prerelease)
- The workflow validates custom version format
- Dry run mode tests everything without making changes