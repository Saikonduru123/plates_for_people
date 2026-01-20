--
-- PostgreSQL database dump
--

\restrict Ibijg780M58by9tdlAVdaIXvEFKCOKvBmxtaOcCW39e6fvwzdVlktbOwDsXxgOr

-- Dumped from database version 14.18 (Ubuntu 14.18-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: donationstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.donationstatus AS ENUM (
    'PENDING',
    'CONFIRMED',
    'REJECTED',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public.donationstatus OWNER TO postgres;

--
-- Name: mealtype; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.mealtype AS ENUM (
    'BREAKFAST',
    'LUNCH',
    'DINNER'
);


ALTER TYPE public.mealtype OWNER TO postgres;

--
-- Name: ngoverificationstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.ngoverificationstatus AS ENUM (
    'PENDING',
    'VERIFIED',
    'REJECTED'
);


ALTER TYPE public.ngoverificationstatus OWNER TO postgres;

--
-- Name: userrole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.userrole AS ENUM (
    'DONOR',
    'NGO',
    'ADMIN'
);


ALTER TYPE public.userrole OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    user_id integer,
    user_email character varying(255),
    user_role character varying(50),
    action character varying(100) NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id integer NOT NULL,
    description text NOT NULL,
    changes json,
    ip_address character varying(45),
    user_agent character varying(500),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: donation_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.donation_requests (
    id integer NOT NULL,
    donor_id integer NOT NULL,
    ngo_location_id integer NOT NULL,
    food_type character varying(255) NOT NULL,
    quantity_plates integer NOT NULL,
    meal_type public.mealtype NOT NULL,
    donation_date date NOT NULL,
    pickup_time_start character varying(10) NOT NULL,
    pickup_time_end character varying(10) NOT NULL,
    description text,
    special_instructions text,
    status public.donationstatus NOT NULL,
    confirmed_at timestamp with time zone,
    rejected_at timestamp with time zone,
    rejection_reason text,
    completed_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);


ALTER TABLE public.donation_requests OWNER TO postgres;

--
-- Name: donation_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.donation_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.donation_requests_id_seq OWNER TO postgres;

--
-- Name: donation_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.donation_requests_id_seq OWNED BY public.donation_requests.id;


--
-- Name: donor_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.donor_profiles (
    id integer NOT NULL,
    user_id integer NOT NULL,
    organization_name character varying(255) NOT NULL,
    contact_person character varying(255) NOT NULL,
    phone character varying(20) NOT NULL,
    address_line1 character varying(255) NOT NULL,
    address_line2 character varying(255),
    city character varying(100) NOT NULL,
    state character varying(100) NOT NULL,
    zip_code character varying(20) NOT NULL,
    country character varying(100) NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);


ALTER TABLE public.donor_profiles OWNER TO postgres;

--
-- Name: donor_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.donor_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.donor_profiles_id_seq OWNER TO postgres;

--
-- Name: donor_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.donor_profiles_id_seq OWNED BY public.donor_profiles.id;


--
-- Name: ngo_location_capacity; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ngo_location_capacity (
    id integer NOT NULL,
    location_id integer NOT NULL,
    date date NOT NULL,
    meal_type public.mealtype NOT NULL,
    total_capacity integer NOT NULL,
    current_capacity integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);


ALTER TABLE public.ngo_location_capacity OWNER TO postgres;

--
-- Name: ngo_location_capacity_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ngo_location_capacity_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ngo_location_capacity_id_seq OWNER TO postgres;

--
-- Name: ngo_location_capacity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ngo_location_capacity_id_seq OWNED BY public.ngo_location_capacity.id;


--
-- Name: ngo_locations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ngo_locations (
    id integer NOT NULL,
    ngo_id integer NOT NULL,
    location_name character varying(255) NOT NULL,
    address_line1 character varying(255) NOT NULL,
    address_line2 character varying(255),
    city character varying(100) NOT NULL,
    state character varying(100) NOT NULL,
    zip_code character varying(20) NOT NULL,
    country character varying(100) NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    is_active boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);


ALTER TABLE public.ngo_locations OWNER TO postgres;

--
-- Name: ngo_locations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ngo_locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ngo_locations_id_seq OWNER TO postgres;

--
-- Name: ngo_locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ngo_locations_id_seq OWNED BY public.ngo_locations.id;


--
-- Name: ngo_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ngo_profiles (
    id integer NOT NULL,
    user_id integer NOT NULL,
    organization_name character varying(255) NOT NULL,
    registration_number character varying(100) NOT NULL,
    contact_person character varying(255) NOT NULL,
    phone character varying(20) NOT NULL,
    verification_status public.ngoverificationstatus NOT NULL,
    verification_document_url character varying(500),
    verified_at timestamp with time zone,
    verified_by integer,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone
);


ALTER TABLE public.ngo_profiles OWNER TO postgres;

--
-- Name: ngo_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ngo_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ngo_profiles_id_seq OWNER TO postgres;

--
-- Name: ngo_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ngo_profiles_id_seq OWNED BY public.ngo_profiles.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    notification_type character varying(50) NOT NULL,
    related_entity_type character varying(50),
    related_entity_id integer,
    is_read boolean NOT NULL,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: ratings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ratings (
    id integer NOT NULL,
    donation_id integer NOT NULL,
    donor_id integer NOT NULL,
    ngo_id integer NOT NULL,
    rating integer NOT NULL,
    feedback text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT rating_range CHECK (((rating >= 1) AND (rating <= 5)))
);


ALTER TABLE public.ratings OWNER TO postgres;

--
-- Name: ratings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ratings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ratings_id_seq OWNER TO postgres;

--
-- Name: ratings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ratings_id_seq OWNED BY public.ratings.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role public.userrole NOT NULL,
    is_active boolean NOT NULL,
    is_verified boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
    last_login timestamp with time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: donation_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donation_requests ALTER COLUMN id SET DEFAULT nextval('public.donation_requests_id_seq'::regclass);


--
-- Name: donor_profiles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donor_profiles ALTER COLUMN id SET DEFAULT nextval('public.donor_profiles_id_seq'::regclass);


--
-- Name: ngo_location_capacity id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ngo_location_capacity ALTER COLUMN id SET DEFAULT nextval('public.ngo_location_capacity_id_seq'::regclass);


--
-- Name: ngo_locations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ngo_locations ALTER COLUMN id SET DEFAULT nextval('public.ngo_locations_id_seq'::regclass);


--
-- Name: ngo_profiles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ngo_profiles ALTER COLUMN id SET DEFAULT nextval('public.ngo_profiles_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: ratings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings ALTER COLUMN id SET DEFAULT nextval('public.ratings_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, user_email, user_role, action, entity_type, entity_id, description, changes, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: donation_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.donation_requests (id, donor_id, ngo_location_id, food_type, quantity_plates, meal_type, donation_date, pickup_time_start, pickup_time_end, description, special_instructions, status, confirmed_at, rejected_at, rejection_reason, completed_at, cancelled_at, created_at, updated_at) FROM stdin;
1	1	4	Vegetarian meals	50	LUNCH	2026-01-25	12:00	13:00	Fresh vegetarian meals from our restaurant	Please bring insulated containers	COMPLETED	2026-01-16 12:03:02.102694+05:30	\N	\N	2026-01-16 12:03:02.28927+05:30	\N	2026-01-16 17:33:01.72327+05:30	2026-01-16 17:33:02.279237+05:30
2	1	6	Italian cuisine	30	DINNER	2026-01-26	18:00	19:00	Fresh pasta and pizza	Keep hot	COMPLETED	2026-01-16 12:32:41.017328+05:30	\N	\N	2026-01-16 12:32:41.34218+05:30	\N	2026-01-16 18:02:40.828917+05:30	2026-01-16 18:02:41.336174+05:30
3	1	7	Breakfast items	25	BREAKFAST	2026-01-27	08:00	09:00	Fresh breakfast	Early pickup preferred	COMPLETED	2026-01-16 12:40:36.769869+05:30	\N	\N	2026-01-16 12:40:36.798476+05:30	\N	2026-01-16 18:10:36.66849+05:30	2026-01-16 18:10:36.793043+05:30
4	1	8	Lunch	20	LUNCH	2026-01-28	12:00	13:00	Test donation 1	\N	COMPLETED	2026-01-16 12:40:37.85366+05:30	\N	\N	2026-01-16 12:40:37.880488+05:30	\N	2026-01-16 18:10:37.764257+05:30	2026-01-16 18:10:37.875857+05:30
5	1	9	Lunch	20	LUNCH	2026-01-28	12:00	13:00	Test donation 2	\N	COMPLETED	2026-01-16 12:40:38.080417+05:30	\N	\N	2026-01-16 12:40:38.106822+05:30	\N	2026-01-16 18:10:38.013862+05:30	2026-01-16 18:10:38.100876+05:30
6	1	10	Lunch	20	LUNCH	2026-01-28	12:00	13:00	Test donation 3	\N	COMPLETED	2026-01-16 12:40:38.308367+05:30	\N	\N	2026-01-16 12:40:38.33203+05:30	\N	2026-01-16 18:10:38.241253+05:30	2026-01-16 18:10:38.328266+05:30
7	1	11	idli	50	BREAKFAST	2026-01-28	06:30	09:30	enjoy	enjoy	CONFIRMED	2026-01-17 11:46:50.519868+05:30	\N	\N	\N	\N	2026-01-17 14:38:46.741082+05:30	2026-01-17 17:16:50.504545+05:30
\.


--
-- Data for Name: donor_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.donor_profiles (id, user_id, organization_name, contact_person, phone, address_line1, address_line2, city, state, zip_code, country, latitude, longitude, created_at, updated_at) FROM stdin;
1	1	Updated Food Services Inc	John Doe	+1-555-9999	456 New Street	\N	New York	NY	10001	USA	40.7128	-74.006	2026-01-16 16:41:47.075603+05:30	2026-01-16 16:51:17.496252+05:30
\.


--
-- Data for Name: ngo_location_capacity; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ngo_location_capacity (id, location_id, date, meal_type, total_capacity, current_capacity, created_at, updated_at) FROM stdin;
2	2	2026-01-25	LUNCH	100	100	2026-01-16 17:28:33.037095+05:30	\N
3	3	2026-01-25	LUNCH	100	100	2026-01-16 17:29:57.652798+05:30	\N
4	4	2026-01-25	LUNCH	100	50	2026-01-16 17:33:01.287206+05:30	2026-01-16 17:33:01.72327+05:30
5	6	2026-01-26	DINNER	80	50	2026-01-16 18:02:40.754974+05:30	2026-01-16 18:02:40.828917+05:30
6	7	2026-01-27	BREAKFAST	60	35	2026-01-16 18:10:36.628321+05:30	2026-01-16 18:10:36.66849+05:30
7	8	2026-01-28	LUNCH	50	30	2026-01-16 18:10:37.715128+05:30	2026-01-16 18:10:37.764257+05:30
8	9	2026-01-28	LUNCH	50	30	2026-01-16 18:10:37.990481+05:30	2026-01-16 18:10:38.013862+05:30
9	10	2026-01-28	LUNCH	50	30	2026-01-16 18:10:38.215901+05:30	2026-01-16 18:10:38.241253+05:30
10	11	2026-01-17	BREAKFAST	100	100	2026-01-17 14:37:05.39932+05:30	\N
11	11	2026-01-17	LUNCH	100	100	2026-01-17 14:37:05.39932+05:30	\N
12	11	2026-01-17	DINNER	100	100	2026-01-17 14:37:05.39932+05:30	\N
13	11	2026-01-18	BREAKFAST	100	100	2026-01-17 14:37:05.39932+05:30	\N
14	11	2026-01-18	LUNCH	100	100	2026-01-17 14:37:05.39932+05:30	\N
15	11	2026-01-18	DINNER	100	100	2026-01-17 14:37:05.39932+05:30	\N
16	11	2026-01-19	BREAKFAST	100	100	2026-01-17 14:37:05.39932+05:30	\N
17	11	2026-01-19	LUNCH	100	100	2026-01-17 14:37:05.39932+05:30	\N
18	11	2026-01-19	DINNER	100	100	2026-01-17 14:37:05.39932+05:30	\N
19	11	2026-01-20	BREAKFAST	100	100	2026-01-17 14:37:05.39932+05:30	\N
20	11	2026-01-20	LUNCH	100	100	2026-01-17 14:37:05.39932+05:30	\N
21	11	2026-01-20	DINNER	100	100	2026-01-17 14:37:05.39932+05:30	\N
22	11	2026-01-21	BREAKFAST	100	100	2026-01-17 14:37:05.39932+05:30	\N
23	11	2026-01-21	LUNCH	100	100	2026-01-17 14:37:05.39932+05:30	\N
24	11	2026-01-21	DINNER	100	100	2026-01-17 14:37:05.39932+05:30	\N
25	11	2026-01-22	BREAKFAST	100	100	2026-01-17 14:37:05.39932+05:30	\N
26	11	2026-01-22	LUNCH	100	100	2026-01-17 14:37:05.39932+05:30	\N
27	11	2026-01-22	DINNER	100	100	2026-01-17 14:37:05.39932+05:30	\N
28	11	2026-01-23	BREAKFAST	100	100	2026-01-17 14:37:05.39932+05:30	\N
29	11	2026-01-23	LUNCH	100	100	2026-01-17 14:37:05.39932+05:30	\N
30	11	2026-01-23	DINNER	100	100	2026-01-17 14:37:05.39932+05:30	\N
31	11	2026-01-24	BREAKFAST	100	100	2026-01-17 14:37:05.39932+05:30	\N
32	11	2026-01-24	LUNCH	100	100	2026-01-17 14:37:05.39932+05:30	\N
33	11	2026-01-24	DINNER	100	100	2026-01-17 14:37:05.39932+05:30	\N
34	11	2026-01-25	BREAKFAST	100	100	2026-01-17 14:37:05.39932+05:30	\N
35	11	2026-01-25	LUNCH	100	100	2026-01-17 14:37:05.39932+05:30	\N
36	11	2026-01-25	DINNER	100	100	2026-01-17 14:37:05.39932+05:30	\N
37	11	2026-01-26	BREAKFAST	100	100	2026-01-17 14:37:05.39932+05:30	\N
38	11	2026-01-26	LUNCH	100	100	2026-01-17 14:37:05.39932+05:30	\N
39	11	2026-01-26	DINNER	100	100	2026-01-17 14:37:05.39932+05:30	\N
40	11	2026-01-27	BREAKFAST	100	100	2026-01-17 14:37:05.39932+05:30	\N
41	11	2026-01-27	LUNCH	100	100	2026-01-17 14:37:05.39932+05:30	\N
42	11	2026-01-27	DINNER	100	100	2026-01-17 14:37:05.39932+05:30	\N
44	11	2026-01-28	LUNCH	100	100	2026-01-17 14:37:05.39932+05:30	\N
45	11	2026-01-28	DINNER	100	100	2026-01-17 14:37:05.39932+05:30	\N
46	11	2026-01-29	BREAKFAST	100	100	2026-01-17 14:37:05.39932+05:30	\N
47	11	2026-01-29	LUNCH	100	100	2026-01-17 14:37:05.39932+05:30	\N
48	11	2026-01-29	DINNER	100	100	2026-01-17 14:37:05.39932+05:30	\N
49	11	2026-01-30	BREAKFAST	100	100	2026-01-17 14:37:05.39932+05:30	\N
50	11	2026-01-30	LUNCH	100	100	2026-01-17 14:37:05.39932+05:30	\N
51	11	2026-01-30	DINNER	100	100	2026-01-17 14:37:05.39932+05:30	\N
52	11	2026-01-31	BREAKFAST	100	100	2026-01-17 14:37:05.39932+05:30	\N
53	11	2026-01-31	LUNCH	100	100	2026-01-17 14:37:05.39932+05:30	\N
54	11	2026-01-31	DINNER	100	100	2026-01-17 14:37:05.39932+05:30	\N
55	11	2026-02-01	BREAKFAST	100	100	2026-01-17 14:37:05.39932+05:30	\N
56	11	2026-02-01	LUNCH	100	100	2026-01-17 14:37:05.39932+05:30	\N
57	11	2026-02-01	DINNER	100	100	2026-01-17 14:37:05.39932+05:30	\N
58	11	2026-02-02	BREAKFAST	100	100	2026-01-17 14:37:05.39932+05:30	\N
59	11	2026-02-02	LUNCH	100	100	2026-01-17 14:37:05.39932+05:30	\N
60	11	2026-02-02	DINNER	100	100	2026-01-17 14:37:05.39932+05:30	\N
61	11	2026-02-03	BREAKFAST	100	100	2026-01-17 14:37:05.39932+05:30	\N
62	11	2026-02-03	LUNCH	100	100	2026-01-17 14:37:05.39932+05:30	\N
63	11	2026-02-03	DINNER	100	100	2026-01-17 14:37:05.39932+05:30	\N
64	11	2026-02-04	BREAKFAST	100	100	2026-01-17 14:37:05.39932+05:30	\N
65	11	2026-02-04	LUNCH	100	100	2026-01-17 14:37:05.39932+05:30	\N
66	11	2026-02-04	DINNER	100	100	2026-01-17 14:37:05.39932+05:30	\N
67	11	2026-02-05	BREAKFAST	100	100	2026-01-17 14:37:05.39932+05:30	\N
68	11	2026-02-05	LUNCH	100	100	2026-01-17 14:37:05.39932+05:30	\N
69	11	2026-02-05	DINNER	100	100	2026-01-17 14:37:05.39932+05:30	\N
70	11	2026-02-06	BREAKFAST	100	100	2026-01-17 14:37:05.39932+05:30	\N
71	11	2026-02-06	LUNCH	100	100	2026-01-17 14:37:05.39932+05:30	\N
72	11	2026-02-06	DINNER	100	100	2026-01-17 14:37:05.39932+05:30	\N
73	11	2026-02-07	BREAKFAST	100	100	2026-01-17 14:37:05.39932+05:30	\N
74	11	2026-02-07	LUNCH	100	100	2026-01-17 14:37:05.39932+05:30	\N
75	11	2026-02-07	DINNER	100	100	2026-01-17 14:37:05.39932+05:30	\N
76	11	2026-02-08	BREAKFAST	100	100	2026-01-17 14:37:05.39932+05:30	\N
77	11	2026-02-08	LUNCH	100	100	2026-01-17 14:37:05.39932+05:30	\N
78	11	2026-02-08	DINNER	100	100	2026-01-17 14:37:05.39932+05:30	\N
79	11	2026-02-09	BREAKFAST	100	100	2026-01-17 14:37:05.39932+05:30	\N
80	11	2026-02-09	LUNCH	100	100	2026-01-17 14:37:05.39932+05:30	\N
81	11	2026-02-09	DINNER	100	100	2026-01-17 14:37:05.39932+05:30	\N
82	11	2026-02-10	BREAKFAST	100	100	2026-01-17 14:37:05.39932+05:30	\N
83	11	2026-02-10	LUNCH	100	100	2026-01-17 14:37:05.39932+05:30	\N
84	11	2026-02-10	DINNER	100	100	2026-01-17 14:37:05.39932+05:30	\N
85	11	2026-02-11	BREAKFAST	100	100	2026-01-17 14:37:05.39932+05:30	\N
86	11	2026-02-11	LUNCH	100	100	2026-01-17 14:37:05.39932+05:30	\N
87	11	2026-02-11	DINNER	100	100	2026-01-17 14:37:05.39932+05:30	\N
88	11	2026-02-12	BREAKFAST	100	100	2026-01-17 14:37:05.39932+05:30	\N
89	11	2026-02-12	LUNCH	100	100	2026-01-17 14:37:05.39932+05:30	\N
90	11	2026-02-12	DINNER	100	100	2026-01-17 14:37:05.39932+05:30	\N
91	11	2026-02-13	BREAKFAST	100	100	2026-01-17 14:37:05.39932+05:30	\N
92	11	2026-02-13	LUNCH	100	100	2026-01-17 14:37:05.39932+05:30	\N
93	11	2026-02-13	DINNER	100	100	2026-01-17 14:37:05.39932+05:30	\N
94	11	2026-02-14	BREAKFAST	100	100	2026-01-17 14:37:05.39932+05:30	\N
95	11	2026-02-14	LUNCH	100	100	2026-01-17 14:37:05.39932+05:30	\N
96	11	2026-02-14	DINNER	100	100	2026-01-17 14:37:05.39932+05:30	\N
97	11	2026-02-15	BREAKFAST	100	100	2026-01-17 14:37:05.39932+05:30	\N
98	11	2026-02-15	LUNCH	100	100	2026-01-17 14:37:05.39932+05:30	\N
99	11	2026-02-15	DINNER	100	100	2026-01-17 14:37:05.39932+05:30	\N
43	11	2026-01-28	BREAKFAST	100	50	2026-01-17 14:37:05.39932+05:30	2026-01-17 14:38:46.741082+05:30
\.


--
-- Data for Name: ngo_locations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ngo_locations (id, ngo_id, location_name, address_line1, address_line2, city, state, zip_code, country, latitude, longitude, is_active, created_at, updated_at) FROM stdin;
1	1	Main Distribution Center	100 Main St	Suite 200	New York	NY	10001	USA	40.7128	-74.006	t	2026-01-16 17:25:14.920863+05:30	\N
2	1	Main Distribution Center	100 Main St	Suite 200	New York	NY	10001	USA	40.7128	-74.006	t	2026-01-16 17:28:32.892253+05:30	\N
3	1	Main Distribution Center	100 Main St	Suite 200	New York	NY	10001	USA	40.7128	-74.006	t	2026-01-16 17:29:57.499973+05:30	\N
4	1	Main Distribution Center	100 Main St	Suite 200	New York	NY	10001	USA	40.7128	-74.006	t	2026-01-16 17:33:01.141171+05:30	\N
5	1	Test Notification Center	200 Test St	Floor 3	Boston	MA	02101	USA	42.3601	-71.0589	t	2026-01-16 18:02:12.019122+05:30	\N
6	1	Test Notification Center	200 Test St	Floor 3	Boston	MA	02101	USA	42.3601	-71.0589	t	2026-01-16 18:02:40.694473+05:30	\N
7	1	Rating Test Center	300 Rating St	\N	NYC	NY	10001	USA	40.7128	-74.006	t	2026-01-16 18:10:36.536074+05:30	\N
8	1	Test Location 1	1 Main St	\N	NYC	NY	10001	USA	40.7128	-74.006	t	2026-01-16 18:10:37.51179+05:30	\N
9	1	Test Location 2	2 Main St	\N	NYC	NY	10001	USA	40.7128	-74.006	t	2026-01-16 18:10:37.931857+05:30	\N
10	1	Test Location 3	3 Main St	\N	NYC	NY	10001	USA	40.7128	-74.006	t	2026-01-16 18:10:38.158669+05:30	\N
11	3	Main Branch - Ekkatuthangal	No. 45, Arcot Road	Near Ekkatuthangal Metro Station	Chennai	Tamil Nadu	600032	India	13.0199	80.1989	t	2026-01-17 13:29:10.320747+05:30	2026-01-17 13:29:10.320747+05:30
12	3	vishnu	Zone 9 Teynampet		Chennai Corporation	Tamil Nadu	600034	India	13.061322	80.23935	t	2026-01-17 18:57:29.989965+05:30	\N
\.


--
-- Data for Name: ngo_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ngo_profiles (id, user_id, organization_name, registration_number, contact_person, phone, verification_status, verification_document_url, verified_at, verified_by, rejection_reason, created_at, updated_at) FROM stdin;
1	3	Test NGO Organization	NGO123456	John Doe	+919876543210	VERIFIED	\N	2026-01-16 11:48:19.956781+05:30	1	\N	2026-01-16 17:07:50.772133+05:30	2026-01-17 17:13:53.334764+05:30
3	12	Chennai Food Bank	NGO789012	Rajesh Kumar	+919876543211	VERIFIED	\N	\N	\N	\N	2026-01-17 13:27:22.185377+05:30	2026-01-17 17:13:53.334764+05:30
4	13	Mumbai Meals Foundation	NGO345678	Priya Sharma	+919876543212	VERIFIED	\N	\N	\N	\N	2026-01-17 17:13:53.334764+05:30	\N
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, title, message, notification_type, related_entity_type, related_entity_id, is_read, read_at, created_at) FROM stdin;
1	3	New Donation Request	Updated Food Services Inc wants to donate 30 plates of dinner on 2026-01-26	donation_created	donation	\N	f	\N	2026-01-16 18:02:40.828917+05:30
4	3	New Donation Request	Updated Food Services Inc wants to donate 25 plates of breakfast on 2026-01-27	donation_created	donation	3	f	\N	2026-01-16 18:10:36.66849+05:30
5	1	Donation Confirmed	Test Food Bank has confirmed your donation at Rating Test Center. Check details for pickup information.	donation_confirmed	donation	3	f	\N	2026-01-16 18:10:36.76356+05:30
6	1	Donation Completed!	Thank you! Your donation of 25 plates has been successfully delivered to Test Food Bank. Please rate your experience.	donation_completed	donation	3	f	\N	2026-01-16 18:10:36.793043+05:30
7	3	New Rating Received	Updated Food Services Inc rated your service ⭐⭐⭐⭐⭐ (5/5)	rating_received	donation	3	f	\N	2026-01-16 18:10:36.818428+05:30
8	3	New Donation Request	Updated Food Services Inc wants to donate 20 plates of lunch on 2026-01-28	donation_created	donation	4	f	\N	2026-01-16 18:10:37.764257+05:30
9	1	Donation Confirmed	Test Food Bank has confirmed your donation at Test Location 1. Check details for pickup information.	donation_confirmed	donation	4	f	\N	2026-01-16 18:10:37.850121+05:30
10	1	Donation Completed!	Thank you! Your donation of 20 plates has been successfully delivered to Test Food Bank. Please rate your experience.	donation_completed	donation	4	f	\N	2026-01-16 18:10:37.875857+05:30
11	3	New Rating Received	Updated Food Services Inc rated your service ⭐⭐⭐⭐ (4/5)	rating_received	donation	4	f	\N	2026-01-16 18:10:37.901641+05:30
12	3	New Donation Request	Updated Food Services Inc wants to donate 20 plates of lunch on 2026-01-28	donation_created	donation	5	f	\N	2026-01-16 18:10:38.013862+05:30
13	1	Donation Confirmed	Test Food Bank has confirmed your donation at Test Location 2. Check details for pickup information.	donation_confirmed	donation	5	f	\N	2026-01-16 18:10:38.076262+05:30
14	1	Donation Completed!	Thank you! Your donation of 20 plates has been successfully delivered to Test Food Bank. Please rate your experience.	donation_completed	donation	5	f	\N	2026-01-16 18:10:38.100876+05:30
15	3	New Rating Received	Updated Food Services Inc rated your service ⭐⭐⭐⭐⭐ (5/5)	rating_received	donation	5	f	\N	2026-01-16 18:10:38.127806+05:30
16	3	New Donation Request	Updated Food Services Inc wants to donate 20 plates of lunch on 2026-01-28	donation_created	donation	6	f	\N	2026-01-16 18:10:38.241253+05:30
17	1	Donation Confirmed	Test Food Bank has confirmed your donation at Test Location 3. Check details for pickup information.	donation_confirmed	donation	6	f	\N	2026-01-16 18:10:38.30236+05:30
18	1	Donation Completed!	Thank you! Your donation of 20 plates has been successfully delivered to Test Food Bank. Please rate your experience.	donation_completed	donation	6	f	\N	2026-01-16 18:10:38.328266+05:30
19	3	New Rating Received	Updated Food Services Inc rated your service ⭐⭐⭐⭐⭐ (5/5)	rating_received	donation	6	f	\N	2026-01-16 18:10:38.350014+05:30
20	12	New Donation Request	Updated Food Services Inc wants to donate 50 plates of breakfast on 2026-01-28	donation_created	donation	7	f	\N	2026-01-17 14:38:46.741082+05:30
21	1	Donation Confirmed	Chennai Food Bank has confirmed your donation at Main Branch - Ekkatuthangal. Check details for pickup information.	donation_confirmed	donation	7	f	\N	2026-01-17 17:16:50.504545+05:30
\.


--
-- Data for Name: ratings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ratings (id, donation_id, donor_id, ngo_id, rating, feedback, created_at) FROM stdin;
1	3	1	1	5	Excellent service! Very professional and organized. The pickup was smooth and they were very grateful for the donation.	2026-01-16 18:10:36.818428+05:30
2	4	1	1	4	Test feedback 1 - rating 4 stars	2026-01-16 18:10:37.901641+05:30
3	5	1	1	5	Test feedback 2 - rating 5 stars	2026-01-16 18:10:38.127806+05:30
4	6	1	1	5	Test feedback 3 - rating 5 stars	2026-01-16 18:10:38.350014+05:30
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, role, is_active, is_verified, created_at, updated_at, last_login) FROM stdin;
1	testdonor@example.com	$2b$12$VnM6VSUSSLX5GfGmZrw4ZeD7k09XLYjk2ILsrl1ReXsPdp0GsjrrW	DONOR	t	f	2026-01-16 16:41:47.075603+05:30	\N	\N
3	testngo@example.com	$2b$12$e8axB7qv9mq.xRV2hnGnsOla/2bsGp8V4IV6DMQi27nu/xgQB.J0.	NGO	t	t	2026-01-16 17:07:50.772133+05:30	2026-01-17 17:14:43.637884+05:30	\N
12	chennai.ngo@example.com	$2b$12$ZLQlJqQUeJxjeZEL7K1nNeFVzeUKUDkYpAyrhqxHPKAOzzhLp0N42	NGO	t	t	2026-01-17 13:27:22.185377+05:30	2026-01-17 17:14:43.637884+05:30	\N
13	mumbai.ngo@example.com	$2b$12$D02wfpfgLQ6HSLNC.W31pOl3I7ZxRuD.pQ9XKXaC4PaRqZLelfQmy	NGO	t	t	2026-01-17 17:13:53.334764+05:30	2026-01-17 17:14:43.637884+05:30	\N
\.


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 1, false);


