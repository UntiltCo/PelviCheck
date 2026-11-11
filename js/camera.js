// Live Camera State Variables
let mediaStream = null;
let facingMode = 'user';

// Open Live Camera Modal
async function openCameraModal() {
    document.getElementById('cameraModal').classList.remove('hidden');
    await startCamera();
}

// Start Camera Stream
async function startCamera() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode }
        });
        const videoEl = document.getElementById('cameraStream');
        videoEl.srcObject = mediaStream;
    } catch (err) {
        alert("Camera access denied or unavailable on this device.");
        closeCameraModal();
    }
}

// Flip Camera (Front / Back)
function switchCameraMode() {
    facingMode = facingMode === 'user' ? 'environment' : 'user';
    startCamera();
}

// Close Camera Stream
function closeCameraModal() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
    document.getElementById('cameraModal').classList.add('hidden');
}

// Capture Snapshot from Camera Feed
function captureCameraPhoto() {
    const videoEl = document.getElementById('cameraStream');
    if (!videoEl.videoWidth) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = videoEl.videoWidth;
    tempCanvas.height = videoEl.videoHeight;
    const tCtx = tempCanvas.getContext('2d');
    tCtx.drawImage(videoEl, 0, 0, tempCanvas.width, tempCanvas.height);

    const img = new Image();
    img.onload = function() {
        closeCameraModal();
        runAutomaticStrictScan(img);
    };
    img.src = tempCanvas.toDataURL('image/jpeg');
}