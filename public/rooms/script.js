const socket = io('/')

// Connecting to Peer server
const myPeer = new Peer(undefined, {
  host: '/',
  port: '3000',
  secure: true
})

// Creating html5 video elements
const videoGrid = document.getElementById('video-grid')
const myVideo = document.createElement('video')
myVideo.muted = true

const peers = {}
var myUserId = 0;

myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id)
  myUserId = id;
  createChatBubble('Witaj w pokoju ' + ROOM_ID);
})

// Getting access to user media with WebRTC API
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myVideoStream = stream
  addVideoStream(myVideo, myVideoStream)
  myPeer.on('call', call => {
    call.answer(stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
  })

  socket.on('user-connected', userId => {
    connectToNewUser(userId, stream)
    createChatBubble('Dołączył ' + userId);
  })
})

socket.on('user-disconnected', userId => {
  if (peers[userId]) {
    peers[userId].close()
    createChatBubble('Rozłączył się ' + userId);
  }
})

socket.on('message', msg => {
  createChatBubble(msg);
})

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  video.innerHTML = userId
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  })
  call.on('close', () => {
    video.remove()
  })
  peers[userId] = call
}

function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
}

//Mute or unmute your microphone
function muteMicrophone() {
  let enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    document.getElementById("muteBtn").text = 'Odcisz mikrofon'
    console.log('Wyciszono mikrofon')
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    document.getElementById("muteBtn").text = 'Wycisz mikrofon'
    console.log('Odciszono mikrofon')
  }
}

//Turn on or off your video
function stopVideo() {
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    document.getElementById("stopBtn").text = 'Wlacz kamerke'
    console.log('Wylaczono kamerke')
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    document.getElementById("stopBtn").text = 'Wylacz kamerke'
    console.log('Wlaczono kamerke')
  }
}


// Chatbox on socket
const toggleChatboxBtn = document.querySelector(".js-chatbox-toggle");
const chatbox = document.querySelector(".js-chatbox");
const chatboxMsgDisplay = document.querySelector(".js-chatbox-display");
const chatboxForm = document.querySelector(".js-chatbox-form");
chatbox.classList.toggle("chatbox--is-visible")

const createChatBubble = input => {
  const chatSection = document.createElement("p");
  chatSection.textContent = input;
  chatSection.classList.add("chatbox__display-chat");
  chatboxMsgDisplay.appendChild(chatSection);
};

toggleChatboxBtn.addEventListener("click", () => {
  chatbox.classList.toggle("chatbox--is-visible");

  if (chatbox.classList.contains("chatbox--is-visible")) {
    toggleChatboxBtn.innerHTML = '<i class="fas fa-chevron-down">Zamknij</i>';
  } else {
    toggleChatboxBtn.innerHTML = '<i class="fas fa-chevron-up">Otwórz</i>';
  }
});

chatboxForm.addEventListener("submit", e => {
  const chatInput = document.querySelector(".js-chatbox-input").value;
  socket.emit('message', myUserId + ': ' + chatInput)
  createChatBubble(chatInput);
  e.preventDefault();
  chatboxForm.reset();
});