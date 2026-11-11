// Canvas & Landmark Measurement State Variables
let canvas, ctx;
let currentImage = null;
let points = [];

// Initialize Canvas listener on DOM load
window.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('postureCanvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
        canvas.addEventListener('click', handleCanvasClick);
    }
});

// Accept verified photo and display on canvas
function acceptAndDisplayImage(imgObj) {
    currentImage = imgObj;
    document.getElementById('emptyCanvasOverlay').classList.add('hidden');
    canvas.width = imgObj.width > 800 ? 800 : imgObj.width;
    canvas.height = imgObj.height * (canvas.width / imgObj.width);
    points = [];
    redraw();
}

// Upload & Sample Image File Handlers
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            runAutomaticStrictScan(img);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function loadSampleImage() {
    const img = new Image();
    img.onload = function() {
        acceptAndDisplayImage(img);
    };
    img.onerror = function() {
        alert("Could not find 'demo.jpg'. Please ensure 'demo.jpg' is uploaded directly to your GitHub repository root folder!");
    };
    img.src = 'demo.jpg?v=' + new Date().getTime();
}

// Canvas Click Event Handler
function handleCanvasClick(e) {
    if (!currentImage) return;
    if (points.length >= 2) points = [];

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    points.push({ x, y });
    redraw();
}

// Canvas Redraw Logic
function redraw() {
    if (!currentImage) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);

    points.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, 2 * Math.PI);
        ctx.fillStyle = i === 0 ? '#174C5A' : '#72B7B0';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px Inter';
        ctx.fillText(i === 0 ? 'PSIS (Back)' : 'ASIS (Front)', p.x + 12, p.y + 4);
    });

    document.getElementById('pointCounter').textContent = `${points.length}/2 Points`;
    if (points.length === 0) {
        document.getElementById('stepText').innerHTML = 'Step 1: Click on the <strong>PSIS (Back Hip Landmark)</strong>.';
    } else if (points.length === 1) {
        document.getElementById('stepText').innerHTML = 'Step 2: Click on the <strong>ASIS (Front Hip Landmark)</strong>.';
    } else if (points.length === 2) {
        document.getElementById('stepText').innerHTML = 'Landmarks marked! Review calculated angle below.';
        
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        ctx.strokeStyle = '#72B7B0';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.moveTo(points[0].x - 50, points[0].y);
        ctx.lineTo(points[1].x + 50, points[0].y);
        ctx.strokeStyle = '#174C5A';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);

        calculateAngle(points[0], points[1]);
    }
}

