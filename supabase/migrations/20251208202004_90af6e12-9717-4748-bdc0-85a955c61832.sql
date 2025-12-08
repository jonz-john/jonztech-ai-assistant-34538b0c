-- Create a table to track AI usage statistics
CREATE TABLE public.ai_usage_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_usage_stats ENABLE ROW LEVEL SECURITY;

-- Only admins (developer mode users) can view all stats
-- Regular users can only see their own
CREATE POLICY "Users can view their own usage stats" 
ON public.ai_usage_stats 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage stats" 
ON public.ai_usage_stats 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create a view for aggregate stats (accessible by service role)
CREATE OR REPLACE VIEW public.usage_summary AS
SELECT 
  COUNT(DISTINCT user_id) as total_users,
  COUNT(*) as total_requests,
  SUM(tokens_used) as total_tokens,
  DATE(created_at) as date
FROM public.ai_usage_stats
GROUP BY DATE(created_at)
ORDER BY date DESC;