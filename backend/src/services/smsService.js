const { supabaseAdmin } = require('../config/supabase');

/**
 * Send SMS notification
 * 
 * This is a placeholder implementation. Replace with your actual SMS provider.
 * Options:
 * - Twilio: https://www.twilio.com
 * - Africa's Talking: https://africastalking.com (Recommended for Rwanda)
 * - Vonage: https://vonage.com
 */
async function sendSMS(phoneNumber, message) {
  try {
    // Log the SMS attempt
    const { data: smsLog, error: insertError } = await supabaseAdmin
      .from('sms_logs')
      .insert({
        recipient_phone: phoneNumber,
        message: message,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error logging SMS:', insertError);
    }

    // TODO: Implement actual SMS sending with your provider
    // Example for Africa's Talking:
    /*
    const AfricasTalking = require('africas-talking');
    const at = AfricasTalking({
      username: process.env.AT_USERNAME,
      apiKey: process.env.AT_API_KEY
    });

    const sms = at.SMS;
    const result = await sms.send({
      to: phoneNumber,
      message: message,
      from: process.env.SMS_FROM || 'PreferredMIS'
    });

    // Update SMS log with result
    await supabaseAdmin
      .from('sms_logs')
      .update({
        status: 'sent',
        provider: 'africas-talking',
        provider_message_id: result.SMSMessageData.Recipients[0].messageId
      })
      .eq('id', smsLog.id);

    return { success: true, messageId: result.SMSMessageData.Recipients[0].messageId };
    */

    // Example for Twilio:
    /*
    const twilio = require('twilio');
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    await supabaseAdmin
      .from('sms_logs')
      .update({
        status: 'sent',
        provider: 'twilio',
        provider_message_id: result.sid
      })
      .eq('id', smsLog.id);

    return { success: true, messageId: result.sid };
    */

    // For now, just mark as sent (simulation mode)
    console.log(`[SMS SIMULATION] To: ${phoneNumber}, Message: ${message}`);
    
    await supabaseAdmin
      .from('sms_logs')
      .update({
        status: 'sent',
        provider: 'simulation'
      })
      .eq('id', smsLog.id);

    return { success: true, messageId: 'simulated' };

  } catch (error) {
    console.error('Send SMS error:', error);

    // Log the failure
    await supabaseAdmin
      .from('sms_logs')
      .update({
        status: 'failed',
        error_message: error.message
      })
      .where({ recipient_phone: phoneNumber });

    throw error;
  }
}

/**
 * Send bulk SMS notifications
 */
async function sendBulkSMS(recipients, message) {
  const results = [];

  for (const phone of recipients) {
    try {
      const result = await sendSMS(phone, message);
      results.push({ phone, success: true, ...result });
    } catch (error) {
      results.push({ phone, success: false, error: error.message });
    }
  }

  return results;
}

/**
 * Get SMS logs
 */
async function getSMSLogs(filters = {}) {
  try {
    let query = supabaseAdmin
      .from('sms_logs')
      .select('*')
      .order('sent_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.recipient) {
      query = query.eq('recipient_phone', filters.recipient);
    }

    if (filters.startDate) {
      query = query.gte('sent_at', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('sent_at', filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Get SMS logs error:', error);
    throw error;
  }
}

module.exports = {
  sendSMS,
  sendBulkSMS,
  getSMSLogs
};
