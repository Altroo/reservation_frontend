import type { EventChannel } from 'redux-saga';
import { END, eventChannel } from 'redux-saga';
import { WSMaintenanceAction } from '@/store/actions/wsActions';

type WSAction = ReturnType<typeof WSMaintenanceAction>;

let ws: WebSocket;

const WS_MAX_RECONNECT_DELAY_MS = 30000;
const WS_INITIAL_RECONNECT_DELAY_MS = 1000;

export function initWebsocket(token: string): EventChannel<WSAction> {
  return eventChannel<WSAction>((emitter) => {
    let reconnectDelay = WS_INITIAL_RECONNECT_DELAY_MS;

    function createWs() {
      const wsUrl = `${process.env.NEXT_PUBLIC_ROOT_WS_URL}`;
      if (typeof window !== 'undefined') {
        ws = new WebSocket(`${wsUrl}?token=${token}`);
        ws.onopen = () => {
          reconnectDelay = WS_INITIAL_RECONNECT_DELAY_MS;
        };
        ws.onerror = () => {
          // let onclose handle retries
        };
        ws.onmessage = (e: MessageEvent) => {
          try {
            const msg = JSON.parse(e.data);
            if (msg && msg.message && typeof msg.message.type === 'string') {
              const signalType = msg.message.type as string;
              if (signalType === 'MAINTENANCE') {
                const maintenance = Boolean(msg.message.maintenance);
                emitter(WSMaintenanceAction(maintenance));
              }
            }
          } catch {
            // ignore malformed messages
          }
        };
        ws.onclose = (e: CloseEvent) => {
          if (e.code === 4001) {
            emitter(END);
            return;
          }
          setTimeout(() => {
            createWs();
          }, reconnectDelay);
          reconnectDelay = Math.min(reconnectDelay * 2, WS_MAX_RECONNECT_DELAY_MS);
        };
      }
    }

    createWs();
    return () => {
      try {
        ws.close();
      } catch {
        // ignore
      }
    };
  });
}
