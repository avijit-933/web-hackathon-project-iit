// asteroid_details.js

// NASA API Configuration
const NASA_API_KEY = '68qAj5eRO28O0LBVBJUS596b6kYwhHGsgkE4DgMQ'; // Replace with your NASA API key for production
const NASA_BASE_URL = 'https://api.nasa.gov/neo/rest/v1/neo';

// Global variables for 3D visualization
let scene, camera, renderer, animationId;
let isAnimating = true;
let showLabels = true;
let earth, asteroid, orbitLine;

// DOM Elements
let asteroidSearch, searchBtn, loading, errorMessage, asteroidDetails;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    asteroidSearch = document.getElementById('asteroid-search');
    searchBtn = document.getElementById('search-btn');
    loading = document.getElementById('loading');
    errorMessage = document.getElementById('error-message');
    asteroidDetails = document.getElementById('asteroid-details');
    
    // Add event listener for Enter key
    if (asteroidSearch) {
        asteroidSearch.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchAsteroid();
            }
        });
    }
    
    // Check if asteroid ID is in URL
    const urlParams = new URLSearchParams(window.location.search);
    const asteroidId = urlParams.get('id');
    if (asteroidId) {
        asteroidSearch.value = asteroidId;
        searchAsteroid();
    }
});

async function searchAsteroid() {
    const searchTerm = asteroidSearch.value.trim();
    
    if (!searchTerm) {
        showError('Please enter an asteroid ID or name');
        return;
    }

    // Show loading state
    loading.style.display = 'block';
    errorMessage.style.display = 'none';
    searchBtn.disabled = true;
    searchBtn.innerHTML = '<span class="icon">⏳</span> Searching...';

    try {
        // Try to fetch asteroid data
        const asteroidData = await fetchAsteroidData(searchTerm);
        
        // Populate the UI with fetched data
        populateAsteroidData(asteroidData);
        
        // Show the asteroid details section
        asteroidDetails.style.display = 'block';
        
        // Scroll to details
        asteroidDetails.scrollIntoView({ behavior: 'smooth' });
        
        // Update URL without reloading
        updateURL(searchTerm);
        
        // Initialize 3D visualization
        init3D(asteroidData);
        
    } catch (error) {
        showError(error.message);
        asteroidDetails.style.display = 'none';
    } finally {
        // Hide loading state
        loading.style.display = 'none';
        searchBtn.disabled = false;
        searchBtn.innerHTML = '<span class="icon">🚀</span> Search';
    }
}

async function fetchAsteroidData(searchTerm) {
    try {
        // First try by ID
        const response = await fetch(`${NASA_BASE_URL}/${searchTerm}?api_key=${NASA_API_KEY}`);
        
        if (!response.ok) {
            // If not found by ID, try searching by name
            throw new Error('Asteroid not found by ID. Try searching by name instead.');
        }
        
        const data = await response.json();
        
        // Extract the closest approach data
        const closeApproachData = data.close_approach_data && data.close_approach_data.length > 0 
            ? data.close_approach_data[0] 
            : null;
        
        // Process the data
        const processedData = {
            id: data.id,
            name: data.name,
            neo_reference_id: data.neo_reference_id,
            designation: data.designation,
            is_hazardous: data.is_potentially_hazardous_asteroid,
            absolute_magnitude: data.absolute_magnitude_h,
            
            // Extract diameter data
            diameter_min_m: data.estimated_diameter?.meters?.estimated_diameter_min || 0,
            diameter_max_m: data.estimated_diameter?.meters?.estimated_diameter_max || 0,
            
            // Extract orbit data if available
            close_approach_date: closeApproachData?.close_approach_date || 'N/A',
            close_approach_time: closeApproachData?.close_approach_date_full?.split(' ')[1] || 'N/A',
            miss_distance_km: parseFloat(closeApproachData?.miss_distance?.kilometers || 0),
            miss_distance_lunar: parseFloat(closeApproachData?.miss_distance?.lunar || 0),
            velocity_kmh: parseFloat(closeApproachData?.relative_velocity?.kilometers_per_hour || 0),
            
            // Orbital data
            orbit_id: data.orbital_data?.orbit_id || 'N/A',
            orbit_class: data.orbital_data?.orbit_class?.orbit_class_type || 'N/A',
            first_observation_date: data.orbital_data?.first_observation_date || 'N/A',
            last_observation_date: data.orbital_data?.last_observation_date || 'N/A'
        };
        
        return processedData;
        
    } catch (error) {
        throw new Error(`Failed to fetch asteroid data: ${error.message}`);
    }
}

