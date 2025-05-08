--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.8 (Homebrew)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Lectures; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Lectures" (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    "topicId" integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "imageUrl" character varying(255)
);


ALTER TABLE public."Lectures" OWNER TO postgres;

--
-- Name: Lectures_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Lectures_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Lectures_id_seq" OWNER TO postgres;

--
-- Name: Lectures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Lectures_id_seq" OWNED BY public."Lectures".id;


--
-- Name: QuestionAttempts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."QuestionAttempts" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "questionId" integer NOT NULL,
    "selectedAnswer" character varying(255) NOT NULL,
    "isCorrect" boolean NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."QuestionAttempts" OWNER TO postgres;

--
-- Name: QuestionAttempts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."QuestionAttempts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."QuestionAttempts_id_seq" OWNER TO postgres;

--
-- Name: QuestionAttempts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."QuestionAttempts_id_seq" OWNED BY public."QuestionAttempts".id;


--
-- Name: Questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Questions" (
    id integer NOT NULL,
    text text,
    "optionA" character varying(255),
    "optionB" character varying(255),
    "optionC" character varying(255),
    "optionD" character varying(255),
    "correctAnswer" character varying(255),
    difficulty character varying(255),
    "topicId" integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "optionE" character varying(255),
    "imageUrl" character varying(255),
    classification character varying(255),
    explanation text
);


ALTER TABLE public."Questions" OWNER TO postgres;

--
-- Name: Questions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Questions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Questions_id_seq" OWNER TO postgres;

--
-- Name: Questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Questions_id_seq" OWNED BY public."Questions".id;


--
-- Name: SequelizeMeta; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SequelizeMeta" (
    name character varying(255) NOT NULL
);


ALTER TABLE public."SequelizeMeta" OWNER TO postgres;

--
-- Name: Topics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Topics" (
    id integer NOT NULL,
    name character varying(255),
    description text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "parentId" integer
);


ALTER TABLE public."Topics" OWNER TO postgres;

--
-- Name: Topics_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Topics_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Topics_id_seq" OWNER TO postgres;

--
-- Name: Topics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Topics_id_seq" OWNED BY public."Topics".id;


--
-- Name: Users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Users" (
    id integer NOT NULL,
    username character varying(255),
    password character varying(255),
    role character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    specialization character varying(255)
);


ALTER TABLE public."Users" OWNER TO postgres;

--
-- Name: Users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Users_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Users_id_seq" OWNER TO postgres;

--
-- Name: Users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Users_id_seq" OWNED BY public."Users".id;


--
-- Name: WordleScores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."WordleScores" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    score integer NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public."WordleScores" OWNER TO postgres;

--
-- Name: WordleScores_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."WordleScores_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."WordleScores_id_seq" OWNER TO postgres;

--
-- Name: WordleScores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."WordleScores_id_seq" OWNED BY public."WordleScores".id;


--
-- Name: Lectures id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Lectures" ALTER COLUMN id SET DEFAULT nextval('public."Lectures_id_seq"'::regclass);


--
-- Name: QuestionAttempts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."QuestionAttempts" ALTER COLUMN id SET DEFAULT nextval('public."QuestionAttempts_id_seq"'::regclass);


--
-- Name: Questions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Questions" ALTER COLUMN id SET DEFAULT nextval('public."Questions_id_seq"'::regclass);


--
-- Name: Topics id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Topics" ALTER COLUMN id SET DEFAULT nextval('public."Topics_id_seq"'::regclass);


--
-- Name: Users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users" ALTER COLUMN id SET DEFAULT nextval('public."Users_id_seq"'::regclass);


--
-- Name: WordleScores id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WordleScores" ALTER COLUMN id SET DEFAULT nextval('public."WordleScores_id_seq"'::regclass);


