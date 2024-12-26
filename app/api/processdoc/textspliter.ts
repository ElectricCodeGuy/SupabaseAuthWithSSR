import { encodingForModel } from 'js-tiktoken';

export function recursiveTextSplitter(
  text: string,
  chunkSize: number,
  chunkOverlap: number
): string[] {
  const tokenizer = encodingForModel('text-embedding-3-large');
  const separators = ['\n\n', '\n', ' ', ''];

  function splitText(text: string, separators: string[]): string[] {
    const finalChunks: string[] = [];

    let separator = separators[separators.length - 1];
    let newSeparators: string[] | undefined;

    for (let i = 0; i < separators.length; i++) {
      const s = separators[i];
      if (s === '' || text.includes(s)) {
        separator = s;
        newSeparators = separators.slice(i + 1);
        break;
      }
    }

    const splits = text.split(separator);

    let currentChunk: string[] = [];
    let currentChunkLength = 0;

    for (const split of splits) {
      const splitLength = tokenizer.encode(split).length;

      if (currentChunkLength + splitLength <= chunkSize) {
        currentChunk.push(split);
        currentChunkLength += splitLength;
      } else {
        if (currentChunk.length > 0) {
          finalChunks.push(currentChunk.join(separator));
          const overlapChunk = currentChunk.slice(
            -Math.floor(chunkOverlap / separator.length)
          );
          currentChunk = overlapChunk;
          currentChunkLength = tokenizer.encode(
            overlapChunk.join(separator)
          ).length;
        }

        if (splitLength > chunkSize) {
          if (newSeparators) {
            const subSplits = splitText(split, newSeparators);
            finalChunks.push(...subSplits);
          } else {
            finalChunks.push(split);
          }
        } else {
          currentChunk = [split];
          currentChunkLength = splitLength;
        }
      }
    }

    if (currentChunk.length > 0) {
      finalChunks.push(currentChunk.join(separator));
    }

    return finalChunks;
  }

  return splitText(text, separators);
}
