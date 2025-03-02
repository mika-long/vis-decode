import { useMemo } from 'react';
import { useStoreSelector } from '../store';

export function useGetAnswers(filters: string[]) {
  const answers = useStoreSelector((state) => state.answers);

  const requestedAnswers = useMemo(() => {
    const answerNames = Object.keys(answers).filter((answer) => {
      // Handle case where no filters provided - return all answers
      if (filters.length === 0) {
        return true;
      }

      // Check if any of the provided filters match
      return filters.some((filter) => {
        // Split answer for comparison
        const answerParts = answer.split('_');

        // Case 1: Filter is a complete task base like "task1_test"
        // eslint-disable-next-line prefer-template
        if (filter.includes('_') && answer.startsWith(filter + '_')) {
          return true;
        }

        // Case 2: Filter is just a task number like "task1"
        if (filter.startsWith('task') && answerParts[0] === filter) {
          return true;
        }

        // Case 3: Filter is a test index like "1" (looking for first test in sequence)
        // For this case we check the third segment (index 2)
        if (!Number.isNaN(Number(filter)) && answerParts.length > 2) {
          if (answerParts[3] === filter) {
            return true;
          }
        }

        // Case 4: Exact match
        return answer === filter;
      });
    });

    const newAnswerObj: Record<string, unknown> = {};

    answerNames.forEach((answer) => {
      if (answer) {
        if (Object.keys(answers[answer].answer).length > 0) {
          newAnswerObj[answer] = answers[answer].answer;
        } else {
          newAnswerObj[answer] = null;
        }
      }
    });

    return newAnswerObj;
  }, [answers, filters]);

  return requestedAnswers;
}
