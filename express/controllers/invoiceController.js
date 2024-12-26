const { validationResult } = require('express-validator');
const invoiceService = require('../services/invoiceService');

const createInvoice = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const result = await invoiceService.createInvoice(req.body);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getInvoices = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const { date } = req.query;
        const filters = { date };
        const pagination = { size: req.query.size || 25, page: req.query.page || 1 };

        const result = await invoiceService.getInvoices(filters, pagination);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const updateInvoice = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const result = await invoiceService.updateInvoice(req.params.invoice_no, req.body);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const deleteInvoice = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const result = await invoiceService.deleteInvoice(req.params.invoice_no);
        res.json(result);
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: err.message });
    }
};

const uploadInvoice = async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        const result = await invoiceService.uploadInvoice(req);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { createInvoice, getInvoices, updateInvoice, deleteInvoice, uploadInvoice };
