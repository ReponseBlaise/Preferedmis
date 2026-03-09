const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { supabase } = require('../config/supabase');
const path = require('path');
const fs = require('fs');

const LOGO_PATH = path.join(__dirname, '../../assets/logo.png');

exports.generatePayrollExcel = async (project_id, start_date, end_date) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Payroll Report');

  // Add logo if exists
  if (fs.existsSync(LOGO_PATH)) {
    const logoId = workbook.addImage({
      filename: LOGO_PATH,
      extension: 'png',
    });
    worksheet.addImage(logoId, {
      tl: { col: 0, row: 0 },
      ext: { width: 150, height: 60 }
    });
  }

  // Add title
  worksheet.mergeCells('A1:F3');
  worksheet.getCell('A1').value = 'PREFERRED CONTRACTORS';
  worksheet.getCell('A1').font = { size: 18, bold: true, color: { argb: 'FF1e40af' } };
  worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
  
  worksheet.mergeCells('A4:F4');
  worksheet.getCell('A4').value = 'PAYROLL REPORT';
  worksheet.getCell('A4').font = { size: 14, bold: true };
  worksheet.getCell('A4').alignment = { vertical: 'middle', horizontal: 'center' };
  
  worksheet.mergeCells('A5:F5');
  worksheet.getCell('A5').value = `Period: ${start_date} to ${end_date}`;
  worksheet.getCell('A5').font = { size: 11 };
  worksheet.getCell('A5').alignment = { vertical: 'middle', horizontal: 'center' };
  
  worksheet.addRow([]);

  // Headers starting at row 7
  worksheet.getRow(7).values = ['Worker Name', 'Phone', 'Position', 'Rate/Day (RWF)', 'Days Worked', 'Total Amount (RWF)'];
  worksheet.columns = [
    { key: 'full_name', width: 25 },
    { key: 'phone', width: 15 },
    { key: 'position', width: 20 },
    { key: 'rate_per_day', width: 15 },
    { key: 'total_days_worked', width: 15 },
    { key: 'total_amount', width: 20 }
  ];

  // Fetch workers
  const { data: workers } = await supabase
    .from('workers')
    .select('*')
    .eq('project_id', project_id);

  // Fetch attendance for date range
  const { data: attendance } = await supabase
    .from('attendance')
    .select('*')
    .gte('attendance_date', start_date)
    .lte('attendance_date', end_date);

  // Calculate totals
  const rows = workers.map(w => {
    const workerAttendance = attendance.filter(a => a.worker_id === w.id);
    const total_days_worked = workerAttendance.reduce((sum, a) => sum + parseFloat(a.days_worked || 0), 0);
    const total_amount = w.rate_per_day * total_days_worked;
    return {
      full_name: w.full_name,
      phone: w.phone,
      position: w.position,
      rate_per_day: w.rate_per_day,
      total_days_worked,
      total_amount
    };
  });

  rows.forEach(row => {
    worksheet.addRow(row);
  });

  worksheet.getRow(7).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(7).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1e40af' }
  };

  const totalRow = worksheet.addRow({
    full_name: 'TOTAL',
    total_amount: rows.reduce((sum, row) => sum + parseFloat(row.total_amount), 0)
  });
  totalRow.font = { bold: true, size: 12 };
  totalRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE5E7EB' }
  };

  return workbook;
};

exports.generateInventoryExcel = async (project_id, start_date, end_date) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Inventory Report');

  // Add logo if exists
  if (fs.existsSync(LOGO_PATH)) {
    const logoId = workbook.addImage({
      filename: LOGO_PATH,
      extension: 'png',
    });
    worksheet.addImage(logoId, {
      tl: { col: 0, row: 0 },
      ext: { width: 150, height: 60 }
    });
  }

  // Add title
  worksheet.mergeCells('A1:G3');
  worksheet.getCell('A1').value = 'PREFERRED CONTRACTORS';
  worksheet.getCell('A1').font = { size: 18, bold: true, color: { argb: 'FF1e40af' } };
  worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
  
  worksheet.mergeCells('A4:G4');
  worksheet.getCell('A4').value = 'INVENTORY REPORT';
  worksheet.getCell('A4').font = { size: 14, bold: true };
  worksheet.getCell('A4').alignment = { vertical: 'middle', horizontal: 'center' };
  
  if (start_date && end_date) {
    worksheet.mergeCells('A5:G5');
    worksheet.getCell('A5').value = `Period: ${start_date} to ${end_date}`;
    worksheet.getCell('A5').font = { size: 11 };
    worksheet.getCell('A5').alignment = { vertical: 'middle', horizontal: 'center' };
  }
  
  worksheet.addRow([]);

  // Headers starting at row 7
  worksheet.getRow(7).values = ['Item Name', 'Category', 'Quantity', 'Unit', 'Unit Price (RWF)', 'Total Price (RWF)', 'Purchase Date'];
  worksheet.columns = [
    { key: 'name', width: 30 },
    { key: 'category_name', width: 20 },
    { key: 'quantity', width: 12 },
    { key: 'unit', width: 12 },
    { key: 'unit_price', width: 15 },
    { key: 'total_price', width: 18 },
    { key: 'purchase_date', width: 15 }
  ];

  let query = supabase
    .from('inventory_items')
    .select('*, inventory_categories(name)')
    .eq('project_id', project_id);

  if (start_date && end_date) {
    query = query.gte('purchase_date', start_date).lte('purchase_date', end_date);
  }

  const { data: items } = await query.order('purchase_date', { ascending: false });

  items.forEach(item => {
    worksheet.addRow({
      name: item.name,
      category_name: item.inventory_categories?.name || '',
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      total_price: item.total_price,
      purchase_date: item.purchase_date
    });
  });

  worksheet.getRow(7).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(7).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1e40af' }
  };

  return workbook;
};

exports.generatePayrollPDF = async (project_id, start_date, end_date) => {
  const doc = new PDFDocument({ margin: 50 });

  // Add logo if exists
  if (fs.existsSync(LOGO_PATH)) {
    doc.image(LOGO_PATH, 50, 30, { width: 100 });
  }

  doc.fontSize(20).text('PREFERRED CONTRACTORS', { align: 'center' });
  doc.fontSize(16).text('Payroll Report', { align: 'center' });
  doc.fontSize(12).text(`Period: ${start_date} to ${end_date}`, { align: 'center' });
  doc.moveDown(2);

  // Fetch workers
  const { data: workers } = await supabase
    .from('workers')
    .select('*')
    .eq('project_id', project_id);

  // Fetch attendance for date range
  const { data: attendance } = await supabase
    .from('attendance')
    .select('*')
    .gte('attendance_date', start_date)
    .lte('attendance_date', end_date);

  // Calculate totals
  const rows = workers.map(w => {
    const workerAttendance = attendance.filter(a => a.worker_id === w.id);
    const total_days_worked = workerAttendance.reduce((sum, a) => sum + parseFloat(a.days_worked || 0), 0);
    const total_amount = w.rate_per_day * total_days_worked;
    return {
      full_name: w.full_name,
      position: w.position,
      rate_per_day: w.rate_per_day,
      total_days_worked,
      total_amount
    };
  });

  const tableTop = 150;
  const itemHeight = 30;

  doc.fontSize(10).text('Name', 50, tableTop);
  doc.text('Position', 200, tableTop);
  doc.text('Days', 320, tableTop);
  doc.text('Rate', 380, tableTop);
  doc.text('Total', 450, tableTop);

  let y = tableTop + 20;
  let total = 0;

  rows.forEach((row, i) => {
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
