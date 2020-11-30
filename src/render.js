const { desktopCapturer, remote } = require('electron');

const { writeFile } = require('fs');

const { dialog, Menu } = remote;

// global variable 
let mediaRecorder
const recorderChunks = [];
const videoElement = document.querySelector('video');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const videoSelectBtn = document.getElementById('videoSelectBtn');

startBtn.onclick = (e) => {
    
    mediaRecorder.start();
    startBtn.classList.add('is-danger');
    startBtn.innerHTML = 'Recording Started....';
}

stopBtn.onclick = (e) => {

    mediaRecorder.stop();
    startBtn.classList.remove('is-danger');
    startBtn.innerHTML = 'Start';

}

videoSelectBtn.onclick = getVideoSources;


// get all window screen
async function getVideoSources(){

    const inputSources = await desktopCapturer.getSources({
        types:['window', 'screen']
    });

    const videoOptionsMenu = Menu.buildFromTemplate(
        inputSources.map(source => {
            return {
                label: source.name,
                click: () => selectSource(source)
            };
        })
    );

    videoOptionsMenu.popup();

}

async function selectSource(source){
    console.log(source)
    videoSelectBtn.innerHTML = source.name
    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: source.id
            }
        }
    }

    // create steam
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    videoElement.srcObject = stream;
    videoElement.play();

    // create the mediarecorder
    const options = {
        mimeType: 'video/webm;codecs=vp9'
    }

    mediaRecorder = new MediaRecorder(stream, options)
    
    // register events handler
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;

}   


function handleDataAvailable(e){
    console.log('video data available');
    recorderChunks.push(e.data);
}

async function handleStop(e){
    const blob = new Blob(recorderChunks, {
        type: 'video/webm;codecs=vp9'
    });

    const buffer = Buffer.from(await blob.arrayBuffer())
    const {filePath} = await dialog.showSaveDialog({
        buttonLabel:'Save Video',
        defaultPath:`vid-${Date.now()}.webm`
    });

    // write a file
    if(filePath){
        writeFile(filePath, buffer, () => {
            console.log('File Saved Sucessfully');
        })
    }
}