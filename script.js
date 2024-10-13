let nodes = [];
let links = [];
let nodeId = 0;
let selectedNodeId = null;
let isDragging = false;
let offsetX, offsetY;
let firstSelectedNodeId = null; // For connecting nodes
let zoomLevel = 1; // Zoom level for canvas

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions
canvas.width = 800;
canvas.height = 600;

document.getElementById('addNodeButton').addEventListener('click', addNode);
document.getElementById('deleteNodeButton').addEventListener('click', deleteNode);
document.getElementById('renameNodeButton').addEventListener('click', renameNode);
document.getElementById('saveImageButton').addEventListener('click', saveAsImage);
document.getElementById('clearButton').addEventListener('click', clearMindMap);
canvas.addEventListener('mousedown', startDrag);
canvas.addEventListener('mouseup', endDrag);
canvas.addEventListener('mousemove', dragNode);
canvas.addEventListener('click', handleCanvasClick);
canvas.addEventListener('wheel', zoomCanvas); // Add zoom functionality

// Prevent canvas click from propagating to document
canvas.addEventListener('click', function(event) {
    event.stopPropagation();
});

document.addEventListener('click', function() {
    // Deselect node when clicking outside the canvas
    if (selectedNodeId !== null) {
        selectedNodeId = null;
        draw();
    }
});

document.addEventListener('keydown', function(event) {
    if (selectedNodeId !== null) {
        // Move node with arrow keys
        const currentNode = nodes.find(node => node.id === selectedNodeId);
        if (event.key === "ArrowUp") currentNode.y -= 5;
        if (event.key === "ArrowDown") currentNode.y += 5;
        if (event.key === "ArrowLeft") currentNode.x -= 5;
        if (event.key === "ArrowRight") currentNode.x += 5;
        draw();
    }
});

function addNode() {
    const text = document.getElementById('nodeText').value;
    const color = document.getElementById('nodeColor').value; // Get color from the color picker
    if (!text) return;

    const node = {
        id: nodeId++,
        text: text,
        x: Math.random() * (canvas.width - 150) + 25,
        y: Math.random() * (canvas.height - 100) + 25,
        color: color || `hsl(${Math.random() * 360}, 100%, 75%)`, // Random color
    };
    nodes.push(node);
    draw();
    document.getElementById('nodeText').value = '';
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous canvas

    // Draw all links first (connections between nodes)
    links.forEach(link => {
        const sourceNode = nodes.find(node => node.id === link.source);
        const targetNode = nodes.find(node => node.id === link.target);
        if (sourceNode && targetNode) {
            ctx.beginPath();
            ctx.moveTo((sourceNode.x + 50) * zoomLevel, (sourceNode.y + 25) * zoomLevel);
            ctx.lineTo((targetNode.x + 50) * zoomLevel, (targetNode.y + 25) * zoomLevel);
            ctx.strokeStyle = '#999';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });

    // Draw all nodes
    nodes.forEach(node => {
        ctx.fillStyle = node.color;

        ctx.beginPath();
        ctx.roundRect(node.x * zoomLevel, node.y * zoomLevel, 100 * zoomLevel, 50 * zoomLevel, 10); // Rounded rectangle
        ctx.fill();

        // Highlight selected node with a border
        if (node.id === selectedNodeId) {
            ctx.strokeStyle = '#FF0000'; // Red border for selected node
            ctx.lineWidth = 3;
        } else {
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1;
        }
        ctx.stroke();

        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.text, (node.x + 50) * zoomLevel, (node.y + 25) * zoomLevel); // Text centered
    });
}

function clearMindMap() {
    nodes = [];
    links = [];
    selectedNodeId = null;
    draw(); // Redraw after clearing
}

CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
    if (typeof radius === 'undefined') radius = 5;
    if (typeof radius === 'number') {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
        const defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
        for (let side in defaultRadius) {
            radius[side] = radius[side] || defaultRadius[side];
        }
    }
    this.beginPath();
    this.moveTo(x + radius.tl, y);
    this.lineTo(x + width - radius.tr, y);
    this.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    this.lineTo(x + width, y + height - radius.br);
    this.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    this.lineTo(x + radius.bl, y + height);
    this.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    this.lineTo(x, y + radius.tl);
    this.quadraticCurveTo(x, y, x + radius.tl, y);
    this.closePath();
    return this;
};

function startDrag(event) {
    const mousePos = getMousePos(canvas, event);
    nodes.forEach(node => {
        if (isInsideNode(mousePos, node)) {
            isDragging = true;
            selectedNodeId = node.id;
            offsetX = mousePos.x - node.x;
            offsetY = mousePos.y - node.y;
        }
    });
}

function endDrag() {
    isDragging = false;
}

function dragNode(event) {
    if (!isDragging || selectedNodeId === null) return;

    const mousePos = getMousePos(canvas, event);
    const currentNode = nodes.find(node => node.id === selectedNodeId);
    if (currentNode) {
        currentNode.x = mousePos.x - offsetX;
        currentNode.y = mousePos.y - offsetY;
        draw();
    }
}

function handleCanvasClick(event) {
    const mousePos = getMousePos(canvas, event);
    let clickedNode = null;

    nodes.forEach(node => {
        if (isInsideNode(mousePos, node)) {
            clickedNode = node;
        }
    });

    if (clickedNode) {
        selectedNodeId = clickedNode.id;
    } else {
        selectedNodeId = null; // Deselect if clicking outside
    }
    draw();
}

function isInsideNode(mousePos, node) {
    return mousePos.x > node.x && mousePos.x < node.x + 100 &&
           mousePos.y > node.y && mousePos.y < node.y + 50;
}

function getMousePos(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (event.clientX - rect.left) / zoomLevel,
        y: (event.clientY - rect.top) / zoomLevel
    };
}

function saveAsImage() {
    const dataURL = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = 'mindmap.png';
    a.click();
}

function zoomCanvas(event) {
    event.preventDefault(); // Prevent page scrolling
    const zoomAmount = event.deltaY > 0 ? 0.9 : 1.1; // Zoom in or out based on scroll direction
    zoomLevel *= zoomAmount; // Update zoom level
    draw(); // Redraw the canvas
}

// Bullet Point Functionality
const bulletPoints = [];

function addBulletPoint() {
    const bulletInput = document.getElementById('bulletInput');
    const text = bulletInput.value;
    if (text) {
        bulletPoints.push(text);
        bulletInput.value = '';
        renderBulletPoints();
    }
}

function deleteBulletPoint() {
    const bulletList = document.getElementById('bulletList');
    const selectedItem = bulletList.querySelector('li.selected');
    if (selectedItem) {
        const index = Array.from(bulletList.children).indexOf(selectedItem);
        bulletPoints.splice(index, 1);
        renderBulletPoints();
    }
}

function renderBulletPoints() {
    const bulletList = document.getElementById('bulletList');
    bulletList.innerHTML = ''; // Clear existing list
    bulletPoints.forEach((point, index) => {
        const li = document.createElement('li');
        li.textContent = point;
        li.classList.add('cursor-pointer');
        li.addEventListener('click', () => {
            bulletList.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
            li.classList.add('selected');
        });
        bulletList.appendChild(li);
    });
}
