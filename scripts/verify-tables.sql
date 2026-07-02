SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('platform_pix_keys', 'pending_tips', 'artists') ORDER BY table_name;