--
-- Data for Name: Lectures; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Lectures" (id, title, content, "topicId", "createdAt", "updatedAt", "imageUrl") FROM stdin;
6	Bakteri Hücre Duvarı ve Gram Boyama	Bakterilerin çoğu hücre duvarına sahiptir...	3	2025-04-23 09:41:49.458+00	2025-04-23 09:41:49.458+00	https://example.com/images/gram_positive_negative.jpg
9	aaa	<h1 style="text-align: center;"><span style="color: #f1c40f;">Merhaba&nbsp;</span></h1>	3	2025-04-23 12:19:38.775+00	2025-04-23 12:19:38.775+00	\N
11	aaaa	<p><img src="https://media.istockphoto.com/id/628978952/tr/foto%C4%9Fraf/microscopic-blue-bacteria-background.jpg?s=612x612&amp;w=0&amp;k=20&amp;c=JAag0243xxUjs8Ba3EvgGWHx-USuOKWSzhvggFj4dTo=" alt="aaaaa" width="612" height="357"></p>	5	2025-04-23 12:28:28.425+00	2025-04-23 12:28:28.425+00	\N
12	aaa	<div class="presentation-container">\n<div id="slide1" class="slide active">\n<div class="slide-content">\n<h1>Quorum Sensing</h1>\n<h2>Bakteriyel İletişimden Tıbbi Uygulamalara</h2>\n<p>[Sunan: Adınız Soyadınız]</p>\n<p>Tıbbi Mikrobiyoloji Kongresi - [Tarih]</p>\n</div>\n<div class="slide-footer">[Kongre Adı/Logosu]</div>\n<div class="slide-number">1 / 15</div>\n</div>\n<div id="slide2" class="slide">\n<div class="slide-content">\n<h1>Giriş: Bakterilerin Gizli Dili</h1>\n<h2>Bu Sunumda Neler Var?</h2>\n<ul>\n<li>Quorum Sensing (QS) nedir? Temel kavramlar.</li>\n<li>QS mekanizmaları nasıl &ccedil;alışır?</li>\n<li>Gram-pozitif ve Gram-negatif bakterilerde QS farklılıkları.</li>\n<li>QS'in tıbbi mikrobiyolojideki &ouml;nemi: Patojenez, biyofilm ve antibiyotik direnci.</li>\n<li>Tedavi hedefi olarak QS: Quorum Quenching (QQ) stratejileri.</li>\n<li>&Ouml;rnekler ve gelecek perspektifleri.</li>\n</ul>\n<img src="https://via.placeholder.com/600x300/0A9396/FFFFFF?text=Bakteriyel+Koloni" alt="Bakteri kolonisi ill&uuml;strasyonu"></div>\n<div class="slide-footer">Giriş</div>\n<div class="slide-number">2 / 15</div>\n</div>\n<div id="slide3" class="slide">\n<div class="slide-content">\n<h1>Quorum Sensing (QS) Nedir?</h1>\n<h2>Yoğunluğa Bağlı Karar Verme</h2>\n<p>Quorum Sensing, bakterilerin h&uuml;cre yoğunluğunu algılamak ve buna yanıt olarak gen ekspresyonunu topluca d&uuml;zenlemek i&ccedil;in kullandıkları bir iletişim mekanizmasıdır <span class="citation">[1]</span>.</p>\n<p>Basit&ccedil;e: Bakteriler, belirli bir eşik yoğunluğa ulaştıklarında "&ccedil;oğunluk" olduklarını anlar ve bazı davranışları (&ouml;rneğin saldırı, savunma) koordine şekilde başlatırlar.</p>\n<p><strong>Analoji:</strong> Kalabalık bir odada fısıltıyla konuşmak yerine, yeterli kişi toplandığında hep birlikte bağırmak gibi d&uuml;ş&uuml;n&uuml;lebilir.</p>\n<img src="https://via.placeholder.com/500x250/94D2BD/001219?text=Yoğunluk+Algılama" alt="Yoğunluk algılama konsepti"></div>\n<div class="slide-footer">Tanım</div>\n<div class="slide-number">3 / 15</div>\n</div>\n<div id="slide4" class="slide">\n<div class="slide-content">\n<h1>Temel QS Mekanizması</h1>\n<h2>Sinyal -&gt; Algılama -&gt; Yanıt</h2>\n<p>QS sistemleri genellikle şu temel adımları i&ccedil;erir <span class="citation">[2]</span>:</p>\n<div class="diagram">\n<div class="diagram-step"><img src="https://via.placeholder.com/100/005F73/FFFFFF?text=Sinyal" alt="Sinyal Molek&uuml;l&uuml;">\n<p><strong>1. Sinyal &Uuml;retimi:</strong> Bakteriler, 'otoind&uuml;kleyici' (AI) adı verilen k&uuml;&ccedil;&uuml;k sinyal molek&uuml;lleri &uuml;retir ve &ccedil;evreye salar.</p>\n</div>\n<div class="arrow">➔</div>\n<div class="diagram-step"><img src="https://via.placeholder.com/100/0A9396/FFFFFF?text=Birikim" alt="Molek&uuml;l Birikimi">\n<p><strong>2. Sinyal Birikimi:</strong> Pop&uuml;lasyon yoğunluğu arttık&ccedil;a, ortamdaki AI konsantrasyonu da artar.</p>\n</div>\n<div class="arrow">➔</div>\n<div class="diagram-step"><img src="https://via.placeholder.com/100/94D2BD/001219?text=Algılama" alt="Resept&ouml;r">\n<p><strong>3. Sinyal Algılama:</strong> AI molek&uuml;lleri belirli bir eşik konsantrasyona ulaştığında, bakteriyel resept&ouml;rlere bağlanır.</p>\n</div>\n<div class="arrow">➔</div>\n<div class="diagram-step"><img src="https://via.placeholder.com/100/E9D8A6/001219?text=Yanıt" alt="Gen Ekspresyonu">\n<p><strong>4. Koordineli Yanıt:</strong> Resept&ouml;r aktivasyonu, belirli genlerin (&ouml;rn. vir&uuml;lans fakt&ouml;rleri, biyofilm oluşumu) ekspresyonunu topluca değiştirir.</p>\n</div>\n</div>\n</div>\n<div class="slide-footer">Mekanizma</div>\n<div class="slide-number">4 / 15</div>\n</div>\n<div id="slide5" class="slide">\n<div class="slide-content">\n<h1>Anahtar Bileşenler</h1>\n<h2>Otoind&uuml;kleyiciler ve Resept&ouml;rler</h2>\n<p><strong>Otoind&uuml;kleyiciler (Autoinducers - AI):</strong></p>\n<ul>\n<li>Bakteriler tarafından &uuml;retilen kimyasal sinyal molek&uuml;lleridir.</li>\n<li>Farklı bakteri t&uuml;rleri farklı AI'lar kullanır.</li>\n<li>&Ouml;rnekler: A&ccedil;il-homoserin laktonlar (AHLs - Gram-negatiflerde yaygın), Otoind&uuml;kleyici peptitler (AIPs - Gram-pozitiflerde yaygın), Autoinducer-2 (AI-2 - T&uuml;rler arası iletişim) <span class="citation">[3]</span>.</li>\n</ul>\n<p><strong>Resept&ouml;rler:</strong></p>\n<ul>\n<li>AI molek&uuml;llerini tanıyan ve bağlayan proteinlerdir.</li>\n<li>Genellikle sitoplazmik transkripsiyon fakt&ouml;rleri veya membran sens&ouml;r kinazlarıdır.</li>\n<li>AI bağlanması, resept&ouml;r&uuml;n konformasyonunu değiştirerek sinyal iletimini başlatır.</li>\n</ul>\n<img src="https://via.placeholder.com/550x280/005F73/FFFFFF?text=AI+Molek&uuml;l+ve+Resept&ouml;r" alt="Otoind&uuml;kleyici molek&uuml;l ve resept&ouml;r etkileşimi"></div>\n<div class="slide-footer">Bileşenler</div>\n<div class="slide-number">5 / 15</div>\n</div>\n<div id="slide6" class="slide">\n<div class="slide-content">\n<h1>QS Sistem Tipleri</h1>\n<h2>Gram-Pozitif vs. Gram-Negatif</h2>\n<p><strong>Gram-Negatif Bakteriler:</strong></p>\n<ul>\n<li>Genellikle <strong>A&ccedil;il-Homoserin Lakton (AHL)</strong> sinyallerini kullanır (&ouml;rn: LuxI/LuxR sistemi) <span class="citation">[2]</span>.</li>\n<li>AHL'ler genellikle h&uuml;cre zarından serbest&ccedil;e dif&uuml;ze olabilir.</li>\n<li>Resept&ouml;rler (LuxR benzeri proteinler) genellikle sitoplazmadadır ve AHL bağlandığında DNA'ya bağlanarak gen ekspresyonunu d&uuml;zenler.</li>\n</ul>\n<p><strong>Gram-Pozitif Bakteriler:</strong></p>\n<ul>\n<li>Genellikle modifiye edilmiş <strong>Oligo-peptitleri (Autoinducing Peptides - AIPs)</strong> sinyal olarak kullanır <span class="citation">[3]</span>.</li>\n<li>AIP'ler aktif taşıma ile h&uuml;cre dışına salınır.</li>\n<li>Algılama genellikle h&uuml;cre zarındaki iki bileşenli sistem (sens&ouml;r kinaz / yanıt reg&uuml;lat&ouml;r&uuml;) tarafından yapılır.</li>\n</ul>\n<p><strong>T&uuml;rler Arası İletişim:</strong> Autoinducer-2 (AI-2), hem Gram-pozitif hem de Gram-negatif bakteriler tarafından &uuml;retilip algılanabilen "evrensel" bir sinyal molek&uuml;l&uuml;d&uuml;r <span class="citation">[4]</span>.</p>\n</div>\n<div class="slide-footer">Sistem Tipleri</div>\n<div class="slide-number">6 / 15</div>\n</div>\n<div id="slide7" class="slide">\n<div class="slide-content">\n<h1>QS Tarafından D&uuml;zenlenen Davranışlar</h1>\n<h2>Kolektif Aksiyonun G&uuml;c&uuml;</h2>\n<p>Bakteriler, yeterli &ccedil;oğunluğa ulaştıklarında QS aracılığıyla bir&ccedil;ok &ouml;nemli s&uuml;reci koordine ederler:</p>\n<ul>\n<li><strong>Biyofilm Oluşumu:</strong> Y&uuml;zeylere yapışma ve koruyucu matris &uuml;retimi <span class="citation">[5]</span>.</li>\n<li><strong>Vir&uuml;lans Fakt&ouml;rlerinin Salgılanması:</strong> Toksinler, enzimler (proteazlar, hemolizinler) gibi hastalık yapıcı molek&uuml;llerin &uuml;retimi <span class="citation">[1, 6]</span>.</li>\n<li><strong>Biyol&uuml;minesans:</strong> Işık &uuml;retimi (&ouml;rneğin, <em>Vibrio fischeri</em>).</li>\n<li><strong>Spor&uuml;lasyon:</strong> Zorlu koşullara dayanıklı sporların oluşturulması.</li>\n<li><strong>Konjugasyon:</strong> Genetik materyal aktarımı.</li>\n<li><strong>Antibiyotik &Uuml;retimi/Direnci:</strong> Bazı antibiyotiklerin &uuml;retimi veya diren&ccedil; mekanizmalarının aktivasyonu.</li>\n</ul>\n<img src="https://via.placeholder.com/600x300/0A9396/FFFFFF?text=Biyofilm+%26+Vir&uuml;lans" alt="Biyofilm ve Vir&uuml;lans Fakt&ouml;rleri"></div>\n<div class="slide-footer">Fonksiyonlar</div>\n<div class="slide-number">7 / 15</div>\n</div>\n<div id="slide8" class="slide">\n<div class="slide-content">\n<h1>QS ve Patojenez</h1>\n<h2>Hastalık Gelişimindeki Rol&uuml;</h2>\n<p>Bir&ccedil;ok patojen bakteri, konak&ccedil;ı savunma mekanizmalarından ka&ccedil;ınmak ve enfeksiyonu başlatmak i&ccedil;in QS sistemlerini kullanır <span class="citation">[6]</span>.</p>\n<ul>\n<li><strong>Erken Evrelerde Gizlenme:</strong> D&uuml;ş&uuml;k yoğunlukta iken QS aktif değildir, bakteri bağışıklık sisteminden gizlenebilir.</li>\n<li><strong>Koordineli Saldırı:</strong> Yeterli sayıya ulaşıldığında (quorum), QS aktive olur ve vir&uuml;lans fakt&ouml;rleri (toksinler, doku yıkıcı enzimler) eş zamanlı olarak salgılanır. Bu, bağışıklık sisteminin başa &ccedil;ıkmasını zorlaştırır.</li>\n<li><strong>&Ouml;rnek Patojenler:</strong>\n<ul>\n<li><em>Pseudomonas aeruginosa:</em> Kistik fibrozis hastalarında akciğer enfeksiyonları, yanık yarası enfeksiyonları (AHL ve PQS sistemleri) <span class="citation">[7]</span>.</li>\n<li><em>Staphylococcus aureus:</em> Cilt enfeksiyonları, pn&ouml;moni, sepsis (AIP tabanlı Agr sistemi) <span class="citation">[8]</span>.</li>\n<li><em>Vibrio cholerae:</em> Kolera (Kolera toksini &uuml;retimi QS ile d&uuml;zenlenir).</li>\n</ul>\n</li>\n</ul>\n</div>\n<div class="slide-footer">Patojenez</div>\n<div class="slide-number">8 / 15</div>\n</div>\n<div id="slide9" class="slide">\n<div class="slide-content">\n<h1>QS, Biyofilmler ve Diren&ccedil;</h1>\n<h2>Tedavideki Zorluklar</h2>\n<p><strong>Biyofilm ve QS İlişkisi:</strong></p>\n<ul>\n<li>QS, biyofilm oluşumunun bir&ccedil;ok aşamasını (yapışma, matris &uuml;retimi, olgunlaşma) d&uuml;zenler <span class="citation">[5]</span>.</li>\n<li>Biyofilm i&ccedil;indeki bakteriler, planktonik (serbest y&uuml;zen) formlarına g&ouml;re antibiyotiklere ve konak bağışıklık sistemine karşı <strong>100-1000 kat daha diren&ccedil;lidir</strong>.</li>\n<li>Tıbbi cihaz kaynaklı enfeksiyonlar (kateterler, implantlar) genellikle biyofilm kaynaklıdır ve QS &ouml;nemli bir rol oynar.</li>\n</ul>\n<p><strong>Antibiyotik Direnci ve QS:</strong></p>\n<ul>\n<li>QS, bazı durumlarda doğrudan antibiyotik diren&ccedil; genlerinin (&ouml;rn. efluks pompaları) ekspresyonunu artırabilir.</li>\n<li>Biyofilm yapısı, antibiyotiklerin penetrasyonunu fiziksel olarak engelleyebilir.</li>\n<li>Biyofilm i&ccedil;indeki yavaş metabolizma da antibiyotik etkinliğini azaltır.</li>\n</ul>\n<img src="https://via.placeholder.com/500x250/94D2BD/001219?text=Biyofilm+Direnci" alt="Biyofilm ve antibiyotik direnci ilişkisi"></div>\n<div class="slide-footer">Biyofilm ve Diren&ccedil;</div>\n<div class="slide-number">9 / 15</div>\n</div>\n<div id="slide10" class="slide">\n<div class="slide-content">\n<h1>Tedavi Hedefi: Quorum Quenching (QQ)</h1>\n<h2>Bakteriyel İletişimi Bozmak</h2>\n<p>Antibiyotik direncindeki artış, yeni tedavi stratejilerine olan ihtiyacı artırmıştır. Quorum Quenching (QQ), bakterilerin QS sistemlerini hedef alarak enfeksiyonları kontrol etmeyi ama&ccedil;layan yenilik&ccedil;i bir yaklaşımdır <span class="citation">[9, 10]</span>.</p>\n<p><strong>QQ Stratejileri:</strong></p>\n<ul>\n<li><strong>Sinyal Sentezinin İnhibisyonu:</strong> Otoind&uuml;kleyici (AI) &uuml;retimini sağlayan enzimleri bloke etmek.</li>\n<li><strong>Sinyal Molek&uuml;llerinin Yıkımı:</strong> AI'ları par&ccedil;alayan enzimler (&ouml;rn. AHLazlar, Laktonazlar) kullanmak.</li>\n<li><strong>Sinyal Algılamanın Engellenmesi:</strong> AI'ların resept&ouml;rlere bağlanmasını engelleyen antagonist molek&uuml;ller kullanmak.</li>\n</ul>\n<p><strong>Avantajları:</strong> QQ stratejileri, bakterileri doğrudan &ouml;ld&uuml;rmek yerine iletişimlerini bozduğu i&ccedil;in, klasik antibiyotiklere kıyasla diren&ccedil; gelişimine daha az se&ccedil;ilim baskısı uygulama potansiyeline sahiptir <span class="citation">[10]</span>.</p>\n<img src="https://via.placeholder.com/550x250/E9D8A6/001219?text=Quorum+Quenching+Stratejileri" alt="Quorum Quenching Mekanizmaları"></div>\n<div class="slide-footer">Quorum Quenching</div>\n<div class="slide-number">10 / 15</div>\n</div>\n<div id="slide11" class="slide">\n<div class="slide-content">\n<h1>&Ouml;rnekler ve Klinik &Ouml;nem</h1>\n<h2>QS'in Tıptaki Yansımaları</h2>\n<p><strong><em>Pseudomonas aeruginosa:</em></strong></p>\n<ul>\n<li>İki ana AHL tabanlı QS sistemi (Las ve Rhl) ve PQS sistemi bulunur.</li>\n<li>Biyofilm oluşumu, proteaz, elastaz, ekzotoksin A gibi bir&ccedil;ok vir&uuml;lans fakt&ouml;r&uuml;n&uuml; kontrol eder <span class="citation">[7]</span>.</li>\n<li>&Ouml;zellikle kistik fibrozisli hastalarda kronik akciğer enfeksiyonlarının ve ventilat&ouml;r ilişkili pn&ouml;moninin &ouml;nemli bir etkenidir. QS inhibit&ouml;rleri bu bakteriye karşı potansiyel tedavi ajanı olarak araştırılmaktadır.</li>\n</ul>\n<p><strong><em>Staphylococcus aureus:</em></strong></p>\n<ul>\n<li>Agr sistemi (AIP tabanlı) en bilinen QS sistemidir.</li>\n<li>Hemolizinler, toksinler (TSST-1), proteazlar gibi vir&uuml;lans fakt&ouml;rlerini ve biyofilm oluşumunu d&uuml;zenler <span class="citation">[8]</span>.</li>\n<li>MRSA (Metisiline Diren&ccedil;li S. aureus) enfeksiyonlarının tedavisindeki zorluklar, Agr sistemini hedef alan QQ yaklaşımlarına ilgiyi artırmıştır.</li>\n</ul>\n<img src="https://via.placeholder.com/600x250/005F73/FFFFFF?text=P.+aeruginosa+%26+S.+aureus" alt="Pseudomonas aeruginosa ve Staphylococcus aureus"></div>\n<div class="slide-footer">&Ouml;rnekler</div>\n<div class="slide-number">11 / 15</div>\n</div>\n<div id="slide12" class="slide">\n<div class="slide-content">\n<h1>Zorluklar ve Gelecek Perspektifleri</h1>\n<h2>QS Araştırmalarının Yarını</h2>\n<p><strong>Mevcut Zorluklar:</strong></p>\n<ul>\n<li><strong>Karmaşıklık:</strong> Bir&ccedil;ok bakteride birden fazla ve birbiriyle etkileşen QS sistemi bulunur.</li>\n<li><strong>Spesifiklik:</strong> Patojenlere &ouml;zg&uuml; QS sistemlerini hedeflerken, yararlı kommensal bakterilerin QS'ini bozmamak &ouml;nemlidir.</li>\n<li><strong>İla&ccedil; Geliştirme:</strong> Etkili, stabil ve d&uuml;ş&uuml;k toksisiteye sahip QQ ajanlarının geliştirilmesi ve klinik &ccedil;alışmalara taşınması zordur.</li>\n<li><strong>Diren&ccedil; Potansiyeli:</strong> QQ ajanlarına karşı da zamanla diren&ccedil; gelişebilir.</li>\n</ul>\n<p><strong>Gelecek Y&ouml;nelimleri:</strong></p>\n<ul>\n<li>Yeni ve daha spesifik QQ molek&uuml;llerinin keşfi ve tasarımı.</li>\n<li>QS inhibit&ouml;rlerinin antibiyotiklerle kombine kullanımı (sinerjistik etki).</li>\n<li>QS'in konak-patojen etkileşimlerindeki rol&uuml;n&uuml;n daha derinlemesine anlaşılması.</li>\n<li>QS tabanlı tanı y&ouml;ntemlerinin geliştirilmesi.</li>\n</ul>\n</div>\n<div class="slide-footer">Gelecek</div>\n<div class="slide-number">12 / 15</div>\n</div>\n<div id="slide13" class="slide">\n<div class="slide-content">\n<h1>Sonu&ccedil;</h1>\n<h2>&Ouml;nemli &Ccedil;ıkarımlar</h2>\n<ul>\n<li>Quorum Sensing, bakterilerin pop&uuml;lasyon yoğunluğuna bağlı olarak gen ekspresyonunu koordine etmelerini sağlayan kritik bir iletişim mekanizmasıdır.</li>\n<li>Patojen bakterilerde vir&uuml;lans fakt&ouml;rlerinin &uuml;retimi ve biyofilm oluşumu gibi s&uuml;re&ccedil;lerde merkezi bir rol oynar.</li>\n<li>QS, tıbbi mikrobiyolojide enfeksiyonların anlaşılması ve tedavisi i&ccedil;in &ouml;nemli bir hedeftir.</li>\n<li>Quorum Quenching (QQ) stratejileri, antibiyotik direncine karşı m&uuml;cadelede umut verici, yenilik&ccedil;i bir yaklaşım sunmaktadır.</li>\n<li>Bu alandaki araştırmalar, enfeksiyon hastalıklarıyla m&uuml;cadelede yeni kapılar a&ccedil;ma potansiyeline sahiptir.</li>\n</ul>\n<img src="https://via.placeholder.com/500x250/0A9396/FFFFFF?text=&Ouml;zet+ve+Anahtar+Noktalar" alt="Sunum &ouml;zeti"></div>\n<div class="slide-footer">Sonu&ccedil;</div>\n<div class="slide-number">13 / 15</div>\n</div>\n<div id="slide14" class="slide">\n<div class="slide-content" style="text-align: left;">\n<h1>Referanslar</h1>\n<p>Bu sunumda kullanılan bilgilerin dayandığı temel kaynaklar (&Ouml;rnek Referanslar):</p>\n<ol class="references">\n<li>Miller, M. B., &amp; Bassler, B. L. (2001). Quorum sensing in bacteria. <em>Annual review of microbiology, 55</em>(1), 165-199.</li>\n<li>Fuqua, C., Parsek, M. R., &amp; Greenberg, E. P. (2001). Regulation of gene expression by cell-to-cell communication: acyl-homoserine lactone quorum sensing. <em>Annual Reviews in Genetics, 35</em>(1), 439-468.</li>\n<li>Reading, N. C., &amp; Sperandio, V. (2006). Quorum sensing: the many languages of bacteria. <em>FEMS microbiology letters, 254</em>(1), 1-11.</li>\n<li>Xavier, K. B., &amp; Bassler, B. L. (2003). LuxS quorum sensing: more than just a numbers game. <em>Current opinion in microbiology, 6</em>(2), 191-197.</li>\n<li>Davies, D. G., Parsek, M. R., Pearson, J. P., Iglewski, B. H., Costerton, J. W., &amp; Greenberg, E. P. (1998). The involvement of cell-to-cell signals in the development of a bacterial biofilm. <em>Science, 280</em>(5361), 295-298.</li>\n<li>Rutherford, S. T., &amp; Bassler, B. L. (2012). Bacterial quorum sensing: its role in virulence and possibilities for its control. <em>Cold Spring Harbor perspectives in medicine, 2</em>(11), a012427.</li>\n<li>Lee, J., &amp; Zhang, L. (2015). The hierarchy quorum sensing network in Pseudomonas aeruginosa. <em>Protein &amp; cell, 6</em>(1), 26-41.</li>\n<li>Novick, R. P. (2003). Autoinduction and signal transduction in the regulation of staphylococcal virulence. <em>Molecular microbiology, 48</em>(6), 1429-1449.</li>\n<li>Dong, Y. H., Wang, L. H., Xu, J. L., Zhang, H. B., Zhang, X. F., &amp; Zhang, L. H. (2001). Quenching quorum-sensing-dependent bacterial infection by an N-acyl homoserine lactonase. <em>Nature, 411</em>(6839), 813-817.</li>\n<li>LaSarre, B., &amp; Federle, M. J. (2013). Exploiting quorum sensing to confuse bacterial pathogens. <em>Microbiology and Molecular Biology Reviews, 77</em>(1), 73-111.</li>\n</ol>\n<p style="font-size: 0.9em; margin-top: 20px;">Not: Bu referans listesi konunun temelini oluşturan &ouml;nemli makalelerden se&ccedil;ilmiştir. Daha detaylı ve g&uuml;ncel literat&uuml;r taraması &ouml;nerilir.</p>\n</div>\n<div class="slide-footer">Referanslar</div>\n<div class="slide-number">14 / 15</div>\n</div>\n<div id="slide15" class="slide">\n<div class="slide-content">\n<h1>Teşekk&uuml;rler</h1>\n<h2>Sorularınız?</h2>\n<p>Dinlediğiniz i&ccedil;in teşekk&uuml;r ederim.</p>\n<p>Varsa sorularınızı alabilirim.</p>\n<p style="margin-top: 30px; font-size: 1.2em;">İletişim: [E-posta Adresiniz]</p>\n<img src="https://via.placeholder.com/400x200/0A9396/FFFFFF?text=Soru+%26+Cevap" alt="Soru işareti ikonu"></div>\n<div class="slide-footer">Teşekk&uuml;r</div>\n<div class="slide-number">15 / 15</div>\n</div>\n</div>\n<div class="navigation"><button id="prevBtn" class="nav-button" disabled="disabled">&Ouml;nceki</button> <span id="slideCounter" style="margin: 0 10px; color: var(--text-color); font-weight: bold;">1 / 15</span> <button id="nextBtn" class="nav-button">Sonraki</button></div>	2	2025-04-23 12:43:30.35+00	2025-04-23 12:43:30.35+00	\N
13	aaa	<p>aaaaaaa</p>	4	2025-04-23 17:50:07.339+00	2025-04-23 17:50:07.339+00	\N
14	hbgughbuhbuhbuhb	<p>vggyvygvygvy</p>	2	2025-04-23 21:01:57.238+00	2025-04-23 21:01:57.238+00	\N
15	deneme alt konu başlığı 2 	<p>jkngqvejrgvnaweljrgnvwaeljgtonqeorjgvnerjtgn</p>\n<p>jkngqvejrgvnaweljrgnvwaeljgtonqeorjgvnerjtgn</p>\n<p>jkngqvejrgvnaweljrgnvwaeljgtonqeorjgvnerjtgn</p>\n<p>jkngqvejrgvnaweljrgnvwaeljgtonqeorjgvnerjtgn</p>\n<p>jkngqvejrgvnaweljrgnvwaeljgtonqeorjgvnerjtgn</p>\n<p>jkngqvejrgvnaweljrgnvwaeljgtonqeorjgvnerjtgn</p>\n<p>jkngqvejrgvnaweljrgnvwaeljgtonqeorjgvnerjtgn</p>	3	2025-04-24 08:41:26.076+00	2025-04-24 08:41:26.076+00	\N
16	YENİ KONU	<p>AAAAAAA</p>	3	2025-04-24 08:58:50.678+00	2025-04-24 08:58:50.678+00	\N
17	yeni konu	<p>askdmfaojdfna</p>\n<p>askdmfaojdfna</p>\n<p>askdmfaojdfna</p>	3	2025-04-24 09:10:00.327+00	2025-04-24 09:10:00.327+00	\N
18	Yeni konu	<p>adsdasd</p>	3	2025-04-24 09:16:03.469+00	2025-04-24 09:16:03.469+00	\N
19	aaaa	<p>aaaaaaaaa</p>	3	2025-04-24 09:50:02.381+00	2025-04-24 09:50:02.381+00	\N
20	aaaa	<p>adsda</p>\n<p>adsda</p>\n<p>adsda</p>\n<p>adsda</p>\n<p>adsda</p>	3	2025-04-24 09:52:00.567+00	2025-04-24 09:52:00.567+00	\N
21	SSSS	<p>SSSS</p>	1	2025-04-24 09:57:01.355+00	2025-04-24 09:57:01.355+00	\N
22	Stafilokoklar	<h1>Stafilokoklar</h1>\n<p class="highlight">Tıp &Ouml;ğrencileri İ&ccedil;in Derlenmiştir</p>\n<p><strong>Stafilokoklar</strong>, Gram-pozitif, katalaz pozitif, &uuml;z&uuml;m salkımı şeklinde k&uuml;melenme g&ouml;steren kok bakterilerdir. İnsanlarda en sık enfeksiyon oluşturan t&uuml;rleri <strong>Staphylococcus aureus</strong> ve koag&uuml;laz negatif stafilokoklardır.</p>\n<div class="note-box"><strong>Akılda Kalsın:</strong> Stafilokoklar Gram-pozitif, katalaz pozitif ve k&uuml;melenmiş koklardır. <br>S. aureus koag&uuml;laz pozitiftir ve altın sarısı koloni oluşturur.</div>\n<hr>\n<h2>Genel &Ouml;zellikleri</h2>\n<ul>\n<li>Gram-pozitif koklardır.</li>\n<li>Katalaz pozitiftirler (streptokoklardan ayrılır).</li>\n<li>Fak&uuml;ltatif anaerobiktirler.</li>\n<li>&Uuml;z&uuml;m salkımı şeklinde k&uuml;melenerek dizilirler.</li>\n<li>&Ccedil;oğunlukla deride ve mukozalarda kolonize olurlar.</li>\n</ul>\n<h2>&Ouml;nemli T&uuml;rleri</h2>\n<h3>1. Staphylococcus aureus</h3>\n<ul>\n<li><strong>Koag&uuml;laz pozitiftir.</strong></li>\n<li>Protein A, teikoik asit ve &ccedil;eşitli toksinler &uuml;retir.</li>\n<li>Beta hemoliz yapar.</li>\n<li>Altın sarısı koloniler oluşturur (&ouml;zellikle %5 koyun kanlı agarda).</li>\n</ul>\n<h4>Başlıca Hastalıklar:</h4>\n<ul>\n<li>Cilt ve yumuşak doku enfeksiyonları (sel&uuml;lit, impetigo, abse)</li>\n<li>Bakteriyemi ve sepsis</li>\n<li>Endokardit</li>\n<li>Osteomiyelit ve septik artrit</li>\n<li>Gıda zehirlenmesi (enterotoksin ile)</li>\n<li>Toksik şok sendromu (TSS toksini ile)</li>\n</ul>\n<h3>2. Koag&uuml;laz Negatif Stafilokoklar (KNS)</h3>\n<ul>\n<li><strong>&Ouml;zellikle Staphylococcus epidermidis ve Staphylococcus saprophyticus</strong> &ouml;nemlidir.</li>\n<li>Genellikle biyofilm oluşturarak kateter, protez gibi yabancı cisim enfeksiyonlarına neden olurlar.</li>\n<li><strong>S. saprophyticus</strong> &ouml;zellikle gen&ccedil; kadınlarda idrar yolu enfeksiyonlarına sebep olur.</li>\n</ul>\n<hr>\n<h2>Tanı</h2>\n<ul>\n<li>Gram boyası: Mor renkli, k&uuml;melenmiş koklar g&ouml;zlenir.</li>\n<li>Katalaz testi: Pozitif sonu&ccedil; verir.</li>\n<li>Koag&uuml;laz testi: <em>S. aureus</em> pozitif; diğerleri negatif.</li>\n<li>K&uuml;lt&uuml;r: Sarı pigment (S. aureus) ve beta hemoliz g&ouml;zlemlenebilir.</li>\n</ul>\n<div class="warning-box"><strong>Uyarı:</strong> MRSA suşları standart antibiyotiklere diren&ccedil;lidir. <br>Hastane ve toplum kaynaklı enfeksiyonlarda b&uuml;y&uuml;k &ouml;neme sahiptir.</div>\n<h2>Diren&ccedil; ve Tedavi</h2>\n<ul>\n<li><strong>Metisilin diren&ccedil;li Staphylococcus aureus (MRSA)</strong> &ouml;nemli bir sorundur.</li>\n<li>MRSA enfeksiyonlarında <strong>vankomisin</strong> veya <strong>linezolid</strong> gibi antibiyotikler kullanılır.</li>\n<li>Hassas suşlarda ise <strong>penisilinaza diren&ccedil;li penisilinler</strong> (&ouml;rneğin nafsilin) tercih edilir.</li>\n</ul>\n<footer>&copy; 2025 Tıp Fak&uuml;ltesi Ders Notları - Stafilokoklar</footer>	14	2025-04-26 19:30:52.193+00	2025-04-26 19:30:52.193+00	\N
7	Antikorların Yapısı zzzz	<p>Antikorlar (imm&uuml;noglobulinler), B lenfositleri tarafından &uuml;retilen ve antijenlere &ouml;zg&uuml; olarak bağlanan Y şeklinde proteinlerdir...</p>	2	2025-04-23 10:26:09.383+00	2025-05-06 13:11:20.937+00	\N
\.


