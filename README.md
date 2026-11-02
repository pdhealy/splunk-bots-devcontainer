# Splunk BOTS Docker

## Overview

Splunk released the first three Boss of the SOC (BOTS) datasets several years ago. The idea behind it is a blue team CTF style exercise of doing an investigation in one of the most common and popular SIEM tools - Splunk. Unfortunately, as time has went on, the apps and files necessary to get a reliable and stable Splunk instance up and running to support it has become more and more difficult. This is where the idea for Splunk BOTS Docker comes into play. This is designed to be a nearly self-contained and self-sufficient source for building and utilizing a Splunk BOTS environment all on your own. Below are details about each of the BOTS datasets and how to spin each one up and access it. 

It is worth noting that the container comes with the temporary 30 day license, and if your container lives past that you will need to bring it down and then back up (thus resetting everything). The datasets themselves are not included due to GitHub having a max file size of 100MB and these files are all over that limit. If in the future these files become unavailable, I will find a way to get them from somewhere else.

Lastly, both the BOTSv1 and BOTSv2 environments have a walkthrough app to assist for folks not as familiar with Splunk, and to walk you through the scenarios and your investigation.

Happy Hunting!

## Launching a BOTS environment

Docker Desktop (or a compatible Docker Engine), Docker Compose v2, and the required
BOTS application archives are prerequisites. Set `SPLUNK_PASSWORD` in `config/.env`
to a unique local password before starting a service; the username is always `admin`.
This local file is intentionally untracked, so password updates are never committed or
passed on the command line.

BOTSv2 and BOTSv3 also require locally supplied dataset archives in `data/`. Download
the archive indicated by its dataset guide, verify its published checksum, and save it
as `data/botsv2_data_set_attack_only.tgz` or `data/botsv3_data_set.tgz`, respectively.
The application and dataset archives are bind mounted read-only and are never downloaded
by the Splunk container.

The project is configured for one BOTS service at a time. This avoids port, memory, and
dataset contention. BOTS v1, v2, and v3 are respectively available at ports 8000, 8020,
and 8030.

The app archive bind mounts default to `./apps/botsv1`, `./apps/botsv2`, and
`./apps/botsv3`. Set `BOTS_APPS_ROOT` to use a different parent directory while keeping
the dataset-specific subdirectories, for example:

```sh
BOTS_APPS_ROOT=/data/splunk-apps ./scripts/bots-compose bots1 up -d
```

### VS Code Dev Container (primary)

Set `BOTS_SERVICE` before opening the folder in VS Code, then use **Dev Containers:
Reopen in Container**:

```sh
BOTS_SERVICE=bots1 code .
```

Use `bots2` or `bots3` to select the other datasets. The Dev Container validates this
value before creating containers, starts a development workspace and only the selected
Splunk service, and forwards all three possible UI ports.

The equivalent CLI launch is:

```sh
BOTS_SERVICE=bots2 ./scripts/devcontainer-up
```

### Docker Compose (secondary)

Use the wrapper to validate the selected service and run only that service:

```sh
./scripts/bots-compose bots1 up -d
./scripts/bots-compose bots1 logs -f
./scripts/bots-compose bots1 down
```

The wrapper's `down` command stops and removes only the selected service. Standard
Compose commands remain available, for example `docker compose up -d bots3`.

To start only `bots3` directly with Docker Compose and set its platform for this command:

```sh
SPLUNK_PLATFORM=linux/amd64 docker compose up -d bots3
```

### Apple Silicon and other non-amd64 hosts

The Splunk image is pinned to a verified x86-64 image digest. Native amd64 hosts should
leave `SPLUNK_PLATFORM` unset. On Apple Silicon, explicitly enable Docker emulation:

```sh
SPLUNK_PLATFORM=linux/amd64 ./scripts/bots-compose bots3 up -d
SPLUNK_PLATFORM=linux/amd64 BOTS_SERVICE=bots3 ./scripts/devcontainer-up
```

For direct Compose usage without the wrapper, use the command above.

### Image updates

The Splunk image is pinned by digest for reproducible builds. Dependabot proposes image
updates weekly; merge an update only after the CI configuration and Dev Container builds
pass, then run `./scripts/test-launch-matrix` on an amd64-capable Docker host.

### Validation

Run the static configuration checks with:

```sh
node --test tests/config.test.mjs
```

On a host with a reachable Docker daemon, run the complete sequential Compose and Dev
Container launch matrix with:

```sh
./scripts/test-launch-matrix
```

The matrix runs all six launch combinations: `bots1`, `bots2`, and `bots3` through
Docker Compose, then the Dev Container CLI. It waits for each Splunk UI before stopping
and removing that service, then continues to the next target.

To verify a single Docker Compose target manually:

```sh
./scripts/bots-compose bots1 up -d
./scripts/bots-compose bots1 logs -f
./scripts/bots-compose bots1 down
```

Replace `bots1` with `bots2` or `bots3` as needed. The live checks require Docker to be
installed and its daemon to be reachable; `docker info` must succeed before running the
matrix.

### Configuration layout

- `config/.env` is an untracked local file containing shared `SPLUNK_START_ARGS` and
  `SPLUNK_PASSWORD`.
- `config/bots/botsv1.env`, `config/bots/botsv2.env`, and `config/bots/botsv3.env`
  contain the corresponding `SPLUNK_APPS_URL` manifest.
- `SPLUNK_PLATFORM=linux/amd64` is the only architecture-selection mechanism; it is
  consumed directly by `docker-compose.yml` for both wrapper and direct launches.

Splunk initialization and BOTS dataset ingestion can take a long time. Wait until the
selected service reports healthy before treating startup as failed. Use the wrapper's
`logs` command to diagnose readiness or ingestion issues.

## BOTSv1

Data was created in 2016 based off of realistic data and scenarios developed into a fictional exercise.

Involves two scenarios: an APT and a ransomware event.

Walkthrough App: Investigating with Splunk Workshop

[Local copy of the BOTSv1 dataset details](docs/botsv1.md)

The Splunk App for Stream has been stripped of the binaries for bringing data in. It will work for the purposes of this lab, but not to bring in additional data.

## BOTSv2

Data was created in August 2017 based off of realistic data and scenarios developed into a fictional exercise.

Involves working through an APT investigation.

Walkthrough App: Advanced Hunting APTs with Splunk

It is worth noting that certain parts of the walkthrough try to leverage "Enterprise Security" which is a premium (read pay for) app, and is not available publicly. However, this should have minimal impact on investigating the actual data and scenarios.

[Local copy of the BOTSv2 dataset details](docs/botsv2.md)

## BOTSv3

Data was created in 2018 based off of realistic data and scenarios developed into a fictional exercise.

[Local copy of the BOTSv3 dataset details](docs/botsv3.md)

## CTF Scoreboard

Coming Soon...