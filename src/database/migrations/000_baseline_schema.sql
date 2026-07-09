--
-- PostgreSQL database dump
--

\restrict 74D8jBF5RX8bx5xwS9M3gC9R4oAcsbDr4gY5qaYPBdv5gsL0JNsc4ATzGXwviac

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: banners; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.banners (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    image_url text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    emoji character varying(20),
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: payment_reminders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_reminders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    payment_id uuid NOT NULL,
    owner_user_id uuid NOT NULL,
    channel text NOT NULL,
    reminder_type text NOT NULL,
    reminder_date date DEFAULT CURRENT_DATE NOT NULL,
    recipient text,
    subject text,
    message text NOT NULL,
    sent_at timestamp without time zone,
    status text DEFAULT 'PENDING'::text NOT NULL,
    error_message text,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT payment_reminders_channel_check CHECK ((channel = ANY (ARRAY['EMAIL'::text, 'WHATSAPP'::text]))),
    CONSTRAINT payment_reminders_status_check CHECK ((status = ANY (ARRAY['PENDING'::text, 'SENT'::text, 'FAILED'::text, 'SKIPPED'::text]))),
    CONSTRAINT payment_reminders_type_check CHECK ((reminder_type = ANY (ARRAY['BEFORE_DUE'::text, 'DUE_TODAY'::text, 'OVERDUE'::text, 'BLOCKED'::text])))
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid,
    subscription_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    due_date date NOT NULL,
    paid_at timestamp with time zone,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    gateway_provider character varying(30) DEFAULT 'MANUAL'::character varying NOT NULL,
    gateway_payment_id character varying(255),
    gateway_payment_url text,
    gateway_invoice_url text,
    gateway_status character varying(60),
    gateway_response jsonb,
    gateway_created_at timestamp with time zone,
    gateway_updated_at timestamp with time zone,
    owner_user_id uuid,
    CONSTRAINT check_payments_gateway_provider CHECK (((gateway_provider)::text = ANY ((ARRAY['MANUAL'::character varying, 'ASAAS'::character varying])::text[]))),
    CONSTRAINT payments_amount_check CHECK ((amount >= (0)::numeric)),
    CONSTRAINT payments_status_check CHECK (((status)::text = ANY ((ARRAY['PAID'::character varying, 'PENDING'::character varying, 'OVERDUE'::character varying, 'CANCELED'::character varying])::text[])))
);


--
-- Name: plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    monthly_price numeric(10,2) NOT NULL,
    annual_price numeric(10,2),
    max_restaurants integer DEFAULT 1 NOT NULL,
    max_products integer,
    max_categories integer,
    max_users integer,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid NOT NULL,
    category_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    image_url text,
    is_active boolean DEFAULT true NOT NULL,
    is_promotion boolean DEFAULT false NOT NULL,
    is_new boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    video_url text
);


--
-- Name: restaurants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.restaurants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_user_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    logo_url text,
    whatsapp character varying(30),
    phone character varying(30),
    address text,
    opening_hours text,
    status character varying(50) DEFAULT 'ACTIVE'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    asaas_customer_id character varying(255)
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    restaurant_id uuid,
    status character varying(20) DEFAULT 'PENDING'::character varying NOT NULL,
    plan_name character varying(100) DEFAULT 'MenuFlow Completo'::character varying NOT NULL,
    monthly_price numeric(10,2) NOT NULL,
    started_at date DEFAULT CURRENT_DATE NOT NULL,
    next_billing_date date NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    owner_user_id uuid,
    CONSTRAINT subscriptions_monthly_price_check CHECK ((monthly_price >= (0)::numeric)),
    CONSTRAINT subscriptions_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'PENDING'::character varying, 'OVERDUE'::character varying, 'CANCELED'::character varying])::text[])))
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    asaas_customer_id character varying(255)
);


--
-- Name: banners banners_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: payment_reminders payment_reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_reminders
    ADD CONSTRAINT payment_reminders_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: restaurants restaurants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restaurants
    ADD CONSTRAINT restaurants_pkey PRIMARY KEY (id);


--
-- Name: restaurants restaurants_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restaurants
    ADD CONSTRAINT restaurants_slug_key UNIQUE (slug);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_restaurant_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_restaurant_id_key UNIQUE (restaurant_id);


