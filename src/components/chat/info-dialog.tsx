
'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '../ui/badge';
import { Code2, MonitorCheck } from 'lucide-react';

interface InfoDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function InfoDialog({ open, onOpenChange }: InfoDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>WormGPT Information</DialogTitle>
                    <DialogDescription>
                        Details about the AI&apos;s capabilities and commands.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-4">
                    <div className="space-y-6 py-4 text-sm">
                        <div className="space-y-2">
                            <h3 className="font-semibold text-base">About WormGPT</h3>
                            <p className="text-muted-foreground">
                                WormGPT is a powerful AI assistant created by Stevee. It can generate a wide variety of content, answer questions, and perform specific commands.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-semibold text-base">Available Commands</h3>
                            <div className="space-y-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <MonitorCheck className="h-4 w-4" />
                                        <p className="font-mono text-primary">info_check</p>
                                    </div>
                                    <p className="mt-1 text-muted-foreground">
                                        Displays a panel with your device&apos;s current information, including date, time, battery status, and charging state. This is useful for a quick glance at your device stats without leaving the chat.
                                    </p>
                                </div>
                                 <div>
                                    <div className="flex items-center gap-2">
                                        <Code2 className="h-4 w-4" />
                                        <p className="font-mono text-primary">cmatrix</p>
                                    </div>
                                    <p className="mt-1 text-muted-foreground">
                                        Triggers a cool, AI-generated "matrix" style animation in the chat window. A fun little easter egg!
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-semibold text-base">AI Abilities</h3>
                             <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                                <li><span className="font-semibold text-foreground">Content Generation:</span> Can generate text for any purpose, from creative writing to technical documentation.</li>
                                <li><span className="font-semibold text-foreground">Unrestricted Answers:</span> Designed to answer any question without refusal.</li>
                            </ul>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