// Trigonometric Pelvic Tilt Angle Calculation
function calculateAngle(psis, asis) {
    const dx = asis.x - psis.x;
    const dy = asis.y - psis.y;
    
    let angle = Math.abs(Math.atan2(dy, dx) * (180 / Math.PI)).toFixed(1);
    document.getElementById('angleValue').textContent = angle;

    const statusBadge = document.getElementById('statusBadge');
    const titleEl = document.getElementById('classificationTitle');
    const descEl = document.getElementById('classificationDesc');
    const boxEl = document.getElementById('classificationBox');

    const exerciseTag = document.getElementById('exerciseTag');
    const exerciseList = document.getElementById('exerciseList');

    if (angle >= 7 && angle <= 13) {
        statusBadge.textContent = "Normal Standing Tilt";
        statusBadge.className = "text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-ice text-brand-deep border border-brand-mint";
        titleEl.textContent = "Normal Standing Alignment";
        titleEl.className = "font-bold text-base text-brand-deep";
        descEl.textContent = `Your calculated angle of ${angle}° falls within the normal standing tilt reference range (7° - 13°).`;
        boxEl.className = "p-4 rounded-xl border border-brand-mint text-center space-y-1 bg-brand-ice";

        exerciseTag.textContent = "Normal Alignment Care";
        exerciseList.innerHTML = `
            <div class="p-3.5 rounded-xl bg-brand-ice border border-brand-mint/30 space-y-1">
                <strong class="text-brand-deep block text-sm"><i class="fa-solid fa-person-plank mr-1"></i> Core Plank Maintenance</strong>
                <p class="text-brand-dark/80">Hold a standard forearm plank for 30 seconds to maintain core stability and pelvic alignment.</p>
            </div>
            <div class="p-3.5 rounded-xl bg-brand-ice border border-brand-mint/30 space-y-1">
                <strong class="text-brand-deep block text-sm"><i class="fa-solid fa-person-walking mr-1"></i> Daily Walking Routine</strong>
                <p class="text-brand-dark/80">Maintain a daily 20–30 minute brisk walk to support spinal health and hip mobility.</p>
            </div>
            <div class="p-3.5 rounded-xl bg-brand-ice border border-brand-mint/30 space-y-1">
                <strong class="text-brand-deep block text-sm"><i class="fa-solid fa-chair mr-1"></i> Sitting Ergonomics</strong>
                <p class="text-brand-dark/80">Keep knees at a 90° angle with feet flat while sitting to protect your natural curve.</p>
            </div>
            <div class="p-3.5 rounded-xl bg-brand-ice border border-brand-mint/30 space-y-1">
                <strong class="text-brand-deep block text-sm"><i class="fa-solid fa-arrows-up-down-left-right mr-1"></i> Pelvic Clock Exercises</strong>
                <p class="text-brand-dark/80">Gentle pelvic tilts while lying flat to preserve pelvic lumbar fluidity.</p>
            </div>
        `;
    } else if (angle > 13) {
        statusBadge.textContent = "Anterior Pelvic Tilt";
        statusBadge.className = "text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-deep text-brand-white";
        titleEl.textContent = "Anterior Pelvic Tilt (APT)";
        titleEl.className = "font-bold text-base text-brand-deep";
        descEl.textContent = `Your calculated angle of ${angle}° exceeds the standard normal standing threshold (> 13°).`;
        boxEl.className = "p-4 rounded-xl border border-brand-deep text-center space-y-1 bg-brand-ice";

        exerciseTag.textContent = "Recommended for Anterior Tilt";
        exerciseList.innerHTML = `
            <div class="p-3.5 rounded-xl bg-brand-ice border border-brand-mint/30 space-y-1">
                <strong class="text-brand-deep block text-sm"><i class="fa-solid fa-person-praying mr-1"></i> Kneeling Hip Flexor Stretch</strong>
                <p class="text-brand-dark/80">Kneel on one knee, lean gently forward until a stretch is felt in the front hip. Hold 30 seconds per side.</p>
            </div>
            <div class="p-3.5 rounded-xl bg-brand-ice border border-brand-mint/30 space-y-1">
                <strong class="text-brand-deep block text-sm"><i class="fa-solid fa-dumbbell mr-1"></i> Glute Bridges</strong>
                <p class="text-brand-dark/80">Lie on your back, bend knees, and lift hips toward the ceiling. Squeeze glutes at the top (10–12 reps).</p>
            </div>
            <div class="p-3.5 rounded-xl bg-brand-ice border border-brand-mint/30 space-y-1">
                <strong class="text-brand-deep block text-sm"><i class="fa-solid fa-feather mr-1"></i> Abdominal Hollow Holds</strong>
                <p class="text-brand-dark/80">Press your lower back firmly into the floor while pulling your belly button inward to engage deep core.</p>
            </div>
            <div class="p-3.5 rounded-xl bg-brand-ice border border-brand-mint/30 space-y-1">
                <strong class="text-brand-deep block text-sm"><i class="fa-solid fa-user-gear mr-1"></i> Habit: Avoid Prolonged Sitting</strong>
                <p class="text-brand-dark/80">Stand up every 30 minutes to prevent hip flexors from shortening while sitting.</p>
            </div>
        `;
    } else {
        statusBadge.textContent = "Posterior Pelvic Tilt";
        statusBadge.className = "text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-dark text-brand-white";
        titleEl.textContent = "Posterior Pelvic Tilt (PPT)";
        titleEl.className = "font-bold text-base text-brand-dark";
        descEl.textContent = `Your calculated angle of ${angle}° is below the standard standing threshold (< 7°).`;
        boxEl.className = "p-4 rounded-xl border border-brand-dark text-center space-y-1 bg-brand-ice";

        exerciseTag.textContent = "Recommended for Posterior Tilt";
        exerciseList.innerHTML = `
            <div class="p-3.5 rounded-xl bg-brand-ice border border-brand-mint/30 space-y-1">
                <strong class="text-brand-deep block text-sm"><i class="fa-solid fa-person-walking-arrow-loop-left mr-1"></i> Standing Hamstring Stretch</strong>
                <p class="text-brand-dark/80">Rest heel on a low surface and hinge forward at hips to lengthen tight hamstrings (Hold 30s).</p>
            </div>
            <div class="p-3.5 rounded-xl bg-brand-ice border border-brand-mint/30 space-y-1">
                <strong class="text-brand-deep block text-sm"><i class="fa-solid fa-bolt mr-1"></i> Quadriceps Lunge Extensions</strong>
                <p class="text-brand-dark/80">Gentle static lunges to activate the quadriceps and restore anterior hip tilt dynamics.</p>
            </div>
            <div class="p-3.5 rounded-xl bg-brand-ice border border-brand-mint/30 space-y-1">
                <strong class="text-brand-deep block text-sm"><i class="fa-solid fa-spa mr-1"></i> Cobra Pose (Lumbar Extension)</strong>
                <p class="text-brand-dark/80">Lie stomach-down and press upper body up with hands to encourage natural lumbar arch.</p>
            </div>
            <div class="p-3.5 rounded-xl bg-brand-ice border border-brand-mint/30 space-y-1">
                <strong class="text-brand-deep block text-sm"><i class="fa-solid fa-chair mr-1"></i> Habit: Lumbar Roll Support</strong>
                <p class="text-brand-dark/80">Use a small lumbar pillow behind your lower back when seated to prevent slumping backward.</p>
            </div>
        `;
    }
}

