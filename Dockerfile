FROM node:16-alpine

# Set node env
ENV NODE_ENV production

# Set WORKDIR
WORKDIR /app

# Copy project files
COPY --chown=node:node . /app

# Install packages
RUN npm install

# Set user as node
USER node

# Start app
ENTRYPOINT ["node", "/app/index.js"]
# Pass commmand line arguments to app
CMD ["$*"]
