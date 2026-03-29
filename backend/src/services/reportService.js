const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const { supabaseAdmin } = require("../config/supabase");

const countPaydays = (startDate, endDate) => {
  let count = 0;
  let current = new Date(startDate);
  current.setDate(1);

  while (current <= new Date(endDate)) {
    let payday = new Date(current.getFullYear(), current.getMonth(), 28);
    if (payday >= new Date(startDate) && payday <= new Date(endDate)) {
      count++;
    }
    current.setMonth(current.getMonth() + 1);
  }
  return count;
};

exports.generatePayrollExcel = async (project_id, start_date, end_date) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Payroll Report");

  // Title block
  worksheet.mergeCells("A1:F2");
  worksheet.getCell("A1").value = "PREFERRED CONTRACTORS";
  worksheet.getCell("A1").font = {
    size: 16,
    bold: true,
    color: { argb: "FF1e40af" },
  };
  worksheet.getCell("A1").alignment = {
    vertical: "middle",
    horizontal: "center",
  };

  worksheet.mergeCells("A3:F3");
  worksheet.getCell("A3").value = "PAYROLL REPORT";
  worksheet.getCell("A3").font = { size: 13, bold: true };
  worksheet.getCell("A3").alignment = { horizontal: "center" };

  worksheet.mergeCells("A4:F4");
  worksheet.getCell("A4").value = `Period: ${start_date} to ${end_date}`;
  worksheet.getCell("A4").font = { size: 10, italic: true };
  worksheet.getCell("A4").alignment = { horizontal: "center" };

  worksheet.addRow([]);

  // Column definitions
  worksheet.columns = [
    { key: "full_name", width: 25 },
    { key: "phone", width: 15 },
    { key: "position", width: 20 },
    { key: "rate_per_day", width: 15 },
    { key: "total_days_worked", width: 15 },
    { key: "total_amount", width: 20 },
  ];

  // Header row
  const headerRow = worksheet.addRow([
    "Worker Name",
    "Phone",
    "Position",
    "Rate/Day (RWF)",
    "Days Worked",
    "Total Amount (RWF)",
  ]);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1e40af" },
  };
  headerRow.alignment = { horizontal: "center" };

  // Fetch data
  const { data: payrollData } = await exports.getPayrollReportData(
    project_id,
    start_date,
    end_date,
  );
  let grandTotal = 0;

  (payrollData.workers || []).forEach((w, i) => {
    grandTotal += w.total_amount;

    const row = worksheet.addRow({
      full_name: w.full_name,
      phone: w.phone || "",
      position: w.position || "",
      rate_per_day: w.rate_per_day,
      total_days_worked: w.total_days_worked,
      total_amount: w.total_amount,
    });

    if (i % 2 === 0) {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF8FAFF" },
      };
    }
  });

  // Total row
  const totalRow = worksheet.addRow({
    full_name: "TOTAL",
    total_amount: grandTotal,
  });
  totalRow.font = { bold: true, size: 12 };
  totalRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE5E7EB" },
  };

  // Border all data cells
  worksheet.eachRow((row, rowNum) => {
    if (rowNum >= 6) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    }
  });

  return workbook;
};

exports.generateInventoryExcel = async (project_id, start_date, end_date) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Inventory Report");

  worksheet.mergeCells("A1:G2");
  worksheet.getCell("A1").value = "PREFERRED CONTRACTORS";
  worksheet.getCell("A1").font = {
    size: 16,
    bold: true,
    color: { argb: "FF1e40af" },
  };
  worksheet.getCell("A1").alignment = {
    vertical: "middle",
    horizontal: "center",
  };

  worksheet.mergeCells("A3:G3");
  worksheet.getCell("A3").value = "INVENTORY REPORT";
  worksheet.getCell("A3").font = { size: 13, bold: true };
  worksheet.getCell("A3").alignment = { horizontal: "center" };

  if (start_date && end_date) {
    worksheet.mergeCells("A4:G4");
    worksheet.getCell("A4").value = `Period: ${start_date} to ${end_date}`;
    worksheet.getCell("A4").font = { size: 10, italic: true };
    worksheet.getCell("A4").alignment = { horizontal: "center" };
  }

  worksheet.addRow([]);

  worksheet.columns = [
    { key: "name", width: 30 },
    { key: "category_name", width: 20 },
    { key: "quantity", width: 12 },
    { key: "unit", width: 12 },
    { key: "unit_price", width: 15 },
    { key: "total_price", width: 18 },
    { key: "purchase_date", width: 15 },
  ];

  const headerRow = worksheet.addRow([
    "Item Name",
    "Category",
    "Quantity",
    "Unit",
    "Unit Price (RWF)",
    "Total Price (RWF)",
    "Purchase Date",
  ]);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1e40af" },
  };
  headerRow.alignment = { horizontal: "center" };

  let query = supabaseAdmin
    .from("inventory_items")
    .select("*, inventory_categories(name)")
    .eq("project_id", project_id);

  if (start_date && end_date) {
    query = query
      .gte("purchase_date", start_date)
      .lte("purchase_date", end_date);
  }

  const { data: items } = await query.order("purchase_date", {
    ascending: false,
  });

  let grandTotal = 0;
  (items || []).forEach((item, i) => {
    const total = parseFloat(item.total_price || 0);
    grandTotal += total;
    const row = worksheet.addRow({
      name: item.name,
      category_name: item.inventory_categories?.name || "",
      quantity: item.quantity,
      unit: item.unit || "",
      unit_price: parseFloat(item.unit_price || 0),
      total_price: total,
      purchase_date: item.purchase_date || "",
    });
    if (i % 2 === 0) {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF8FAFF" },
      };
    }
  });

  const totalRow = worksheet.addRow({ name: "TOTAL", total_price: grandTotal });
  totalRow.font = { bold: true, size: 12 };
  totalRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE5E7EB" },
  };

  worksheet.eachRow((row, rowNum) => {
    if (rowNum >= 6) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    }
  });

  return workbook;
};

