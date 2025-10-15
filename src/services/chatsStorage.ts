export const CHAT_DETAILS_PREFIX = 'chatDetails:';

export function getChatDetails(chatId: string): string {
  try {
    return window.localStorage.getItem(CHAT_DETAILS_PREFIX + chatId) || '';
  } catch {
    return '';
  }
}

export function setChatDetails(chatId: string, details: string): void {
  try {
    window.localStorage.setItem(CHAT_DETAILS_PREFIX + chatId, details);
  } catch {}
}

export function removeChatDetails(chatId: string): void {
  try {
    window.localStorage.removeItem(CHAT_DETAILS_PREFIX + chatId);
  } catch {}
}


