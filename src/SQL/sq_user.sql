CREATE TABLE public.sq_user
(
    id integer NOT NULL,
    username text COLLATE pg_catalog."default",
    password text COLLATE pg_catalog."default",
    title text COLLATE pg_catalog."default",
    firstname text COLLATE pg_catalog."default",
    lastname text COLLATE pg_catalog."default",
    email text COLLATE pg_catalog."default",
    CONSTRAINT sq_user_pkey PRIMARY KEY (id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.sq_user
    OWNER to sq_core;

-- **********************************

INSERT INTO public.sq_user(
	id, username, password, title, firstname, lastname, email) VALUES 
	(1, 'sa','sa','','sa','sa',NULL),
	(2, 'SqExperiment','SqExperiment','','SQ','Experiment',NULL),
	(3, 'SqBacktester','SqBacktester','','SQ','Backtester',NULL),
	(4, 'SqVbroker','SqVbroker','','SQ','VBroker',NULL),
	(5, 'SqServer','SqServer','','SQ','Server',NULL),
	(6, 'SqWebserver','SqWebserver','','SQ','WebServer',NULL),
	(21, 'AllUser','','','All','User',NULL),
	(22, 'test','test','','Test','Test',NULL),
	(23, 'gyantal','gyantal','Dr.','George','Antal','gyantal@gmail.com'),
	(24, 'drcharmat','rapeto','','Didier','Charmat','drcharmat@gmail.com'),
	(25, 'blukucz','blukucz','','Balazs','Lukucz','blukucz@gmail.com'),
	(26, 'lnemeth','lnemeth','','Laszlo','Nemeth','laszlo.nemeth.hu@gmail.com');


