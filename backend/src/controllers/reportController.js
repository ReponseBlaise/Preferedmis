const reportService = require("../services/reportService");

exports.exportPayrollExcel = async (req, res) => {
  try {
    const { project_id, start_date, end_date } = req.query;

    if (!project_id || !start_date || !end_date) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const workbook = await reportService.generatePayrollExcel(
      project_id,
      start_date,
      end_date,
    );

    // Set headers BEFORE streaming
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=payroll_${start_date}_${end_date}.xlsx`,
    );
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

    // Write workbook directly to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export payroll excel error:", error.message, error.stack);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ error: error.message || "Failed to export payroll" });
    }
  }
};

exports.exportPayrollPDF = async (req, res) => {
  try {
    const { project_id, start_date, end_date } = req.query;

    if (!project_id || !start_date || !end_date) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const doc = await reportService.generatePayrollPDF(
      project_id,
      start_date,
      end_date,
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=payroll_${start_date}_${end_date}.pdf`,
    );
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error("Export payroll PDF error:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to export payroll" });
  }
};

exports.exportInventoryExcel = async (req, res) => {
  try {
    const { project_id, start_date, end_date } = req.query;

    if (!project_id) {
      return res.status(400).json({ error: "Project ID is required" });
    }

    const workbook = await reportService.generateInventoryExcel(
      project_id,
      start_date,
      end_date,
    );

    // Set headers BEFORE streaming
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=inventory_${Date.now()}.xlsx`,
    );
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

    // Write workbook directly to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Export inventory excel error:", error.message, error.stack);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ error: error.message || "Failed to export inventory" });
    }
  }
};

exports.exportInventoryPDF = async (req, res) => {
  try {
    const { project_id, start_date, end_date } = req.query;

    if (!project_id) {
      return res.status(400).json({ error: "Project ID is required" });
    }

    const doc = await reportService.generateInventoryPDF(
      project_id,
      start_date,
      end_date,
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=inventory_${Date.now()}.pdf`,
    );
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error("Export inventory PDF error:", error);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ error: error.message || "Failed to export inventory" });
    }
  }
};

