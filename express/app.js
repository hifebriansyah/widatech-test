const express = require('express');
const { body, query, param } = require('express-validator');
const invoiceController = require('./controllers/invoiceController');
const multer = require('multer');

const app = express();
const port = 3000;

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use(express.json());

app.post('/invoices', [
    body('date').isISO8601(),
    body('customer_name').isString().isLength({ min: 2 }),
    body('salesperson_name').isString().isLength({ min: 2 }),
    body('payment_type').isIn(['CASH', 'CREDIT']),
    body('products').isArray({ min: 1 }),
    body('products.*.item_name').isString().isLength({ min: 5 }),
    body('products.*.quantity').isInt({ min: 1 }),
    body('products.*.total_cost').isFloat({ min: 0 }),
    body('products.*.total_price').isFloat({ min: 0 })
], invoiceController.createInvoice);

app.get('/invoices', [
    query('date').optional().isISO8601().withMessage('Invalid date format'),
    query('size').optional().isInt({ min: 1 }),
    query('page').optional().isInt({ min: 1 })
], invoiceController.getInvoices);

app.put('/invoices/:invoice_no', [
    param('invoice_no').isString(),
    body('customer_name').optional().isString().isLength({ min: 2 }),
    body('salesperson_name').optional().isString().isLength({ min: 2 }),
    body('payment_type').optional().isIn(['CASH', 'CREDIT']),
    body('products').optional().isArray({ min: 1 }),
    body('products.*.id').optional().isString().withMessage('Invalid product ID'),
    body('products.*.item_name').optional().isString().isLength({ min: 5 }),
    body('products.*.quantity').optional().isInt({ min: 1 }),
    body('products.*.total_cost').optional().isFloat({ min: 0 }),
    body('products.*.total_price').optional().isFloat({ min: 0 })
], invoiceController.updateInvoice);

app.delete('/invoices/:invoice_no', [param('invoice_no').isString()], invoiceController.deleteInvoice);

app.post('/invoices/upload', upload.single('file'), invoiceController.uploadInvoice);

app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        // Read the Excel file
        const workbook = xlsx.read(req.file.buffer);
        
        // Process the "invoice" sheet
        const invoiceSheet = workbook.Sheets['invoice'];
        const invoices = xlsx.utils.sheet_to_json(invoiceSheet);

        // Insert invoices into MySQL
        const invoiceQueries = invoices.map(async invoice => {
            const sql = 'INSERT INTO invoices (invoice_no, date, customer, salesperson, payment_type, notes) VALUES (?, ?, ?, ?, ?, ?)';
            await pool.query(sql, [invoice['invoice no'], invoice.date, invoice.customer, invoice.salesperson, invoice['payment type'], invoice.notes]);
        });

        await Promise.all(invoiceQueries);

        // Process the "product sold" sheet
        const productSheet = workbook.Sheets['product sold'];
        const products = xlsx.utils.sheet_to_json(productSheet);

        // Insert products into MySQL
        const productQueries = products.map(async product => {
            const sql = 'INSERT INTO products (invoice_no, item, quantity, total_cogs, total_price) VALUES (?, ?, ?, ?, ?)';
            await pool.query(sql, [product['Invoice no'], product.item, product.quantity, product['total cogs'], product['total price']]);
        });

        await Promise.all(productQueries);

        res.send('Invoices and products imported successfully!');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