function populateAsteroidData(asteroidData) {
    // Update asteroid name
    document.getElementById('asteroid-name').textContent = asteroidData.name || asteroidData.designation;
    
    // Hazard badge
    const hazardBadge = document.getElementById('hazard-badge');
    if (asteroidData.is_hazardous) {
        hazardBadge.textContent = 'Potentially Hazardous';
        hazardBadge.className = 'hazard-badge hazard-yes';
    } else {
        hazardBadge.textContent = 'Not Hazardous';
        hazardBadge.className = 'hazard-badge hazard-no';
    }

    // Orbit data
    if (asteroidData.close_approach_date !== 'N/A') {
        document.getElementById('approach-date').textContent = 
            new Date(asteroidData.close_approach_date).toLocaleDateString('en-US', { 
                year: 'numeric', month: 'long', day: 'numeric' 
            });
        document.getElementById('approach-time').textContent = asteroidData.close_approach_time;
        document.getElementById('distance').textContent = 
            (asteroidData.miss_distance_km / 1000000).toFixed(2) + ' million km';
        document.getElementById('velocity').textContent = 
            Math.round(asteroidData.velocity_kmh).toLocaleString() + ' km/h';
        document.getElementById('lunar-distance').textContent = 
            asteroidData.miss_distance_lunar.toFixed(1) + ' LD';
    } else {
        document.getElementById('approach-date').textContent = 'No close approach data';
        document.getElementById('approach-time').textContent = 'N/A';
        document.getElementById('distance').textContent = 'N/A';
        document.getElementById('velocity').textContent = 'N/A';
        document.getElementById('lunar-distance').textContent = 'N/A';
    }

    // Physical data
    document.getElementById('diameter-min').textContent = 
        asteroidData.diameter_min_m ? Math.round(asteroidData.diameter_min_m) + ' meters' : 'N/A';
    document.getElementById('diameter-max').textContent = 
        asteroidData.diameter_max_m ? Math.round(asteroidData.diameter_max_m) + ' meters' : 'N/A';
    document.getElementById('magnitude').textContent = asteroidData.absolute_magnitude || 'N/A';
    document.getElementById('hazardous').textContent = asteroidData.is_hazardous ? 'Yes' : 'No';
    document.getElementById('orbit-id').textContent = asteroidData.orbit_id || 'N/A';

    // Calculate and display risk assessment
    calculateRisk(asteroidData);
}

