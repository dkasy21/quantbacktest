/**
 * Normalizes an email address to prevent multi-account abuse.
  * - Lowercases the entire address
   * - Strips + aliases (user+tag@gmail.com -> user@gmail.com)
    * - Removes dots from Gmail/Googlemail local parts (j.o.h.n@gmail.com -> john@gmail.com)
     */
     export function normalizeEmail(email: string): string {
       const lower = email.toLowerCase().trim();
         const atIndex = lower.lastIndexOf('@');
           if (atIndex === -1) return lower;

             const local = lower.slice(0, atIndex);
               const domain = lower.slice(atIndex + 1);

                 // Strip + alias (works for all providers)
                   const localWithoutAlias = local.split('+')[0];

                     // Remove dots only for Gmail/Googlemail
                       const gmailDomains = new Set(['gmail.com', 'googlemail.com']);
                         const normalizedLocal = gmailDomains.has(domain)
                             ? localWithoutAlias.replace(/\./g, '')
                                 : localWithoutAlias;

                                   return `${normalizedLocal}@${domain}`;
                                   }
