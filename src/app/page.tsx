"use client";

import { useMemo, useState } from "react";
import { LiveKitRoom, useVoiceAssistant, BarVisualizer, RoomAudioRenderer, ConnectionState, ConnectionStateToast, VoiceAssistantControlBar } from "@livekit/components-react";
import '@livekit/components-styles';
import { MediaDeviceFailure } from "livekit-client";
import { Button } from "@/components/ui/button";

interface RoomDetails {
  roomName: string;
  token: string;
}


export default function Home() {
  const [roomDetails, setRoomDetails] = useState<RoomDetails | null>(null);
  const [shouldConnect, setShouldConnect] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const userId= useMemo(() => `user-${Math.random().toFixed(5)}`, []);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      setError(null);
      const response = await fetch(`/api/generate-token?userId=${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch token");
      }
      const data: RoomDetails = await response.json();
      setRoomDetails(data);
      setShouldConnect(true);
    } catch (error: any) {
      setError(error.message);
      setShouldConnect(false);
    } finally {
      setIsLoading(false);
    }
  }

  const onDeviceFailure = (e?: MediaDeviceFailure) => {
    console.error("Device failure", e);
    setError("Device failure");
    setShouldConnect(false);
  }  
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#9165e913] to-[#9191df13] flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-muted to-[#988ab319] rounded-2xl shadow-xl p-6 w-full max-w-3xl">
        <h1 className="text-2xl font-bold text-center mb-6 text-primary">
          AI Voice Assistant
        </h1>

        <div className="flex flex-col items-center justify-center">
          {
            !shouldConnect || !roomDetails ? (
              <div className="flex flex-col items-center space-y-4 w-full max-w-xs">
                <p className="text-center text-sm text-muted-foreground">Connect to our AI Voice Assistant for a conversation</p>
                <Button onClick={handleConnect} disabled={isLoading} className="w-full bg-primary disabled:bg-primary/80 text-secondary py-2 rounded-md hover:bg-primary/90">
                  Connect to Voice Assistant
                </Button>
                {error && <p className="text-center text-sm text-red-500">{error}</p>}
              </div>
            ) : (
              <LiveKitRoom
                data-lk-theme="default"
                audio={true}  
                video={false}
                token={roomDetails.token}
                connect={shouldConnect}
                serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_SERVER_URL}
                onMediaDeviceFailure={onDeviceFailure}
                onDisconnected={() => {setShouldConnect(false), setRoomDetails(null)}}
              >
                <ConnectionStatus />
                <VoiceVisualizerWrapper />
                <VoiceAssistantControlBar />
                <RoomAudioRenderer />
                <ConnectionStateToast />
              </LiveKitRoom>
            )
          }
        </div>
      </div>
      
    </div>
  );
}

function VoiceVisualizerWrapper() {
  const {state, audioTrack} = useVoiceAssistant();

  return <div className="flex flex-col items-center justify-center gap-2">
    <BarVisualizer state={state} options={{maxHeight: 40, minHeight: 20}} barCount={7} trackRef={audioTrack} style={{width: "100%", height: "100px", '--lk-bg': 'transparent', '--lk-foreground': 'transparent'} as React.CSSProperties} className="bg-transparent" />
    <p className="text-center text-primary text-sm"> {state === 'speaking' ? 'Agent is speaking...' : 'Listening...'}</p>
  </div>
}

function ConnectionStatus() {
  return <div className="flex flex-col items-center justify-center gap-2 mt-2 font-bold">
    <ConnectionState />
  </div>
}