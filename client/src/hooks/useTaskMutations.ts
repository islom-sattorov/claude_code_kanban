import { useBoardStore } from '../store/useBoardStore';
import { ColumnId } from '../../../shared/types';

export function useTaskMutations() {
  const { createTask, moveTask, removeTask, runTask } = useBoardStore();

  return {
    createTask,
    moveTask,
    removeTask,
    runTask,
  };
}