--
-- Data for Name: QuestionAttempts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."QuestionAttempts" (id, "userId", "questionId", "selectedAnswer", "isCorrect", "createdAt", "updatedAt") FROM stdin;
2	1	16	C	f	2025-04-23 14:05:15.12+00	2025-04-23 14:05:15.12+00
3	1	22	A	f	2025-04-23 14:07:24.889+00	2025-04-23 14:07:24.889+00
4	1	16	B	t	2025-04-23 14:07:30.524+00	2025-04-23 14:07:30.524+00
5	1	19	D	f	2025-04-23 14:07:33.326+00	2025-04-23 14:07:33.326+00
6	1	23	B	f	2025-04-23 14:07:36.366+00	2025-04-23 14:07:36.366+00
7	1	25	C	f	2025-04-23 14:07:39.026+00	2025-04-23 14:07:39.026+00
8	1	20	B	t	2025-04-23 14:07:44.536+00	2025-04-23 14:07:44.536+00
9	1	26	D	t	2025-04-23 14:07:53.546+00	2025-04-23 14:07:53.546+00
10	1	24	B	f	2025-04-23 14:07:55.859+00	2025-04-23 14:07:55.859+00
11	1	18	C	f	2025-04-23 14:07:58.566+00	2025-04-23 14:07:58.566+00
12	1	17	C	t	2025-04-23 14:08:02.414+00	2025-04-23 14:08:02.414+00
13	1	22	C	t	2025-04-23 14:25:18.462+00	2025-04-23 14:25:18.462+00
14	1	16	B	t	2025-04-23 14:25:26.645+00	2025-04-23 14:25:26.645+00
15	1	19	C	t	2025-04-23 14:25:34.269+00	2025-04-23 14:25:34.269+00
16	1	23	A	t	2025-04-23 14:25:46.594+00	2025-04-23 14:25:46.594+00
17	1	25	B	t	2025-04-23 14:25:50.934+00	2025-04-23 14:25:50.934+00
18	1	20	B	t	2025-04-23 14:25:54.761+00	2025-04-23 14:25:54.761+00
19	1	26	D	t	2025-04-23 14:25:59.319+00	2025-04-23 14:25:59.319+00
20	1	24	C	t	2025-04-23 14:26:03.464+00	2025-04-23 14:26:03.464+00
21	1	18	B	t	2025-04-23 14:26:07.565+00	2025-04-23 14:26:07.565+00
22	1	17	C	t	2025-04-23 14:26:13.356+00	2025-04-23 14:26:13.356+00
27	1	22	B	f	2025-04-23 14:46:23.236+00	2025-04-23 14:46:23.236+00
28	1	23	A	t	2025-04-23 15:00:09.956+00	2025-04-23 15:00:09.956+00
29	1	20	A	f	2025-04-23 15:00:16.803+00	2025-04-23 15:00:16.803+00
30	1	16	C	f	2025-04-23 15:00:26.904+00	2025-04-23 15:00:26.904+00
31	1	18	B	t	2025-04-23 15:01:10.315+00	2025-04-23 15:01:10.315+00
32	1	23	A	t	2025-04-23 15:01:14.917+00	2025-04-23 15:01:14.917+00
33	1	19	C	t	2025-04-23 15:01:19.38+00	2025-04-23 15:01:19.38+00
34	1	22	C	t	2025-04-23 15:01:23.918+00	2025-04-23 15:01:23.918+00
35	1	24	C	t	2025-04-23 15:01:29.252+00	2025-04-23 15:01:29.252+00
36	1	26	D	t	2025-04-23 15:01:35.04+00	2025-04-23 15:01:35.04+00
37	1	20	B	t	2025-04-23 15:01:38.32+00	2025-04-23 15:01:38.32+00
38	1	25	B	t	2025-04-23 15:01:41.756+00	2025-04-23 15:01:41.756+00
39	1	17	C	t	2025-04-23 15:01:45.558+00	2025-04-23 15:01:45.558+00
40	1	16	B	t	2025-04-23 15:01:49.646+00	2025-04-23 15:01:49.646+00
41	1	24	C	t	2025-04-23 15:05:34.115+00	2025-04-23 15:05:34.115+00
42	1	23	D	f	2025-04-23 15:05:38.304+00	2025-04-23 15:05:38.304+00
43	1	20	E	f	2025-04-23 15:05:40.743+00	2025-04-23 15:05:40.743+00
44	1	26	D	t	2025-04-23 15:05:42.942+00	2025-04-23 15:05:42.942+00
45	1	16	D	f	2025-04-23 15:05:45.271+00	2025-04-23 15:05:45.271+00
46	1	18	E	f	2025-04-23 15:05:48.093+00	2025-04-23 15:05:48.093+00
47	1	22	C	t	2025-04-23 15:05:50.648+00	2025-04-23 15:05:50.648+00
48	1	25	D	f	2025-04-23 15:05:53.041+00	2025-04-23 15:05:53.041+00
49	1	19	D	f	2025-04-23 15:05:55.06+00	2025-04-23 15:05:55.06+00
50	1	17	E	f	2025-04-23 15:05:57.258+00	2025-04-23 15:05:57.258+00
51	1	16	A	f	2025-04-23 15:13:02.955+00	2025-04-23 15:13:02.955+00
52	1	16	D	f	2025-04-23 15:15:14.924+00	2025-04-23 15:15:14.924+00
53	1	16	E	f	2025-04-23 15:15:25.77+00	2025-04-23 15:15:25.77+00
54	1	16	C	f	2025-04-23 15:15:38.827+00	2025-04-23 15:15:38.827+00
55	1	16	A	f	2025-04-23 15:16:04.385+00	2025-04-23 15:16:04.385+00
56	1	20	E	f	2025-04-23 15:16:48.185+00	2025-04-23 15:16:48.185+00
57	1	24	B	f	2025-04-23 15:19:43.959+00	2025-04-23 15:19:43.959+00
58	1	20	C	f	2025-04-23 15:22:46.896+00	2025-04-23 15:22:46.896+00
61	1	26	B	f	2025-04-23 18:19:49.503+00	2025-04-23 18:19:49.503+00
62	1	19	C	t	2025-04-23 18:43:23.67+00	2025-04-23 18:43:23.67+00
63	6	22	C	t	2025-04-23 19:00:58.092+00	2025-04-23 19:00:58.092+00
64	1	23	A	t	2025-04-23 21:50:20.766+00	2025-04-23 21:50:20.766+00
65	7	17	C	t	2025-04-24 09:33:04.558+00	2025-04-24 09:33:04.558+00
66	7	22	C	t	2025-04-24 09:33:13.899+00	2025-04-24 09:33:13.899+00
67	7	25	B	t	2025-04-24 09:33:18.229+00	2025-04-24 09:33:18.229+00
68	7	16	B	t	2025-04-24 09:33:33.719+00	2025-04-24 09:33:33.719+00
69	7	26	D	t	2025-04-24 09:33:37.641+00	2025-04-24 09:33:37.641+00
70	7	19	C	t	2025-04-24 09:33:40.696+00	2025-04-24 09:33:40.696+00
71	7	18	B	t	2025-04-24 09:33:44.654+00	2025-04-24 09:33:44.654+00
72	7	23	A	t	2025-04-24 09:34:04.857+00	2025-04-24 09:34:04.857+00
73	7	20	B	t	2025-04-24 09:34:22.337+00	2025-04-24 09:34:22.337+00
74	7	25	B	t	2025-04-24 09:34:28.651+00	2025-04-24 09:34:28.651+00
75	7	24	C	t	2025-04-24 09:34:42.802+00	2025-04-24 09:34:42.802+00
76	7	18	B	t	2025-04-24 09:34:51.948+00	2025-04-24 09:34:51.948+00
77	7	17	C	t	2025-04-24 09:34:58.506+00	2025-04-24 09:34:58.506+00
78	1	17	C	t	2025-04-26 08:14:31.257+00	2025-04-26 08:14:31.257+00
79	1	19	C	t	2025-04-26 08:15:39.547+00	2025-04-26 08:15:39.547+00
80	1	16	E	f	2025-04-26 08:21:38.558+00	2025-04-26 08:21:38.558+00
81	1	23	A	t	2025-04-26 08:22:31.54+00	2025-04-26 08:22:31.54+00
82	1	23	A	t	2025-04-26 10:12:12.848+00	2025-04-26 10:12:12.848+00
83	1	26	B	f	2025-04-26 10:12:17.593+00	2025-04-26 10:12:17.593+00
84	1	26	B	f	2025-04-26 10:18:06.602+00	2025-04-26 10:18:06.602+00
85	1	25	B	t	2025-04-26 10:29:28.685+00	2025-04-26 10:29:28.685+00
86	1	17	C	t	2025-04-26 10:34:35.664+00	2025-04-26 10:34:35.664+00
87	1	16	D	f	2025-04-26 10:34:43.565+00	2025-04-26 10:34:43.565+00
88	1	24	D	f	2025-04-26 10:46:03.305+00	2025-04-26 10:46:03.305+00
89	1	18	C	f	2025-04-26 11:59:02.609+00	2025-04-26 11:59:02.609+00
90	1	20	B	t	2025-04-26 12:48:30.14+00	2025-04-26 12:48:30.14+00
91	1	25	B	t	2025-04-26 12:48:41.412+00	2025-04-26 12:48:41.412+00
92	11	26	C	f	2025-04-26 14:42:15.686+00	2025-04-26 14:42:15.686+00
93	11	25	B	t	2025-04-26 14:42:38.419+00	2025-04-26 14:42:38.419+00
94	11	19	C	t	2025-04-26 14:42:46.115+00	2025-04-26 14:42:46.115+00
95	11	16	B	t	2025-04-26 14:43:12.524+00	2025-04-26 14:43:12.524+00
96	11	22	C	t	2025-04-26 14:43:20.996+00	2025-04-26 14:43:20.996+00
97	11	24	C	t	2025-04-26 14:43:29.22+00	2025-04-26 14:43:29.22+00
98	11	17	C	t	2025-04-26 14:43:35.471+00	2025-04-26 14:43:35.471+00
99	11	23	D	f	2025-04-26 14:43:43.411+00	2025-04-26 14:43:43.411+00
100	11	18	B	t	2025-04-26 14:43:48.685+00	2025-04-26 14:43:48.685+00
101	11	20	B	t	2025-04-26 14:43:54.091+00	2025-04-26 14:43:54.091+00
102	1	16	C	f	2025-04-26 15:30:36.187+00	2025-04-26 15:30:36.187+00
103	1	25	C	f	2025-04-26 15:30:41.733+00	2025-04-26 15:30:41.733+00
107	1	19	A	f	2025-04-27 13:08:35.2+00	2025-04-27 13:08:35.2+00
109	1	26	B	f	2025-04-29 16:23:28.091+00	2025-04-29 16:23:28.091+00
110	1	17	C	t	2025-05-02 19:17:21.849+00	2025-05-02 19:17:21.849+00
111	1	24	C	t	2025-05-05 18:14:33.15+00	2025-05-05 18:14:33.15+00
112	1	22	B	f	2025-05-05 21:16:09.875+00	2025-05-05 21:16:09.875+00
113	1	18	B	t	2025-05-05 21:17:49.959+00	2025-05-05 21:17:49.959+00
114	1	22	B	f	2025-05-05 21:17:55.153+00	2025-05-05 21:17:55.153+00
115	1	26	B	f	2025-05-05 21:18:05.095+00	2025-05-05 21:18:05.095+00
116	1	20	B	t	2025-05-06 08:14:35.77+00	2025-05-06 08:14:35.77+00
117	1	25	B	t	2025-05-06 08:14:45.617+00	2025-05-06 08:14:45.617+00
118	1	16	C	f	2025-05-06 10:15:46.283+00	2025-05-06 10:15:46.283+00
119	1	17	D	f	2025-05-06 12:08:18.482+00	2025-05-06 12:08:18.482+00
120	1	18	D	f	2025-05-06 12:08:25.737+00	2025-05-06 12:08:25.737+00
121	1	24	B	f	2025-05-06 12:08:29.074+00	2025-05-06 12:08:29.074+00
122	1	22	C	t	2025-05-06 12:45:03.389+00	2025-05-06 12:45:03.389+00
123	1	25	B	t	2025-05-06 12:45:09.663+00	2025-05-06 12:45:09.663+00
124	1	17	C	t	2025-05-06 12:45:13.558+00	2025-05-06 12:45:13.558+00
125	1	23	A	t	2025-05-06 12:45:21.3+00	2025-05-06 12:45:21.3+00
126	1	26	C	f	2025-05-06 12:45:24.677+00	2025-05-06 12:45:24.677+00
127	1	16	A	f	2025-05-06 12:45:28.769+00	2025-05-06 12:45:28.769+00
128	1	24	B	f	2025-05-06 12:45:31.674+00	2025-05-06 12:45:31.674+00
129	1	20	D	f	2025-05-06 12:45:41.073+00	2025-05-06 12:45:41.073+00
130	1	27	B	f	2025-05-06 12:45:43.528+00	2025-05-06 12:45:43.528+00
131	1	18	A	f	2025-05-06 12:45:45.814+00	2025-05-06 12:45:45.814+00
132	1	19	B	f	2025-05-06 12:45:50.174+00	2025-05-06 12:45:50.174+00
133	1	17	C	t	2025-05-06 13:09:24.017+00	2025-05-06 13:09:24.017+00
134	1	18	C	f	2025-05-06 13:09:29.778+00	2025-05-06 13:09:29.778+00
135	1	24	A	f	2025-05-06 13:09:32.713+00	2025-05-06 13:09:32.713+00
136	1	23	A	t	2025-05-06 13:15:03.277+00	2025-05-06 13:15:03.277+00
137	1	27	B	f	2025-05-06 13:15:41.066+00	2025-05-06 13:15:41.066+00
138	1	19	D	f	2025-05-06 13:15:45.025+00	2025-05-06 13:15:45.025+00
139	1	20	C	f	2025-05-06 13:15:46.908+00	2025-05-06 13:15:46.908+00
140	1	23	A	t	2025-05-06 13:17:09.605+00	2025-05-06 13:17:09.605+00
141	1	16	C	f	2025-05-06 16:19:22.778+00	2025-05-06 16:19:22.778+00
142	1	17	D	f	2025-05-06 18:29:57.379+00	2025-05-06 18:29:57.379+00
143	1	26	C	f	2025-05-06 18:33:28.011+00	2025-05-06 18:33:28.011+00
144	1	27	A	f	2025-05-06 21:34:36.802+00	2025-05-06 21:34:36.802+00
145	1	25	D	f	2025-05-06 21:34:40.452+00	2025-05-06 21:34:40.452+00
146	1	26	A	f	2025-05-06 21:34:43.24+00	2025-05-06 21:34:43.24+00
147	1	16	C	f	2025-05-06 21:34:48.096+00	2025-05-06 21:34:48.096+00
148	1	16	C	f	2025-05-06 21:45:20.546+00	2025-05-06 21:45:20.546+00
149	1	26	B	f	2025-05-06 21:45:42.555+00	2025-05-06 21:45:42.555+00
150	1	17	A	f	2025-05-06 21:45:47.271+00	2025-05-06 21:45:47.271+00
151	1	19	A	f	2025-05-06 21:46:42.714+00	2025-05-06 21:46:42.714+00
152	1	22	C	t	2025-05-06 21:46:48.01+00	2025-05-06 21:46:48.01+00
153	1	27	B	f	2025-05-06 21:46:52.876+00	2025-05-06 21:46:52.876+00
154	1	23	B	f	2025-05-06 21:46:58.458+00	2025-05-06 21:46:58.458+00
155	1	23	A	t	2025-05-06 21:53:13.634+00	2025-05-06 21:53:13.634+00
156	1	27	C	f	2025-05-06 21:53:21.776+00	2025-05-06 21:53:21.776+00
157	1	26	B	f	2025-05-06 21:53:26.559+00	2025-05-06 21:53:26.559+00
158	1	24	A	f	2025-05-06 21:53:31.042+00	2025-05-06 21:53:31.042+00
159	1	25	A	f	2025-05-06 21:53:34.431+00	2025-05-06 21:53:34.431+00
160	1	19	C	t	2025-05-06 21:53:39.068+00	2025-05-06 21:53:39.068+00
161	1	18	C	f	2025-05-06 21:53:42.454+00	2025-05-06 21:53:42.454+00
162	1	16	A	f	2025-05-06 21:53:46.136+00	2025-05-06 21:53:46.136+00
163	1	17	A	f	2025-05-06 21:53:48.66+00	2025-05-06 21:53:48.66+00
164	1	20	A	f	2025-05-06 21:53:51.529+00	2025-05-06 21:53:51.529+00
165	1	22	A	f	2025-05-06 21:53:54.805+00	2025-05-06 21:53:54.805+00
166	1	27	A	f	2025-05-06 21:53:57.764+00	2025-05-06 21:53:57.764+00
167	1	23	A	t	2025-05-06 21:54:00.874+00	2025-05-06 21:54:00.874+00
168	1	24	C	t	2025-05-06 21:57:21.318+00	2025-05-06 21:57:21.318+00
169	1	19	C	t	2025-05-06 21:57:29.858+00	2025-05-06 21:57:29.858+00
170	1	23	A	t	2025-05-06 21:57:35.391+00	2025-05-06 21:57:35.391+00
171	1	22	C	t	2025-05-06 21:57:39.971+00	2025-05-06 21:57:39.971+00
172	1	26	D	t	2025-05-06 21:57:47.629+00	2025-05-06 21:57:47.629+00
173	1	16	B	t	2025-05-06 21:57:54.092+00	2025-05-06 21:57:54.092+00
174	1	27	D	t	2025-05-06 21:58:01.945+00	2025-05-06 21:58:01.945+00
175	1	23	A	t	2025-05-06 21:58:10.079+00	2025-05-06 21:58:10.079+00
176	1	22	C	t	2025-05-06 21:58:17.61+00	2025-05-06 21:58:17.61+00
177	1	20	E	f	2025-05-06 21:58:22.489+00	2025-05-06 21:58:22.489+00
178	1	18	C	f	2025-05-06 21:59:56.787+00	2025-05-06 21:59:56.787+00
179	1	25	C	f	2025-05-06 22:00:00.892+00	2025-05-06 22:00:00.892+00
180	1	16	A	f	2025-05-06 22:00:03.953+00	2025-05-06 22:00:03.953+00
181	1	19	C	t	2025-05-06 22:00:14.055+00	2025-05-06 22:00:14.055+00
182	1	17	B	f	2025-05-06 22:05:30.873+00	2025-05-06 22:05:30.873+00
183	1	25	E	f	2025-05-06 22:05:33.542+00	2025-05-06 22:05:33.542+00
184	1	22	A	f	2025-05-06 22:05:35.507+00	2025-05-06 22:05:35.507+00
185	1	26	D	t	2025-05-06 22:05:37.564+00	2025-05-06 22:05:37.564+00
186	1	18	B	t	2025-05-06 22:05:39.664+00	2025-05-06 22:05:39.664+00
187	1	23	A	t	2025-05-06 22:05:41.995+00	2025-05-06 22:05:41.995+00
188	1	27	D	t	2025-05-06 22:05:44.333+00	2025-05-06 22:05:44.333+00
189	1	24	C	t	2025-05-06 22:05:51.785+00	2025-05-06 22:05:51.785+00
190	1	23	C	f	2025-05-06 22:13:52.261+00	2025-05-06 22:13:52.261+00
191	1	24	C	t	2025-05-06 22:17:55.161+00	2025-05-06 22:17:55.161+00
192	1	26	B	f	2025-05-06 22:17:59.25+00	2025-05-06 22:17:59.25+00
193	1	17	C	t	2025-05-06 22:19:52.328+00	2025-05-06 22:19:52.328+00
194	1	18	B	t	2025-05-06 22:19:58.27+00	2025-05-06 22:19:58.27+00
195	1	24	C	t	2025-05-06 22:20:04.676+00	2025-05-06 22:20:04.676+00
196	1	16	C	f	2025-05-06 22:22:14.576+00	2025-05-06 22:22:14.576+00
197	1	22	C	t	2025-05-06 22:28:01.012+00	2025-05-06 22:28:01.012+00
198	1	18	B	t	2025-05-07 12:36:27.185+00	2025-05-07 12:36:27.185+00
199	1	53	B	t	2025-05-07 19:47:18.14+00	2025-05-07 19:47:18.14+00
200	1	30	B	f	2025-05-07 19:49:52.084+00	2025-05-07 19:49:52.084+00
201	1	48	C	f	2025-05-07 19:49:55.34+00	2025-05-07 19:49:55.34+00
202	1	37	B	f	2025-05-07 19:49:59.087+00	2025-05-07 19:49:59.087+00
203	1	23	A	t	2025-05-07 20:03:58.285+00	2025-05-07 20:03:58.285+00
204	1	47	C	t	2025-05-07 20:08:05.545+00	2025-05-07 20:08:05.545+00
205	1	28	C	t	2025-05-08 04:40:34.395+00	2025-05-08 04:40:34.395+00
\.


