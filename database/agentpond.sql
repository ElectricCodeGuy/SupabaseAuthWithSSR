-- AgentPond writes trace batches with a server-only Supabase key. No public
-- Storage policies are added: service-role/secret-key access bypasses RLS.
INSERT INTO storage.buckets (id, name, public)
VALUES ('agentpond', 'agentpond', false)
ON CONFLICT (id) DO UPDATE
SET public = false;
