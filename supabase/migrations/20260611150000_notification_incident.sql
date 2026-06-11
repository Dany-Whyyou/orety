-- La migration incidents (20260421120000) envoie des notifications de type
-- 'incident' mais l'enum type_notification ne le contenait pas.
alter type type_notification add value if not exists 'incident';