--
-- Data for Name: Questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Questions" (id, text, "optionA", "optionB", "optionC", "optionD", "correctAnswer", difficulty, "topicId", "createdAt", "updatedAt", "optionE", "imageUrl", classification, explanation) FROM stdin;
17	Gram boyama yönteminde mor renk veren bakterilere ne ad verilir?	Gram Negatif	Aside Dirençli	Gram Pozitif	Spiroket	C	easy	3	2025-04-23 09:45:46.291+00	2025-04-23 09:45:46.291+00	Mikoplazma	https://example.com/images/gram_stain.jpg	Çıkmış Benzeri	\N
18	Bakterilerde konjugasyonun temel işlevi nedir?	Hücre bölünmesi	Genetik materyal aktarımı	Endospor oluşumu	Hareket	B	medium	3	2025-04-23 09:45:46.291+00	2025-04-23 09:45:46.291+00	Fagositoz	\N	Çalışma Sorusu	\N
19	Fotosentez nerede gerçekleşir?	Mitokondri	Ribozom	Kloroplast	Çekirdek	C	easy	1	2025-04-23 09:45:46.291+00	2025-04-23 09:45:46.291+00	Lizozom	https://example.com/images/chloroplast.png	Çalışma Sorusu	\N
20	Virolojinin ana konusu nedir?	Bakteriler	Virüsler	Mantarlar	Parazitler	B	easy	4	2025-04-23 09:47:32.254+00	2025-04-23 09:47:32.254+00	Prionlar	\N	Çalışma Sorusu	\N
22	<p>Hangisi Gram negatif bir bakteridir?</p>	Staphylococcus aureus	Streptococcus pyogenes	Escherichia coli	Enterococcus faecalis	C	easy	1	2025-04-23 13:20:35.253+00	2025-04-23 13:20:35.253+00	Listeria monocytogenes	\N	Çalışma Sorusu	\N
23	<p>HIV virüsünün hedef hücre yüzey reseptörü nedir?</p>	CD4	CD8	CD20	TLR4	A	medium	2	2025-04-23 13:20:35.253+00	2025-04-23 13:20:35.253+00	CCR7	\N	Çalışma Sorusu	\N
25	<p>Tüberküloz tanısında kullanılan boyama yöntemi hangisidir?</p>	Gram boyama	Ziehl-Neelsen boyası	Giemsa boyası	Wright boyası	B	easy	4	2025-04-23 13:20:35.253+00	2025-04-23 13:20:35.253+00	H&E boyası	\N	Çalışma Sorusu	\N
26	<p>Bir enfeksiyon hastasında prokalsitonin yüksekliği genellikle neyi gösterir?</p>	Viral enfeksiyon	Mantar enfeksiyonu	Parazitik enfeksiyon	Bakteriyel enfeksiyon	D	easy	5	2025-04-23 13:20:35.253+00	2025-04-23 13:20:35.253+00	Alerjik reaksiyon	\N	Çalışma Sorusu	\N
27	<p>Aaaaaaaa</p>	Aaa	Aaaa	Aaa	Doğru	D	medium	8	2025-04-27 13:38:41.187+00	2025-04-27 13:38:41.187+00	Ddds	\N	Çıkmış Benzeri	\N
16	<p>Aşağıdakilerden hangisi prokaryotik h&uuml;cre yapısına sahiptir? a</p>	Maya	Bakteri	Amip	Alg	B	easy	1	2025-04-23 09:45:46.291+00	2025-05-06 13:11:44.166+00	Mantar	\N	Çıkmış Benzeri	\N
24	<p>Beta-laktam antibiyotiklerin etki mekanizması nedir?</p>	Protein sentezini inhibe eder	DNA sentezini inhibe eder	Hücre duvarı sentezini inhibe eder	Folik asit sentezini inhibe eder	C	medium	3	2025-04-23 13:20:35.253+00	2025-05-06 13:18:16.159+00	RNA sentezini inhibe eder	\N	Çıkmış Benzeri	\N
28	Tozla Mücadele ile İlgili Uygulamalara İlişkin Tebliğ'e göre akciğer radyografisinin teknik kalitesini değerlendirmek amacıyla kullanılan;\nI. 1. Derece: İyi kalitede olan radyografi,\nII. 2. Derece: Kabul edilebilir, pnömokonyoz radyografisi sınıflandırmasını bozması muhtemel teknik hatası olmayan radyografi,\nIII. 3. Derece: Sınıflandırma amaçları için kabul edilemez olan radyografi\nderecelendirme kriterlerinden hangileri doğrudur?	Yalnız I	Yalnız III	I ve II	II ve III	C	medium	16	2025-05-07 16:03:28.202+00	2025-05-07 16:03:28.202+00	I, II ve III	\N	ÖSYM	\N
29	Biyolojik Etkenlere Maruziyet Risklerinin Önlenmesi Hakkında Yönetmelik'e göre işverenin yükümlülükleriyle ilgili aşağıdaki ifadelerden hangisi yanlıştır?	Biyolojik etkene olan maruziyetler, kazalar ve olaylarla ilgili kayıtları maruziyet sona erdikten sonra en az 30 yıl saklar.	Biyolojik etkenlerin ortama yayılmasından doğan ve insanda ciddi enfeksiyona veya hastalığa neden olabilecek kaza veya olayı, çalışanlara veya çalışan temsilcilerine derhâl bildirir.	İş yerinde biyolojik etkenlere maruziyet riskinin azaltılması için gerekli önlemleri alır.	İş yerinde çalışanların veya çalışan temsilcilerinin uygun ve yeterli eğitim almalarını sağlar ve gerekli bilgi ve talimatları verir.	A	medium	16	2025-05-07 16:06:16.348+00	2025-05-07 16:06:16.348+00	Biyolojik etkenlerle yapılan çalışmalarda, çalışanların çalışmalara başlamadan önce ve işin devamında düzenli aralıklarla sağlık gözetimine tabi tutulmalarını sağlar.	\N	ÖSYM	\N
30	Sağlık gözetimi kapsamında yapılan işe giriş muayenesiyle ilgili,\nI. Uygun işe yerleştirme amacıyla yapılır.\nII. Meslek hastalıklarından korunma bakımından birincil korunma ilkesine uygun muayenelerdir.\nIII. Kişinin işe uygunluğunun kararı yapacağı işin niteliğine göre değil, iş yerinin tehlike sınıfına göre verilir.\nifadelerinden hangileri doğrudur?	Yalnız I	Yalnız III	I ve II	II ve III	C	medium	16	2025-05-07 16:06:16.348+00	2025-05-07 16:06:16.348+00	I, II ve III	\N	ÖSYM	\N
31	İlkyardım Yönetmeliği'ne göre aşağıdakilerden hangisi, ilk yardımcı olacak kişilerin eğitim yeterliliklerinden biri değildir?	En az ilkokul veya ilköğretim okulu mezunu olması zorunludur.	Eğitim sonunda başarılı sayılmaları için, teorik ve uygulamalı sınavların her birinden, 100 tam puan üzerinden 75 puan almış olmaları şartı aranır.	Eğitim süresinin tamamına devam etmesi zorunludur.	İki defa sınava girmesine rağmen başarısız olan katılımcılara yetki belgesi verilmez.	B	medium	16	2025-05-07 16:06:16.348+00	2025-05-07 16:06:16.348+00	Sınavlarda başarılı olamayan katılımcılar 1 ay içerisinde tekrar sınava tabi tutulurlar.	\N	ÖSYM	\N
32	İşle ilişkili hastalıklar ve meslek hastalıklarıyla ilgili aşağıdaki ifadelerden hangisi yanlıştır?	İşle ilişkili hastalıklar toplum genelinde meslek hastalıklarına göre daha nadir görülür.	İşle ilişkili hastalıkların oluşumunda birden fazla faktör rol oynayabilir.	Meslek hastalıkları, iş yeri ortamında bulunan faktörlerin etkisiyle meydana gelen hastalıklardır.	Meslek hastalıkları geçici veya sürekli olabilir.	A	medium	16	2025-05-07 16:06:16.348+00	2025-05-07 16:06:16.348+00	İşle ilişkili hastalıklar çalışma koşulları nedeniyle doğal seyri değişebilen hastalıklardır.	\N	ÖSYM	\N
33	I. Lyme hastalığı\nII. Brusellozis\nIII. Şarbon\nÖSYM\nYukarıdaki bulaşıcı hastalıklardan hangileri zoonozdur?	Yalnız I	Yalnız II	I ve III	II ve III	E	medium	16	2025-05-07 16:07:17.196+00	2025-05-07 16:07:17.196+00	I, II ve III	\N	ÖSYM	\N
34	I. Siderozis\nII. Over kanseri\nIII. Larinks kanseri\nÖSYM\nYukarıdaki hastalıklardan hangileri asbest maruz kalımı sonucu oluşabilir?	Yalnız I	Yalnız III	I ve II	I ve III	E	medium	16	2025-05-07 16:07:17.196+00	2025-05-07 16:07:17.196+00	II ve III	\N	ÖSYM	\N
35	Çalışma Gücü ve Meslekte Kazanma Gücü Kaybı Oranı Tespit İşlemleri Yönetmeliği'ne göre pnömokonyozun meslek hastalığı sayılabilmesi için sigortalının, havasında promokonyoz yapacak yoğunluk ve nitelikte toz bulunan yer altı veya yer üstü iş yerlerinde kural olarak toplam en az kaç yıl çalışmış olması şarttır?	3	4	5	7	A	medium	16	2025-05-07 16:07:17.196+00	2025-05-07 16:07:17.196+00	10	\N	ÖSYM	\N
36	I. Alerjik etki\nII. Fibrotik etki\nIII. Karsinojenik etki\nÖSYM\nYukarıdakilerden hangileri iş yerinde maruz kalınan etkenlere bağlı olarak ortaya çıkan solunumla ilgili etkilerdendir?	Yalnız I	Yalnız II	I ve III	II ve III	E	medium	16	2025-05-07 16:07:17.196+00	2025-05-07 16:07:17.196+00	I, II ve III	\N	ÖSYM	\N
37	Mesleki solunum sistemi hastalığı olan bisinozis ile ilgili,\nI. Özellikle uzun süreden beri hayvancılık yapan çalışanlarda görülür.\nII. Tanısında; meslek öyküsü ve solunum fonksiyon testleri önem taşır.\nIII. Bisinozis hastalarının karakteristik şikâyetleri çoğunlukla işe başladıktan birkaç saat sonra gelişen nefes darlığı ve göğüste sıkışma hissidir.\nifadelerinden hangileri doğrudur?	Yalnız I	Yalnız II	I ve III	II ve III	D	medium	16	2025-05-07 16:07:17.196+00	2025-05-07 16:07:17.196+00	I, II ve III	\N	ÖSYM	\N
38	I. Kurşun\nII. Karbon disülfit\nIII. Kadmiyum\nÖSYM\nYukarıdaki kimyasal etkenlerden hangileri hipertansiyon için risk faktörüdür?	Yalnız I	Yalnız II	I ve III	II ve III	E	medium	16	2025-05-07 16:08:19.447+00	2025-05-07 16:08:19.447+00	I, II ve III	\N	ÖSYM	\N
39	Mesleki deri hastalıklarıyla ilgili,\nI. Mesleki deri hastalıklarının büyük bir kısmı kontakt dermatittir.\nII. Mesleksel kontakt dermatitin çoğunluğu ellerde görülür.\nIII. Kontakt ürtiker yalnızca immünolojik mekanizmalar sonucu ortaya çıkar.\nifadelerinden hangileri doğrudur?	Yalnız I	Yalnız II	Yalnız III	I ve II	D	medium	16	2025-05-07 16:08:19.447+00	2025-05-07 16:08:19.447+00	II ve III	\N	ÖSYM	\N
40	Tip II dekompresyon hastalığıyla ilgili,\nI. Parestezi görülebilir.\nII. Santral sinir sistemi etkilenebilir.\nIII. Osteonekroz görülebilir.\nifadelerinden hangileri doğrudur?	Yalnız I	Yalnız III	I ve II	II ve III	C	medium	16	2025-05-07 16:08:19.447+00	2025-05-07 16:08:19.447+00	I, II ve III	\N	ÖSYM	\N
41	Çalışma hayatında Hepatit B'ye yönelik aşı uygulamalarıyla ilgili,\nI. Sağlık çalışanları için önerilir.\nII. Tek doz uygulanır. ÖSYM\nIII. Hepatit B aşılanması aynı zamanda Hepatit E'ye karşı da koruyucudur.\nifadelerinden hangileri doğrudur?	Yalnız I	Yalnız II	I ve III	II ve III	A	medium	16	2025-05-07 16:08:19.447+00	2025-05-07 16:08:19.447+00	I, II ve III	\N	ÖSYM	\N
42	Brusellozis ile ilgili aşağıdaki ifadelerden hangisi yanlıştır?	Enfekte hayvanla cilt teması sonucu gelişebilir.	Klinik belirtileri; yüksek ateş, aşırı terleme ve eklem ağrılarıdır.	Kesin tanı tüberkülin testiyle konulur.	Besicilik ve veterinerlik işleri riskli işlerdendir.	C	medium	16	2025-05-07 16:08:19.447+00	2025-05-07 16:08:19.447+00	Enfekte aerosollerin solunmasıyla hastalık bulaşabilir.	\N	ÖSYM	\N
43	Aşağıdaki kanser türü - kanserojen etken eşleştirmelerinden hangisi yanlıştır?	Mesane kanseri - Kızılötesi ışınlar	Burun boşluğu kanseri - Krom (VI) bileşikleri	Böbrek kanseri - Trikloretilen	Akciğer kanseri - Radon	A	medium	16	2025-05-07 16:08:19.447+00	2025-05-07 16:08:19.447+00	Karaciğer anjiyosarkomu - Vinil klorür	\N	ÖSYM	\N
44	İş yerinde sürekli bilgisayar kullanan bir büro çalışanı; el, el bileği ve çevresinde ağrı, uyuşukluk, hissizlik, parestezi ve kuvvetsizlik şikâyetleriyle başvuruyor. Çalışanın yapılan duyu muayenesinde ilk üç parmak ve dördüncü parmak radial yarısı volar yüzlerinde hipoestezi saptanıyor.\nBu hastaya konulabilecek tanı aşağıdakilerden hangisi olabilir?	Karpal tünel sendromu	Tetik parmak	Gangliyon kist	El-kol vibrasyon sendromu	A	medium	16	2025-05-07 16:08:19.447+00	2025-05-07 16:08:19.447+00	Lateral epikondilit	\N	ÖSYM	\N
45	El-kol titreşimine bağlı gelişen beyaz parmak tablosuna ilişkin semptomlar aşağıdakilerden hangisinin varlığında artar?	Gürültü	Düşük basınç	UV radyasyon	Soğuk	D	medium	16	2025-05-07 16:08:19.447+00	2025-05-07 16:08:19.447+00	İyonizan radyasyon	\N	ÖSYM	\N
46	Çalışma Gücü ve Meslekte Kazanma Gücü Kaybı Oranı Tespit İşlemleri Yönetmeliği'ne göre gürültü zararlarının meslek hastalığı sayılabilmesi için bir kişinin;\nI. gürültülü işte en az 2 yıl çalışmış olması,\nII. yaşadığı konutta çevresel gürültüye maruz kalmış olması,\nIII. gürültü şiddeti sürekli olarak 85 desibelin üstünde olan işte en az 30 gün çalışmış olması\nşartlarından hangileri gerekir?	Yalnız I	Yalnız II	Yalnız III	I ve III	D	medium	16	2025-05-07 16:08:19.447+00	2025-05-07 16:08:19.447+00	II ve III	\N	ÖSYM	\N
47	Şiddetli karın ağrısıyla hekime başvuran 45 yaşındaki erkek hastanın 10 yıldır akümülatör endüstrisinde çalıştığı; son zamanlarda sık sık karın ağrısı, ağızda metalik tat, bulantı ve iştahsızlık öyküsü olduğu ve muayenesinde diş etlerinde renkli çizgilenme bulunduğu saptanıyor.\nBu hastanın maruz kaldığı madde aşağıdakilerden hangisidir?	Kömür	Mangan	Kurşun	Demir	C	medium	16	2025-05-07 16:08:19.447+00	2025-05-07 16:08:19.447+00	Asbest	\N	ÖSYM	\N
48	I. Tremor\nII. İşitme kaybı\nIII. Hafıza kaybı\nÖSYM\nCıva zehirlenmesi sonucunda yukarıdaki bulgulardan hangileri görülebilir?	Yalnız I	Yalnız II	I ve III	II ve III	E	medium	16	2025-05-07 16:09:33.025+00	2025-05-07 16:09:33.025+00	I, II ve III	\N	ÖSYM	\N
49	Kadmiyum metabolizmasıyla ilgili,\nI. Solunum sistemiyle absorbe edilebilir.\nII. Karaciğer ve böbreklerde birikir.\nIII. Vücuttan atılımı başlıca safra yoluyla olur.\nifadelerinden hangileri doğrudur?	Yalnız I	Yalnız III	I ve II	II ve III	C	medium	16	2025-05-07 16:09:33.025+00	2025-05-07 16:09:33.025+00	I, II ve III	\N	ÖSYM	\N
50	Çalışma hayatında beslenme ve sıvı gereksinimiyle ilgili aşağıdaki ifadelerden hangisi yanlıştır?	Yetişkin bireylerde günlük sıvı gereksinimi kişinin ağırlığına göre hesaplanabilir.	Doymuş yağ ve trans yağları içeren besinlerin tüketimi artırılmalıdır.	Su yerine tatlı ve gazlı içeceklerin tüketilmesi bazı kronik hastalıklar için risk faktörü olabilir.	Ağır işlerde ve sıcak ortamlarda çalışanlarda terleme sonucu suyla birlikte elektrolit kaybı artar.	B	medium	16	2025-05-07 16:09:33.025+00	2025-05-07 16:09:33.025+00	Çorbalar ve yapısında bol su bulunabilen yeşil yapraklı sebzeler sıvı gereksiniminin karşılanmasına katkıda bulunur.	\N	ÖSYM	\N
51	Biyolojik Etkenlere Maruziyet Risklerinin Önlenmesi Hakkında Yönetmelik'e göre enfeksiyon risk düzeyi Grup 2 olan aşağıdaki etkenlerden hangisinin etkili aşısı vardır?	Borrelia recurrentis	Mycoplasma hominis	Neisseria meningitidis	Yersinia pseudotuberculosis	C	medium	16	2025-05-07 16:09:33.025+00	2025-05-07 16:09:33.025+00	Clostridium botulinum	\N	ÖSYM	\N
52	İş yerinde belirli bir etkene maruz kalanlarda görülebilecek bir sağlık sorununun insidans hızı aşağıdaki araştırma yöntemlerinden hangisiyle elde edilir?	Tanımlayıcı araştırmalar	Kesitsel araştırmalar	Vaka-kontrol araştırmaları	Kohort araştırmaları	D	medium	16	2025-05-07 16:09:33.025+00	2025-05-07 16:09:33.025+00	Metodolojik araştırmalar	\N	ÖSYM	\N
53	Islak ortamda çalışılan bir iş yerinde, iş sağlığı ve güvenliği uygulamaları kapsamında cilt koruma ve bakımına ilişkin eğitim çalışması yapılmış; ön test ve son test puanları karşılaştırılarak katılımcıların bilgi düzeyinin arttığı saptanmıştır.\nYapılan bu araştırmanın türü aşağıdakilerden hangisidir?	Vaka-kontrol	Müdahale	Retrospektif kohort	Meta analiz	B	medium	16	2025-05-07 16:09:33.025+00	2025-05-07 16:09:33.025+00	Kesitsel	\N	ÖSYM	\N
54	Sağlık kayıtlarıyla ilgili,\nI. Sağlık gözetimi yapılacak her çalışan için kişisel sağlık ve etkilenme kayıtlarının tutulması ve güncelleştirilmesi zorunludur.\nII. Kayıtlar, gizliliği de dikkate alınarak uygun bir şekilde tutulmalı ve saklanmalıdır.\nIII. Sağlık personeli hariç kendilerine ait olsa bile kimse sağlık muayene sonuçları ve etkilenme düzeylerine ait bilgileri görme hakkına sahip değildir.\nifadelerinden hangileri doğrudur?	Yalnız I	Yalnız III	I ve II	II ve III	C	medium	16	2025-05-07 16:09:33.025+00	2025-05-07 16:09:33.025+00	I, II ve III	\N	ÖSYM	\N
55	Çalışanların Gürültü ile İlgili Risklerden Korunmalarına Dair Yönetmelik kapsamında aşağıdakilerden hangisi maruziyetin önlenmesi ve azaltılmasında işverenin özellikle dikkate alacağı hususlar arasında yer almaz?	Gürültüye maruziyetin daha az olduğu başka çalışma yöntemlerinin seçilmesi	Yapılan işe göre mümkün olan en düşük düzeyde gürültü yayan uygun iş ekipmanının seçilmesi	İş yerinin ve çalışılan yerlerin uygun şekilde tasarlanması ve düzenlenmesi	İş ekipmanını doğru ve güvenli bir şekilde kullanmaları için çalışanlara gerekli bilgi ve eğitimin verilmesi	E	medium	16	2025-05-07 16:09:33.025+00	2025-05-07 16:09:33.025+00	Çalışanların düzenli sağlık gözetimine tabi olacakları aralıkların belirlenmesi	\N	ÖSYM	\N
56	Aşağıdaki metallerden hangisi mesleki ve çevresel sağlık tehlikesi oluşturan ağır metal olarak sınıflandırılmaz?	Kurşun	Kadmiyum	Nikel	Sodyum	D	medium	16	2025-05-07 16:09:33.025+00	2025-05-07 16:09:33.025+00	Cıva	\N	ÖSYM	\N
57	Statik antropometri boyutlarına ilişkin görselde yer alan (d) boyutu aşağıdakilerden hangisidir?	Üst vücut yüksekliği	Dirsekler arası mesafe	Dirsek yüksekliği	Kalça diz ucu mesafesi	C	medium	16	2025-05-07 16:09:33.025+00	2025-05-07 16:09:33.025+00	Uyluk kalınlığı	\N	ÖSYM	\N
\.


