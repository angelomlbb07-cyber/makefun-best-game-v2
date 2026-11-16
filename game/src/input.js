// Keyboard and mouse input: keys held, keys just pressed (edge-triggered),
// digit choices (1/2/3) for the difficulty and boon screens, and the pointer
// position in canvas coordinates.

export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_RESTART = 'restart';
export const ACTION_MUTE = 'mute';

const KEY_ACTIONS = {
  Enter: ACTION_CONFIRM,
  ' ': ACTION_CONFIRM,
  p: ACTION_PAUSE,
  P: ACTION_PAUSE,
  Escape: ACTION_PAUSE,
  r: ACTION_RESTART,
  R: ACTION_RESTART,
  m: ACTION_MUTE,
  M: ACTION_MUTE,
};

export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  const state = {
    held,
    mouseX: 640,
    mouseY: 400,
    mouseDown: false,
    // The digit pressed this frame (0 = none); main clears it each frame.
    choice: 0,
    // True only on the frame the key went down; main clears it each frame.
    wasPressed(action) {
      return pressed.has(action);
    },
    wasChoice(n) {
      return state.choice === n;
    },
    endFrame() {
      pressed.clear();
      state.choice = 0;
    },
  };

  function toCanvas(event) {
    const rect = canvas.getBoundingClientRect();
    state.mouseX = ((event.clientX - rect.left) / rect.width) * 1280;
    state.mouseY = ((event.clientY - rect.top) / rect.height) * 800;
  }

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    held.add(event.key);
    const action = KEY_ACTIONS[event.key];
    if (action) {
      pressed.add(action);
      event.preventDefault();
    }
    if (event.key === '1' || event.key === '2' || event.key === '3') {
      state.choice = Number(event.key);
    }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
    }
  });
  window.addEventListener('keyup', (event) => {
    held.delete(event.key);
  });
  canvas.addEventListener('pointermove', toCanvas);
  canvas.addEventListener('pointerdown', (event) => {
    toCanvas(event);
    state.mouseDown = true;
    pressed.add(ACTION_CONFIRM);
  });
  window.addEventListener('pointerup', () => {
    state.mouseDown = false;
  });
  return state;
}

// Steering vector from held keys (-1..1 on each axis).
export function steerVector(input) {
  let x = 0;
  let y = 0;
  if (input.held.has('ArrowLeft') || input.held.has('a') || input.held.has('A')) x -= 1;
  if (input.held.has('ArrowRight') || input.held.has('d') || input.held.has('D')) x += 1;
  if (input.held.has('ArrowUp') || input.held.has('w') || input.held.has('W')) y -= 1;
  if (input.held.has('ArrowDown') || input.held.has('s') || input.held.has('S')) y += 1;
  return { x, y };
}
