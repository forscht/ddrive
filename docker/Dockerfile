FROM node:16-alpine

# Set node env
ENV NODE_ENV production

# Set WORKDIR
WORKDIR /app

# Copy project files
COPY --chown=node:node . /app

# NPM Update
RUN npm update -g npm

# Install packages
RUN npm install

# Copy entrypoint
# to be able to pass process argv
COPY docker/entrypoint /

RUN chmod +x /entrypoint

# Set user as node
USER node

# Start app
ENTRYPOINT ["/entrypoint"]