--
-- Data for Name: SequelizeMeta; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SequelizeMeta" (name) FROM stdin;
20250423070730-create-user.js
20250423083720-create-topic.js
20250423083836-create-question.js
20250423090449-add-optionE-imageUrl-to-questions.js
20250423091236-create-lecture.js
20250423091902-add-imageUrl-to-lectures.js
20250423093404-add-parentId-to-topics.js
20250423094320-add-classification-to-questions.js
20250423101422-add-specialization-to-users.js
20250423135741-create-question-attempt.js
\.


--
-- Data for Name: Topics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Topics" (id, name, description, "createdAt", "updatedAt", "parentId") FROM stdin;
1	Genel Mikrobiyoloji	Genel Mikrobiyoloji ana kategorisi	2025-04-23 09:36:34.132+00	2025-04-23 09:36:34.132+00	\N
2	İmmünoloji	İmmünoloji ana kategorisi	2025-04-23 09:36:34.132+00	2025-04-23 09:36:34.132+00	\N
4	Viroloji	Viroloji ana kategorisi	2025-04-23 09:36:34.132+00	2025-04-23 09:36:34.132+00	\N
5	Mikoloji	Mikoloji ana kategorisi	2025-04-23 09:36:34.132+00	2025-04-23 09:36:34.132+00	\N
6	Parazitoloji	Parazitoloji ana kategorisi	2025-04-23 09:36:34.132+00	2025-04-23 09:36:34.132+00	\N
7	Enfeksiyon Hastalıkları	Enfeksiyon Hastalıkları ana kategorisi	2025-04-23 09:36:34.132+00	2025-04-23 09:36:34.132+00	\N
8	Laboratuvar Uygulamaları	Laboratuvar Uygulamaları ana kategorisi	2025-04-23 09:36:34.132+00	2025-04-23 09:36:34.132+00	\N
3	Bakteriyoloji	Bakteriyoloji ana kategorisi Selamun Aleyküm 	2025-04-23 09:36:34.132+00	2025-04-23 11:48:02.541+00	\N
11	Deneme Alt konu başlığı	akndflqjaenrgjleqnagv faejlrnfv geqgjrnvf eqrjgvn qejrgvn qeagj	2025-04-24 08:40:45.819+00	2025-04-24 08:40:45.819+00	3
12	aaaa	aaaaa	2025-04-24 09:51:01.636+00	2025-04-24 09:51:01.636+00	11
13	Gram Pozitif Koklar	\N	2025-04-26 19:24:44.022+00	2025-04-26 19:24:44.022+00	3
14	Stafilokoklar	\N	2025-04-26 19:25:22.736+00	2025-04-26 19:25:22.736+00	13
15	zzzzzzzzzzz	zzzzzzzzzzzzzzzzz	2025-05-06 13:10:23.013+00	2025-05-06 13:10:23.013+00	6
16	ISG Çıkmış	İşyeri Hekimliği	2025-05-07 15:54:28.978+00	2025-05-07 15:54:28.978+00	7
\.


