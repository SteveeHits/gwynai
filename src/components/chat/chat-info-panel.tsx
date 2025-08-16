
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Battery, Plug, Clock, Calendar } from 'lucide-react';

export function ChatInfoPanel() {
  const [batteryStatus, setBatteryStatus] = useState<{ level: number | null; charging: boolean | null }>({ level: null, charging: null });
  const [dateTime, setDateTime] = useState<Date | null>(null);

  useEffect(() => {
    // This effect runs only on the client
    setDateTime(new Date());
    const timer = setInterval(() => setDateTime(new Date()), 60000); // Update every minute

    let battery: any;
    const updateBatteryStatus = async () => {
      try {
        if ('getBattery' in navigator) {
          battery = await (navigator as any).getBattery();
          const update = () => {
            setBatteryStatus({
              level: Math.floor(battery.level * 100),
              charging: battery.charging,
            });
          };
          update();
          battery.addEventListener('levelchange', update);
          battery.addEventListener('chargingchange', update);
        } else {
            setBatteryStatus({ level: null, charging: null });
        }
      } catch (error) {
        console.error('Battery status not available:', error);
        setBatteryStatus({ level: null, charging: null });
      }
    };

    updateBatteryStatus();

    return () => {
      clearInterval(timer);
      if (battery) {
        battery.removeEventListener('levelchange', () => {});
        battery.removeEventListener('chargingchange', () => {});
      }
    };
  }, []);

  return (
    <Card className="bg-muted/50">
      <CardHeader>
        <CardTitle>Device Info</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <span>{dateTime ? dateTime.toLocaleDateString() : 'Loading...'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <span>{dateTime ? dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Loading...'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Battery className="h-5 w-5 text-primary" />
          <span>{batteryStatus.level !== null ? `${batteryStatus.level}%` : 'N/A'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Plug className="h-5 w-5 text-primary" />
          <span>{batteryStatus.charging !== null ? (batteryStatus.charging ? 'Yes' : 'No') : 'N/A'}</span>
        </div>
      </CardContent>
    </Card>
  );
}
