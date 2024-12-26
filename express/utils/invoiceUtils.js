const generateInvoiceNumber = () => {
    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear().toString().slice(-2);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `inv-${day}${month}${year}${random}`;
};

function excelDateToJSDate(serial) {
    const utcDays = serial - 25569; // Excel's epoch is 25569 days after Unix epoch
    const utcValue = utcDays * 86400; // Convert days to seconds
    return new Date(utcValue * 1000).toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
}

module.exports = { generateInvoiceNumber, excelDateToJSDate };
