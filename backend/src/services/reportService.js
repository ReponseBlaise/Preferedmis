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
  worksheet.getCell("A3").value = "PAYROLL REPORT";
  worksheet.getCell("A3").font = { size: 13, bold: true };
  worksheet.getCell("A3").alignment = { horizontal: "center" };

  worksheet.mergeCells("A4:G4");
  worksheet.getCell("A4").value = `Period: ${start_date} to ${end_date}`;
  worksheet.getCell("A4").font = { size: 10, italic: true };
  worksheet.getCell("A4").alignment = { horizontal: "center" };

  worksheet.addRow([]);

  // Column definitions
  worksheet.columns = [
    { key: "full_name", width: 25 },
    { key: "phone", width: 15 },
    { key: "position", width: 20 },
    { key: "payment_type", width: 12 },
    { key: "rate_info", width: 18 },
    { key: "total_days_worked", width: 15 },
    { key: "total_amount", width: 20 },
  ];

  // Header row
  const headerRow = worksheet.addRow([
    "Worker Name",
    "Phone",
    "Position",
    "Type",
    "Rate/Salary (RWF)",
    "Days/Months",
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

  // Use adjusted dates if it's month-end payroll
  const displayStartDate = payrollData.adjustedStartDate || start_date;
  const displayEndDate = payrollData.adjustedEndDate || end_date;
  const payrollType = payrollData.isMonthPayroll ? "(MONTH-END PAYROLL)" : "";

  worksheet.getCell("A4").value =
    `Period: ${displayStartDate} to ${displayEndDate} ${payrollType}`;

  let grandTotal = 0;

  (payrollData.workers || []).forEach((w, i) => {
    grandTotal += w.total_amount;

    const rateInfo =
      w.payment_type === "daily" ? w.rate_per_day : w.monthly_salary;
    const daysInfo =
      w.payment_type === "daily"
        ? w.total_days_worked.toFixed(2)
        : payrollData.isMonthPayroll
          ? "1 Month"
          : "0 Months";

    const row = worksheet.addRow({
      full_name: w.full_name,
      phone: w.phone || "",
      position: w.position || "",
      payment_type: w.payment_type === "daily" ? "Daily" : "Monthly",
      rate_info: rateInfo,
      total_days_worked: daysInfo,
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

  // Fetch payroll data first to get adjusted dates
  const { data: payrollData } = await exports.getPayrollReportData(
    project_id,
    start_date,
    end_date,
  );

  // Use adjusted dates if it's month-end payroll
  const displayStartDate = payrollData.adjustedStartDate || start_date;
  const displayEndDate = payrollData.adjustedEndDate || end_date;
  const isMonthPayroll = payrollData.isMonthPayroll;

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
    .text(
      `Period: ${displayStartDate} to ${displayEndDate}${isMonthPayroll ? " (MONTH-END)" : ""}`,
      { align: "center" },
    );
  doc.moveDown(1.5);

  const workers = payrollData.workers || [];

  const rows = workers.map((w) => {
    var rateDisplay;
    var daysDisplay;

    if (w.payment_type === "daily") {
      rateDisplay = w.rate_per_day;
      daysDisplay = w.total_days_worked.toFixed(2);
    } else {
      rateDisplay = w.monthly_salary;
      daysDisplay = isMonthPayroll ? "Month" : "0";
    }

    return {
      full_name: w.full_name,
      position: w.position || "",
      type: w.payment_type === "daily" ? "Daily" : "Monthly",
      rate_or_salary: rateDisplay,
      days_or_status: daysDisplay,
      total_amount: w.total_amount,
    };
  });

  // Table header
  const colX = [50, 170, 270, 340, 410, 480];
  const tableTop = doc.y;

  doc.rect(50, tableTop, 495, 20).fill("#1e40af");
  doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold");
  doc.text("Worker Name", colX[0], tableTop + 5, { width: 115 });
  doc.text("Position", colX[1], tableTop + 5, { width: 95 });
  doc.text("Type", colX[2], tableTop + 5, { width: 65 });
  doc.text("Rate/Salary", colX[3], tableTop + 5, { width: 65 });
  doc.text("Days/Month", colX[4], tableTop + 5, { width: 65 });
  doc.text("Total (RWF)", colX[5], tableTop + 5, { width: 65 });

  let y = tableTop + 22;
  let grandTotal = 0;
  doc.font("Helvetica").fontSize(8).fillColor("#000000");

  rows.forEach((row, i) => {
    if (i % 2 === 0) doc.rect(50, y - 2, 495, 18).fill("#f0f4ff");
    doc.fillColor("#000000");
    doc.text(row.full_name, colX[0], y, { width: 115 });
    doc.text(row.position, colX[1], y, { width: 95 });
    doc.text(row.type, colX[2], y, { width: 65 });
    doc.text(Number(row.rate_or_salary).toLocaleString(), colX[3], y, {
      width: 65,
    });
    doc.text(row.days_or_status, colX[4], y, { width: 65 });
    doc.text(row.total_amount.toLocaleString(), colX[5], y, { width: 65 });
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
  doc.text("TOTAL PAYROLL", colX[0], y + 5, { width: 350 });
  doc.text(`${grandTotal.toLocaleString()} RWF`, colX[5], y + 5, { width: 65 });

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
    // Parse dates
    const endDateObj = new Date(end_date);
    const year = endDateObj.getFullYear();
    const month = endDateObj.getMonth();

    // Check if we're in the last 5 days of the month (end of week payroll scenario)
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dayOfMonth = endDateObj.getDate();
    const isNearMonthEnd = dayOfMonth >= daysInMonth - 4; // Last 5 days

    // If near month end, recalculate period to full month
    let adjustedStartDate = start_date;
    let adjustedEndDate = end_date;
    let isMonthPayroll = false;

    if (isNearMonthEnd) {
      // Set start to 1st of the month
      const monthStart = new Date(year, month, 1);
      adjustedStartDate = monthStart.toISOString().split("T")[0];

      // Set end to last day of month
      const monthEnd = new Date(year, month + 1, 0);
      adjustedEndDate = monthEnd.toISOString().split("T")[0];
      isMonthPayroll = true;
    }

    // Get workers for the project
    const { data: workers } = await supabaseAdmin
      .from("workers")
      .select("*")
      .eq("project_id", project_id)
      .eq("is_active", true);

    // Get attendance records for the adjusted period
    const { data: attendance } = await supabaseAdmin
      .from("attendance")
      .select("*")
      .eq("project_id", project_id)
      .gte("attendance_date", adjustedStartDate)
      .lte("attendance_date", adjustedEndDate);

    // Calculate payroll for each worker using HISTORICAL rates
    const workersPayroll = await Promise.all(
      (workers || []).map(async (worker) => {
        let total_amount = 0;
        let total_days_worked = 0;
        let rateUsed = 0;

        if (worker.payment_type === "daily") {
          // Daily workers: calculate from attendance with historical rates
          const workerAttendance = (attendance || []).filter(
            (a) => a.worker_id === worker.id,
          );

          // Group attendance by rate periods
          let amount = 0;
          for (const attendanceRecord of workerAttendance) {
            const { data: historicalRate } = await supabaseAdmin
              .from("worker_salary_history")
              .select("rate_per_day")
              .eq("worker_id", worker.id)
              .lte("effective_date", attendanceRecord.attendance_date)
              .is("end_date", null)
              .order("effective_date", { ascending: false })
              .limit(1)
              .single();

            const rate = historicalRate?.rate_per_day || parseFloat(worker.rate_per_day || 0);
            const daysWorked = parseFloat(attendanceRecord.days_worked || 0);
            amount += rate * daysWorked;
            total_days_worked += daysWorked;
            rateUsed = rate; // Track last rate for display
          }
          total_amount = amount;
        } else if (worker.payment_type === "monthly") {
          // Monthly workers: use historical salary if it's month-end payroll
          if (isMonthPayroll) {
            const { data: historicalSalary } = await supabaseAdmin
              .from("worker_salary_history")
              .select("monthly_salary")
              .eq("worker_id", worker.id)
              .lte("effective_date", adjustedEndDate)
              .is("end_date", null)
              .order("effective_date", { ascending: false })
              .limit(1)
              .single();

            total_amount = parseFloat(historicalSalary?.monthly_salary || worker.monthly_salary || 0);
            total_days_worked = 1; // Full month worked
            rateUsed = total_amount;
          } else {
            total_amount = 0;
            total_days_worked = 0;
          }
        }

        return {
          id: worker.id,
          full_name: worker.full_name,
          phone: worker.phone,
          position: worker.position,
          payment_type: worker.payment_type,
          rate_per_day: parseFloat(worker.rate_per_day || 0),
          monthly_salary: parseFloat(worker.monthly_salary || 0),
          total_days_worked,
          total_amount,
        };
      }),
    );

    return {
      data: {
        workers: workersPayroll,
        total_payroll: workersPayroll.reduce(
          (sum, w) => sum + w.total_amount,
          0,
        ),
        isMonthPayroll,
        adjustedStartDate,
        adjustedEndDate,
      },
    };
  } catch (error) {
    console.error("Get payroll report data error:", error);
    throw error;
  }
};
