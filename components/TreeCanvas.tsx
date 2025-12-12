import React, { useRef, useEffect, useCallback } from 'react';
import { Particle, ProjectedPoint, GiftMessage } from '../types';
import { GIFTS, TREE_COLORS, SNOW_COLOR, STAR_COLOR, LIGHT_COLORS } from '../constants';

interface TreeCanvasProps {
  onGiftClick: (gift: GiftMessage) => void;
}

const TreeCanvas: React.FC<TreeCanvasProps> = ({ onGiftClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  
  // Initialize Particles
  const initParticles = useCallback(() => {
    const particles: Particle[] = [];

    // Tree Dimensions
    const treeHeight = 500;
    const treeBaseRadius = 220;
    const treeTopY = -250;
    
    // 0. Trunk
    const trunkHeight = 120;
    const trunkWidth = 50; 
    const trunkStartY = treeTopY + treeHeight - 50;
    
    const trunkSegments = 20;
    const segmentHeight = trunkHeight / trunkSegments;

    for (let i = 0; i < trunkSegments; i++) {
         const y = trunkStartY + (i * segmentHeight);
         particles.push({
             x: 0,
             y: y,
             z: 0,
             size: trunkWidth,
             color: '#3e2723',
             type: 'trunk',
             opacity: 1
         });
    }

    // 1. Tree Foliage
    const layers = 80;
    
    for (let i = 0; i < layers; i++) {
      const progress = i / layers; 
      const y = treeTopY + (progress * treeHeight);
      
      const radius = treeBaseRadius * Math.pow(progress, 0.9);
      const particlesInLayer = 8 + Math.floor(progress * 30); 

      for (let j = 0; j < particlesInLayer; j++) {
        const angle = (Math.PI * 2 * j) / particlesInLayer + Math.random() * 0.5;
        const r = radius * (0.85 + Math.random() * 0.3);

        particles.push({
          x: Math.cos(angle) * r,
          y: y + (Math.random() - 0.5) * 12,
          z: Math.sin(angle) * r,
          size: Math.random() * 4 + 2,
          color: TREE_COLORS[Math.floor(Math.random() * TREE_COLORS.length)],
          type: 'tree',
          opacity: 0.9 + Math.random() * 0.1
        });
      }
    }

    // 2. Lights
    const coils = 7;
    const pointsPerCoil = 35;
    for (let i = 0; i < coils * pointsPerCoil; i++) {
      const p = i / (coils * pointsPerCoil); 
      const y = treeTopY + (p * treeHeight);
      const radius = treeBaseRadius * p + 8;
      const angle = p * Math.PI * 2 * coils;

      particles.push({
        x: Math.cos(angle) * radius,
        y: y,
        z: Math.sin(angle) * radius,
        size: Math.random() > 0.7 ? Math.random() * 4 + 5 : Math.random() * 2 + 3,
        color: LIGHT_COLORS[i % LIGHT_COLORS.length],
        type: 'light',
        opacity: 1,
        blinkOffset: Math.random() * 100
      });
    }

    // 3. Decorations (Ornaments)
    for (let i = 0; i < 80; i++) {
        const p = Math.random();
        const y = treeTopY + (p * treeHeight);
        const radius = treeBaseRadius * p * 0.9;
        const angle = Math.random() * Math.PI * 2;
        
        const isStar = Math.random() > 0.7;
        
        particles.push({
            x: Math.cos(angle) * radius,
            y: y,
            z: Math.sin(angle) * radius,
            size: isStar ? 4 : 6,
            color: isStar ? '#ffffaa' : (Math.random() > 0.5 ? '#ef4444' : '#fbbf24'),
            type: 'ornament',
            opacity: 1
        });
    }

    // 3.5 Ba Yin Qiao (Eight-Tone Orifices) - UPDATED
    // Static, scattered, same size as gifts (28)
    const numBaYinQiao = 18; // Increased count slightly for better scattering
    for (let i = 0; i < numBaYinQiao; i++) {
        // Random height: mostly middle to bottom, but some high up
        const p = Math.random() * 0.85 + 0.1; 
        const y = treeTopY + (p * treeHeight);
        
        // Base radius at this height
        const baseLayerRadius = treeBaseRadius * Math.pow(p, 0.9);
        
        // Depth scattering: Some are buried slightly (0.8), some hang out (1.15)
        const depthScale = 0.8 + Math.random() * 0.35; 
        const radius = baseLayerRadius * depthScale;
        
        const angle = Math.random() * Math.PI * 2;

        particles.push({
            x: Math.cos(angle) * radius,
            y: y,
            z: Math.sin(angle) * radius,
            size: 28, // Matches Gift Size
            color: '#e0e7ff', 
            type: 'bayinqiao',
            opacity: 1,
            rotationPhase: Math.random() * Math.PI * 2 // Static orientation
        });
    }

    // 4. Top Star
    particles.push({
      x: 0,
      y: treeTopY - 25,
      z: 0,
      size: 45,
      color: STAR_COLOR,
      type: 'star',
      opacity: 1
    });

    // 5. Gifts
    GIFTS.forEach((gift, index) => {
      const p = 0.6 + (index / GIFTS.length) * 0.35;
      const y = treeTopY + (p * treeHeight);
      const radius = treeBaseRadius * p + 40;
      const angle = (index / GIFTS.length) * Math.PI * 2; 

      particles.push({
        x: Math.cos(angle) * radius,
        y: y,
        z: Math.sin(angle) * radius,
        size: 28, // Updated to match Ba Yin Qiao
        color: gift.color,
        type: 'gift',
        giftId: gift.id,
        opacity: 1,
        angleOffset: angle,
      });
    });

    // 6. Snow
    for (let i = 0; i < 400; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 1200,
        y: (Math.random() - 0.5) * 1200,
        z: (Math.random() - 0.5) * 1200,
        size: Math.random() * 2.5 + 1,
        color: SNOW_COLOR,
        type: 'snow',
        speed: Math.random() * 2 + 1.5,
        opacity: Math.random() * 0.5 + 0.3
      });
    }

    particlesRef.current = particles;
  }, []);

  // Projection Logic
  const project = (p: Particle, width: number, height: number, rotationY: number): ProjectedPoint => {
    const cos = Math.cos(rotationY);
    const sin = Math.sin(rotationY);
    
    let rx = p.x * cos - p.z * sin;
    let rz = p.x * sin + p.z * cos;
    let ry = p.y;

    const fov = 800;
    const viewerDistance = 1100;
    const scale = fov / (fov + viewerDistance + rz);

    const x2d = rx * scale + width / 2;
    const y2d = ry * scale + height / 2;

    return {
      x: x2d,
      y: y2d,
      scale: scale,
      visible: scale > 0
    };
  };

  // Helper to draw the "Ba Yin Qiao" (Eight-Tone Orifice)
  const drawBaYinQiao = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, _time: number, phase: number) => {
      // 1. Clip to Sphere shape
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.clip();

      // 2. Base Material Gradient (Pearlescent / Jade)
      // Complex gradient: White highlight -> Pale Blue -> Lavender -> Deep Purple/Grey edge
      const grad = ctx.createRadialGradient(x - size*0.3, y - size*0.3, size*0.1, x, y, size * 1.2);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.98)'); 
      grad.addColorStop(0.3, 'rgba(210, 230, 255, 0.95)'); 
      grad.addColorStop(0.6, 'rgba(160, 140, 240, 0.9)'); 
      grad.addColorStop(1, 'rgba(80, 70, 150, 0.95)'); 
      
      ctx.fillStyle = grad;
      ctx.fillRect(x - size, y - size, size * 2, size * 2);

      // 3. 3D Holes Simulation (STATIC)
      // Define points on a unit sphere (corners + centers)
      const points = [
          {x: 0, y: 0, z: 1}, {x: 0, y: 0, z: -1},
          {x: 1, y: 0, z: 0}, {x: -1, y: 0, z: 0},
          {x: 0, y: 1, z: 0}, {x: 0, y: -1, z: 0},
          {x: 0.7, y: 0.7, z: 0.7}, {x: -0.7, y: -0.7, z: -0.7}
      ];

      // Use phase for STATIC orientation. No time dependency.
      // This ensures each orb looks different but doesn't spin.
      const t = phase; 
      const cosT = Math.cos(t);
      const sinT = Math.sin(t);
      const cosT2 = Math.cos(t * 0.7);
      const sinT2 = Math.sin(t * 0.7);

      points.forEach(p => {
          // Rotate Y
          let px = p.x * cosT - p.z * sinT;
          let pz = p.x * sinT + p.z * cosT;
          let py = p.y;
          
          // Rotate X
          let py2 = py * cosT2 - pz * sinT2;
          let pz2 = py * sinT2 + pz * cosT2;
          let px2 = px;

          // Projection scale for "depth" inside the orb
          const scale = 1 / (1 - pz2 * 0.3);
          const drawX = x + px2 * size * 0.7;
          const drawY = y + py2 * size * 0.7;
          const holeRad = size * 0.25 * scale;

          if (pz2 > 0) {
              // Front holes: Dark inside, sharp rim
              ctx.beginPath();
              ctx.ellipse(drawX, drawY, holeRad, holeRad * 0.85, 0, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(20, 15, 60, 0.85)'; // Deep hollow
              ctx.fill();

              // Rim
              ctx.lineWidth = 1.5;
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
              ctx.stroke();
          } else {
             // Back holes: Faint, ghostly (adds translucency)
              ctx.beginPath();
              ctx.ellipse(drawX, drawY, holeRad * 0.9, holeRad * 0.7, 0, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(10, 5, 40, 0.15)'; 
              ctx.fill();
          }
      });

      // 4. Surface Cloud Patterns (Swirls)
      // Fixed overlay to simulate carving texture
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - size*0.6, y + size*0.4);
      ctx.bezierCurveTo(x - size*0.3, y - size*0.2, x + size*0.3, y + size*0.2, x + size*0.6, y - size*0.4);
      ctx.stroke();
      
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, size * 0.85, 0, Math.PI * 2); // Inner rim suggestion
      ctx.stroke();

      ctx.restore(); // End Clip

      // 5. Outer Glow (Bloom)
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'rgba(180, 200, 255, 0.6)';
      ctx.fillStyle = 'transparent';
      ctx.beginPath();
      ctx.arc(x, y, size * 0.95, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 6. Specular Highlight (Glassy Finish)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.ellipse(x - size*0.35, y - size*0.35, size * 0.2, size * 0.12, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
  };

  // Animation Loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const time = Date.now() * 0.001;
    const rotationSpeed = 0.25; 
    const currentRotation = time * rotationSpeed;

    // Update Snow Position
    particlesRef.current.forEach(p => {
      if (p.type === 'snow') {
        p.y += p.speed || 1;
        if (p.y > 600) p.y = -600; 
      }
    });

    // Sort by depth
    particlesRef.current.sort((a, b) => {
      const az = a.x * Math.sin(currentRotation) + a.z * Math.cos(currentRotation);
      const bz = b.x * Math.sin(currentRotation) + b.z * Math.cos(currentRotation);
      return bz - az; 
    });

    particlesRef.current.forEach(p => {
      const proj = project(p, canvas.width, canvas.height, currentRotation);

      if (proj.visible) {
        ctx.globalAlpha = p.opacity;
        
        if (p.type === 'trunk') {
            const width = p.size * proj.scale;
            const height = 10 * proj.scale; 
            ctx.fillStyle = p.color;
            ctx.fillRect(proj.x - width/2, proj.y, width, height);
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(proj.x + width/6, proj.y, width/3, height);
        }
        else if (p.type === 'tree') {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, p.size * proj.scale, 0, Math.PI * 2);
            ctx.fill();
        } 
        else if (p.type === 'light') {
            const blink = Math.sin(time * 4 + (p.blinkOffset || 0));
            const alpha = 0.5 + 0.5 * Math.abs(blink);
            ctx.shadowBlur = 15 * alpha;
            ctx.shadowColor = p.color;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, p.size * proj.scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1;
        }
        else if (p.type === 'ornament') {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, p.size * proj.scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.beginPath();
            ctx.arc(proj.x - p.size*0.3*proj.scale, proj.y - p.size*0.3*proj.scale, p.size * 0.3 * proj.scale, 0, Math.PI * 2);
            ctx.fill();
        }
        else if (p.type === 'bayinqiao') {
            // Draw enhanced Ba Yin Qiao asset (Static)
            drawBaYinQiao(ctx, proj.x, proj.y, p.size * proj.scale, time, p.rotationPhase || 0);
        }
        else if (p.type === 'star') {
          const pulse = 1 + Math.sin(time * 3) * 0.1;
          const outerRadius = p.size * proj.scale * pulse;
          const innerRadius = outerRadius * 0.4;
          
          ctx.shadowBlur = 50;
          ctx.shadowColor = '#ffff00';
          ctx.fillStyle = 'rgba(255, 220, 100, 0.2)';
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, outerRadius * 1.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowBlur = 20;
          ctx.fillStyle = STAR_COLOR;
          
          const spikes = 5;
          let rot = Math.PI / 2 * 3;
          let cx = proj.x;
          let cy = proj.y;
          let step = Math.PI / spikes;

          ctx.beginPath();
          ctx.moveTo(cx, cy - outerRadius);
          for (let i = 0; i < spikes; i++) {
            cx = proj.x + Math.cos(rot) * outerRadius;
            cy = proj.y + Math.sin(rot) * outerRadius;
            ctx.lineTo(cx, cy);
            rot += step;

            cx = proj.x + Math.cos(rot) * innerRadius;
            cy = proj.y + Math.sin(rot) * innerRadius;
            ctx.lineTo(cx, cy);
            rot += step;
          }
          ctx.lineTo(proj.x, proj.y - outerRadius);
          ctx.closePath();
          ctx.fill();
          
          ctx.shadowBlur = 0;
        }
        else if (p.type === 'gift') {
          const size = p.size * proj.scale;
          const halfSize = size / 2;
          const bob = Math.sin(time * 2 + (p.angleOffset || 0)) * 5 * proj.scale;
          const yPos = proj.y + bob;

          ctx.shadowBlur = 10;
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          ctx.fillStyle = p.color;
          ctx.fillRect(proj.x - halfSize, yPos - halfSize, size, size);
          
          ctx.fillStyle = 'rgba(0,0,0,0.1)';
          ctx.fillRect(proj.x - halfSize, yPos + halfSize - size * 0.1, size, size * 0.1);

          ctx.fillStyle = '#ffffff';
          const ribbonWidth = size * 0.25;
          ctx.fillRect(proj.x - ribbonWidth/2, yPos - halfSize, ribbonWidth, size);
          ctx.fillRect(proj.x - halfSize, yPos - ribbonWidth/2, size, ribbonWidth);
          
          ctx.shadowBlur = 5;
          ctx.shadowColor = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(proj.x - ribbonWidth, yPos - halfSize, ribbonWidth, ribbonWidth*0.8, -0.5, 0, Math.PI * 2);
          ctx.ellipse(proj.x + ribbonWidth, yPos - halfSize, ribbonWidth, ribbonWidth*0.8, 0.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowBlur = 0;
        } 
        else if (p.type === 'snow') {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, p.size * proj.scale, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.globalAlpha = 1;
      }
    });

    requestRef.current = requestAnimationFrame(animate);
  }, [project]);

  // Handle Canvas Click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const time = Date.now() * 0.001;
    const currentRotation = time * 0.25;

    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      
      // Check for Gift clicks
      if (p.type === 'gift' && p.giftId) {
        const proj = project(p, canvas.width, canvas.height, currentRotation);
        const bob = Math.sin(time * 2 + (p.angleOffset || 0)) * 5 * proj.scale;
        const yPos = proj.y + bob;
        const size = p.size * proj.scale;
        const hitRadius = size * 0.8;
        
        const dx = clickX - proj.x;
        const dy = clickY - yPos;
        
        if (Math.abs(dx) < hitRadius && Math.abs(dy) < hitRadius) {
          const gift = GIFTS.find(g => g.id === p.giftId);
          if (gift) {
            onGiftClick(gift);
            return; 
          }
        }
      }
      
      // Check for Ba Yin Qiao clicks
      if (p.type === 'bayinqiao') {
          const proj = project(p, canvas.width, canvas.height, currentRotation);
          const size = p.size * proj.scale;
          const dx = clickX - proj.x;
          const dy = clickY - proj.y;
          // Simple visual feedback for now in console
          if (dx*dx + dy*dy < size*size) {
              console.log("Touched Ba Yin Qiao");
          }
      }
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(requestRef.current);
    };
  }, [initParticles, animate]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full cursor-pointer touch-none"
      onClick={handleCanvasClick}
      style={{ touchAction: 'none' }} 
    />
  );
};

export default TreeCanvas;