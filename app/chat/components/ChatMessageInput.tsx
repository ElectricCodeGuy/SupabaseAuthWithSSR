import type { KeyboardEvent } from 'react';
import React, { useState, useRef } from 'react';
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
import type { useChat } from '@ai-sdk/react';
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

// FilePreview component remains the same
const FilePreview = React.memo(
  ({ file, onRemove }: { file: File; onRemove: () => void }) => {
    const [previewUrl, setPreviewUrl] = useState<string>('');

    React.useEffect(() => {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }, [file]);

    return (
      <div className="group/thumbnail relative">
        <div
          className="rounded-lg overflow-hidden border-0.5 border-border-300/25 shadow-sm shadow-always-black/5 can-focus-within rounded-lg cursor-pointer hover:border-border-200/50 hover:shadow-always-black/10"
          style={{ width: 120, height: 120, minWidth: 120, minHeight: 120 }}
        >
          <div
            className="relative bg-bg-000"
            style={{ width: '100%', height: '100%' }}
          >
            {previewUrl && file.type === 'application/pdf' ? (
              <iframe
                src={previewUrl}
                title={`Preview of ${file.name}`}
                className="w-full h-full pointer-events-none"
                style={{
                  transform: 'scale(0.2)',
                  transformOrigin: 'top left',
                  width: '500%',
                  height: '500%'
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                <FileIcon className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>
          <div className="absolute bottom-2 left-0 right-0 px-2.5 overflow-x-hidden overflow-y-visible">
            <div className="relative flex flex-row items-center gap-1 justify-between">
              <div
                className="flex flex-row gap-1 shrink min-w-0"
                style={{ opacity: 1 }}
              >
                <div className="min-w-0 overflow-hidden h-[18px] flex flex-row items-center justify-center gap-0.5 px-1 border-0.5 border-border-300/25 shadow-sm rounded bg-bg-000/70 backdrop-blur-sm font-medium">
                  <p className="uppercase truncate font-styrene text-text-300 text-[11px] leading-[13px] overflow-hidden">
                    pdf
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="transition-all hover:bg-bg-000/50 text-text-500 hover:text-text-200 group-focus-within/thumbnail:opacity-100 group-hover/thumbnail:opacity-100 opacity-0 w-5 h-5 absolute -top-2 -left-2 rounded-full border-0.5 border-border-300/25 bg-bg-000/90 backdrop-blur-sm flex items-center justify-center"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    );
  }
);

FilePreview.displayName = 'FilePreview';

type ChatHelpers = ReturnType<typeof useChat>;

interface MessageInputProps {
  chatId: string;
  selectedOption: string;
  handleOptionChange: (value: string) => void;
  sendMessage: ChatHelpers['sendMessage'];
  status: ChatHelpers['status'];
  stop: ChatHelpers['stop'];
}

const MessageInput: React.FC<MessageInputProps> = ({
  chatId,
  selectedOption,
  handleOptionChange,
  sendMessage,
  status,
  stop
}) => {
  const { selectedBlobs } = useUpload();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [input, setInput] = useState('');
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && event.shiftKey) {
      // Allow newline on Shift + Enter
    } else if (event.key === 'Enter') {
      event.preventDefault();
      handleFormSubmit(event);
    }
  };

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
      toast.error('File is too large (max 3MB)');
      return;
    }

    setAttachedFiles((prev) => [...prev, file]);
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const filesToBase64 = async (files: File[]): Promise<any[]> => {
    const promises = files.map((file) => {
      return new Promise<any>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          resolve({
            type: 'file',
            filename: file.name,
            mediaType: file.type,
            url: base64
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });
    return Promise.all(promises);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && attachedFiles.length === 0) return;

    // REMOVED the router.push logic from here

    // Prepare message parts
    const parts: any[] = [{ type: 'text', text: input }];

    // Add file parts if there are attachments
    if (attachedFiles.length > 0) {
      const fileParts = await filesToBase64(attachedFiles);
      parts.push(...fileParts);
    }

    // Send message
    sendMessage(
      {
        role: 'user',
        parts: parts
      },
      {
        body: {
          chatId: chatId,
          option: selectedOption,
          selectedBlobs: selectedBlobs
        }
      }
    );

    // Clear input and files
    setInput('');
    setAttachedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
            {attachedFiles.length === 0 && (
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
                    { value: 'gpt-5', label: 'GPT-5' },
                    { value: 'gpt-5-mini', label: 'GPT-5 Mini' },
                    { value: 'o3', label: 'OpenAI O3' },
                    {
                      value: 'claude-4-sonnet',
                      label: 'Claude 4.5 Sonnet'
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

          {/* Send button or spinner */}
          {status !== 'ready' && status !== 'error' ? (
            <div
              className="h-8 w-8 sm:h-10 sm:w-10 mr-2 flex items-center justify-center border border-primary/30 cursor-pointer relative group rounded-lg bg-background"
              onClick={stop}
            >
              <div className="flex items-center justify-center transition-opacity group-hover:opacity-0">
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary animate-spin" />
              </div>
              <div className="absolute inset-0 hidden group-hover:flex items-center justify-center">
                <Square size={14} className="text-red-500 sm:h-4 sm:w-4" />
              </div>
            </div>
          ) : (
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              disabled={!input.trim() && attachedFiles.length === 0}
              className="h-8 w-8 sm:h-10 sm:w-10 hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors border border-primary/30 rounded-lg cursor-pointer"
            >
              <Send className="text-primary w-5 h-5 sm:w-8 sm:h-8" />
            </Button>
          )}
        </div>

        {/* File previews section */}
        {attachedFiles.length > 0 && (
          <div className="overflow-hidden border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
            <div className="flex flex-row overflow-x-auto gap-3 px-3.5 py-2.5">
              {attachedFiles.map((file, index) => (
                <FilePreview
                  key={file.name + index}
                  file={file}
                  onRemove={() => removeFile(index)}
                />
              ))}
            </div>
          </div>
        )}
      </form>
    </>
  );
};

export default MessageInput;
