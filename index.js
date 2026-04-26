const fs = require('fs');
const ytdl = require('ytdl-core');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const yts = require('yt-search');
const axios = require('axios');
const sharp = require('sharp');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true, args: ['--no-sandbox'] }
});

client.on('qr', qr => qrcode.generate(qr, { small: true }));
client.on('ready', () => console.log('Bot Ready!'));

client.on('message', async msg => {
    let text = (msg.body || '').toLowerCase().trim();

    // 1. AI Chat
    if (text.startsWith('.ai ')) {
        const query = text.replace('.ai', '').trim();
        try {
            const res = await axios.get(`https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(query)}&owner=Viru&botname=Bot`);
            msg.reply(res.data.response);
        } catch { msg.reply("AI Error 😢"); }
    }

    // 2. Song Download
    else if (text.startsWith('.song ')) {
        const query = text.replace('.song', '').trim();
        msg.reply("Searching... 🎵");
        const search = await yts(query);
        if (!search.videos.length) return msg.reply("Not found 😢");
        
        const video = search.videos[0];
        msg.reply(`Downloading: ${video.title}`);
        
        const stream = ytdl(video.url, { filter: 'audioonly' });
        const filePath = './song.mp3';
        stream.pipe(fs.createWriteStream(filePath)).on('finish', async () => {
            await client.sendMessage(msg.from, MessageMedia.fromFilePath(filePath), { sendAudioAsVoice: false });
            fs.unlinkSync(filePath);
        });
    }

    // 3. Sticker
    else if (text === '.sticker' && msg.hasMedia) {
        const media = await msg.downloadMedia();
        const output = await sharp(Buffer.from(media.data, 'base64')).resize(512, 512).webp().toBuffer();
        const sticker = new MessageMedia('image/webp', output.toString('base64'), 'sticker.webp');
        await client.sendMessage(msg.from, sticker, { sendMediaAsSticker: true });
    }

    // 4. Group Admin Commands
    else if (text.startsWith('.kick') && msg.isGroupMsg) {
        const contact = msg.mentionedIds[0];
        if (contact) {
            const chat = await msg.getChat();
            await chat.removeParticipants([contact]);
            msg.reply("User kicked 😎");
        }
    }
    
    // Weather Update
else if (text.startsWith('.weather ')) {
    const city = text.replace('.weather ', '').trim();
    const apiKey = 'ec3e0d5042f5649c04c8625e7b5773e4'; // ec3e0d5042f5649c04c8625e7b5773e4
    
    try {
        const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
        const weather = res.data;
        const msgText = `🌍 *Weather in ${weather.name}*\n` +
                        `🌡️ Temp: ${weather.main.temp}°C\n` +
                        `☁️ Condition: ${weather.weather[0].description}\n` +
                        `💧 Humidity: ${weather.main.humidity}%`;
        msg.reply(msgText);
    } catch (error) {
        msg.reply("කාලගුණ තොරතුරු ලබාගත නොහැකි විය. නගරයේ නම නිවැරදිදැයි පරීක්ෂා කරන්න. 😢");
    }
}

// Currency Converter
else if (text.startsWith('.convert ')) {
    const args = text.split(' ');
    if (args.length !== 4) return msg.reply("වැරදි ආකෘතියකි! උදාහරණ: .convert 10 USD LKR");
    
    const amount = args[1];
    const from = args[2].toUpperCase();
    const to = args[3].toUpperCase();
    
    // dc5c38242220ef919254765d
    const apiKey = 'dc5c38242220ef919254765d'; 
    
    try {
        const res = await axios.get(`https://v6.exchangerate-api.com/v6/${apiKey}/pair/${from}/${to}/${amount}`);
        const result = res.data.conversion_result;
        msg.reply(`💱 *${amount} ${from}* = *${result.toFixed(2)} ${to}*`);
    } catch (error) {
        msg.reply("මුදල් පරිවර්තනය අසාර්ථකයි. කරුණාකර නැවත උත්සාහ කරන්න.");
    }
}

    // 5. Utilities
    else if (text === '.time') msg.reply('🕒 ' + new Date().toLocaleTimeString());
    else if (text === '.dice') msg.reply('🎲 ' + (Math.floor(Math.random() * 6) + 1));
});

client.initialize();
