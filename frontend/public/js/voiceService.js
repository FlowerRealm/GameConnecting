// Assuming socket.io client is loaded globally or via another module.
// For now, let's try to use a global `io()` or assume it's managed elsewhere.
// import { socket } from './socketService.js'; // If you have a socket service

const peerConnections = {}; // socketId -> RTCPeerConnection
let localStream = null;
let currentVoiceRoomId = null;
let localSocketId = null; // Will be set upon connection
const activeVoiceUsers = new Map(); // socketId -> {userId, username, socketId}
let onVoiceUsersUpdate = null; // Callback function for UI updates

const iceConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

let socket = null;

export function setVoiceUsersUpdateCallback(callback) {
    onVoiceUsersUpdate = callback;
}

export function initVoiceChat(socketInstance) {
    if (!socketInstance) {
        console.error('Socket instance not provided to initVoiceChat.');
        return;
    }
    socket = socketInstance;
    localSocketId = socket.id;

    socket.on('voice:active_users_in_room', ({ users }) => {
        activeVoiceUsers.clear();
        users.forEach(user => {
            // Ensure the structure matches what server sends: {socketId, userId, username}
            activeVoiceUsers.set(user.socketId, user);
            if (user.socketId !== localSocketId) {
                createPeerConnection(user.socketId, true);
            }
        });
        if (onVoiceUsersUpdate) {
            onVoiceUsersUpdate(Array.from(activeVoiceUsers.values()));
        }
    });

    socket.on('voice:user_joined', ({ socketId, userId, username }) => {
        // Server sends {socketId, userId, username}
        activeVoiceUsers.set(socketId, { socketId, userId, username });
        if (onVoiceUsersUpdate) {
            onVoiceUsersUpdate(Array.from(activeVoiceUsers.values()));
        }
        if (socketId !== localSocketId) {
             createPeerConnection(socketId, true);
        }
    });

    socket.on('voice:user_left', ({ socketId, userId, username }) => {
        activeVoiceUsers.delete(socketId);
        if (onVoiceUsersUpdate) {
            onVoiceUsersUpdate(Array.from(activeVoiceUsers.values()));
        }
        if (peerConnections[socketId]) {
            peerConnections[socketId].close();
            delete peerConnections[socketId];
            const audioEl = document.getElementById(`audio_${socketId}`);
            if (audioEl) audioEl.remove();
        }
    });

    socket.on('voice:receive_signal', async ({ senderSocketId, signalType, sdp }) => {
        let pc = peerConnections[senderSocketId];
        if (!pc) {
            pc = createPeerConnection(senderSocketId, false);
        }
        try {
            await pc.setRemoteDescription(new RTCSessionDescription({ type: signalType, sdp }));
            if (signalType === 'offer') {
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('voice:send_signal', {
                    roomId: currentVoiceRoomId,
                    targetSocketId: senderSocketId,
                    signalType: 'answer',
                    sdp: pc.localDescription.sdp,
                });
            }
        } catch (error) {
            console.error('Error handling received signal:', error);
        }
    });

    socket.on('voice:receive_ice_candidate', ({ senderSocketId, candidate }) => {
        const pc = peerConnections[senderSocketId];
        if (pc && candidate) {
            pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error('Error adding ICE candidate:', e));
        }
    });

    socket.on('voice:error', ({ message }) => {
        console.error('Voice chat error from server:', message);
        alert(`Voice chat error: ${message}`);
    });
}

function createPeerConnection(targetSocketId, isOfferInitiator) {
    if (peerConnections[targetSocketId]) {
        return peerConnections[targetSocketId];
    }

    const pc = new RTCPeerConnection(iceConfiguration);
    peerConnections[targetSocketId] = pc;

    if (localStream) {
        localStream.getTracks().forEach(track => {
            pc.addTrack(track, localStream);
        });
    } else {
        console.warn('Local stream not available when creating peer connection.');
    }

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('voice:send_ice_candidate', {
                roomId: currentVoiceRoomId,
                targetSocketId,
                candidate: event.candidate,
            });
        }
    };

    pc.ontrack = (event) => {
        const audioElId = `audio_${targetSocketId}`;
        let audioEl = document.getElementById(audioElId);
        if (!audioEl) {
            audioEl = document.createElement('audio');
            audioEl.id = audioElId;
            audioEl.autoplay = true;
            document.body.appendChild(audioEl);
        }
        if (event.streams && event.streams[0]) {
            audioEl.srcObject = event.streams[0];
        } else {
            let inboundStream = new MediaStream();
            inboundStream.addTrack(event.track);
            audioEl.srcObject = inboundStream;
        }
    };

    pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'closed') {
            console.error(`ICE connection to ${targetSocketId} failed or disconnected.`);
        }
    };

    if (isOfferInitiator) {
        pc.createOffer()
            .then(offer => pc.setLocalDescription(offer))
            .then(() => {
                socket.emit('voice:send_signal', {
                    roomId: currentVoiceRoomId,
                    targetSocketId,
                    signalType: 'offer',
                    sdp: pc.localDescription.sdp,
                });
            })
            .catch(e => console.error('Error creating offer:', e));
    }
    return pc;
}

export async function joinVoiceRoom(roomId) {
    if (!socket) {
        console.error('Socket not initialized. Call initVoiceChat(socket) first.');
        alert('Voice chat system not ready. Please connect to the server first.');
        return false; // Indicate failure
    }
    if (currentVoiceRoomId === roomId && localStream) {
        return true; // Indicate already joined
    }

    if (localStream) {
        await leaveVoiceRoom();
    } else {
        activeVoiceUsers.clear();
        if (onVoiceUsersUpdate) {
            onVoiceUsersUpdate([]);
        }
    }

    currentVoiceRoomId = String(roomId);

    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        socket.emit('voice:join_room', { roomId: currentVoiceRoomId });
        return true; // Indicate success
    } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Could not access microphone. Please check permissions. ' + error.message);
        currentVoiceRoomId = null;
        activeVoiceUsers.clear(); // Clear users on failure too
        if (onVoiceUsersUpdate) {
            onVoiceUsersUpdate([]);
        }
        return false; // Indicate failure
    }
}

export async function leaveVoiceRoom() {
    if (!socket || !currentVoiceRoomId) {
        return;
    }
    socket.emit('voice:leave_room', { roomId: currentVoiceRoomId });

    activeVoiceUsers.clear();
    if (onVoiceUsersUpdate) {
        onVoiceUsersUpdate([]);
    }

    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }

    Object.values(peerConnections).forEach(pc => pc.close());
    for (const socketId in peerConnections) {
        const audioEl = document.getElementById(`audio_${socketId}`);
        if (audioEl) audioEl.remove();
    }
    peerConnections = {};

    currentVoiceRoomId = null;
}

export function toggleMute() {
    if (!localStream) {
        console.warn('Cannot toggle mute, local stream not available.');
        return false;
    }
    let isMutedNow = false;
    localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
        isMutedNow = !track.enabled;
    });
    return isMutedNow;
}
