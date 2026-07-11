import { getNotifications, markAllNotificationsAsRead } from "../dashboard/dashboardService.js";

const TRIGGER_SELECTOR = ".notification-trigger";
const BADGE_SELECTOR = ".notification-badge";
const BODY_SELECTOR = ".notification-body";
const EMPTY_SELECTOR = ".notification-empty";
const COUNT_SELECTOR = ".notification-count";

const ICONS = {
  login: "\u{1F510}",
  logout: "\u{1F6AA}",
  signup: "\u{1F389}",
  profile_updated: "\u{1F464}",
  password_changed: "\u{1F511}",
};

let isInitialised = false;

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return "";

  let date;
  if (typeof timestamp.toDate === "function") {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === "string") {
    date = new Date(timestamp);
  } else if (typeof timestamp?.seconds === "number") {
    date = new Date(timestamp.seconds * 1000);
  } else {
    return "";
  }

  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffSec < 10) return "Just now";
  if (diffSec < 60) return `${diffSec} seconds ago`;
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs === 1 ? "" : "s"} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;

  const months = Math.floor(diffDays / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;

  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
};

const getIcon = (type) => ICONS[type] || "\u{1F514}";

const updateBadge = (items) => {
  const badge = document.querySelector(BADGE_SELECTOR);
  if (!badge) return;

  const unread = items.filter((n) => !n.isRead).length;
  badge.textContent = unread;
  badge.hidden = unread === 0;
};

const updateCount = (items) => {
  const el = document.querySelector(COUNT_SELECTOR);
  if (!el) return;

  const unread = items.filter((n) => !n.isRead).length;
  el.textContent = `${unread} new`;
};

const buildNotificationItem = (notification) => {
  const item = document.createElement("div");
  item.className = "notification-item";
  item.setAttribute("role", "menuitem");

  const dot = document.createElement("span");
  dot.className = "notification-dot";
  dot.setAttribute("aria-hidden", "true");
  if (!notification.isRead) {
    dot.classList.add("notification-dot--unread");
  }

  const content = document.createElement("div");
  content.className = "notification-content";

  const text = document.createElement("span");
  text.className = "notification-text";
  text.textContent = `${getIcon(notification.type)} ${notification.title}`;

  const time = document.createElement("span");
  time.className = "notification-time";
  time.textContent = formatRelativeTime(notification.createdAt);

  content.appendChild(text);
  content.appendChild(time);
  item.appendChild(dot);
  item.appendChild(content);

  return item;
};

const renderDropdown = (items) => {
  const body = document.querySelector(BODY_SELECTOR);
  const empty = document.querySelector(EMPTY_SELECTOR);
  if (!body) return;

  body.innerHTML = "";
  updateCount(items);

  if (items.length === 0) {
    if (empty) empty.hidden = false;
    return;
  }

  if (empty) empty.hidden = true;

  items.forEach((n) => {
    body.appendChild(buildNotificationItem(n));
  });
};

const loadNotifications = async () => {
  try {
    const notifications = await getNotifications();
    renderDropdown(notifications);
    updateBadge(notifications);
  } catch (error) {
    console.error("DashboardNotification: load failed", error.message);
    renderDropdown([]);
    updateBadge([]);
  }
};

const handleBellClick = async () => {
  const body = document.querySelector(BODY_SELECTOR);
  if (!body || body.children.length === 0) return;

  try {
    await markAllNotificationsAsRead();
  } catch (error) {
    console.error("DashboardNotification: markAllAsRead failed", error.message);
    return;
  }

  await loadNotifications();
};

const initDashboardNotification = () => {
  if (isInitialised) return;
  isInitialised = true;

  loadNotifications();

  const trigger = document.querySelector(TRIGGER_SELECTOR);
  if (trigger) {
    trigger.addEventListener("click", handleBellClick);
  }
};

export { initDashboardNotification };
