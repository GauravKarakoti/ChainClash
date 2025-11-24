FROM rust:1.86-slim

SHELL ["bash", "-c"]

# Install system dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    protobuf-compiler \
    clang \
    make \
    curl \
    git

RUN rustup target add wasm32-unknown-unknown

# Install Linera tools
RUN cargo install --locked linera-service@0.15.5 linera-storage-service@0.15.5

# Install Node.js and pnpm
RUN curl https://raw.githubusercontent.com/creationix/nvm/v0.40.3/install.sh | \
    bash \
    && . ~/.nvm/nvm.sh \
    && nvm install lts/krypton \
    && npm install -g pnpm

WORKDIR /build

COPY . .

# Healthcheck for the frontend
HEALTHCHECK CMD ["curl", "-s", "http://localhost:5173"]

ENTRYPOINT ["bash", "/build/run.bash"]