--
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Users" (id, username, password, role, "createdAt", "updatedAt", specialization) FROM stdin;
1	denemeuser	$2b$10$QOhIH92Wy48RggRcnUi47ujkE2jhw3.uizH0/Jth/SnEBOA.ptm2y	admin	2025-04-23 08:23:18.02+00	2025-04-23 08:23:18.02+00	\N
6	NURAY	$2b$10$Pt0Iby70kQEnGxSeLStxbe6Agg/wVhLQI0QOHC1fC2JP8BMMXPRHO	user	2025-04-23 18:50:13.848+00	2025-04-23 18:50:13.848+00	Diğer
7	srg	$2b$10$ugNmnje4iITt34qW4HEwEOcVOdpWwLvpRgk.vCiIZUHwOQU9Q9C8m	admin	2025-04-24 09:32:26.846+00	2025-04-24 09:42:45.485+00	TUS
9	Deli5353	$2b$10$9s4vB9HRRaoruSNCEIE5lePc3FnDAzfesVPL3HLOXVI7REAumKpN.	user	2025-04-25 09:26:01.549+00	2025-04-25 09:26:01.549+00	YDUS
10	Nurayy	$2b$10$3BcPs9eV.AcDxaaYvnDeZeydKaGWzVS/a6/s.pNtbf9veCEMYIuSW	admin	2025-04-25 09:26:05.528+00	2025-04-25 11:03:47.866+00	Diğer
11	Sucukbey	$2b$10$RTJCSTlt.t394iV74lvfSu45NGJF09h7SykdIUY2jvcXqP6VpFV6y	admin	2025-04-26 14:40:59.124+00	2025-04-26 14:56:45.818+00	TUS
13	Hanife Tutan	$2b$10$oe2PCbD9Ap/Cj5j5GMehu.n5F9vEewTYwvw3V4E/wEJYCida1/xNe	admin	2025-04-26 18:03:39.479+00	2025-04-26 20:36:45.829+00	YDUS
15	Asude	$2b$10$084lUS9/hAu1G0XVkOdtJ.CO8t240bp5vUisdQSD.1bWBZAVRF6iK	user	2025-04-28 17:11:50.883+00	2025-04-28 17:11:50.883+00	Diğer
\.


