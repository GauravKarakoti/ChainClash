FROM rust:1.86-slim

SHELL ["bash", "-c"]

# Install dependencies (added musl-tools just in case, but binstall fetches gnu usually)
RUN apt-get update && apt-get install -y \
    pkg-config \
    protobuf-compiler \
    clang \
    make \
    curl \
    git \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

RUN rustup target add wasm32-unknown-unknown

# Install cargo-binstall and then fetch linera-service binaries
# This is fast and ensures the binary matches your OS (Debian)
RUN curl -L --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/cargo-bins/cargo-binstall/main/install-from-binstall-release.sh | bash
RUN cargo binstall -y linera-storage-service@0.15.6 linera-service@0.15.6

# Install Node.js and pnpm
RUN curl https://raw.githubusercontent.com/creationix/nvm/v0.40.3/install.sh | bash \
    && . ~/.nvm/nvm.sh \
    && nvm install lts/krypton \
    && npm install -g pnpm

WORKDIR /build
COPY . .

# Verification step: Fail build early if linera is missing or broken
RUN linera --version

HEALTHCHECK CMD ["curl", "-s", "http://localhost:5173"]
ENTRYPOINT ["bash", "/build/run.bash"]