import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Circle, Trash2, X } from 'lucide-react';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { EmptyState, Skeleton } from '../ui/Feedback.jsx';
import {
  useClearReadNotificationsMutation,
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '../../store/api/nexusApi.js';
import { toggleNotifications } from '../../store/uiSlice.js';
import { cn, relativeTime, severityTone } from '../../lib/utils.js';

export function NotificationsPanel() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const open = useSelector((state) => state.ui.notificationsOpen);
  const { data, isLoading } = useGetNotificationsQuery(
    { limit: 12 },
    { skip: !open, pollingInterval: open ? 20_000 : 0 }
  );
  const [markRead] = useMarkNotificationReadMutation();
  const [markAll, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation();
  const [clearRead, { isLoading: clearing }] = useClearReadNotificationsMutation();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === 'Escape' && dispatch(toggleNotifications(false));
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dispatch, open]);

  if (!open) return null;

  const notifications = data?.data ?? [];

  const openNotification = async (notification) => {
    if (!notification.readAt) await markRead(notification.id);
    dispatch(toggleNotifications(false));
    if (notification.link) navigate(notification.link);
  };

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-[1px]"
        onClick={() => dispatch(toggleNotifications(false))}
        aria-hidden
      />
      <aside className="animate-in absolute inset-y-0 right-0 flex w-full max-w-[400px] flex-col border-l border-line/70 bg-white shadow-float">
        <div className="flex items-start justify-between gap-3 border-b border-line/70 px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-bold text-ink">Notifications</h2>
              {(data?.unread ?? 0) > 0 && <Badge tone="flame">{data.unread} unread</Badge>}
            </div>
            <p className="mt-0.5 text-[11.5px] text-muted">
              Alerts, rule events and workspace activity.
            </p>
          </div>
          <button
            type="button"
            onClick={() => dispatch(toggleNotifications(false))}
            className="cursor-pointer rounded-lg p-1.5 text-muted transition hover:bg-cloud hover:text-ink"
            aria-label="Close notifications"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 border-b border-line/60 bg-cloud/50 px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            icon={CheckCheck}
            loading={markingAll}
            onClick={() => markAll()}
            disabled={!data?.unread}
          >
            Mark all read
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            loading={clearing}
            onClick={() => clearRead()}
            className="text-muted"
          >
            Clear read
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex gap-3 rounded-xl border border-line/60 p-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No notifications yet"
              description="When rules fire or devices change state, you'll see it here."
            />
          ) : (
            <div className="divide-y divide-line/60">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => openNotification(notification)}
                  className={cn(
                    'flex w-full cursor-pointer items-start gap-3 px-4 py-3.5 text-left transition hover:bg-cream/70',
                    !notification.readAt && 'bg-flame/[0.045]'
                  )}
                >
                  <span
                    className={cn(
                      'mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                      notification.severity === 'critical'
                        ? 'bg-danger/10 text-danger'
                        : notification.severity === 'warning'
                          ? 'bg-gold/15 text-[#8a6400]'
                          : 'bg-info/10 text-info'
                    )}
                  >
                    <Bell className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      {!notification.readAt && (
                        <Circle className="h-1.5 w-1.5 fill-flame text-flame" />
                      )}
                      <span className="truncate text-[12px] font-bold text-ink">
                        {notification.title}
                      </span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-[11px] leading-relaxed text-muted">
                      {notification.message}
                    </span>
                    <span className="mt-1.5 flex items-center gap-2">
                      <Badge
                        tone={severityTone(notification.severity)}
                        className="px-1.5 py-0.5 text-[9px]"
                      >
                        {notification.severity}
                      </Badge>
                      <span className="text-[9.5px] text-muted">
                        {relativeTime(notification.createdAt)}
                      </span>
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
