const { supabaseAdmin } = require('../config/supabase');

const auditLog = (action, tableName) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = async (data) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          await supabaseAdmin
            .from('audit_logs')
            .insert({
              user_id: req.user?.id,
              action,
              table_name: tableName,
              record_id: data?.id || data?.data?.id,
              new_values: data,
              ip_address: req.ip
            });
        } catch (error) {
          console.error('Audit log error:', error);
        }
      }
      originalJson(data);
    };
    
    next();
  };
};

module.exports = auditLog;
