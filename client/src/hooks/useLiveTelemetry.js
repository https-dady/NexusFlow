import { useEffect, useMemo, useRef, useState } from 'react';
import { getSocket } from '../lib/socket.js';
import { useSocketVersion } from './useSocket.js';

export function useLiveTelemetry(deviceIds = []) {
  const socket = useSocketVersion();
  const [latest, setLatest] = useState({});
  const [connected, setConnected] = useState(Boolean(socket?.connected));
  const [lastEventAt, setLastEventAt] = useState(null);
  const subscriptionRef = useRef(new Set());
  const key = useMemo(() => [...deviceIds].filter(Boolean).sort().join(','), [deviceIds]);

  useEffect(() => {
    if (!socket) return undefined;
    const ids = key ? key.split(',') : [];
    const subscribed = subscriptionRef.current;
    const onConnect = () => {
      setConnected(true);
      for (const id of ids) {
        socket.emit('subscribe:device', id);
        subscriptionRef.current.add(id);
      }
    };
    const onDisconnect = () => setConnected(false);
    const onTelemetry = (payload) => {
      if (!payload?.deviceId) return;
      if (ids.length && !ids.includes(payload.deviceId)) return;
      setLatest((previous) => ({ ...previous, [payload.deviceId]: payload }));
      setLastEventAt(new Date());
    };

    if (socket.connected) onConnect();
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('telemetry:new', onTelemetry);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('telemetry:new', onTelemetry);
      for (const id of subscribed) socket.emit('unsubscribe:device', id);
      subscribed.clear();
    };
  }, [key, socket]);

  return { latest, connected, lastEventAt };
}

export function useSocketStatus() {
  const socket = getSocket();
  const [connected, setConnected] = useState(Boolean(socket?.connected));
  useEffect(() => {
    if (!socket) return undefined;
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    setConnected(socket.connected);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [socket]);
  return connected;
}
