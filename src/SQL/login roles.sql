

-- ************ How to give read/insert right to a table to a non-owner user:

-- Make sure you log into psql as the owner of the tables = sq_core. to find out who own the tables use \dt  psql -h CONNECTION_STRING DBNAME -U OWNER_OF_THE_TABLES
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public to sq_server;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public to sq_server;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public to sq_server;	