const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const yts = require('yt-search');
const axios = require('axios');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', qr => {
    console.log('Scan QR below:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Bot Ready!');
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

client.on('message', async msg => {

    let text = (msg.body || '').toString().toLowerCase(); 
if (text.startsWith('.song')) {

    let query = text.replace('.song', '').trim();

    const search = await yts(query);
    const video = search.videos[0];

    if (!video) return msg.reply('❌ Not found');

    msg.reply(`🎵 ${video.title}\n🔗 ${video.url}`);
}
if (text.startsWith('.ai')) {

    let q = text.replace('.ai', '').trim();

    let res = await axios.get(
        'https://api.popcat.xyz/chatbot?msg=' + q + '&owner=Viru&botname=Bot'
    );

    msg.reply(res.data.response);
}
if (text === '.dice') {
    msg.reply('🎲 ' + (Math.floor(Math.random() * 6) + 1));
}
if (text === '.coin') {
    msg.reply(Math.random() > 0.5 ? '🪙 Head' : '🪙 Tail');
}

    // MENU
    if (text === '.menu') {
        return msg.reply(`
🤖 BOT MENU

.song <name>
.vv
.ai <text>
.time
        `);
    }

    // SONG (safe link)
    if (text.startsWith('.song')) {

        let query = text.replace('.song', '').trim();

        if (!query) return msg.reply('❌ Enter song name');

        const search = await yts(query);

        if (!search.videos.length) {
            return msg.reply('❌ Not found');
        }

        const video = search.videos[0];

        msg.reply(`🎵 ${video.title}\n🔗 ${video.url}`);
    }

    // VIEW ONCE PHOTO
    if (text === '.vv') {

        const media = await MessageMedia.fromUrl(
            'https://picsum.photos/400',
            { unsafeMime: true }
        );

        await sleep(1000);

        client.sendMessage(msg.from, media, {
            isViewOnce: true
        });
    }

    // AI CHAT
    if (text.startsWith('.ai')) {

        let q = text.replace('.ai', '').trim();

        let res = await axios.get(
            'https://api.popcat.xyz/chatbot?msg=' + q + '&owner=Viru&botname=Bot'
        );

        msg.reply(res.data.response);
    }

    // TIME
    if (text === '.time') {
        msg.reply('🕒 ' + new Date().toLocaleTimeString());
    }

});

client.initialize();