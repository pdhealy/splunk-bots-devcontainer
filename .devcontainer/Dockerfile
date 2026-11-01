# syntax=docker/dockerfile:1.7
FROM mcr.microsoft.com/devcontainers/base:2.1.8-ubuntu24.04

# hadolint ignore=DL3008
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt/lists,sharing=locked \
    apt-get update \
    && apt-get install -y --no-install-recommends \
        bash-completion \
        build-essential \
        ca-certificates \
        curl \
        dnsutils \
        git \
        iproute2 \
        iputils-ping \
        jq \
        less \
        lsof \
        netcat-openbsd \
        procps \
        psmisc \
        tree \
        unzip \
        vim-tiny \
        wget \
        zstd \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