exports.generatePayrollPDF = async (project_id, start_date, end_date) => {
  const doc = new PDFDocument({ margin: 50, size: "A4" });

  // Header
  doc
    .fontSize(20)
    .fillColor("#1e40af")
    .text("PREFERRED CONTRACTORS", { align: "center" });
  doc
    .fontSize(14)
    .fillColor("#000000")
    .text("Payroll Report", { align: "center" });
  doc
    .fontSize(10)
    .fillColor("#555555")
    .text(`Period: ${start_date} to ${end_date}`, { align: "center" });
  doc.moveDown(1.5);

  // Fetch data
  const { data: workers } = await supabaseAdmin
    .from("workers")
    .select("*")
    .eq("project_id", project_id)
    .eq("payment_type", "daily");

  const { data: attendance } = await supabaseAdmin
    .from("attendance")
    .select("*")
    .eq("project_id", project_id)
    .gte("attendance_date", start_date)
    .lte("attendance_date", end_date);

  const rows = (workers || []).map((w) => {
    const workerAttendance = (attendance || []).filter(
      (a) => a.worker_id === w.id,
    );
    const total_days_worked = workerAttendance.reduce(
      (sum, a) => sum + parseFloat(a.days_worked || 0),
      0,
    );
    const total_amount = parseFloat(w.rate_per_day || 0) * total_days_worked;
    return {
      full_name: w.full_name,
      position: w.position || "",
      rate_per_day: w.rate_per_day || 0,
      total_days_worked,
      total_amount,
    };
  });

  // Table header
  const colX = [50, 200, 310, 370, 450];
  const tableTop = doc.y;

  doc.rect(50, tableTop, 495, 20).fill("#1e40af");
  doc.fillColor("#ffffff").fontSize(9).font("Helvetica-Bold");
  doc.text("Worker Name", colX[0], tableTop + 5, { width: 145 });
  doc.text("Position", colX[1], tableTop + 5, { width: 105 });
  doc.text("Days", colX[2], tableTop + 5, { width: 55 });
  doc.text("Rate/Day", colX[3], tableTop + 5, { width: 75 });
  doc.text("Total (RWF)", colX[4], tableTop + 5, { width: 95 });

  let y = tableTop + 22;
  let grandTotal = 0;
  doc.font("Helvetica").fontSize(9).fillColor("#000000");

  rows.forEach((row, i) => {
    if (i % 2 === 0) doc.rect(50, y - 2, 495, 18).fill("#f0f4ff");
    doc.fillColor("#000000");
    doc.text(row.full_name, colX[0], y, { width: 145 });
    doc.text(row.position, colX[1], y, { width: 105 });
    doc.text(row.total_days_worked.toFixed(2), colX[2], y, { width: 55 });
    doc.text(Number(row.rate_per_day).toLocaleString(), colX[3], y, {
      width: 75,
    });
    doc.text(row.total_amount.toLocaleString(), colX[4], y, { width: 95 });
    grandTotal += row.total_amount;
    y += 20;

    // Page break
    if (y > 750) {
      doc.addPage();
      y = 50;
    }
  });

  // Total row
  doc.rect(50, y, 495, 22).fill("#e5e7eb");
  doc.fillColor("#000000").font("Helvetica-Bold").fontSize(10);
  doc.text("TOTAL PAYROLL", colX[0], y + 5, { width: 390 });
  doc.text(`${grandTotal.toLocaleString()} RWF`, colX[4], y + 5, { width: 95 });

  // Footer
  doc.moveDown(3);
  doc
    .fontSize(8)
    .fillColor("#888888")
    .text(`Generated on ${new Date().toLocaleString()}`, { align: "right" });

  return doc;
};

