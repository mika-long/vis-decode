import { useMemo } from 'react';
import { useStoreSelector } from '../store';

export function useGetAnswers(tasks: string[]) {
  const answers = useStoreSelector((state) => state.answers);

  const requestedAnswers = useMemo(() => {
    const answerNames = tasks.map((task) => Object.keys(answers).filter((answer) => {
      const splitAnswer = answer.split('_');
      return splitAnswer.slice(0, splitAnswer.length - 1).join('_') === task;
    })).flat();

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
  }, [answers, tasks]);

  return requestedAnswers;
}
