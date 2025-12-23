
import React, { useRef, useEffect } from 'react';
import { Player, Platform, PlatformType } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from '../constants';

interface GameViewProps {
  player1: Player;
  player2: Player;
  platforms: Platform[];
  finishLineX: number;
  theme: string;
}

const GameView: React.FC<GameViewProps> = ({ player1, player2, platforms, finishLineX, theme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const halfWidth = CANVAS_WIDTH / 2;

    const renderViewport = (p: Player, xOffset: number) => {
      ctx.save();
      // Define the viewport clip
      ctx.beginPath();
      ctx.rect(xOffset, 0, halfWidth, CANVAS_HEIGHT);
      ctx.clip();

      // Camera: Center player horizontally in their viewport
      const cameraX = Math.max(0, p.pos.x - halfWidth / 2);

      // Background
      ctx.fillStyle = COLORS.BACKGROUND;
      ctx.fillRect(xOffset, 0, halfWidth, CANVAS_HEIGHT);

      // Parallax Grid
      ctx.save();
      ctx.translate(xOffset - (cameraX * 0.2) % 100, 0);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = -100; x < halfWidth + 100; x += 100) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }
      ctx.restore();

      ctx.save();
      ctx.translate(xOffset - cameraX, 0);

      // Draw Platforms
      platforms.forEach(plat => {
        if (plat.x + plat.width < cameraX || plat.x > cameraX + halfWidth) return;

        switch (plat.type) {
          case PlatformType.BOUNCE: ctx.fillStyle = COLORS.BOUNCE; break;
          case PlatformType.LAVA: ctx.fillStyle = COLORS.LAVA; break;
          case PlatformType.ICE: ctx.fillStyle = COLORS.ICE; break;
          default: ctx.fillStyle = COLORS.PLATFORM;
        }
        
        if (plat.type !== PlatformType.NORMAL) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = ctx.fillStyle as string;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        
        ctx.strokeStyle = 'white';
        ctx.globalAlpha = 0.1;
        ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
      });

      // Finish Line
      if (finishLineX >= cameraX && finishLineX <= cameraX + halfWidth) {
        ctx.fillStyle = COLORS.ACCENT;
        ctx.shadowBlur = 20;
        ctx.shadowColor = COLORS.ACCENT;
        ctx.fillRect(finishLineX, 0, 10, CANVAS_HEIGHT);
        ctx.shadowBlur = 0;
      }

      // Draw Both Players
      const drawCharacter = (target: Player) => {
        ctx.fillStyle = target.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = target.color;
        ctx.fillRect(target.pos.x, target.pos.y, target.width, target.height);
        
        // Eyes
        ctx.fillStyle = 'white';
        const lookDir = target.vel.x >= 0 ? 1 : -1;
        ctx.fillRect(target.pos.x + (lookDir === 1 ? 20 : 5), target.pos.y + 10, 8, 4);

        // Speed trail
        if (Math.abs(target.vel.x) > 5) {
          ctx.globalAlpha = 0.3;
          ctx.fillRect(target.pos.x - target.vel.x * 2, target.pos.y, target.width, target.height);
          ctx.globalAlpha = 1.0;
        }

        // Double jump ready indicator (small particles above head)
        if (target.canDoubleJump && target.isJumping) {
          ctx.fillStyle = 'white';
          ctx.globalAlpha = 0.6;
          ctx.fillRect(target.pos.x + target.width / 2 - 2, target.pos.y - 10, 4, 4);
          ctx.globalAlpha = 1.0;
        }

        ctx.shadowBlur = 0;
      };

      drawCharacter(player1);
      drawCharacter(player2);

      ctx.restore();
      
      // Viewport HUD
      ctx.fillStyle = p.color;
      ctx.font = 'bold 12px Orbitron';
      ctx.textAlign = 'left';
      ctx.fillText(`${p.name.toUpperCase()}: ${Math.floor(p.pos.x)}m`, xOffset + 20, 30);
      
      // Double Jump Indicator in HUD
      if (p.canDoubleJump) {
        ctx.fillStyle = COLORS.ACCENT;
        ctx.fillRect(xOffset + 20, 40, 40, 4);
      }
      
      ctx.restore();
    };

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    renderViewport(player1, 0);
    renderViewport(player2, halfWidth);

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(halfWidth, 0);
    ctx.lineTo(halfWidth, CANVAS_HEIGHT);
    ctx.stroke();

    ctx.fillStyle = COLORS.ACCENT;
    ctx.textAlign = 'center';
    ctx.font = 'bold 10px Orbitron';
    ctx.fillText(`GOAL AT ${finishLineX}m`, CANVAS_WIDTH / 2, 15);

  }, [player1, player2, platforms, finishLineX]);

  return (
    <div className="relative border-4 border-slate-700 rounded-xl overflow-hidden shadow-2xl bg-black">
      <canvas 
        ref={canvasRef} 
        width={CANVAS_WIDTH} 
        height={CANVAS_HEIGHT}
        className="block w-full h-auto"
      />
      <div className="absolute top-0 left-0 w-full flex justify-between px-4 pointer-events-none">
        <div className="pt-2">
            <div className="bg-blue-500/20 text-blue-400 text-[10px] font-orbitron px-2 py-0.5 rounded border border-blue-500/50">CAM 01</div>
        </div>
        <div className="pt-2">
            <div className="bg-pink-500/20 text-pink-400 text-[10px] font-orbitron px-2 py-0.5 rounded border border-pink-500/50">CAM 02</div>
        </div>
      </div>
    </div>
  );
};

export default GameView;