exports.generateInventoryPDF = async (project_id, start_date, end_date) => {
  const doc = new PDFDocument({ margin: 50, size: "A4" });

  // Header
  doc
    .fontSize(20)
    .fillColor("#1e40af")
    .text("PREFERRED CONTRACTORS", { align: "center" });
  doc
    .fontSize(14)
    .fillColor("#000000")
    .text("Inventory Report", { align: "center" });

  if (start_date && end_date) {
    doc
      .fontSize(10)
      .fillColor("#555555")
      .text(`Period: ${start_date} to ${end_date}`, { align: "center" });
  }
  doc.moveDown(1.5);

  // Fetch data
  let query = supabaseAdmin
    .from("inventory_items")
    .select("*, inventory_categories(name)")
    .eq("project_id", project_id);

  if (start_date && end_date) {
    query = query
      .gte("purchase_date", start_date)
      .lte("purchase_date", end_date);
  }

  const { data: items } = await query.order("purchase_date", {
    ascending: false,
  });

  // Table header
  const colX = [50, 200, 310, 370, 450];
  const tableTop = doc.y;

  doc.rect(50, tableTop, 495, 20).fill("#1e40af");
  doc.fillColor("#ffffff").fontSize(9).font("Helvetica-Bold");
  doc.text("Item Name", colX[0], tableTop + 5, { width: 145 });
  doc.text("Category", colX[1], tableTop + 5, { width: 105 });
  doc.text("Qty", colX[2], tableTop + 5, { width: 55 });
  doc.text("Unit Price", colX[3], tableTop + 5, { width: 75 });
  doc.text("Total (RWF)", colX[4], tableTop + 5, { width: 95 });

  let y = tableTop + 22;
  let grandTotal = 0;
  doc.font("Helvetica").fontSize(9).fillColor("#000000");

  (items || []).forEach((item, i) => {
    if (i % 2 === 0) doc.rect(50, y - 2, 495, 18).fill("#f0f4ff");
    doc.fillColor("#000000");
    const itemTotal = parseFloat(item.total_price || 0);
    grandTotal += itemTotal;

    doc.text(item.name || "", colX[0], y, { width: 145 });
    doc.text(item.inventory_categories?.name || "", colX[1], y, { width: 105 });
    doc.text(item.quantity.toString(), colX[2], y, { width: 55 });
    doc.text(Number(item.unit_price || 0).toLocaleString(), colX[3], y, {
      width: 75,
    });
    doc.text(itemTotal.toLocaleString(), colX[4], y, { width: 95 });
    y += 20;

    // Page break
    if (y > 750) {
      doc.addPage();
      y = 50;
    }
  });

  // Total row
  doc.rect(50, y, 495, 22).fill("#e5e7eb");
  doc.fillColor("#000000").font("Helvetica-Bold").fontSize(10);
  doc.text("TOTAL INVENTORY VALUE", colX[0], y + 5, { width: 390 });
  doc.text(`${grandTotal.toLocaleString()} RWF`, colX[4], y + 5, { width: 95 });

  // Footer
  doc.moveDown(3);
  doc
    .fontSize(8)
    .fillColor("#888888")
    .text(`Generated on ${new Date().toLocaleString()}`, { align: "right" });

  return doc;
};

exports.getPayrollReportData = async (project_id, start_date, end_date) => {
  try {
    // Get workers for the project
    const { data: workers } = await supabaseAdmin
      .from("workers")
      .select("*")
      .eq("project_id", project_id)
      .eq("is_active", true);

    // Get attendance records
    const { data: attendance } = await supabaseAdmin
      .from("attendance")
      .select("*")
      .eq("project_id", project_id)
      .gte("attendance_date", start_date)
      .lte("attendance_date", end_date);

    // Calculate payroll for each worker
    const workersPayroll = (workers || []).map((worker) => {
      const workerAttendance = (attendance || []).filter(
        (a) => a.worker_id === worker.id,
      );
      const total_days_worked = workerAttendance.reduce(
        (sum, a) => sum + parseFloat(a.days_worked || 0),
        0,
      );
      const total_amount =
        parseFloat(worker.rate_per_day || 0) * total_days_worked;

      return {
        id: worker.id,
        full_name: worker.full_name,
        phone: worker.phone,
        position: worker.position,
        rate_per_day: parseFloat(worker.rate_per_day || 0),
        total_days_worked,
        total_amount,
      };
    });

    return {
      data: {
        workers: workersPayroll,
        total_payroll: workersPayroll.reduce(
          (sum, w) => sum + w.total_amount,
          0,
        ),
      },
    };
  } catch (error) {
    console.error("Get payroll report data error:", error);
    throw error;
  }
};
