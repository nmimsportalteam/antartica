-- Database: antartica

-- DROP DATABASE antartica;

CREATE DATABASE antartica
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'English_India.1252'
    LC_CTYPE = 'English_India.1252'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;
	
	
	
	
-- Table: public.users

-- DROP TABLE public.users;

CREATE TABLE public.users
(
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    first_name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    last_name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    email character varying(100) COLLATE pg_catalog."default" NOT NULL,
    password character varying(255) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email)
)

TABLESPACE pg_default;

ALTER TABLE public.users
    OWNER to postgres;
	
	
	
-- Table: public.employees

-- DROP TABLE public.employees;

CREATE TABLE public.employees
(
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    user_id integer NOT NULL,
    employee_id character varying(20) COLLATE pg_catalog."default" NOT NULL,
    organization_name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT employees_employee_id_key UNIQUE (employee_id),
    CONSTRAINT fk_user FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE public.employees
    OWNER to postgres;
	
	
	
	
	
-- FUNCTION: public.gen_emp_id()

-- DROP FUNCTION public.gen_emp_id();

CREATE OR REPLACE FUNCTION public.gen_emp_id(
	)
    RETURNS character varying
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE
 	emp_id VARCHAR(11);
	emp_int INT;
BEGIN
	SELECT SPLIT_PART(COALESCE((SELECT employee_id FROM employees ORDER BY id DESC LIMIT 1), 'ANT00000000'), 'T', 2) INTO emp_int;
	SELECT CAST(emp_int AS INT) + 1 INTO emp_int;
	SELECT CONCAT('ANT',  lpad(emp_int::text, 8, '0')) INTO emp_id;
	RETURN emp_id;
END;
$BODY$;

ALTER FUNCTION public.gen_emp_id()
    OWNER TO postgres;

	
	
	
-- FUNCTION: public.register_user(character varying, character varying, character varying, character varying, character varying)

-- DROP FUNCTION public.register_user(character varying, character varying, character varying, character varying, character varying);

CREATE OR REPLACE FUNCTION public.register_user(
	first_name character varying,
	last_name character varying,
	email character varying,
	password character varying,
	org_name character varying)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE
   user_id INT;
BEGIN
   INSERT INTO users(first_name, last_name, email, password) VALUES (first_name, last_name, email, password) RETURNING id INTO user_id;
   INSERT INTO employees(user_id, employee_id, organization_name) VALUES (user_id, (SELECT gen_emp_id()), org_name);
   RETURN user_id;
END;
$BODY$;

ALTER FUNCTION public.register_user(character varying, character varying, character varying, character varying, character varying)
    OWNER TO postgres;



-- FUNCTION: public.filter_user_json(integer, integer, character varying, character varying, character varying)

-- DROP FUNCTION public.filter_user_json(integer, integer, character varying, character varying, character varying);

CREATE OR REPLACE FUNCTION public.filter_user_json(
	pagi_limit integer DEFAULT NULL::integer,
	pagi_cursor integer DEFAULT NULL::integer,
	search_text character varying DEFAULT NULL::character varying,
	sort_by character varying DEFAULT NULL::character varying,
	sort_as character varying DEFAULT NULL::character varying)
    RETURNS text
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE
json TEXT;
pagilimit INT;
pagicursor INT;
searchtext VARCHAR(100);
sortby VARCHAR(100);
sortas VARCHAR(100);
max_id INT;
BEGIN

SELECT COALESCE(pagi_limit, 3) INTO pagilimit;
SELECT COALESCE(pagi_cursor, 0) INTO pagicursor;
SELECT COALESCE(REPLACE(search_text, '"', ''), '') INTO searchtext;

IF (sort_by <> '') IS NOT TRUE THEN
SELECT 'id' INTO sortby;
ELSE
SELECT COALESCE(REPLACE(sort_by, '"', ''), 'id') INTO sortby;
END IF;

IF (sort_as <> '') IS NOT TRUE THEN
SELECT 'ASC' INTO sortas;
ELSE
SELECT COALESCE(REPLACE(sort_as, '"', ''), 'ASC') INTO sortas;
END IF;

--RAISE NOTICE 'sort_by is ===>> %, %, %, %, %', pagilimit, pagicursor, searchtext, sortby, sortas;

IF sortby = 'employee_id' OR sortby = 'organization_name' THEN
EXECUTE 'SELECT array_to_json(array_agg(row_to_json(t))) FROM (SELECT u.id, u.first_name, u.last_name, u.email, e.employee_id, e.organization_name FROM users u INNER JOIN employees e ON e.user_id = u.id WHERE (u.first_name ILIKE ''%' || searchtext ||'%'' OR u.last_name ILIKE ''%' || searchtext ||'%'' OR e.employee_id ILIKE ''%' || searchtext ||'%'') AND u.id > '|| pagicursor ||' ORDER BY e.' || sortby ||' '|| sortas || ' LIMIT '|| pagilimit ||') t' INTO json;

ELSE
EXECUTE 'SELECT array_to_json(array_agg(row_to_json(t))) FROM (SELECT u.id, u.first_name, u.last_name, u.email, e.employee_id, e.organization_name FROM users u INNER JOIN employees e ON e.user_id = u.id WHERE (u.first_name ILIKE ''%' || searchtext ||'%'' OR u.last_name ILIKE ''%' || searchtext ||'%'' OR e.employee_id ILIKE ''%' || searchtext ||'%'') AND u.id > '|| pagicursor ||' ORDER BY u.' || sortby ||' '|| sortas || ' LIMIT '|| pagilimit ||') t' INTO json;
END IF;

RETURN json;
END;
$BODY$;

ALTER FUNCTION public.filter_user_json(integer, integer, character varying, character varying, character varying)
    OWNER TO postgres;