--
-- Data for Name: WordleScores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."WordleScores" (id, "userId", score, "createdAt", "updatedAt") FROM stdin;
16	1	80	2025-04-28 18:22:32.845	2025-04-28 18:22:32.845
17	1	40	2025-04-28 18:23:17.183	2025-04-28 18:23:17.183
18	1	100	2025-04-28 18:23:41.93	2025-04-28 18:23:41.93
19	1	100	2025-04-28 18:23:50.755	2025-04-28 18:23:50.755
20	1	40	2025-04-28 18:25:25.464	2025-04-28 18:25:25.464
21	1	20	2025-04-28 18:37:15.666	2025-04-28 18:37:15.666
22	1	40	2025-04-28 18:42:20.202	2025-04-28 18:42:20.202
23	1	60	2025-04-29 16:22:24.938	2025-04-29 16:22:24.938
24	1	1196	2025-05-06 19:55:09.586	2025-05-06 19:55:09.586
25	1	782	2025-05-06 20:08:41.181	2025-05-06 20:08:41.181
26	1	1310	2025-05-06 20:42:08.036	2025-05-06 20:42:08.036
27	1	1310	2025-05-06 21:00:36.541	2025-05-06 21:00:36.541
28	1	1310	2025-05-06 21:01:00.274	2025-05-06 21:01:00.274
29	1	1310	2025-05-06 21:01:07.659	2025-05-06 21:01:07.659
30	1	1310	2025-05-06 21:01:13.745	2025-05-06 21:01:13.745
31	1	1300	2025-05-06 21:11:01.808	2025-05-06 21:11:01.808
32	1	1150	2025-05-06 21:13:54.958	2025-05-06 21:13:54.958
33	1	1310	2025-05-06 22:04:52.37	2025-05-06 22:04:52.37
34	1	540	2025-05-06 22:05:22.011	2025-05-06 22:05:22.011
\.


