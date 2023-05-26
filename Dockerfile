FROM node:18.16 AS build

WORKDIR /app

COPY package.json package-lock.json tsconfig.json /app/

RUN npm ci

COPY src /app/src

RUN npm run build

FROM node:18.16

WORKDIR /app

COPY package.json package-lock.json /app/

RUN npm ci --production

COPY --from=build /app/dist /app/dist

EXPOSE 3005

CMD ["node", "dist/index.js"]