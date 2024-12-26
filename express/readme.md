
# Widatech API

Widatech API is a Node.js application designed to manage invoices and related products. It provides endpoints to handle CRUD operations for invoices, including deletion and product management.

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Project](#running-the-project)
- [License](#license)

## Installation

### Prerequisites

Before running the project, ensure you have the following installed:

- Node.js (>= 16.x)
- MySQL (or MariaDB) server

### Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/widatech.git
   cd widatech
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Set up config/db.js:

   Open `db.js` and configure your database credentials (will use .env in the future).

4. Run the database migrations to set up the schema:

   ```bash
   npm run migrate
   ```

## Running the Project

Start the application by running:

```bash
npm start
```

The API will run on `http://localhost:3000` by default.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.