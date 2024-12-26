const pool = require('../config/db');
const { generateInvoiceNumber, excelDateToJSDate } = require('../utils/invoiceUtils');
const xlsx = require('xlsx');

const createInvoice = async (invoiceData) => {
    const { date, customer_name, salesperson_name, payment_type, products } = invoiceData;
    const invoice_no = generateInvoiceNumber();

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query(
            `INSERT INTO invoices (invoice_no, date, customer_name, salesperson_name, payment_type) 
            VALUES (?, ?, ?, ?, ?)`,
            [invoice_no, date, customer_name, salesperson_name, payment_type]
        );

        for (let product of products) {
            await connection.query(
                `INSERT INTO products (item_name, quantity, total_cost, total_price, invoice_no) 
                VALUES (?, ?, ?, ?, ?)`,
                [product.item_name, product.quantity, product.total_cost, product.total_price, invoice_no]
            );
        }

        await connection.commit();
        return { message: 'Invoice created successfully', invoice_no };
    } catch (err) {
        console.log(err)
        await connection.rollback();
        throw new Error('something went wrong!');
    } finally {
        connection.release();
    }
};

const getInvoices = async (filters, pagination) => {
    const { date } = filters;
    const { size, page } = pagination;
    const offset = (page - 1) * size;

    try {
        let queryStr = `SELECT * FROM invoices `;
        let queryParams = [];

        if (date) {
            queryStr += `WHERE date = ? `;
            queryParams.push(date);
        }

        queryStr += `LIMIT ? OFFSET ?`;
        queryParams.push(parseInt(size), offset);

        const [invoices] = await pool.query(queryStr, queryParams);

        let totalProfit = 0;
        let totalCashTransactions = 0;
        const invoiceWithProducts = [];

        for (let invoice of invoices) {
            const [products] = await pool.query(`
                SELECT * FROM products 
                WHERE invoice_no = ? `, invoice.invoice_no
            );

            invoice.products = products;
            invoiceWithProducts.push(invoice);

            let totalSoldPrice = 0;
            let totalCostPrice = 0;
            for (let product of products) {
                totalSoldPrice += parseInt(product.total_price);
                totalCostPrice += parseInt(product.total_cost);
            }

            totalProfit += totalSoldPrice - totalCostPrice;

            if (invoice.payment_type.toLowerCase() === 'cash') {
                totalCashTransactions += totalSoldPrice;
            }
        }

        return { invoices: invoiceWithProducts, totalProfit, totalCashTransactions };
    } catch (err) {
        console.log(err)
        throw new Error('something went wrong!');
    }
};

const updateInvoice = async (invoice_no, invoiceData) => {
    const { customer_name, salesperson_name, payment_type, products } = invoiceData;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const updates = { customer_name, salesperson_name, payment_type };
        const setClause = Object.keys(updates).filter(key => updates[key] !== undefined).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates).filter(val => val !== undefined);

        let [updatedRows] = await connection.query(`UPDATE invoices SET ${setClause} WHERE invoice_no = ?`, [...values, invoice_no]);

        if (products && products.length > 0 && updatedRows.affectedRows) {
            await connection.query(`DELETE FROM products WHERE invoice_no = ?`, [invoice_no]);

            for (let product of products) {
                const { item_name, quantity, total_cost, total_price } = product;

                await connection.query(
                    `INSERT INTO products (invoice_no, item_name, quantity, total_cost, total_price) VALUES (?, ?, ?, ?, ?)`,
                    [invoice_no, item_name, quantity, total_cost, total_price]
                );
            }
        }

        await connection.commit();
        return { message: 'Invoice and associated products updated successfully' };
    } catch (err) {
        console.log(err)
        await connection.rollback();
        throw new Error('something went wrong!');
    } finally {
        connection.release();
    }
};

const deleteInvoice = async (invoice_no) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query(`DELETE FROM products WHERE invoice_no = ?`, [invoice_no]);
        await connection.query(`DELETE FROM invoices WHERE invoice_no = ?`, [invoice_no]);

        await connection.commit();
        return { message: 'Invoice and associated products deleted successfully' };
    } catch (err) {
        console.log(err)
        await connection.rollback();
        throw new Error('something went wrong!');
    } finally {
        connection.release();
    }
};

const uploadInvoice = async (req) => {
    try {
        const workbook = xlsx.read(req.file.buffer);
        
        const invoiceSheet = workbook.Sheets['invoice'];
        const invoices = xlsx.utils.sheet_to_json(invoiceSheet);

        const invoiceQueries = invoices.map(async invoice => {
            if (invoice['payment type'] === 'NOTCASHORCREDIT') {
                invoice['payment type'] = 'CREDIT';
            } else {
                invoice['payment type'] = 'CASH';
            }
            const sql = 'INSERT IGNORE INTO invoices (invoice_no, date, customer_name, salesperson_name, payment_type, notes) VALUES (?, ?, ?, ?, ?, ?)';
            res = await pool.query(sql, [invoice['invoice no'], excelDateToJSDate(invoice.date), invoice.customer, invoice.salesperson, invoice['payment type'], invoice.notes]);
            if (res[0].warningStatus) {
                console.log(invoice, "ignored due validation error")
            };
        });

        await Promise.all(invoiceQueries);

        const productSheet = workbook.Sheets['product sold'];
        const products = xlsx.utils.sheet_to_json(productSheet);

        const productQueries = products.map(async product => {
            const sql = 'INSERT IGNORE INTO products (invoice_no, item_name, quantity, total_cost, total_price) VALUES (?, ?, ?, ?, ?)';
            res = await pool.query(sql, [product['Invoice no'], product.item, product.quantity, product['total cogs'], product['total price']]);
            if (res[0].warningStatus) {
                console.log(product, "ignored due validation error")
            };
        });

        await Promise.all(productQueries);

        return { message: 'Upload success' };
    } catch (err) {
        console.log(err)
        throw new Error('something went wrong!');
    }
};

module.exports = { createInvoice, getInvoices, updateInvoice, deleteInvoice, uploadInvoice };
