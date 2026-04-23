FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Generate Prisma client if schema exists
RUN if [ -f "prisma/schema.prisma" ]; then npx prisma generate; fi

EXPOSE 4000

CMD ["npm", "start"]