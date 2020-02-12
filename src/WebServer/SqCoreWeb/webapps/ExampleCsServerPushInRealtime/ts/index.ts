import './../css/main.css';
import { HubConnectionBuilder } from '@microsoft/signalr';

// examples from https://docs.microsoft.com/en-us/aspnet/core/tutorials/signalr-typescript-webpack

const divMessages: HTMLDivElement | null = document.querySelector('#divMessages');
const tbMessage: HTMLInputElement | null = document.querySelector('#tbMessage');
const btnSend: HTMLButtonElement | null = document.querySelector('#btnSend');
const gUsername = new Date().getTime();

const connection = new HubConnectionBuilder().withUrl('/hub/exsvpush').build();

connection.on('messageReceived', (username: string, message: string) => {
    const m = document.createElement('div');

    m.innerHTML = `<div class="message-author">${username}</div><div>${message}</div>`;

    if (divMessages != null) {
        divMessages.appendChild(m);
        divMessages.scrollTop = divMessages.scrollHeight;
    }
});

connection.start().catch(err => document.write(err));

if (tbMessage != null) {
    tbMessage.addEventListener('keyup', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            send();
        }
    });
}

if (btnSend != null) {
    btnSend.addEventListener('click', send);
}

function send() {
    if (tbMessage != null) {
    connection.send('newMessage', gUsername, tbMessage.value)
              .then(() => tbMessage.value = '');
    }
}

// SqCore example
const btnStream: HTMLButtonElement | null = document.querySelector('#btnStartStreaming');
const spanStream: HTMLSpanElement | null = document.querySelector('#divStreaming');

if (btnStream != null) {
    btnStream.addEventListener('click', startStream);
}

function startStream() {
    connection.send('startStreaming', 'message body')
        .then(() => { });
}

connection.on('priceQuoteFromServer', (message: string) => {
    console.log('Stream Message arrived:' + message);
    if (spanStream != null) {
        spanStream.innerHTML = `<span>${message}</span>`;      // this is not really single quote('), but (`), which allows C# like string interpolation.
    }
});



