# Use the base image with the target platform of linux/amd64
FROM --platform=linux/amd64 node:14

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application code to the container
COPY . .

# Expose the port on which your server listens
EXPOSE 9285

# Specify the command to start your server
CMD [ "npm", "start" ]
