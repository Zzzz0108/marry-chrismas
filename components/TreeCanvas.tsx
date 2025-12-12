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
    
    // 0. Trunk (Solid Logic)
    // Instead of a spiral, we create a central spine that we will render as thick blocks
    const trunkHeight = 120;
    const trunkWidth = 50; 
    const trunkStartY = treeTopY + treeHeight - 50; // Overlap slightly with bottom branches
    
    // Create segments for the trunk
    const trunkSegments = 20;
    const segmentHeight = trunkHeight / trunkSegments;

    for (let i = 0; i < trunkSegments; i++) {
         const y = trunkStartY + (i * segmentHeight);
         particles.push({
             x: 0,
             y: y,
             z: 0,
             size: trunkWidth,
             color: '#3e2723', // Darker solid wood color
             type: 'trunk',
             opacity: 1
         });
    }

    // 1. Tree Foliage (Reduced Density)
    const layers = 80; // Reduced from 120 for less clutter
    
    for (let i = 0; i < layers; i++) {
      const progress = i / layers; // 0 (top) to 1 (bottom)
      const y = treeTopY + (progress * treeHeight);
      
      const radius = treeBaseRadius * Math.pow(progress, 0.9);
      // Significantly reduced particle count formula
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

    // 2. Lights (Spiral with varied sizes)
    const coils = 7;
    const pointsPerCoil = 35;
    for (let i = 0; i < coils * pointsPerCoil; i++) {
      const p = i / (coils * pointsPerCoil); // 0 to 1
      const y = treeTopY + (p * treeHeight);
      const radius = treeBaseRadius * p + 8; // Slightly outside foliage
      const angle = p * Math.PI * 2 * coils;

      particles.push({
        x: Math.cos(angle) * radius,
        y: y,
        z: Math.sin(angle) * radius,
        size: Math.random() > 0.7 ? Math.random() * 4 + 5 : Math.random() * 2 + 3, // Some big, some small
        color: LIGHT_COLORS[i % LIGHT_COLORS.length],
        type: 'light',
        opacity: 1,
        blinkOffset: Math.random() * 100
      });
    }

    // 3. Decorations (Ornaments & Extra Stars on tree)
    for (let i = 0; i < 100; i++) {
        const p = Math.random();
        const y = treeTopY + (p * treeHeight);
        const radius = treeBaseRadius * p * 0.9; // Embedded slightly
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

    // 4. Top Star (Significantly larger)
    particles.push({
      x: 0,
      y: treeTopY - 25,
      z: 0,
      size: 45, // Much bigger
      color: STAR_COLOR,
      type: 'star',
      opacity: 1
    });

    // 5. Gift Particles (Larger and positioned carefully)
    GIFTS.forEach((gift, index) => {
      // Position gifts in a nice spiral on the lower half
      const p = 0.6 + (index / GIFTS.length) * 0.35; // 0.6 to 0.95 height
      const y = treeTopY + (p * treeHeight);
      const radius = treeBaseRadius * p + 40; // Stick out well for clicking
      const angle = (index / GIFTS.length) * Math.PI * 2; 

      particles.push({
        x: Math.cos(angle) * radius,
        y: y,
        z: Math.sin(angle) * radius,
        size: 30, // Much larger for interaction
        color: gift.color,
        type: 'gift',
        giftId: gift.id,
        opacity: 1,
        angleOffset: angle,
      });
    });

    // 6. Snow Particles (More dense)
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

    // Perspective Projection
    const fov = 800;
    const viewerDistance = 1100;
    const scale = fov / (fov + viewerDistance + rz);

    const x2d = rx * scale + width / 2;
    const y2d = ry * scale + height / 2; // Centered vertically

    return {
      x: x2d,
      y: y2d,
      scale: scale,
      visible: scale > 0
    };
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
            // Solid trunk rendering
            // Draw a rectangle instead of a circle
            const width = p.size * proj.scale;
            const height = 10 * proj.scale; // Overlap segments
            
            ctx.fillStyle = p.color;
            // Draw main wood block
            ctx.fillRect(proj.x - width/2, proj.y, width, height);
            
            // Add a simple shadow on one side to mimic 3D cylinder
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
            // Make lights pulse instead of disappear completely
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
            // Highlight
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.beginPath();
            ctx.arc(proj.x - p.size*0.3*proj.scale, proj.y - p.size*0.3*proj.scale, p.size * 0.3 * proj.scale, 0, Math.PI * 2);
            ctx.fill();
        }
        else if (p.type === 'star') {
          // Complex Glowing Star Top (Simplified per request)
          const pulse = 1 + Math.sin(time * 3) * 0.1;
          const outerRadius = p.size * proj.scale * pulse;
          const innerRadius = outerRadius * 0.4;
          
          // Glow Back
          ctx.shadowBlur = 50;
          ctx.shadowColor = '#ffff00';
          ctx.fillStyle = 'rgba(255, 220, 100, 0.2)';
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, outerRadius * 1.5, 0, Math.PI * 2);
          ctx.fill();

          // Main Star
          ctx.shadowBlur = 20;
          ctx.fillStyle = STAR_COLOR;
          
          const drawStar = (radOuter: number, radInner: number, rotation: number) => {
             const spikes = 5;
             let rot = rotation;
             let cx = proj.x;
             let cy = proj.y;
             let step = Math.PI / spikes;

             ctx.beginPath();
             ctx.moveTo(cx, cy - radOuter);
             for (let i = 0; i < spikes; i++) {
                cx = proj.x + Math.cos(rot) * radOuter;
                cy = proj.y + Math.sin(rot) * radOuter;
                ctx.lineTo(cx, cy);
                rot += step;

                cx = proj.x + Math.cos(rot) * radInner;
                cy = proj.y + Math.sin(rot) * radInner;
                ctx.lineTo(cx, cy);
                rot += step;
             }
             ctx.lineTo(proj.x, proj.y - radOuter);
             ctx.closePath();
             ctx.fill();
          };

          // Draw main star (upright)
          drawStar(outerRadius, innerRadius, Math.PI / 2 * 3);
          // Removed inner white rotating star
          
          ctx.shadowBlur = 0;
        }
        else if (p.type === 'gift') {
          // Large Gift Box
          const size = p.size * proj.scale;
          const halfSize = size / 2;
          
          // Bobbing animation
          const bob = Math.sin(time * 2 + (p.angleOffset || 0)) * 5 * proj.scale;
          const yPos = proj.y + bob;

          ctx.shadowBlur = 10;
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          
          // Box Base
          ctx.fillStyle = p.color;
          // Simple 3D extrusion effect
          // Front face
          ctx.fillRect(proj.x - halfSize, yPos - halfSize, size, size);
          
          // Lid/Side shadow slightly darker
          ctx.fillStyle = 'rgba(0,0,0,0.1)';
          ctx.fillRect(proj.x - halfSize, yPos + halfSize - size * 0.1, size, size * 0.1);

          // Ribbons
          ctx.fillStyle = '#ffffff';
          const ribbonWidth = size * 0.25;
          ctx.fillRect(proj.x - ribbonWidth/2, yPos - halfSize, ribbonWidth, size);
          ctx.fillRect(proj.x - halfSize, yPos - ribbonWidth/2, size, ribbonWidth);
          
          // Big Bow
          ctx.shadowBlur = 5;
          ctx.shadowColor = '#ffffff';
          ctx.beginPath();
          // Left loop
          ctx.ellipse(proj.x - ribbonWidth, yPos - halfSize, ribbonWidth, ribbonWidth*0.8, -0.5, 0, Math.PI * 2);
          // Right loop
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

    // Iterate front-to-back logic for correct click handling
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      if (p.type === 'gift' && p.giftId) {
        const proj = project(p, canvas.width, canvas.height, currentRotation);
        
        // Bob calculation needs to match render for accurate click
        const bob = Math.sin(time * 2 + (p.angleOffset || 0)) * 5 * proj.scale;
        const yPos = proj.y + bob;

        const size = p.size * proj.scale;
        const hitRadius = size * 0.8; // Box size roughly
        
        const dx = clickX - proj.x;
        const dy = clickY - yPos;
        
        // Simple box collision approximation
        if (Math.abs(dx) < hitRadius && Math.abs(dy) < hitRadius) {
          const gift = GIFTS.find(g => g.id === p.giftId);
          if (gift) {
            onGiftClick(gift);
            return; 
          }
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