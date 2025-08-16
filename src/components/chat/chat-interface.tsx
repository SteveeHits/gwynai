
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Send, Trash2, Menu, Square, HelpCircle, Paperclip } from 'lucide-react';
import { ChatMessage } from './chat-message';
import { Skeleton } from '../ui/skeleton';
import { Bot } from 'lucide-react';
import type { Message, Conversation } from '@/lib/types';
import { ChatInfoPanel } from './chat-info-panel';
import { useSidebar } from '../ui/sidebar';
import type { getVeniceResponse as getVeniceResponseType, getImageAnalysis as getImageAnalysisType } from '@/app/actions';
import { useSettings } from '@/context/settings-context';
import { InfoDialog } from './info-dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';


interface ChatInterfaceProps {
  conversation: Conversation;
  onMessageAdd: (message: Message, isNew: boolean) => void;
  onMessageUpdate: (messageId: string, newContent: string) => void;
  onConversationClear: (conversationId: string) => void;
  onMessageDelete: (messageId: string) => void;
  getVeniceResponse: typeof getVeniceResponseType;
  getImageAnalysis: typeof getImageAnalysisType;
  lastMessageIsNew: boolean;
}

export function ChatInterface({
  conversation,
  onMessageAdd,
  onMessageUpdate,
  onConversationClear,
  onMessageDelete,
  getVeniceResponse,
  getImageAnalysis,
  lastMessageIsNew
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);
  const [showInfo, setShowInfo] = useState(false);
  const { toggleSidebar } = useSidebar();
  const abortControllerRef = useRef<AbortController | null>(null);
  const { settings } = useSettings();
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaViewportRef.current) {
        scrollAreaViewportRef.current.scrollTop = scrollAreaViewportRef.current.scrollHeight;
    }
  }, [conversation.messages, isLoading, showInfo]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added, but only if user is near the bottom
    if (scrollAreaViewportRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollAreaViewportRef.current;
        const isAtBottom = scrollHeight - scrollTop <= clientHeight + 100;
        if (isAtBottom) {
            scrollAreaViewportRef.current.scrollTop = scrollAreaViewportRef.current.scrollHeight;
        }
    }
  }, [conversation.messages.length > 0 ? conversation.messages[conversation.messages.length - 1].content : null]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const stopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const temporaryId = Date.now().toString() + '-file';
    onMessageAdd({ id: temporaryId, role: 'user', content: `Done. Uploading ${file.name}...` }, true);

    try {
        const reader = new FileReader();
        reader.onload = async (event) => {
            const dataUrl = event.target?.result as string;
            let messageContent = '';

            if (file.type.startsWith('image/')) {
                try {
                    const analysis = await getImageAnalysis(dataUrl);
                    messageContent = `Done. The user uploaded an image named "${file.name}". The content is: ${analysis.description}`;
                } catch (error) {
                    console.error('Image analysis failed:', error);
                    toast({
                        variant: 'destructive',
                        title: 'Image Analysis Failed',
                        description: 'Could not analyze the uploaded image.',
                    });
                    onMessageDelete(temporaryId);
                    return;
                }
            } else if (file.type.startsWith('text/')) {
                   const textContent = atob(dataUrl.split(',')[1]);
                   messageContent = `Done. The user uploaded a file named "${file.name}". The content is:\n\n---\n\n${textContent}`;
            } else {
                   messageContent = `Done. The user uploaded a non-text file named "${file.name}" of type "${file.type}". I cannot read its content.`;
            }
            
            onMessageDelete(temporaryId);
            await handleSubmit(undefined, messageContent);
        };
        reader.onerror = (error) => {
            console.error('Error reading file:', error);
            toast({
                variant: 'destructive',
                title: 'File Read Error',
                description: 'Could not read the selected file.',
            });
            onMessageDelete(temporaryId);
        };

        if (file.type.startsWith('text/')) {
            reader.readAsDataURL(file); // Read as data URL to get base64 for text
        } else {
            reader.readAsDataURL(file); // Also read images as data URL
        }

    } catch (error) {
       console.error('Error processing file:', error);
       toast({
         variant: 'destructive',
         title: 'File Processing Error',
         description: 'An error occurred while processing the file.',
       });
       onMessageDelete(temporaryId);
    } finally {
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
};


  const getDeviceContext = async (): Promise<string> => {
    const now = new Date();
    const time = now.toLocaleTimeString();
    const date = now.toLocaleDateString();
    let batteryContext = 'Battery status not available.';

    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        const level = Math.floor(battery.level * 100);
        const charging = battery.charging ? 'Charging' : 'Not Charging';
        batteryContext = `Battery: ${level}%, Status: ${charging}`;
      } catch (error) {
        console.error('Could not get battery status:', error);
      }
    }

    return `Time: ${time}, Date: ${date}, ${batteryContext}`;
  }


  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>, content?: string) => {
    e?.preventDefault();
    const messageContent = content || input;
    if (!messageContent.trim()) return;

    if (isLoading) {
      stopGenerating();
      return;
    }
  
    // Client-side command handling
    if (messageContent.trim().toLowerCase() === 'info_check') {
        setShowInfo(true);
        setInput('');
        return;
    }

    if (messageContent.trim().toLowerCase() === 'cmatrix') {
        onMessageAdd({ id: Date.now().toString(), role: 'assistant', content: '[CMATRIX]' }, true);
        setInput('');
        return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
    };

    setIsLoading(true);
    setInput('');
    setShowInfo(false);

    const deviceContext = await getDeviceContext();
    const contextMessage: Message = {
      id: Date.now().toString() + '-context',
      role: 'user',
      content: `[DEVICE_CONTEXT]${deviceContext}`,
    };

    if(!content) { // Don't add context if we're submitting from a file
        onMessageAdd(contextMessage, false);
    }
    onMessageAdd(userMessage, true); // Add user's visible message

    // Create an optimistic list of messages to send to the AI
    const messagesForApi = [...conversation.messages, contextMessage, userMessage].filter(m => !content || m.id !== userMessage.id);
    if(content) messagesForApi.push(userMessage);


    await streamResponse(messagesForApi);
  };

  const handleRetryResponse = async () => {
    if (isLoading) return;

    const lastUserMessage = conversation.messages.filter(m => m.role === 'user' && !m.content.startsWith('[')).pop();
    if (!lastUserMessage) return;

    // Find the last user message and the AI response that followed it.
    const lastUserMessageIndex = conversation.messages.findIndex(m => m.id === lastUserMessage.id);
    const messagesToDelete = conversation.messages.slice(lastUserMessageIndex + 1).map(m => m.id);

    // Delete the AI response and any subsequent context messages
    onMessageDelete(messagesToDelete.join(','));

    setIsLoading(true);
    const messagesForApi = conversation.messages.slice(0, lastUserMessageIndex + 1);
    await streamResponse(messagesForApi);
  };

  const handleContinueResponse = async (messageId: string) => {
    if (isLoading) return;
  
    const messageToContinueIndex = conversation.messages.findIndex(m => m.id === messageId);
    const messageToContinue = conversation.messages[messageToContinueIndex];
  
    if (!messageToContinue) return;
  
    setIsLoading(true);
    setShowInfo(false);
  
    const continueMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `[CONTINUE]${messageToContinue.content}`,
    };
  
    // We send all messages up to and including the one being continued, plus the new CONTINUE message.
    const messagesForApi = [...conversation.messages.slice(0, messageToContinueIndex + 1), continueMessage];
  
    // Start streaming, but update the original message
    await streamResponse(messagesForApi, messageId);
  };


  const streamResponse = async (messages: Message[], messageIdToUpdate?: string) => {
    let assistantMessageId = messageIdToUpdate;
    if (!assistantMessageId) {
      assistantMessageId = Date.now().toString() + '-ai';
      onMessageAdd({ id: assistantMessageId, role: 'assistant', content: '' }, true);
    }

    try {
      const stream = await getVeniceResponse(messages);
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = '';
      
      const originalMessage = conversation.messages.find(m => m.id === assistantMessageId);
      const originalContent = originalMessage?.content || '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulatedResponse += chunk;
        onMessageUpdate(assistantMessageId, originalContent + accumulatedResponse);
      }

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        const errorMessage = `Sorry, I am having trouble connecting to the AI. Error: ${error.message}`;
        onMessageUpdate(assistantMessageId!, errorMessage);
      } else {
        const finalContent = conversation.messages.find(m => m.id === assistantMessageId)?.content || '';
        onMessageUpdate(assistantMessageId!, finalContent + ' (Cancelled)');
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const showWelcome = conversation.messages.filter(m => !m.content.startsWith('[CONTEXT]') && !m.content.startsWith('[DEVICE_CONTEXT]')).length === 0;

  return (
    <div className="flex h-full flex-col bg-background">
      <InfoDialog open={isInfoOpen} onOpenChange={setIsInfoOpen} />
       <header className="flex shrink-0 items-center gap-4 border-b border-border px-4 py-3 sm:px-6 z-10">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
            <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight">WormGPT</h1>
        <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsInfoOpen(true)} aria-label="Show AI information">
                <HelpCircle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onConversationClear(conversation.id)} aria-label="Clear conversation messages">
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        {showWelcome ? (
            <div className="h-full flex flex-col items-center justify-center">
                <h2 className="text-3xl font-bold">Welcome User</h2>
            </div>
        ) : (
            <ScrollArea className="h-full" viewportRef={scrollAreaViewportRef}>
                <div className="space-y-6 p-4 md:p-6">
                    {conversation.messages.map((message, index) => (
                    <ChatMessage
                        key={message.id}
                        {...message}
                        onDelete={onMessageDelete}
                        onRetry={handleRetryResponse}
                        onContinue={handleContinueResponse}
                        isLastMessage={index === conversation.messages.length - 1 && lastMessageIsNew}
                        isStreaming={isLoading && index === conversation.messages.length - 1}
                        isLoading={isLoading && index === conversation.messages.length - 1}
                    />
                    ))}
                    {isLoading && conversation.messages[conversation.messages.length -1].role === 'user' && (
                       <ChatMessage id="loading" role="assistant" content="" onDelete={() => {}} onRetry={() => {}} onContinue={() => {}} isLastMessage={true} isStreaming={true} isLoading={true} />
                    )}
                    {showInfo && <ChatInfoPanel />}
                </div>
                <ScrollBar orientation="vertical" />
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        )}
      </main>
      <footer className="shrink-0 border-t border-border p-2 sm:p-4 bg-background">
        <form onSubmit={(e) => handleSubmit(e)} className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
            <Paperclip className="h-4 w-4" />
            <span className="sr-only">Attach file</span>
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            disabled={isLoading}
          />
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder={"Ask Me Anything..."}
            className="flex-1"
            autoComplete="off"
            disabled={isLoading}
          />
          {isLoading ? (
            <Button type="button" variant="outline" size="icon" onClick={stopGenerating} aria-label="Stop generating">
                <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" size="icon" aria-label="Send message" disabled={!input.trim()}>
                <Send className="h-4 w-4" />
            </Button>
          )}
        </form>
      </footer>
    </div>
  );
}

    
