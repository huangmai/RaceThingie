
import { Platform, Player, PlatformType, Vector2D } from '../types';
import { 
  GRAVITY, FRICTION, AIR_RESISTANCE, BOUNCE_FORCE, 
  PLAYER_WIDTH, PLAYER_HEIGHT, CANVAS_HEIGHT, JUMP_FORCE 
} from '../constants';

export function checkCollision(p: Player, plat: Platform) {
  return (
    p.pos.x < plat.x + plat.width &&
    p.pos.x + p.width > plat.x &&
    p.pos.y < plat.y + plat.height &&
    p.pos.y + p.height > plat.y
  );
}

export function updatePlayer(
  player: Player, 
  platforms: Platform[], 
  controls: { up: boolean, left: boolean, right: boolean },
  finishLineX: number
): Player {
  const newPlayer = { ...player };

  // Horizontal Movement
  if (controls.left) newPlayer.vel.x -= 0.8;
  if (controls.right) newPlayer.vel.x += 0.8;

  // Friction & Air Resistance
  newPlayer.vel.x *= newPlayer.isJumping ? AIR_RESISTANCE : FRICTION;
  
  // Cap speed
  if (Math.abs(newPlayer.vel.x) > 10) {
    newPlayer.vel.x = Math.sign(newPlayer.vel.x) * 10;
  }

  // Gravity
  newPlayer.vel.y += GRAVITY;

  // Tentative next position
  newPlayer.pos.x += newPlayer.vel.x;
  newPlayer.pos.y += newPlayer.vel.y;

  let onGround = false;

  // Collision Resolution
  for (const plat of platforms) {
    if (checkCollision(newPlayer, plat)) {
      // Horizontal collision
      const overlapX = Math.min(
        newPlayer.pos.x + newPlayer.width - plat.x,
        plat.x + plat.width - newPlayer.pos.x
      );
      const overlapY = Math.min(
        newPlayer.pos.y + newPlayer.height - plat.y,
        plat.y + plat.height - newPlayer.pos.y
      );

      if (overlapX < overlapY) {
        // Resolve horizontal
        if (newPlayer.pos.x + newPlayer.width / 2 < plat.x + plat.width / 2) {
          newPlayer.pos.x = plat.x - newPlayer.width;
        } else {
          newPlayer.pos.x = plat.x + plat.width;
        }
        newPlayer.vel.x = 0;
      } else {
        // Resolve vertical
        if (newPlayer.pos.y + newPlayer.height / 2 < plat.y + plat.height / 2) {
          // Landing
          newPlayer.pos.y = plat.y - newPlayer.height;
          newPlayer.vel.y = 0;
          onGround = true;
          newPlayer.canDoubleJump = true; // Reset double jump on landing

          // Special platform logic
          if (plat.type === PlatformType.BOUNCE) {
            newPlayer.vel.y = BOUNCE_FORCE;
            onGround = false;
          } else if (plat.type === PlatformType.LAVA) {
            newPlayer.pos = { ...newPlayer.lastCheckpointPos };
            newPlayer.vel = { x: 0, y: 0 };
          }
        } else {
          // Hitting head
          newPlayer.pos.y = plat.y + plat.height;
          newPlayer.vel.y = 0;
        }
      }
    }
  }

  newPlayer.isJumping = !onGround;

  // Jumping Logic
  const jumpJustPressed = controls.up && !player.jumpKeyWasDown;
  
  if (jumpJustPressed) {
    if (onGround) {
      // Normal Jump
      newPlayer.vel.y = JUMP_FORCE;
      newPlayer.isJumping = true;
      newPlayer.canDoubleJump = true;
    } else if (newPlayer.canDoubleJump) {
      // Double Jump
      newPlayer.vel.y = JUMP_FORCE; // Standard jump force for second jump
      newPlayer.canDoubleJump = false;
    }
  }

  // Store jump key state for next frame's edge detection
  newPlayer.jumpKeyWasDown = controls.up;

  // Respawn if fell
  if (newPlayer.pos.y > CANVAS_HEIGHT + 500) {
    newPlayer.pos = { ...newPlayer.lastCheckpointPos };
    newPlayer.vel = { x: 0, y: 0 };
    newPlayer.canDoubleJump = true;
  }

  // Update Checkpoint
  if (onGround && newPlayer.pos.x > newPlayer.lastCheckpointPos.x + 400) {
    newPlayer.lastCheckpointPos = { ...newPlayer.pos };
  }

  // Finish condition
  if (newPlayer.pos.x >= finishLineX && !newPlayer.finished) {
    newPlayer.finished = true;
    newPlayer.finishTime = Date.now();
  }

  return newPlayer;
}

export function generateLevel(theme: string, seedParams: any): Platform[] {
  const platforms: Platform[] = [];
  const { gapSize, hazardDensity, platformHeightVariance, levelLength } = seedParams;

  const MAX_REACHABLE_HEIGHT_UP = 120; 
  const MAX_REACHABLE_GAP = 320; 

  // Starting ground
  platforms.push({ x: 0, y: 500, width: 800, height: 100, type: PlatformType.NORMAL });

  let currentX = 800;
  let currentY = 500;

  while (currentX < levelLength) {
    const nextGap = Math.min(MAX_REACHABLE_GAP, Math.random() * gapSize + 80);
    const platWidth = Math.random() * 200 + 150;
    
    const verticalDifficultyFactor = nextGap / MAX_REACHABLE_GAP; 
    const maxUpwardJump = MAX_REACHABLE_HEIGHT_UP * (1 - verticalDifficultyFactor * 0.7);
    
    let heightDiff = (Math.random() - 0.5) * platformHeightVariance;
    
    if (heightDiff < -maxUpwardJump) {
      heightDiff = -maxUpwardJump;
    }

    let nextY = currentY + heightDiff;
    nextY = Math.max(150, Math.min(520, nextY));

    currentX += nextGap;

    let type = PlatformType.NORMAL;
    const r = Math.random();
    
    if (r < hazardDensity * 0.3 && nextGap < MAX_REACHABLE_GAP * 0.8) {
      type = PlatformType.LAVA;
    } else if (r < hazardDensity * 0.6) {
      type = PlatformType.BOUNCE;
    } else if (r < hazardDensity * 0.7) {
      type = PlatformType.ICE;
    }

    platforms.push({
      x: currentX,
      y: nextY,
      width: platWidth,
      height: 40,
      type
    });

    if (type === PlatformType.LAVA) {
      currentX += platWidth + 50;
      platforms.push({
        x: currentX,
        y: nextY,
        width: 150,
        height: 40,
        type: PlatformType.NORMAL
      });
      currentX += 150;
    } else {
      currentX += platWidth;
    }
    
    currentY = nextY;
  }

  // Final finish platform
  platforms.push({ 
    x: levelLength, 
    y: currentY, 
    width: 800, 
    height: 400, 
    type: PlatformType.NORMAL 
  });

  return platforms;
}