--
-- Name: donation_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.donation_requests_id_seq', 7, true);


--
-- Name: donor_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.donor_profiles_id_seq', 1, true);


--
-- Name: ngo_location_capacity_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ngo_location_capacity_id_seq', 99, true);


--
-- Name: ngo_locations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ngo_locations_id_seq', 12, true);


--
-- Name: ngo_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ngo_profiles_id_seq', 4, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 21, true);


--
-- Name: ratings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ratings_id_seq', 4, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 13, true);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: donation_requests donation_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donation_requests
    ADD CONSTRAINT donation_requests_pkey PRIMARY KEY (id);


--
-- Name: donor_profiles donor_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donor_profiles
    ADD CONSTRAINT donor_profiles_pkey PRIMARY KEY (id);


--
-- Name: donor_profiles donor_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donor_profiles
    ADD CONSTRAINT donor_profiles_user_id_key UNIQUE (user_id);


--
-- Name: ngo_location_capacity ngo_location_capacity_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ngo_location_capacity
    ADD CONSTRAINT ngo_location_capacity_pkey PRIMARY KEY (id);


--
-- Name: ngo_locations ngo_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ngo_locations
    ADD CONSTRAINT ngo_locations_pkey PRIMARY KEY (id);


--
-- Name: ngo_profiles ngo_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ngo_profiles
    ADD CONSTRAINT ngo_profiles_pkey PRIMARY KEY (id);