function calculateRisk(asteroidData) {
    let riskScore = 0;
    
    // Size factor (0-40 points)
    const avgDiameter = asteroidData.diameter_min_m && asteroidData.diameter_max_m 
        ? (asteroidData.diameter_min_m + asteroidData.diameter_max_m) / 2 
        : 0;
    
    if (avgDiameter > 1000) riskScore += 40;
    else if (avgDiameter > 500) riskScore += 30;
    else if (avgDiameter > 140) riskScore += 20;
    else if (avgDiameter > 0) riskScore += 10;
    else riskScore += 5; // Unknown size

    // Distance factor (0-35 points)
    if (asteroidData.miss_distance_lunar) {
        if (asteroidData.miss_distance_lunar < 5) riskScore += 35;
        else if (asteroidData.miss_distance_lunar < 10) riskScore += 25;
        else if (asteroidData.miss_distance_lunar < 20) riskScore += 15;
        else riskScore += 5;
    } else {
        riskScore += 10; // Unknown distance
    }

    // Velocity factor (0-15 points)
    if (asteroidData.velocity_kmh) {
        if (asteroidData.velocity_kmh > 100000) riskScore += 15;
        else if (asteroidData.velocity_kmh > 50000) riskScore += 10;
        else riskScore += 5;
    } else {
        riskScore += 5; // Unknown velocity
    }

    // Hazardous classification (0-10 points)
    if (asteroidData.is_hazardous) riskScore += 10;

    // Determine risk level
    let riskLevel, riskClass, riskDescription;
    if (riskScore >= 70) {
        riskLevel = 'HIGH';
        riskClass = 'risk-high';
        riskDescription = 'Close monitoring required. Large size and proximity warrant attention.';
    } else if (riskScore >= 40) {
        riskLevel = 'MEDIUM';
        riskClass = 'risk-medium';
        riskDescription = 'Moderate concern. Size or distance suggests tracking is advisable.';
    } else {
        riskLevel = 'LOW';
        riskClass = 'risk-low';
        riskDescription = 'Minimal threat. Safe distance and manageable size.';
    }

    document.getElementById('risk-level').textContent = riskLevel;
    
    // Size category
    if (avgDiameter > 1000) {
        document.getElementById('size-category').textContent = 'Very Large';
    } else if (avgDiameter > 500) {
        document.getElementById('size-category').textContent = 'Large';
    } else if (avgDiameter > 140) {
        document.getElementById('size-category').textContent = 'Medium';
    } else if (avgDiameter > 0) {
        document.getElementById('size-category').textContent = 'Small';
    } else {
        document.getElementById('size-category').textContent = 'Unknown';
    }

    // Distance rating
    if (asteroidData.miss_distance_lunar) {
        if (asteroidData.miss_distance_lunar < 5) {
            document.getElementById('distance-rating').textContent = 'Very Close';
        } else if (asteroidData.miss_distance_lunar < 10) {
            document.getElementById('distance-rating').textContent = 'Close';
        } else if (asteroidData.miss_distance_lunar < 20) {
            document.getElementById('distance-rating').textContent = 'Moderate';
        } else {
            document.getElementById('distance-rating').textContent = 'Safe';
        }
    } else {
        document.getElementById('distance-rating').textContent = 'Unknown';
    }

    // Update risk indicator
    const riskIndicator = document.getElementById('risk-indicator');
    riskIndicator.className = `risk-indicator ${riskClass}`;
    document.getElementById('risk-title').textContent = `${riskLevel} RISK`;
    document.getElementById('risk-description').textContent = riskDescription;
    
    const riskDot = document.getElementById('risk-dot');
    if (riskLevel === 'HIGH') {
        riskDot.style.background = '#ef4444';
    } else if (riskLevel === 'MEDIUM') {
        riskDot.style.background = '#fbbf24';
    } else {
        riskDot.style.background = '#22c55e';
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    asteroidDetails.style.display = 'none';
}

function updateURL(asteroidId) {
    const url = new URL(window.location);
    url.searchParams.set('id', asteroidId);
    window.history.pushState({}, '', url);
}

// 3D Visualization
function init3D(asteroidData) {
    // Clear previous scene if exists
    if (scene) {
        while(scene.children.length > 0){ 
            scene.remove(scene.children[0]); 
        }
        if (renderer) {
            renderer.dispose();
        }
    }

    const canvas = document.getElementById('orbit-canvas');
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.set(0, 30, 50);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setClearColor(0x000000);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 2);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // Sun
    const sunGeometry = new THREE.SphereGeometry(3, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xfdb813 });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);

    // Sun glow
    const glowGeometry = new THREE.SphereGeometry(3.5, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xfdb813, 
        transparent: true, 
        opacity: 0.3 
    });
    const sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(sunGlow);

    // Earth
    const earthGeometry = new THREE.SphereGeometry(2, 32, 32);
    const earthMaterial = new THREE.MeshPhongMaterial({ color: 0x2233ff });
    earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.position.set(20, 0, 0);
    scene.add(earth);

    // Earth orbit
    const earthOrbitGeometry = new THREE.BufferGeometry();
    const earthOrbitPoints = [];
    for (let i = 0; i <= 360; i++) {
        const angle = (i * Math.PI) / 180;
        earthOrbitPoints.push(new THREE.Vector3(
            Math.cos(angle) * 20,
            0,
            Math.sin(angle) * 20
        ));
    }
    earthOrbitGeometry.setFromPoints(earthOrbitPoints);
    const earthOrbitMaterial = new THREE.LineBasicMaterial({ 
        color: 0x2233ff, 
        transparent: true, 
        opacity: 0.3 
    });
    const earthOrbit = new THREE.Line(earthOrbitGeometry, earthOrbitMaterial);
    scene.add(earthOrbit);

    // Calculate asteroid size based on actual data
    const avgDiameter = (asteroidData.diameter_min_m + asteroidData.diameter_max_m) / 2;
    const asteroidSize = Math.max(0.1, Math.min(avgDiameter / 100, 2));

    // Asteroid
    const asteroidGeometry = new THREE.SphereGeometry(asteroidSize, 16, 16);
    const asteroidMaterial = new THREE.MeshPhongMaterial({ 
        color: asteroidData.is_hazardous ? 0xff4444 : 0xff6b6b 
    });
    asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
    scene.add(asteroid);

    // Calculate orbital parameters based on distance
    const distanceFactor = asteroidData.miss_distance_lunar || 20;
    const a = Math.min(25 + (distanceFactor / 10), 40); // semi-major axis
    const b = Math.min(18 + (distanceFactor / 15), 30); // semi-minor axis

    // Asteroid orbit (elliptical)
    const orbitGeometry = new THREE.BufferGeometry();
    const orbitPoints = [];
    for (let i = 0; i <= 360; i++) {
        const angle = (i * Math.PI) / 180;
        orbitPoints.push(new THREE.Vector3(
            Math.cos(angle) * a,
            Math.sin(angle) * 2,
            Math.sin(angle) * b
        ));
    }
    orbitGeometry.setFromPoints(orbitPoints);
    const orbitMaterial = new THREE.LineBasicMaterial({ 
        color: asteroidData.is_hazardous ? 0xff4444 : 0xff6b6b,
        transparent: true, 
        opacity: 0.5 
    });
    orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
    scene.add(orbitLine);

    // Mouse controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;
            
            camera.position.x += deltaX * 0.1;
            camera.position.y -= deltaY * 0.1;
            camera.lookAt(0, 0, 0);
            
            previousMousePosition = { x: e.clientX, y: e.clientY };
        }
    });

    canvas.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Zoom
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY * 0.05;
        camera.position.z += delta;
        camera.position.z = Math.max(20, Math.min(100, camera.position.z));
    });

    animate();
}

