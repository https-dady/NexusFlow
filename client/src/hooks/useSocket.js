import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { connectSocket, disconnectSocket, getSocket } from '../lib/socket.js';
import { getAccessToken } from '../lib/api.js';
import { nexusApi } from '../store/api/nexusApi.js';
import { signedOut } from '../store/authSlice.js';
import { pushToast } from '../store/uiSlice.js';

export function useSocketBridge() {
  const dispatch = useDispatch();
  const status = useSelector((state) => state.auth.status);

  useEffect(() => {
    if (status !== 'authenticated') {
      disconnectSocket();
      return undefined;
    }
    const token = getAccessToken();
    const socket = connectSocket(token);
    if (!socket) return undefined;

    const invalidate = (tags) => dispatch(nexusApi.util.invalidateTags(tags));
    const onConnect = () => {
      invalidate(['Dashboard', 'AlertSummary', 'Notification']);
    };
    const onTelemetry = () => invalidate(['Telemetry']);
    const onDevice = () => invalidate(['Device', 'Dashboard']);
    const onAlert = () => invalidate(['Alert', 'AlertSummary', 'Dashboard']);
    const onNotification = (payload) => {
      invalidate(['Notification']);
      if (payload?.title) {
        dispatch(
          pushToast({
            title: payload.title,
            message: payload.message ?? '',
            tone: 'info',
          })
        );
      }
    };
    const onSimulation = () => invalidate(['Simulation', 'SimulationSummary']);
    const onExpired = () => {
      dispatch(signedOut());
      dispatch(
        pushToast({ title: 'Session expired', message: 'Please sign in again.', tone: 'danger' })
      );
    };

    socket.on('connect', onConnect);
    socket.on('telemetry:new', onTelemetry);
    socket.on('device:status', onDevice);
    socket.on('alert:new', onAlert);
    socket.on('alert:updated', onAlert);
    socket.on('alert:summary:changed', onAlert);
    socket.on('notification:new', onNotification);
    socket.on('simulation:status', onSimulation);
    socket.on('auth:expired', onExpired);

    return () => {
      socket.off('connect', onConnect);
      socket.off('telemetry:new', onTelemetry);
      socket.off('device:status', onDevice);
      socket.off('alert:new', onAlert);
      socket.off('alert:updated', onAlert);
      socket.off('alert:summary:changed', onAlert);
      socket.off('notification:new', onNotification);
      socket.off('simulation:status', onSimulation);
      socket.off('auth:expired', onExpired);
    };
  }, [dispatch, status]);
}

export function useSocketVersion() {
  return getSocket();
}
