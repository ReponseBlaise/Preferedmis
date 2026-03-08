const { supabaseAdmin } = require('../config/supabase');

exports.recordAttendance = async (req, res) => {
  try {
    const { worker_id, project_id, attendance_date, days_worked, comment } = req.body;

    // Validate required fields
    if (!worker_id) {
      return res.status(400).json({ error: 'Please select a worker' });
    }
    if (!project_id) {
      return res.status(400).json({ error: 'Please select a project' });
    }
    if (!attendance_date) {
      return res.status(400).json({ error: 'Please select an attendance date' });
    }
    if (days_worked && (days_worked < 0 || days_worked > 1)) {
      return res.status(400).json({ error: 'Days worked must be between 0 and 1 (e.g., 0.25, 0.5, 0.75, 1.0)' });
    }

    // Check if attendance exists
    const { data: existing } = await supabaseAdmin
      .from('attendance')
      .select('id')
      .eq('worker_id', worker_id)
      .eq('attendance_date', attendance_date)
      .single();

    let data, error;

    if (existing) {
      // Update existing
      ({ data, error } = await supabaseAdmin
        .from('attendance')
        .update({
          days_worked: days_worked || 1.0,
          comment,
          recorded_by: req.user.id
        })
        .eq('id', existing.id)
        .select()
        .single());
    } else {
      // Insert new
      ({ data, error } = await supabaseAdmin
        .from('attendance')
        .insert({
          worker_id,
          project_id,
          attendance_date,
          days_worked: days_worked || 1.0,
          comment,
          recorded_by: req.user.id
        })
        .select()
        .single());
    }

    if (error) {
      console.error('Record attendance error:', error);
      return res.status(400).json({ error: 'Failed to record attendance. Please check all fields are correct.' });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Record attendance error:', error);
    res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const { project_id, worker_id, start_date, end_date } = req.query;
    let query = supabaseAdmin
      .from('attendance')
      .select(`
        *,
        workers:worker_id (
          full_name,
          position,
          rate_per_day
        ),
        users:recorded_by (
          full_name
        )
      `);

    if (project_id) {
      query = query.eq('project_id', project_id);
    }

    if (worker_id) {
      query = query.eq('worker_id', worker_id);
    }

    if (start_date) {
      query = query.gte('attendance_date', start_date);
    }

    if (end_date) {
      query = query.lte('attendance_date', end_date);
    }

    query = query.order('attendance_date', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
};

exports.getPayrollReport = async (req, res) => {
  try {
    const { project_id, start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // Get all workers for the project
    const { data: workers, error: workersError } = await supabaseAdmin
      .from('workers')
      .select('*')
      .eq('project_id', project_id);

    if (workersError) throw workersError;

    // Get attendance for date range
    const { data: attendance, error: attendanceError } = await supabaseAdmin
      .from('attendance')
      .select('worker_id, days_worked')
      .eq('project_id', project_id)
      .gte('attendance_date', start_date)
      .lte('attendance_date', end_date);

    if (attendanceError) throw attendanceError;

    // Calculate payroll
    const payrollData = workers.map(worker => {
      const workerAttendance = attendance.filter(a => a.worker_id === worker.id);
      const total_days_worked = workerAttendance.reduce((sum, a) => sum + parseFloat(a.days_worked), 0);
      const total_amount = worker.rate_per_day * total_days_worked;

      return {
        worker_id: worker.id,
        full_name: worker.full_name,
        phone: worker.phone,
        position: worker.position,
        rate_per_day: worker.rate_per_day,
        payment_type: worker.payment_type,
        total_days_worked,
        total_amount
      };
    });

    const totalPayroll = payrollData.reduce((sum, row) => sum + row.total_amount, 0);

    res.json({
      period: { start_date, end_date },
      workers: payrollData,
      total_payroll: totalPayroll
    });
  } catch (error) {
    console.error('Payroll report error:', error);
    res.status(500).json({ error: 'Failed to generate payroll report' });
  }
};
