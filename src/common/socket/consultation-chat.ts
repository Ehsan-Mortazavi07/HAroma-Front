'use client';

import { io, type Socket } from 'socket.io-client';
import { BASE_API_URL } from '@/common/constants/URL';

export type ConsultationSocketAck<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type ConsultationSocket = Socket;

export function connectConsultationSocket(sessionToken?: string): ConsultationSocket {
  const apiOrigin = new URL(BASE_API_URL, window.location.origin).origin;
  return io(`${apiOrigin}/consultation-chat`, {
    transports: ['websocket'],
    upgrade: false,
    withCredentials: true,
    auth: sessionToken ? { sessionToken } : {},
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 10_000,
    timeout: 10_000,
  });
}

export function emitConsultationSocket<T>(
  socket: ConsultationSocket,
  event: string,
  payload: unknown,
): Promise<T> {
  if (!socket.connected) return Promise.reject(new Error('اتصال چت برقرار نیست؛ کمی صبر کن و دوباره تلاش کن.'));

  return new Promise((resolve, reject) => {
    socket.timeout(10_000).emit(
      event,
      payload,
      (timeoutError: Error | null, response: ConsultationSocketAck<T>) => {
        if (timeoutError) {
          reject(new Error('پاسخی از سرور دریافت نشد؛ اتصال را بررسی کن و دوباره تلاش کن.'));
          return;
        }
        if (!response || response.ok === false) {
          reject(new Error(response?.ok === false ? response.error : 'درخواست چت انجام نشد.'));
          return;
        }
        resolve(response.data);
      },
    );
  });
}
