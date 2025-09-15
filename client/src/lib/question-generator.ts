import type { Word } from "@shared/schema";
import type { ExerciseQuestion, ExerciseType } from "@/components/practice-exercise";

// Shuffles an array in place and returns it
function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ===== Question Type Generators =====

function generateMultipleChoiceDefinition(word: Word, distractorWords: Word[]): ExerciseQuestion {
  const questionText = `"${word.word}" 的中文意思是什么？`;
  const correctAnswer = word.chineseDefinition;

  const distractors = distractorWords
    .filter(w => w.id !== word.id && w.chineseDefinition !== correctAnswer)
    .slice(0, 3)
    .map(w => w.chineseDefinition);

  if (distractors.length < 3) {
    throw new Error("Not enough unique words for multiple-choice distractors.");
  }

  const options = shuffle([...distractors, correctAnswer]);

  return {
    id: `${word.id}-mc-def`,
    word,
    type: "multiple-choice",
    question: questionText,
    options,
    correctAnswer,
  };
}

function generateFillBlank(word: Word): ExerciseQuestion | null {
  if (!word.englishExample) return null;
  
  const sentence = word.englishExample.replace(new RegExp(word.word, 'gi'), '____');
  if (!sentence.includes('____')) return null; // Word not found in sentence

  return {
    id: `${word.id}-fill-blank`,
    word,
    type: "fill-blank",
    question: sentence,
    correctAnswer: word.word,
  };
}

function generateTranslation(word: Word): ExerciseQuestion {
  return {
    id: `${word.id}-translation`,
    word,
    type: "translation",
    question: `请翻译：${word.chineseDefinition}`,
    correctAnswer: word.word,
  };
}

function generateSpelling(word: Word): ExerciseQuestion {
    return {
        id: `${word.id}-spelling`,
        word,
        type: "spelling",
        question: "听发音，拼写单词",
        correctAnswer: word.word,
    };
}

function generateListening(word: Word, distractorWords: Word[]): ExerciseQuestion {
    const correctAnswer = word.word;
    const distractors = distractorWords
        .filter(w => w.id !== word.id && w.word !== correctAnswer)
        .slice(0, 3)
        .map(w => w.word);

    if (distractors.length < 3) {
        throw new Error("Not enough unique words for listening distractors.");
    }

    const options = shuffle([...distractors, correctAnswer]);

    return {
        id: `${word.id}-listening`,
        word,
        type: "listening",
        question: "听发音，选择正确的单词",
        options,
        correctAnswer,
    };
}


// ===== Main Exported Function =====

/**
 * Generates a practice question for a given word, selecting a type randomly from allowed types.
 * @param word The word to generate a question for.
 * @param distractorWords A pool of other words to use for generating distractors.
 * @param allowedTypes An array of exercise types to choose from. If not provided, all possible types will be considered.
 * @returns A generated ExerciseQuestion object, or null if no suitable question could be generated.
 */
export function generateQuestion(
  word: Word, 
  distractorWords: Word[], 
  allowedTypes?: ExerciseType[]
): ExerciseQuestion | null {
  let possibleTypes: ExerciseType[] = [];

  // Determine all possible types for this word
  const allPossibleTypes: ExerciseType[] = ["multiple-choice", "translation", "spelling"];
  if (word.englishExample && word.englishExample.toLowerCase().includes(word.word.toLowerCase())) {
    allPossibleTypes.push("fill-blank");
  }
  if (distractorWords.length >= 3) {
    allPossibleTypes.push("listening");
  }

  // Filter by allowed types if provided, otherwise use all possible types
  if (allowedTypes && allowedTypes.length > 0) {
    possibleTypes = allPossibleTypes.filter(type => allowedTypes.includes(type));
  } else {
    possibleTypes = allPossibleTypes;
  }

  if (possibleTypes.length === 0) {
    // No suitable question type can be generated with the given constraints
    return null;
  }

  const type = shuffle(possibleTypes)[0];

  try {
    switch (type) {
      case "multiple-choice":
        return generateMultipleChoiceDefinition(word, distractorWords);
      case "fill-blank":
        return generateFillBlank(word);
      case "translation":
        return generateTranslation(word);
      case "spelling":
        return generateSpelling(word);
      case "listening":
        return generateListening(word, distractorWords);
      default:
        return null;
    }
  } catch (error) {
    console.error(`Failed to generate question of type ${type} for word "${word.word}":`, error);
    // Fallback to a simpler question type if generation fails
    return generateTranslation(word);
  }
}