--
-- Name: Lectures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Lectures_id_seq"', 22, true);


--
-- Name: QuestionAttempts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."QuestionAttempts_id_seq"', 205, true);


--
-- Name: Questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Questions_id_seq"', 57, true);


--
-- Name: Topics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Topics_id_seq"', 16, true);


--
-- Name: Users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Users_id_seq"', 18, true);


--
-- Name: WordleScores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."WordleScores_id_seq"', 34, true);


--
-- Name: Lectures Lectures_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Lectures"
    ADD CONSTRAINT "Lectures_pkey" PRIMARY KEY (id);


--
-- Name: QuestionAttempts QuestionAttempts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."QuestionAttempts"
    ADD CONSTRAINT "QuestionAttempts_pkey" PRIMARY KEY (id);


--
-- Name: Questions Questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Questions"
    ADD CONSTRAINT "Questions_pkey" PRIMARY KEY (id);


--
-- Name: SequelizeMeta SequelizeMeta_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name);


--
-- Name: Topics Topics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Topics"
    ADD CONSTRAINT "Topics_pkey" PRIMARY KEY (id);


--
-- Name: Users Users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);


--
-- Name: WordleScores WordleScores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WordleScores"
    ADD CONSTRAINT "WordleScores_pkey" PRIMARY KEY (id);


--
-- Name: Lectures Lectures_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Lectures"
    ADD CONSTRAINT "Lectures_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."Topics"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: QuestionAttempts QuestionAttempts_questionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."QuestionAttempts"
    ADD CONSTRAINT "QuestionAttempts_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES public."Questions"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: QuestionAttempts QuestionAttempts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."QuestionAttempts"
    ADD CONSTRAINT "QuestionAttempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Questions Questions_topicId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Questions"
    ADD CONSTRAINT "Questions_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES public."Topics"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Topics Topics_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Topics"
    ADD CONSTRAINT "Topics_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Topics"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: WordleScores fk_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WordleScores"
    ADD CONSTRAINT fk_user FOREIGN KEY ("userId") REFERENCES public."Users"(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

