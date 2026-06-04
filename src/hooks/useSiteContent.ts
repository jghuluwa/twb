import { useEffect, useState } from 'react';
import { getContent, subscribe } from '../admin/store';

export function useSiteContent() {
  const [content, setContent] = useState(getContent());
  useEffect(() => subscribe(() => setContent(getContent())), []);
  return content;
}
