const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { supabase } = require('../config/supabase');

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

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1e40af' }
  };

  const totalRow = worksheet.addRow({
    full_name: 'TOTAL',
    total_amount: rows.reduce((sum, row) => sum + parseFloat(row.total_amount), 0)
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
