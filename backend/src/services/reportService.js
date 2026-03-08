const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const pool = require('../config/database');

exports.generatePayrollExcel = async (project_id, start_date, end_date) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Payroll Report');

  worksheet.columns = [
    { header: 'Worker Name', key: 'full_name', width: 25 },
    { header: 'Phone', key: 'phone', width: 15 },
    { header: 'Position', key: 'position', width: 20 },
    { header: 'Rate/Day (RWF)', key: 'rate_per_day', width: 15 },
    { header: 'Days Worked', key: 'total_days_worked', width: 15 },
    { header: 'Total Amount (RWF)', key: 'total_amount', width: 20 }
  ];

  const query = `
    SELECT 
      w.full_name, w.phone, w.position, w.rate_per_day,
      COALESCE(SUM(a.days_worked), 0) as total_days_worked,
      w.rate_per_day * COALESCE(SUM(a.days_worked), 0) as total_amount
    FROM workers w
    LEFT JOIN attendance a ON w.id = a.worker_id 
      AND a.attendance_date >= $1 AND a.attendance_date <= $2
    WHERE w.project_id = $3
    GROUP BY w.id, w.full_name, w.phone, w.position, w.rate_per_day
    ORDER BY w.full_name
  `;

  const result = await pool.query(query, [start_date, end_date, project_id]);

  result.rows.forEach(row => {
    worksheet.addRow(row);
  });

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1e40af' }
  };

  const totalRow = worksheet.addRow({
    full_name: 'TOTAL',
    total_amount: result.rows.reduce((sum, row) => sum + parseFloat(row.total_amount), 0)
  });
  totalRow.font = { bold: true };

  return workbook;
};

exports.generateInventoryExcel = async (project_id, start_date, end_date) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Inventory Report');

  worksheet.columns = [
    { header: 'Item Name', key: 'name', width: 30 },
    { header: 'Category', key: 'category_name', width: 20 },
    { header: 'Quantity', key: 'quantity', width: 12 },
    { header: 'Unit', key: 'unit', width: 12 },
    { header: 'Unit Price (RWF)', key: 'unit_price', width: 15 },
    { header: 'Total Price (RWF)', key: 'total_price', width: 18 },
    { header: 'Purchase Date', key: 'purchase_date', width: 15 }
  ];

  let query = `
    SELECT i.*, c.name as category_name
    FROM inventory_items i
    LEFT JOIN inventory_categories c ON i.category_id = c.id
    WHERE i.project_id = $1
  `;
  const params = [project_id];

  if (start_date && end_date) {
    params.push(start_date, end_date);
    query += ` AND i.purchase_date >= $2 AND i.purchase_date <= $3`;
  }

  query += ' ORDER BY i.purchase_date DESC';

  const result = await pool.query(query, params);

  result.rows.forEach(row => {
    worksheet.addRow(row);
  });

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1e40af' }
  };

  return workbook;
};

exports.generatePayrollPDF = async (project_id, start_date, end_date) => {
  const doc = new PDFDocument({ margin: 50 });

  doc.fontSize(20).text('Payroll Report', { align: 'center' });
  doc.fontSize(12).text(`Period: ${start_date} to ${end_date}`, { align: 'center' });
  doc.moveDown();

  const query = `
    SELECT 
      w.full_name, w.position, w.rate_per_day,
      COALESCE(SUM(a.days_worked), 0) as total_days_worked,
      w.rate_per_day * COALESCE(SUM(a.days_worked), 0) as total_amount
    FROM workers w
    LEFT JOIN attendance a ON w.id = a.worker_id 
      AND a.attendance_date >= $1 AND a.attendance_date <= $2
    WHERE w.project_id = $3
    GROUP BY w.id, w.full_name, w.position, w.rate_per_day
    ORDER BY w.full_name
  `;

  const result = await pool.query(query, [start_date, end_date, project_id]);

  const tableTop = 150;
  const itemHeight = 30;

  doc.fontSize(10).text('Name', 50, tableTop);
  doc.text('Position', 200, tableTop);
  doc.text('Days', 320, tableTop);
  doc.text('Rate', 380, tableTop);
  doc.text('Total', 450, tableTop);

  let y = tableTop + 20;
  let total = 0;

  result.rows.forEach((row, i) => {
    doc.text(row.full_name, 50, y);
    doc.text(row.position, 200, y);
    doc.text(row.total_days_worked.toString(), 320, y);
    doc.text(row.rate_per_day.toString(), 380, y);
    doc.text(row.total_amount.toString(), 450, y);
    y += itemHeight;
    total += parseFloat(row.total_amount);
  });

  doc.fontSize(12).text(`Total Payroll: ${total.toFixed(2)} RWF`, 50, y + 20, { bold: true });

  return doc;
};