let time = 0;
function animate() {
    if (isAnimating) {
        animationId = requestAnimationFrame(animate);
        
        time += 0.005;
        
        // Rotate Earth around Sun
        if (earth) {
            earth.position.x = Math.cos(time) * 20;
            earth.position.z = Math.sin(time) * 20;
            earth.rotation.y += 0.01;
        }
        
        // Animate asteroid on elliptical orbit
        if (asteroid) {
            const a = 25;
            const b = 18;
            asteroid.position.x = Math.cos(time * 1.5) * a;
            asteroid.position.y = Math.sin(time * 1.5) * 2;
            asteroid.position.z = Math.sin(time * 1.5) * b;
            asteroid.rotation.x += 0.02;
            asteroid.rotation.y += 0.03;
        }
        
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    }
}

function toggleAnimation() {
    isAnimating = !isAnimating;
    const btn = event.target;
    if (isAnimating) {
        btn.innerHTML = '⏸️ Pause';
        animate();
    } else {
        btn.innerHTML = '▶️ Play';
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
    }
}

function resetView() {
    if (camera) {
        camera.position.set(0, 30, 50);
        camera.lookAt(0, 0, 0);
    }
}

function toggleLabels() {
    showLabels = !showLabels;
    // In a full implementation, this would toggle text labels
    alert(showLabels ? 'Labels enabled' : 'Labels disabled');
}

// Window resize handler
window.addEventListener('resize', () => {
    const canvas = document.getElementById('orbit-canvas');
    if (camera && renderer) {
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    }
});