
CREATE TYPE public.order_status AS ENUM ('vantar','planerad','printas','efterarbete','klar','levererad');
CREATE TYPE public.payment_method AS ENUM ('swish','kontant');
CREATE TYPE public.order_priority AS ENUM ('lag','normal','hog');

CREATE TABLE public.filaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  color text NOT NULL,
  pla_type text NOT NULL DEFAULT 'PLA Basic',
  brand text NOT NULL DEFAULT 'Bambu Lab',
  remaining_grams numeric NOT NULL DEFAULT 1000,
  spool_weight numeric NOT NULL DEFAULT 1000,
  warning_threshold numeric NOT NULL DEFAULT 150,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  stl_path text,
  image_path text,
  default_color text NOT NULL DEFAULT 'Svart',
  material text NOT NULL DEFAULT 'PLA',
  grams numeric NOT NULL DEFAULT 0,
  print_minutes numeric NOT NULL DEFAULT 0,
  price_override numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number serial,
  customer_name text NOT NULL,
  delivery_date date,
  priority public.order_priority NOT NULL DEFAULT 'normal',
  status public.order_status NOT NULL DEFAULT 'vantar',
  paid boolean NOT NULL DEFAULT false,
  payment_method public.payment_method NOT NULL DEFAULT 'swish',
  notes text,
  filament_deducted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  color text NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  grams numeric NOT NULL DEFAULT 0
);

CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  amount numeric NOT NULL,
  category text NOT NULL DEFAULT 'Material',
  date date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  percent numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.settings (
  id int PRIMARY KEY DEFAULT 1,
  notify_low_filament boolean NOT NULL DEFAULT true,
  notify_deliveries boolean NOT NULL DEFAULT true,
  notify_unpaid boolean NOT NULL DEFAULT true,
  notify_production boolean NOT NULL DEFAULT false,
  tax_percent numeric NOT NULL DEFAULT 25,
  price_per_gram numeric NOT NULL DEFAULT 0.25,
  price_per_minute numeric NOT NULL DEFAULT 0.1
);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['filaments','products','orders','order_items','expenses','allocations','settings'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "Inloggade hanterar %s" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END $$;
GRANT USAGE, SELECT ON SEQUENCE public.orders_order_number_seq TO authenticated;

INSERT INTO public.settings (id) VALUES (1);

INSERT INTO public.filaments (color, pla_type, brand, remaining_grams) VALUES
('Svart','PLA Basic','Bambu Lab',820),('Vit','PLA Basic','Bambu Lab',450),
('Blå','PLA Matte','Bambu Lab',120),('Röd','PLA Basic','Sunlu',610),
('Lila','PLA Silk','eSun',95),('Grå','PLA Matte','Bambu Lab',990);

INSERT INTO public.products (id, name, description, default_color, grams, print_minutes, price_override) VALUES
('11111111-0000-0000-0000-000000000001','Telefonhållare','Stabil hållare för mobil på skrivbordet','Svart',45,120,NULL),
('11111111-0000-0000-0000-000000000002','Nyckelring logga','Personlig nyckelring med logga','Blå',8,25,NULL),
('11111111-0000-0000-0000-000000000003','Kabelorganiserare','Set om 5 kabelklämmor','Vit',20,60,NULL),
('11111111-0000-0000-0000-000000000004','Växtkruka liten','Minimalistisk kruka 8 cm','Grå',70,180,49),
('11111111-0000-0000-0000-000000000005','Drake figur','Ledad drake, 15 cm','Lila',35,150,NULL);

INSERT INTO public.orders (id, customer_name, delivery_date, priority, status, paid, payment_method) VALUES
('22222222-0000-0000-0000-000000000001','Anna Svensson',current_date,'hog','klar',true,'swish'),
('22222222-0000-0000-0000-000000000002','Erik Johansson',current_date + 2,'normal','printas',false,'swish'),
('22222222-0000-0000-0000-000000000003','Lisa Karlsson',current_date + 4,'normal','vantar',false,'kontant'),
('22222222-0000-0000-0000-000000000004','Johan Berg',current_date + 1,'hog','efterarbete',true,'swish'),
('22222222-0000-0000-0000-000000000005','Maja Lind',current_date - 3,'lag','levererad',true,'kontant'),
('22222222-0000-0000-0000-000000000006','Oskar Nilsson',current_date + 6,'normal','planerad',false,'swish');

INSERT INTO public.order_items (order_id, product_id, product_name, color, quantity, unit_price, grams) VALUES
('22222222-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000001','Telefonhållare','Svart',2,23.25,45),
('22222222-0000-0000-0000-000000000002','11111111-0000-0000-0000-000000000005','Drake figur','Lila',3,23.75,35),
('22222222-0000-0000-0000-000000000002','11111111-0000-0000-0000-000000000002','Nyckelring logga','Blå',5,4.5,8),
('22222222-0000-0000-0000-000000000003','11111111-0000-0000-0000-000000000004','Växtkruka liten','Grå',2,49,70),
('22222222-0000-0000-0000-000000000004','11111111-0000-0000-0000-000000000003','Kabelorganiserare','Vit',4,11,20),
('22222222-0000-0000-0000-000000000005','11111111-0000-0000-0000-000000000001','Telefonhållare','Röd',1,23.25,45),
('22222222-0000-0000-0000-000000000006','11111111-0000-0000-0000-000000000002','Nyckelring logga','Blå',10,4.5,8);

UPDATE public.orders SET filament_deducted = true WHERE status IN ('klar','levererad','efterarbete');

INSERT INTO public.expenses (description, amount, category, date) VALUES
('Filament 4 rullar',880,'Material',current_date - 20),
('Byggplatta PEI',249,'Utrustning',current_date - 12),
('Elkostnad oktober',120,'Drift',current_date - 5);

INSERT INTO public.allocations (name, percent) VALUES ('Farmloop',10),('Skatt',30),('Återinvestering',20);
