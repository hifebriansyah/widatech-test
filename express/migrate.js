const pool = require('./config/db'); // Adjust the path as needed

async function migrate() {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        await connection.query(`
            CREATE TABLE IF NOT EXISTS invoices (
                id INT NOT NULL AUTO_INCREMENT,
                invoice_no VARCHAR(50) NOT NULL,
                date DATE NOT NULL,
                customer_name VARCHAR(255) NOT NULL,
                salesperson_name VARCHAR(255) NOT NULL,
                payment_type ENUM('CASH', 'CREDIT') NOT NULL,
                notes TEXT,
                PRIMARY KEY (id),
                UNIQUE KEY (invoice_no)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS products (
                id INT NOT NULL AUTO_INCREMENT,
                invoice_no VARCHAR(50) NOT NULL,
                item_name VARCHAR(255) NOT NULL,
                quantity INT NOT NULL,
                total_cost DECIMAL(10, 2) NOT NULL,
                total_price DECIMAL(10, 2) NOT NULL,
                PRIMARY KEY (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        `);

        const productsData = [
            ['inv-2712247072', 'Product A', 1, 30.00, 45.00],
            ['inv-2712242510', 'Product B', 1, 30.00, 45.00],
            ['inv-2712243679', 'Product C', 2, 50.00, 75.00],
            ['inv-2712241372', 'Product D', 2, 50.00, 75.00],
            ['inv-2712244080', 'Product E', 1, 30.00, 45.00],
            ['inv-2712244080', 'Product F', 2, 50.00, 75.00],
            ['inv-2712247072', 'Product G', 1, 30.00, 45.00],
            ['inv-2712243679', 'Product H', 1, 30.00, 45.00],
            ['inv-2712242510', 'Product I', 2, 50.00, 75.00],
            ['inv-2712247072', 'Product J', 2, 50.00, 75.00],
        ];

        const insertProductsQuery = `
            INSERT INTO products (invoice_no, item_name, quantity, total_cost, total_price)
            VALUES ? 
            ON DUPLICATE KEY UPDATE item_name=VALUES(item_name), quantity=VALUES(quantity), total_cost=VALUES(total_cost), total_price=VALUES(total_price)
        `;

        await connection.query(insertProductsQuery, [productsData]);

        const invoicesData = [
            [7, 'inv-2712247072', '2024-12-27', 'Bob White', 'Charlie Green', 'CASH', 'First purchase with discount'],
            [8, 'inv-2712242510', '2024-12-27', 'Alice Brown', 'David Blue', 'CASH', 'First purchase with discount'],
            [9, 'inv-2712243679', '2024-12-27', 'Charlie Green', 'Bob White', 'CASH', 'First purchase with discount'],
            [12, 'inv-2712241372', '2024-12-27', 'David Blue', 'Alice Brown', 'CASH', 'First purchase with discount'],
            [14, 'inv-2712244080', '2024-12-27', 'Charlie Green', 'Alice Brown', 'CASH', null],
        ];

        const insertInvoicesQuery = `
            INSERT INTO invoices (id, invoice_no, date, customer_name, salesperson_name, payment_type, notes) VALUES ? 
        `;

        await connection.query(insertInvoicesQuery, [invoicesData]);

        await connection.commit();

        console.log('Migration complete');
    } catch (error) {
        await connection.rollback();
        console.error('Migration failed:', error);
    } finally {
        connection.release();
    }
}

migrate().catch(console.error);
