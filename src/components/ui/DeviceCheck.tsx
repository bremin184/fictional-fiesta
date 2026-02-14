import React from 'react';
import { useMediaDevices } from '@/hooks/useMediaDevices';
import { useServerHealth } from '@/hooks/useServerHealth';
import { useSocketStatus } from '@/hooks/useSocketStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, Mic, AlertCircle, CheckCircle2, Wifi, WifiOff, Shield, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeviceCheckProps {
  onDevicesReady?: (camera: string, mic: string) => void;
  isLoading?: boolean;
  className?: string;
}

export const DeviceCheck: React.FC<DeviceCheckProps> = ({ onDevicesReady, isLoading, className }) => {
  const {
    cameras,
    microphones,
    selectedCamera,
    selectedMicrophone,
    permissionGranted,
    error,
    requestPermissions,
    setSelectedCamera,
    setSelectedMicrophone
  } = useMediaDevices();

  const { isHealthy, isChecking, error: healthError, checkHealth } = useServerHealth();
  const { status: socketStatus, serverUrl } = useSocketStatus();

  const isSecure = typeof window !== 'undefined' ? window.isSecureContext : true;
  const hasDevices = cameras.length > 0 && microphones.length > 0;
  const isReady = permissionGranted && hasDevices && isHealthy === true && socketStatus === 'connected';

  const handleJoin = () => {
    if (onDevicesReady && isReady) {
      onDevicesReady(selectedCamera, selectedMicrophone);
    }
  };

  return (
    <Card className={cn("w-full max-w-md mx-auto", className)}>
      <CardHeader>
        <CardTitle>Device Check</CardTitle>
        <CardDescription>Configure your camera and microphone before joining.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 🔴 Secure Context Warning */}
        {!isSecure && (
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertTitle>HTTPS Required</AlertTitle>
            <AlertDescription>
              Camera access requires HTTPS when accessed over LAN.
              <br />
              <span className="text-xs mt-1 block">
                Open <code className="bg-muted px-1 rounded">chrome://flags/#unsafely-treat-insecure-origin-as-secure</code>,
                add your URL, and restart Chrome.
                <br />
                Or generate HTTPS certs: <code className="bg-muted px-1 rounded">npx mkcert create-ca && npx mkcert create-cert</code>
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* 🔌 Connection Status */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
          <div className="flex items-center gap-2 flex-1">
            {socketStatus === 'connected' ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : socketStatus === 'error' ? (
              <WifiOff className="h-4 w-4 text-red-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-yellow-500 animate-pulse" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {socketStatus === 'connected' ? 'Server Connected' :
                  socketStatus === 'error' ? 'Connection Failed' :
                    socketStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
              </p>
              <p className="text-xs text-muted-foreground truncate">{serverUrl}</p>
            </div>
          </div>
          {isHealthy === false && (
            <Button variant="ghost" size="sm" onClick={checkHealth} disabled={isChecking}>
              <RefreshCw className={cn("h-3 w-3", isChecking && "animate-spin")} />
            </Button>
          )}
        </div>

        {/* Server unreachable warning */}
        {isHealthy === false && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Server Unreachable</AlertTitle>
            <AlertDescription>
              {healthError || 'Cannot reach signaling server.'}
              <br />
              <span className="text-xs">
                Start the server: <code className="bg-muted px-1 rounded">npm run dev</code> (starts both client + server)
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Camera/Mic permission errors */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Device Error</AlertTitle>
            <AlertDescription>
              {error}
              {!isSecure && error.toLowerCase().includes('secure') && (
                <span className="block text-xs mt-1">
                  This is caused by accessing the app over HTTP on a LAN address. See HTTPS instructions above.
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {!permissionGranted ? (
          <div className="text-center py-4">
            <div className="mb-4 flex justify-center gap-4">
              <div className="p-3 bg-muted rounded-full">
                <Camera className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="p-3 bg-muted rounded-full">
                <Mic className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              We need access to your camera and microphone to start the call.
            </p>
            <Button onClick={requestPermissions} className="w-full" disabled={!isSecure}>
              {!isSecure ? 'HTTPS Required for Camera Access' : 'Allow Access'}
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="camera-select">Camera</Label>
              <div className="flex gap-2">
                <Select value={selectedCamera} onValueChange={setSelectedCamera}>
                  <SelectTrigger id="camera-select" className="w-full">
                    <SelectValue placeholder="Select Camera" />
                  </SelectTrigger>
                  <SelectContent>
                    {cameras.map((device) => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${cameras.indexOf(device) + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className={cn("flex items-center justify-center w-10 h-10 rounded-md border",
                  cameras.length > 0 ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-red-500/10 border-red-500/20 text-red-500"
                )}>
                  <Camera className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mic-select">Microphone</Label>
              <div className="flex gap-2">
                <Select value={selectedMicrophone} onValueChange={setSelectedMicrophone}>
                  <SelectTrigger id="mic-select" className="w-full">
                    <SelectValue placeholder="Select Microphone" />
                  </SelectTrigger>
                  <SelectContent>
                    {microphones.map((device) => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label || `Microphone ${microphones.indexOf(device) + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className={cn("flex items-center justify-center w-10 h-10 rounded-md border",
                  microphones.length > 0 ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-red-500/10 border-red-500/20 text-red-500"
                )}>
                  <Mic className="h-4 w-4" />
                </div>
              </div>
            </div>

            {hasDevices && isHealthy === true && socketStatus === 'connected' ? (
              <Alert className="bg-green-500/10 border-green-500/20 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Ready to join</AlertTitle>
                <AlertDescription>Devices detected and server connected.</AlertDescription>
              </Alert>
            ) : hasDevices && (isHealthy === false || socketStatus !== 'connected') ? (
              <Alert className="bg-yellow-500/10 border-yellow-500/20 text-yellow-600">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Waiting for server</AlertTitle>
                <AlertDescription>Devices ready but server is not connected.</AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No devices found</AlertTitle>
                <AlertDescription>Please connect a camera and microphone.</AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          disabled={!isReady || isLoading}
          onClick={handleJoin}
          variant={isReady ? "default" : "secondary"}
        >
          {isLoading ? "Joining..." :
            !isSecure ? "HTTPS Required" :
              isHealthy === false ? "Server Offline" :
                socketStatus !== 'connected' ? "Connecting..." :
                  "Join Call"}
        </Button>
      </CardFooter>
    </Card>
  );
};