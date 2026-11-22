FROM node:20-alpine
WORKDIR /app
COPY collab-server/package.json ./
RUN npm install --omit=dev
COPY collab-server/server.js ./
ENV PORT=8080 DATA_DIR=/data
EXPOSE 8080
CMD ["node", "server.js"]
