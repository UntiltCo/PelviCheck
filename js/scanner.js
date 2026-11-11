// AI Pose Detection Model Instance
let poseModel = null;

// Initialize MediaPipe Pose AI on page load
window.addEventListener('DOMContentLoaded', () => {
    initializeMediaPipePose();
});

function initializeMediaPipePose() {
    try {
        poseModel = new Pose({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        });
        poseModel.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
    } catch (err) {
        console.warn("MediaPipe Pose load failed, fallback active:", err);
    }
}

// Automatic Strict Scan Function
function runAutomaticStrictScan(imgObj) {
    document.getElementById('scanningOverlay').classList.remove('hidden');

    if (!poseModel) {
        setTimeout(() => {
            document.getElementById('scanningOverlay').classList.add('hidden');
            acceptAndDisplayImage(imgObj);
        }, 800);
        return;
    }

    poseModel.onResults((results) => {
        document.getElementById('scanningOverlay').classList.add('hidden');
        
        // Verify if pose landmarks exist
        if (!results.poseLandmarks || results.poseLandmarks.length === 0) {
            showRejectionModal("The system could not detect a person or body in the provided photo. Please ensure a clear, full-body or waist-level side profile image is captured.");
            return;
        }

        const landmarks = results.poseLandmarks;

        // Keypoints: 23=Left Hip, 24=Right Hip, 25=Left Knee, 26=Right Knee
        const leftHip = landmarks[23];
        const rightHip = landmarks[24];
        const leftKnee = landmarks[25];
        const rightKnee = landmarks[26];

        const isHipVisible = (leftHip && leftHip.visibility > 0.35) || (rightHip && rightHip.visibility > 0.35);
        const isLowerBodyVisible = (leftKnee && leftKnee.visibility > 0.25) || (rightKnee && rightKnee.visibility > 0.25);

        if (isHipVisible && isLowerBodyVisible) {
            acceptAndDisplayImage(imgObj);
        } else {
            showRejectionModal("The system rejected the photo because the waist and hip region is not clearly visible. The ASIS and PSIS landmarks require an unobstructed side-view framing at waist level.");
        }
    });

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imgObj.width;
    tempCanvas.height = imgObj.height;
    const tCtx = tempCanvas.getContext('2d');
    tCtx.drawImage(imgObj, 0, 0);
    
    poseModel.send({ image: tempCanvas });
}

function showRejectionModal(reasonText) {
    document.getElementById('rejectionReasonText').textContent = reasonText;
    document.getElementById('rejectionModal').classList.remove('hidden');
}

function closeRejectionModal() {
    document.getElementById('rejectionModal').classList.add('hidden');
    const imageInput = document.getElementById('imageInput');
    if (imageInput) imageInput.value = "";
}