'use client';

import type { KeyboardEvent } from 'react';
import React, { useState, useRef } from 'react';
import { useChat, type Message } from '@ai-sdk/react';
import { useRouter } from 'next/navigation';
import { useSWRConfig } from 'swr';
import { useUpload } from '../context/uploadContext';
import { toast } from 'sonner';
// Shadcn UI components
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

// Icons from Lucide React
import {
  Send,
  Loader2,
  ChevronDown,
  Paperclip,
  Square,
  X,
  FileIcon
} from 'lucide-react';

const MessageInput = ({
  chatId,
  apiEndpoint,
  currentChat,
  option,
  currentChatId,
  modelType,
  selectedOption,
  handleModelTypeChange,
  handleOptionChange,
  modelTypes
}: {
  chatId: string;
  apiEndpoint: string;
  currentChat: Message[];
  option: string;
  currentChatId: string;
  modelType: string;
  selectedOption: string;
  handleModelTypeChange: (value: string) => void;
  handleOptionChange: (value: string) => void;
  modelTypes: { value: string; label: string }[];
}) => {
  const { selectedBlobs } = useUpload();
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const { input, handleInputChange, handleSubmit, status, stop } = useChat({
    id: 'chat', // Use the same ID to share state
    api: apiEndpoint,
    initialMessages: currentChat,
    body: {
      chatId: chatId,
      option: option,
      selectedBlobs: selectedBlobs
    },
    onFinish: async () => {
      await mutate((key) => Array.isArray(key) && key[0] === 'chatPreviews');
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || 'An error occurred'); // This could lead to sensitive information exposure. A general error message is safer.
    }
  });

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && event.shiftKey) {
      // Allow newline on Shift + Enter
    } else if (event.key === 'Enter') {
      // Prevent default behavior and submit form on Enter only
      event.preventDefault();
      handleFormSubmit(event);
    }
  };

  // Create FileList from files
  function createFileList(files: File[]): FileList {
    const dataTransfer = new DataTransfer();
    files.forEach((file) => dataTransfer.items.add(file));
    return dataTransfer.files;
  }

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('pdf')) {
      toast.error('Only PDF files are allowed');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      // This file limit is here due to Vercel serverless function impose a 4.5 MB limit.
      // A better solution would be to upload the file to a storage service and send the URL.
      // I'm to lazy to implement that right now.
      toast.error('File is too large (max 3MB)');
      return;
    }

    setAttachedFile(file);
  };

  // Handle form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !attachedFile) return;

    if (chatId !== currentChatId) {
      const currentSearchParams = new URLSearchParams(window.location.search);
      let newUrl = `/chat/${chatId}`;

      if (currentSearchParams.toString()) {
        newUrl += `?${currentSearchParams.toString()}`;
      }

      router.push(newUrl, { scroll: false });
    }
    // Handle the submission with experimental attachments
    if (attachedFile) {
      handleSubmit(e, {
        experimental_attachments: createFileList([attachedFile])
      });

      setAttachedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      handleSubmit(e);
    }
  };

  return (
    <>
      <form
        onSubmit={handleFormSubmit}
        className="relative max-w-[720px] mx-auto mb-1 backdrop-blur-sm rounded-2xl overflow-hidden border-1 shadow-sm flex flex-col transition-all duration-200 shadow-md dark:shadow-lg focus-within:shadow-lg dark:focus-within:shadow-xl hover:border-gray-300 dark:hover:border-gray-700 focus-within:border-gray-300 dark:focus-within:border-gray-700 cursor-text"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,application/pdf"
          className="hidden"
        />

        <Textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={status !== 'ready'}
          className="w-full pt-3 pb-1.5 min-h-0 max-h-40 resize-none border-0 shadow-none focus:ring-0 focus-visible:ring-0 focus:outline-none bg-transparent focus:bg-transparent dark:bg-transparent dark:focus:bg-transparent"
          rows={1}
        />

        {/* Bottom controls row with buttons */}
        <div className="flex px-2.5 pb-1 pt-1.5 items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            {!attachedFile && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 cursor-pointer text-xs rounded-md flex items-center gap-1.5 hover:bg-primary/5 dark:hover:bg-primary/10"
                disabled={status !== 'ready'}
              >
                <Paperclip className="h-3.5 w-3.5" />
                <span>Attach file</span>
              </Button>
            )}

            <div className="flex-1 max-w-[160px]">
              <Select value={modelType} onValueChange={handleModelTypeChange}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {modelTypes.map((model) => (
                    <SelectItem
                      key={model.value}
                      value={model.value}
                      className="text-xs"
                    >
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {modelType === 'standart' && (
              <div className="flex-1 ml-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 justify-between text-xs"
                    >
                      <span className="truncate">{selectedOption}</span>
                      <ChevronDown className="h-3 w-3 ml-2 flex-shrink-0 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    {[
                      { value: 'gpt-4.1', label: 'GPT-4.1' },
                      { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
                      { value: 'o3', label: 'OpenAI O3' },
                      {
                        value: 'claude-3.7-sonnet',
                        label: 'Claude 3.7 Sonnet'
                      },
                      { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
                      { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' }
                    ].map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => handleOptionChange(option.value)}
                        className={`text-xs ${
                          selectedOption === option.value
                            ? 'bg-primary/20 dark:bg-primary/30 text-primary dark:text-primary-foreground'
                            : ''
                        }`}
                      >
                        {option.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {attachedFile && (
              <div className="bg-primary/5 dark:bg-primary/10 p-1 rounded-lg flex items-center justify-between">
                <div className="flex items-center">
                  <FileIcon className="h-4 w-4 text-primary mr-2" />
                  <span className="text-sm font-medium dark:text-white">
                    {attachedFile.name}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({Math.round(attachedFile.size / 1024)} KB)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAttachedFile(null)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {selectedBlobs.length > 0 && (
              <div className="hidden sm:flex items-center rounded-full text-xs px-2 h-8 bg-primary/10 border border-primary/30">
                <Paperclip className="mr-1 h-4 w-4 text-primary" />
                <span className="text-primary font-medium">
                  {selectedBlobs.length} file
                  {selectedBlobs.length > 1 ? 's' : ''} attached
                </span>
              </div>
            )}
          </div>

          {/* Send button or spinner with matched sizing */}
          {status !== 'ready' && status !== 'error' ? (
            <div
              className="h-8 w-8 sm:h-10 sm:w-10 mr-2 flex items-center justify-center border border-primary/30 cursor-pointer relative group rounded-lg bg-background"
              onClick={stop}
            >
              {/* Loading indicator (visible by default, hidden on hover) */}
              <div className="flex items-center justify-center transition-opacity group-hover:opacity-0">
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary animate-spin" />
              </div>

              {/* Stop button (hidden by default, visible on hover) */}
              <div className="absolute inset-0 hidden group-hover:flex items-center justify-center">
                <Square size={14} className="text-red-500 sm:h-4 sm:w-4" />
              </div>
            </div>
          ) : (
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              disabled={!input.trim() && !attachedFile}
              className="h-8 w-8 sm:h-10 sm:w-10 hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors border border-primary/30 rounded-lg cursor-pointer"
            >
              <Send className="text-primary w-5 h-5 sm:w-8 sm:h-8" />
            </Button>
          )}
        </div>
      </form>
    </>
  );
};

export default MessageInput;
