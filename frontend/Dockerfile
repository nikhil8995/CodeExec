FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist

EXPOSE 5173

# Serve on 5173 to keep compatibility with existing deploy ports
CMD ["serve", "-s", "dist", "-l", "5173"]
