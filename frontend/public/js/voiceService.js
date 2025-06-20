// Assuming socket.io client is loaded globally or via another module.
// For now, let's try to use a global `io()` or assume it's managed elsewhere.
// import { socket } from './socketService.js'; // If you have a socket service

console.log('VoiceService.js loaded');

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
        console.log('Voice: Received active users in room:', users);
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
        console.log(`Voice: User ${username} (socket: ${socketId}) joined.`);
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
        console.log(`Voice: User ${username} (socket: ${socketId}) left.`);
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
        console.log(`Voice: Received signal from ${senderSocketId}`, { signalType, sdp });
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
        console.log(`Voice: Received ICE candidate from ${senderSocketId}`, candidate);
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
        console.log('PeerConnection already exists for', targetSocketId);
        return peerConnections[targetSocketId];
    }
    console.log(`Voice: Creating PeerConnection to ${targetSocketId}. Initiator: ${isOfferInitiator}`);

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
        console.log(`Voice: Received remote track from ${targetSocketId}`);
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
        console.log(`ICE connection state change for ${targetSocketId}: ${pc.iceConnectionState}`);
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
        console.log('Already in this voice room.');
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
    console.log(`Voice: Attempting to join room ${currentVoiceRoomId}`);

    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        console.log('Voice: Emitting voice:join_room for room', currentVoiceRoomId);
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
        console.log('Not in a voice room or socket not initialized.');
        return;
    }
    console.log(`Voice: Leaving room ${currentVoiceRoomId}`);
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

    console.log(`Voice: Left room ${currentVoiceRoomId}. Cleaned up resources.`);
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
    console.log(isMutedNow ? 'Microphone Muted' : 'Microphone Unmuted');
    return isMutedNow;
}

console.log('VoiceService.js processing complete.');
