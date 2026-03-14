// RabbitMQ connection utility for Node.js backend
// Usage: const { sendToQueue, consumeFromQueue } = require('./rabbitmq');

const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

async function connect() {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    return { connection, channel };
}

async function sendToQueue(queue, message) {
    const { connection, channel } = await connect();
    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
    await channel.close();
    await connection.close();
}

async function consumeFromQueue(queue, onMessage) {
    const { connection, channel } = await connect();
    await channel.assertQueue(queue, { durable: true });
    channel.consume(queue, (msg) => {
        if (msg !== null) {
            const content = JSON.parse(msg.content.toString());
            onMessage(content);
            channel.ack(msg);
        }
    });
    // Do not close connection/channel here; keep alive for consumer
}

module.exports = { sendToQueue, consumeFromQueue };
