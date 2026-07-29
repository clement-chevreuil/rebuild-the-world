const History = (() => {
  let stack = [];
  let currentIndex = -1;

  const push = (state) => {
    stack = stack.slice(0, currentIndex + 1);
    stack.push(JSON.parse(JSON.stringify(state)));
    currentIndex++;
  };

  const undo = () => {
    if (canUndo()) {
      currentIndex--;
      return stack[currentIndex];
    }
    return null;
  };

  const redo = () => {
    if (canRedo()) {
      currentIndex++;
      return stack[currentIndex];
    }
    return null;
  };

  const canUndo = () => currentIndex > 0;
  const canRedo = () => currentIndex < stack.length - 1;

  const clear = () => {
    stack = [];
    currentIndex = -1;
  };

  return { push, undo, redo, canUndo, canRedo, clear };
})();
