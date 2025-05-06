'use client'

import Image from "next/image";
import {cn} from "@/lib/utils";
import {useRouter} from "next/navigation";
import {useEffect, useState} from "react";
import {vapi} from '@/lib/vapi.sdk';

enum CallStatus {
    INACTIVE = "INACTIVE",
    CONNECTING = "CONNECTING",
    ACTIVE = "ACTIVE",
    FINISHED = "FINISHED",
}

interface SavedMessage {
  role: 'user' | 'system' | 'assistant';
  content: string;
}

const Agent = ({userName, userId, type} : AgentProps) => {
  const router = useRouter();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
      const onCallStart = () => setCallStatus(CallStatus.ACTIVE);
      const onCallEnd = () => setCallStatus(CallStatus.FINISHED);

      const onMessage = (message: Message) => {
          if(message.type === 'transcript' && message.transcriptType === 'final') {
            const newMessage = { role: message.role, content: message.transcript }

            setMessages((prev) => [...prev, newMessage]);
          }
      }

      const onSpeechStart = () => setIsSpeaking(true);
      const onSpeechEnd = () => setIsSpeaking(false);

      const onError = (error: Error) => {
    console.log('Error', error);

    // Check if the error is related to meeting ejection
    if (error.message && (
      error.message.includes('Meeting has ended') ||
      error.message.includes('ejection') ||
      error.message.includes('disconnected')
    )) {
      console.log('Meeting ended unexpectedly');
      setConnectionError('The meeting ended unexpectedly. Please try again.');

      // If the call was active, set it to finished
      if (callStatus === CallStatus.ACTIVE) {
        setCallStatus(CallStatus.FINISHED);
      } else if (callStatus === CallStatus.CONNECTING) {
        // If we were still connecting, go back to inactive state
        setCallStatus(CallStatus.INACTIVE);
      }
    } else {
      setConnectionError('An error occurred with the connection. Please try again.');
      setCallStatus(CallStatus.INACTIVE);
    }
  };

      vapi.on('call-start', onCallStart);
      vapi.on('call-end', onCallEnd);
      vapi.on('message', onMessage);
      vapi.on('speech-start', onSpeechStart);
      vapi.on('speech-end', onSpeechEnd);
      vapi.on('error', onError);

      return() => {
      vapi.off('call-start', onCallStart);
      vapi.off('call-end', onCallEnd);
      vapi.off('message', onMessage);
      vapi.off('speech-start', onSpeechStart);
      vapi.off('speech-end', onSpeechEnd);
      vapi.off('error', onError);
      }
  }, [callStatus])

  useEffect(() => {
      if(callStatus === CallStatus.FINISHED) router.push('/');
  }, [messages, callStatus, type, userId]);

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);
    setConnectionError(null); // Reset any previous connection errors

    try {
      await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!, {
        variableValues: {
          username: userName,
          userId: userId,
        },
      });
    } catch (error) {
      console.error("Vapi.start error:", error);
      setConnectionError('Failed to start the meeting. Please try again.');
      setCallStatus(CallStatus.INACTIVE);
    }
  };

  const handleDisconnect = async () => {
    setCallStatus(CallStatus.FINISHED);

    vapi.stop();
  }

  const latestMessage = messages[messages.length - 1]?.content;
  const isCallInactiveOrFinished = callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED;

  return (
    <>
    <div className="call-view">
      <div className="card-interviewer">
        <div className="avatar">
            <Image src="/ai-avatar.png" alt="vapi" width={65} height={54} className="object-cover" />
            {isSpeaking && <span className="animate-speak"></span>}
        </div>
        <h3>AI Interviewer</h3>
      </div>

      <div className="card-border">

          <div className="card-content">
            <Image src="/user-avatar.png" alt="user avatar" width={540} height={540} className="rounded-full object-cover size-[120px]" />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>
        {messages.length > 0 && (
            <div className="transcript-border">
                <div className="transcript">
                    <p key={latestMessage} className={cn('transition-opacity duration-500 opacity-0', 'animate-fadeIn')}>
                        {latestMessage}
                    </p>
                </div>
            </div>
        )}

      {connectionError && (
        <div className="w-full text-center mb-4 text-red-500">
          {connectionError}
        </div>
      )}

      <div className="w-full flex justify-center">
        {callStatus !== 'ACTIVE' ? (
            <button className="relative btn-call" onClick={handleCall}>
                <span className={cn('absolute animate-ping rounded-full opacity-75', callStatus !== 'CONNECTING' && 'hidden')}/>
                  <span>
                  {isCallInactiveOrFinished ? 'Call' : ' . . . '}
                  </span>
            </button>
        ) : (
            <button className= "btn-disconnect" onClick={handleDisconnect}>
                End
            </button>
        )}
      </div>
      </>
  )
}

export default Agent