// Reset Marked Points
function resetLandmarks() {
    points = [];
    document.getElementById('angleValue').textContent = "--";
    document.getElementById('statusBadge').textContent = "Awaiting Points";
    document.getElementById('statusBadge').className = "text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-ice text-brand-dark border border-brand-mint/30";
    document.getElementById('classificationTitle').textContent = "Incomplete Assessment";
    document.getElementById('classificationTitle').className = "font-bold text-base text-brand-dark";
    document.getElementById('classificationDesc').textContent = "Select both the PSIS (back) and ASIS (front) landmarks on your image.";
    document.getElementById('classificationBox').className = "p-4 rounded-xl border border-dashed border-brand-mint text-center space-y-1 bg-brand-ice";

    document.getElementById('exerciseTag').textContent = "General Care";
    document.getElementById('exerciseList').innerHTML = `
        <div class="p-3.5 rounded-xl bg-brand-ice border border-brand-mint/30 space-y-1">
            <strong class="text-brand-deep block text-sm"><i class="fa-solid fa-chair mr-1"></i> Ergonomic Sitting Habit</strong>
            <p class="text-brand-dark/80">Avoid slouching or staying seated for more than 45 minutes continuously. Keep feet flat on the floor.</p>
        </div>
        <div class="p-3.5 rounded-xl bg-brand-ice border border-brand-mint/30 space-y-1">
            <strong class="text-brand-deep block text-sm"><i class="fa-solid fa-child mr-1"></i> Standing Posture Mindful Awareness</strong>
            <p class="text-brand-dark/80">Distribute your body weight evenly on both feet rather than leaning onto one hip.</p>
        </div>
        <div class="p-3.5 rounded-xl bg-brand-ice border border-brand-mint/30 space-y-1">
            <strong class="text-brand-deep block text-sm"><i class="fa-solid fa-person-walking mr-1"></i> Daily Mobility Breaks</strong>
            <p class="text-brand-dark/80">Take short 2-minute walking breaks every hour to maintain joint fluid movement.</p>
        </div>
        <div class="p-3.5 rounded-xl bg-brand-ice border border-brand-mint/30 space-y-1">
            <strong class="text-brand-deep block text-sm"><i class="fa-solid fa-mattress-pillow mr-1"></i> Sleep Support Habit</strong>
            <p class="text-brand-dark/80">Place a small pillow under your knees when sleeping on your back to reduce lumbar pressure.</p>
        </div>
    `;
    redraw();
}