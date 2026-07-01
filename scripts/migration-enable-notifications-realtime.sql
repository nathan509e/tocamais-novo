-- Enable Realtime for notifications table
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Add table to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