--
-- Name: ngo_profiles ngo_profiles_registration_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ngo_profiles
    ADD CONSTRAINT ngo_profiles_registration_number_key UNIQUE (registration_number);


--
-- Name: ngo_profiles ngo_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ngo_profiles
    ADD CONSTRAINT ngo_profiles_user_id_key UNIQUE (user_id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: ratings ratings_donation_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_donation_id_key UNIQUE (donation_id);


--
-- Name: ratings ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_audit_logs_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: ix_audit_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_audit_logs_created_at ON public.audit_logs USING btree (created_at);


--
-- Name: ix_audit_logs_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_audit_logs_id ON public.audit_logs USING btree (id);


--
-- Name: ix_audit_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: ix_donation_requests_donation_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_donation_requests_donation_date ON public.donation_requests USING btree (donation_date);


--
-- Name: ix_donation_requests_donor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_donation_requests_donor_id ON public.donation_requests USING btree (donor_id);


--
-- Name: ix_donation_requests_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_donation_requests_id ON public.donation_requests USING btree (id);


--
-- Name: ix_donation_requests_ngo_location_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_donation_requests_ngo_location_id ON public.donation_requests USING btree (ngo_location_id);


--
-- Name: ix_donation_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_donation_requests_status ON public.donation_requests USING btree (status);


--
-- Name: ix_donor_profiles_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_donor_profiles_id ON public.donor_profiles USING btree (id);


--
-- Name: ix_ngo_location_capacity_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_ngo_location_capacity_date ON public.ngo_location_capacity USING btree (date);


--
-- Name: ix_ngo_location_capacity_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_ngo_location_capacity_id ON public.ngo_location_capacity USING btree (id);


--
-- Name: ix_ngo_location_capacity_location_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_ngo_location_capacity_location_id ON public.ngo_location_capacity USING btree (location_id);


--
-- Name: ix_ngo_locations_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_ngo_locations_id ON public.ngo_locations USING btree (id);


--
-- Name: ix_ngo_locations_latitude; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_ngo_locations_latitude ON public.ngo_locations USING btree (latitude);


--
-- Name: ix_ngo_locations_longitude; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_ngo_locations_longitude ON public.ngo_locations USING btree (longitude);


--
-- Name: ix_ngo_locations_ngo_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_ngo_locations_ngo_id ON public.ngo_locations USING btree (ngo_id);


--
-- Name: ix_ngo_profiles_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_ngo_profiles_id ON public.ngo_profiles USING btree (id);


--
-- Name: ix_ngo_profiles_organization_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_ngo_profiles_organization_name ON public.ngo_profiles USING btree (organization_name);


--
-- Name: ix_ngo_profiles_verification_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_ngo_profiles_verification_status ON public.ngo_profiles USING btree (verification_status);


--
-- Name: ix_notifications_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_notifications_id ON public.notifications USING btree (id);


--
-- Name: ix_notifications_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_notifications_is_read ON public.notifications USING btree (is_read);


--
-- Name: ix_notifications_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: ix_ratings_donor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_ratings_donor_id ON public.ratings USING btree (donor_id);


--
-- Name: ix_ratings_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_ratings_id ON public.ratings USING btree (id);


--
-- Name: ix_ratings_ngo_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_ratings_ngo_id ON public.ratings USING btree (ngo_id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: donation_requests donation_requests_donor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donation_requests
    ADD CONSTRAINT donation_requests_donor_id_fkey FOREIGN KEY (donor_id) REFERENCES public.donor_profiles(id) ON DELETE CASCADE;


--
-- Name: donation_requests donation_requests_ngo_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donation_requests
    ADD CONSTRAINT donation_requests_ngo_location_id_fkey FOREIGN KEY (ngo_location_id) REFERENCES public.ngo_locations(id) ON DELETE CASCADE;


--
-- Name: donor_profiles donor_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donor_profiles
    ADD CONSTRAINT donor_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ngo_location_capacity ngo_location_capacity_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ngo_location_capacity
    ADD CONSTRAINT ngo_location_capacity_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.ngo_locations(id) ON DELETE CASCADE;


--
-- Name: ngo_locations ngo_locations_ngo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ngo_locations
    ADD CONSTRAINT ngo_locations_ngo_id_fkey FOREIGN KEY (ngo_id) REFERENCES public.ngo_profiles(id) ON DELETE CASCADE;


--
-- Name: ngo_profiles ngo_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ngo_profiles
    ADD CONSTRAINT ngo_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ngo_profiles ngo_profiles_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ngo_profiles
    ADD CONSTRAINT ngo_profiles_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ratings ratings_donation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_donation_id_fkey FOREIGN KEY (donation_id) REFERENCES public.donation_requests(id) ON DELETE CASCADE;


--
-- Name: ratings ratings_donor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_donor_id_fkey FOREIGN KEY (donor_id) REFERENCES public.donor_profiles(id) ON DELETE CASCADE;


--
-- Name: ratings ratings_ngo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_ngo_id_fkey FOREIGN KEY (ngo_id) REFERENCES public.ngo_profiles(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict Ibijg780M58by9tdlAVdaIXvEFKCOKvBmxtaOcCW39e6fvwzdVlktbOwDsXxgOr

