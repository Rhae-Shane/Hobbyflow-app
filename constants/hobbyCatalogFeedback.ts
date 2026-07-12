/** Must match server `NO_TAGS_MATCHING_CHIP` / tag-confirm prompt. */
export const NO_TAGS_MATCHING_CHIP = 'No tags matching';

/** Must match server `EMAIL_HOBBY_CATALOG_CHIP` — opens mailto, not a chat answer. */
export const EMAIL_HOBBY_CATALOG_CHIP = 'Email us to add my hobby';

export const HOBBY_CATALOG_FEEDBACK_EMAIL = 'omeshkumar981349978@gmail.com';

export function hobbyCatalogFeedbackMailtoUrl(): string {
  const subject = encodeURIComponent('Hobby not in HobbyFlow catalog');
  const body = encodeURIComponent(
    'Hi,\n\nI could not find matching hobby tags for:\n\n(describe your hobby)\n\nThanks!',
  );
  return `mailto:${HOBBY_CATALOG_FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
}
