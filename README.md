# Splunk BOTS Docker

## Overview

Splunk released the first three Boss of the SOC (BOTS) datasets several years ago. The idea behind it is a blue team CTF style exercise of doing an investigation in one of the most common and popular SIEM tools - Splunk. Unfortunately, as time has went on, the apps and files necessary to get a reliable and stable Splunk instance up and running to support it has become more and more difficult. This is where the idea for Splunk BOTS Docker comes into play. This is designed to be a nearly self-contained and self-sufficient source for building and utilizing a Splunk BOTS environment all on your own. Below are details about each of the BOTS datasets and how to spin each one up and access it. 

It is worth noting that the container comes with the temporary 30 day license, and if your container lives past that you will need to bring it down and then back up (thus resetting everything). The datasets themselves are not included due to GitHub having a max file size of 100MB and these files are all over that limit. If in the future these files become unavailable, I will find a way to get them from somewhere else.

Lastly, both the BOTSv1 and BOTSv2 environments have a walkthrough app to assist for folks not as familiar with Splunk, and to walk you through the scenarios and your investigation.

Happy Hunting!

## Launching a BOTS environment

Docker Desktop (or a compatible Docker Engine), Docker Compose v2, and the required
BOTS application archives are prerequisites. Configure the initial administrator password
in `config/.env` before starting a service; the username is always `admin`.

The project is configured for one BOTS service at a time. This avoids port, memory, and
dataset contention. BOTS v1, v2, and v3 are respectively available at ports 8000, 8020,
and 8030.

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

### Apple Silicon and other non-amd64 hosts

`splunk/splunk:8.2.3` is an x86-64 image. Native amd64 hosts should leave
`SPLUNK_PLATFORM` unset. On Apple Silicon, explicitly enable Docker emulation:

```sh
SPLUNK_PLATFORM=linux/amd64 ./scripts/bots-compose bots3 up -d
SPLUNK_PLATFORM=linux/amd64 BOTS_SERVICE=bots3 ./scripts/devcontainer-up
```

The same override works with direct Compose:

```sh
SPLUNK_PLATFORM=linux/amd64 docker compose up -d bots3
```

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

- `config/.env` contains shared `SPLUNK_START_ARGS` and `SPLUNK_PASSWORD`.
- `config/botsv1.env`, `config/botsv2.env`, and `config/botsv3.env` contain the
  corresponding `SPLUNK_APPS_URL` manifest.
- `docker-compose.amd64.yml` is the explicit amd64 override used by
  `scripts/bots-compose`; direct Compose and Dev Container launches use the
  `SPLUNK_PLATFORM` interpolation in `docker-compose.yml`.

Splunk initialization and BOTS dataset ingestion can take a long time. Wait until the
selected UI responds before treating startup as failed. Use the wrapper's `logs` command
to diagnose readiness or ingestion issues.

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