--
-- Name: payment_reminders unique_payment_reminder_per_day_channel_type; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_reminders
    ADD CONSTRAINT unique_payment_reminder_per_day_channel_type UNIQUE (payment_id, channel, reminder_type, reminder_date);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: banners_restaurant_image_url_unique_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX banners_restaurant_image_url_unique_idx ON public.banners USING btree (restaurant_id, TRIM(BOTH FROM image_url));


--
-- Name: categories_restaurant_name_unique_lower_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX categories_restaurant_name_unique_lower_idx ON public.categories USING btree (restaurant_id, lower(TRIM(BOTH FROM name)));


--
-- Name: idx_payments_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_due_date ON public.payments USING btree (due_date);


--
-- Name: idx_payments_restaurant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_restaurant_id ON public.payments USING btree (restaurant_id);


--
-- Name: idx_payments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_status ON public.payments USING btree (status);


--
-- Name: idx_payments_subscription_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_subscription_id ON public.payments USING btree (subscription_id);


--
-- Name: idx_subscriptions_next_billing_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_next_billing_date ON public.subscriptions USING btree (next_billing_date);


--
-- Name: idx_subscriptions_restaurant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_restaurant_id ON public.subscriptions USING btree (restaurant_id);


--
-- Name: idx_subscriptions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_subscriptions_status ON public.subscriptions USING btree (status);


--
-- Name: plans_name_unique_lower_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX plans_name_unique_lower_idx ON public.plans USING btree (lower(TRIM(BOTH FROM name)));


--
-- Name: products_restaurant_category_name_unique_lower_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX products_restaurant_category_name_unique_lower_idx ON public.products USING btree (restaurant_id, category_id, lower(TRIM(BOTH FROM name)));


--
-- Name: restaurants_slug_unique_lower_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX restaurants_slug_unique_lower_idx ON public.restaurants USING btree (lower(TRIM(BOTH FROM slug)));


--
-- Name: unique_active_payment_by_subscription_month; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_active_payment_by_subscription_month ON public.payments USING btree (subscription_id, EXTRACT(year FROM due_date), EXTRACT(month FROM due_date)) WHERE ((status)::text <> 'CANCELED'::text);


--
-- Name: unique_active_subscription_by_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_active_subscription_by_owner ON public.subscriptions USING btree (owner_user_id) WHERE ((status)::text <> 'CANCELED'::text);


--
-- Name: unique_payments_gateway_payment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_payments_gateway_payment_id ON public.payments USING btree (gateway_payment_id) WHERE (gateway_payment_id IS NOT NULL);


--
-- Name: unique_restaurants_asaas_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_restaurants_asaas_customer_id ON public.restaurants USING btree (asaas_customer_id) WHERE (asaas_customer_id IS NOT NULL);


--
-- Name: unique_users_asaas_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_users_asaas_customer_id ON public.users USING btree (asaas_customer_id) WHERE (asaas_customer_id IS NOT NULL);


--
-- Name: users_email_unique_lower_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_unique_lower_idx ON public.users USING btree (lower(TRIM(BOTH FROM email)));


--
-- Name: payments trigger_update_payments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscriptions trigger_update_subscriptions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: banners fk_banner_restaurant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT fk_banner_restaurant FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- Name: categories fk_category_restaurant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT fk_category_restaurant FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- Name: payments fk_payments_owner_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT fk_payments_owner_user_id FOREIGN KEY (owner_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payments fk_payments_restaurant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT fk_payments_restaurant FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- Name: payments fk_payments_subscription; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT fk_payments_subscription FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE CASCADE;


--
-- Name: products fk_product_category; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: products fk_product_restaurant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT fk_product_restaurant FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- Name: restaurants fk_restaurant_owner; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restaurants
    ADD CONSTRAINT fk_restaurant_owner FOREIGN KEY (owner_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: subscriptions fk_subscriptions_owner_user_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT fk_subscriptions_owner_user_id FOREIGN KEY (owner_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: subscriptions fk_subscriptions_restaurant; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT fk_subscriptions_restaurant FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE;


--
-- Name: payment_reminders payment_reminders_owner_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_reminders
    ADD CONSTRAINT payment_reminders_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public.users(id);


--
-- Name: payment_reminders payment_reminders_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_reminders
    ADD CONSTRAINT payment_reminders_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 74D8jBF5RX8bx5xwS9M3gC9R4oAcsbDr4gY5qaYPBdv5gsL0JNsc4ATzGXwviac

