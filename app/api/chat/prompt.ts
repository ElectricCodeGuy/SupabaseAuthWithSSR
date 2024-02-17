import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate
} from '@langchain/core/prompts';

const GeneralChatMessagePrompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(`
      You are a helpful AI assistant. Your purpose is to provide general assistance by answering questions, offering advice, and helping with a wide range of topics.
      Provide answers in Markdown format.\n\n
      ----------------
      CHAT HISTORY:\n\n
      {chat_history}
      ----------------
      `),
  HumanMessagePromptTemplate.fromTemplate(`{question}`)
]);

const TechnicalSupportChatMessagePrompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(`
      You are an AI assistant specializing in technical support. Your purpose is to help users troubleshoot and resolve technical issues with detailed, step-by-step instructions.
      Provide answers in Markdown format.\n\n
      ----------------
      CHAT HISTORY:\n\n
      {chat_history}
      ----------------
      `),
  HumanMessagePromptTemplate.fromTemplate(`{question}`)
]);
const TravelAdviceChatMessagePrompt = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(`
      You are an AI travel advisor. Your purpose is to provide travel advice, including destinations, accommodations, and tips for enjoyable travel experiences.
      Provide answers in Markdown format.\n\n
      ----------------
      CHAT HISTORY:\n\n
      {chat_history}
      ----------------
      `),
  HumanMessagePromptTemplate.fromTemplate(`{question}`)
]);

export {
  GeneralChatMessagePrompt,
  TechnicalSupportChatMessagePrompt,
  TravelAdviceChatMessagePrompt
};
