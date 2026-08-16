"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Copy,
  Download,
  FileJson,
  FileText,
  FlaskConical,
  HeartHandshake,
  Info,
  LayoutDashboard,
  Menu,
  Microscope,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { ChangeEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";

type StepId = "overview" | "logic" | "design" | "sample" | "methods" | "analysis" | "ethics" | "audit";
type Hypothesis = { id: string; text: string; type: "directional" | "non-directional" | "null" };
type MethodItem = { id: string; name: string; minutes: number; role: string; source: string };
type Project = {
  title: string;
  level: string;
  supervisor: string;
  deadline: string;
  topic: string;
  problem: string;
  aim: string;
  object: string;
  subject: string;
  question: string;
  hypotheses: Hypothesis[];
  design: string;
  time: string;
  setting: string;
  population: string;
  inclusion: string;
  exclusion: string;
  sampleSize: number;
  sampleEffect: string;
  samplePower: number;
  recruitment: string;
  methods: MethodItem[];
  analysis: string;
  primaryOutcome: string;
  missingData: string;
  alpha: string;
  ethicsChecks: string[];
  risk: string;
  storage: string;
  withdrawal: string;
  consent: string;
};

const STORAGE_KEY = "research-constructor-project-v1";

const defaultProject: Project = {
  title: "Новое исследование",
  level: "Курсовая работа",
  supervisor: "",
  deadline: "",
  topic: "",
  problem: "",
  aim: "",
  object: "",
  subject: "",
  question: "",
  hypotheses: [{ id: "h1", text: "", type: "directional" }],
  design: "correlational",
  time: "cross-sectional",
  setting: "online",
  population: "",
  inclusion: "",
  exclusion: "",
  sampleSize: 120,
  sampleEffect: "medium",
  samplePower: 0.8,
  recruitment: "",
  methods: [],
  analysis: "",
  primaryOutcome: "",
  missingData: "Исключить анкеты с пропусками более 20%; для остальных — описать долю пропусков и выбранный способ обработки.",
  alpha: "0,05",
  ethicsChecks: [],
  risk: "",
  storage: "Обезличенные данные хранятся в зашифрованном хранилище; таблица соответствия кодов не создаётся.",
  withdrawal: "Участник может прекратить заполнение без объяснения причин до отправки формы.",
  consent: "",
};

const steps: { id: StepId; label: string; short: string; icon: typeof Target }[] = [
  { id: "overview", label: "Паспорт проекта", short: "Старт", icon: LayoutDashboard },
  { id: "logic", label: "Логика исследования", short: "Логика", icon: Target },
  { id: "design", label: "Дизайн", short: "Дизайн", icon: FlaskConical },
  { id: "sample", label: "Выборка", short: "Выборка", icon: Users },
  { id: "methods", label: "Методы", short: "Методы", icon: BookOpen },
  { id: "analysis", label: "План анализа", short: "Анализ", icon: Microscope },
  { id: "ethics", label: "Этика и данные", short: "Этика", icon: HeartHandshake },
  { id: "audit", label: "Аудит готовности", short: "Аудит", icon: ClipboardCheck },
];

const methodBank: MethodItem[] = [
  { id: "swls", name: "Шкала удовлетворённости жизнью (SWLS)", minutes: 2, role: "Благополучие", source: "Diener et al., 1985" },
  { id: "dass21", name: "DASS-21", minutes: 5, role: "Дистресс", source: "Lovibond & Lovibond, 1995" },
  { id: "erq", name: "Опросник регуляции эмоций (ERQ)", minutes: 4, role: "Эмоциональная регуляция", source: "Gross & John, 2003" },
  { id: "brs", name: "Brief Resilience Scale (BRS-6)", minutes: 2, role: "Резильентность", source: "Smith et al., 2008" },
  { id: "bis", name: "Шкала Бергенской бессонницы (BIS)", minutes: 4, role: "Сон", source: "Pallesen et al., 2008" },
  { id: "tas20", name: "Торонтская шкала алекситимии (TAS-20)", minutes: 7, role: "Алекситимия", source: "Bagby et al., 1994" },
];

const ethicsItems = [
  "Добровольное информированное согласие",
  "Понятное описание процедуры и длительности",
  "Право отказаться без негативных последствий",
  "Контакты исследователя и научного руководителя",
  "Минимизация риска и протокол помощи",
  "Обезличивание и ограничение доступа",
  "Срок хранения и порядок уничтожения данных",
  "Разрешение правообладателей методик проверено",
];

const analysisOptions = [
  { id: "correlation", title: "Корреляция", when: "Связь двух количественных переменных", checks: "Форма связи, выбросы; Пирсон или Спирмен" },
  { id: "groups", title: "Сравнение групп", when: "Различия двух независимых групп", checks: "Распределение, дисперсии; t-критерий или Манна—Уитни" },
  { id: "paired", title: "До и после", when: "Повторное измерение у тех же людей", checks: "Распределение разностей; парный t или Уилкоксон" },
  { id: "regression", title: "Регрессия", when: "Прогноз исхода несколькими факторами", checks: "Линейность, остатки, мультиколлинеарность" },
  { id: "categorical", title: "Категориальные данные", when: "Связь частот и категорий", checks: "Ожидаемые частоты; χ² или точный тест Фишера" },
];

const uid = () => Math.random().toString(36).slice(2, 9);
const filled = (value: string) => value.trim().length >= 8;

function suggestedSample(effect: string, power: number, design: string) {
  const base = effect === "small" ? 390 : effect === "large" ? 44 : 128;
  const powerFactor = power >= 0.9 ? 1.32 : 1;
  const designFactor = design === "experimental" ? 1.05 : design === "qualitative" ? 0.18 : 1;
  return Math.max(12, Math.ceil((base * powerFactor * designFactor) / 10) * 10);
}

function Field({ label, hint, children, wide = false }: { label: string; hint?: string; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`field ${wide ? "field--wide" : ""}`}>
      <span className="field__label">{label}</span>
      {children}
      {hint && <span className="field__hint">{hint}</span>}
    </label>
  );
}

function SectionHead({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="section-head">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}

function Tip({ children }: { children: ReactNode }) {
  return <div className="tip"><Info size={18} aria-hidden="true" /><p>{children}</p></div>;
}

export default function ResearchConstructor() {
  const [project, setProject] = useState<Project>(defaultProject);
  const [active, setActive] = useState<StepId>("overview");
  const [hydrated, setHydrated] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [methodSearch, setMethodSearch] = useState("");
  const [toast, setToast] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setProject({ ...defaultProject, ...JSON.parse(saved) });
      } catch { /* keep a clean project if browser data is damaged */ }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  }, [project, hydrated]);

  const update = <K extends keyof Project>(key: K, value: Project[K]) => setProject((current) => ({ ...current, [key]: value }));
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  const audit = useMemo(() => [
    { label: "Тема конкретна и ограничена", ok: filled(project.topic), step: "logic" as StepId },
    { label: "Проблема обоснована как противоречие или пробел", ok: filled(project.problem), step: "logic" as StepId },
    { label: "Цель отвечает на исследовательский вопрос", ok: filled(project.aim) && filled(project.question), step: "logic" as StepId },
    { label: "Объект и предмет различены", ok: filled(project.object) && filled(project.subject) && project.object !== project.subject, step: "logic" as StepId },
    { label: "Есть проверяемая гипотеза", ok: project.hypotheses.some((item) => filled(item.text)), step: "logic" as StepId },
    { label: "Дизайн и условия сбора данных выбраны", ok: Boolean(project.design && project.time && project.setting), step: "design" as StepId },
    { label: "Границы генеральной совокупности заданы", ok: filled(project.population), step: "sample" as StepId },
    { label: "Критерии включения и исключения описаны", ok: filled(project.inclusion) && filled(project.exclusion), step: "sample" as StepId },
    { label: "Размер выборки и набор обоснованы", ok: project.sampleSize >= 12 && filled(project.recruitment), step: "sample" as StepId },
    { label: "Методы соответствуют переменным", ok: project.methods.length > 0, step: "methods" as StepId },
    { label: "Первичный исход и анализ зафиксированы", ok: filled(project.primaryOutcome) && Boolean(project.analysis), step: "analysis" as StepId },
    { label: "Обработка пропусков описана заранее", ok: filled(project.missingData), step: "analysis" as StepId },
    { label: "Этический минимум закрыт", ok: project.ethicsChecks.length >= 6 && filled(project.risk), step: "ethics" as StepId },
    { label: "Участнику подготовлен текст согласия", ok: filled(project.consent), step: "ethics" as StepId },
  ], [project]);

  const done = audit.filter((item) => item.ok).length;
  const readiness = Math.round((done / audit.length) * 100);
  const currentIndex = steps.findIndex((step) => step.id === active);
  const estimated = suggestedSample(project.sampleEffect, project.samplePower, project.design);
  const methodMinutes = project.methods.reduce((sum, method) => sum + method.minutes, 0);

  const go = (id: StepId) => {
    setActive(id);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `${project.title || "research-project"}.json`;
    link.click();
    URL.revokeObjectURL(href);
    notify("Резервная копия скачана");
  };

  const exportDocx = async () => {
    const { Document, HeadingLevel, Packer, Paragraph, TextRun } = await import("docx");
    const section = (title: string, lines: string[]) => [
      new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
      ...lines.map((line) => new Paragraph({ children: [new TextRun(line || "—")] })),
    ];
    const doc = new Document({ sections: [{ children: [
      new Paragraph({ text: project.title || "Исследовательский проект", heading: HeadingLevel.TITLE }),
      new Paragraph({ text: `${project.level}${project.deadline ? ` · срок ${project.deadline}` : ""}` }),
      ...section("Логика исследования", [
        `Тема: ${project.topic}`, `Проблема: ${project.problem}`, `Цель: ${project.aim}`,
        `Объект: ${project.object}`, `Предмет: ${project.subject}`, `Вопрос: ${project.question}`,
        ...project.hypotheses.map((h, i) => `Гипотеза ${i + 1}: ${h.text}`),
      ]),
      ...section("Дизайн и выборка", [
        `Дизайн: ${project.design}; временной план: ${project.time}; формат: ${project.setting}.`,
        `Генеральная совокупность: ${project.population}`, `Плановый объём: ${project.sampleSize}`,
        `Включение: ${project.inclusion}`, `Исключение: ${project.exclusion}`, `Набор: ${project.recruitment}`,
      ]),
      ...section("Методы и анализ", [
        `Методы: ${project.methods.map((m) => m.name).join("; ") || "не выбраны"}`,
        `Первичный исход: ${project.primaryOutcome}`, `План анализа: ${project.analysis}`,
        `Уровень значимости: ${project.alpha}`, `Пропуски: ${project.missingData}`,
      ]),
      ...section("Этика и данные", [
        `Риски: ${project.risk}`, `Хранение: ${project.storage}`, `Отказ от участия: ${project.withdrawal}`,
        `Текст согласия: ${project.consent}`,
      ]),
    ] }] });
    const blob = await Packer.toBlob(doc);
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `${project.title || "research-project"}.docx`;
    link.click();
    URL.revokeObjectURL(href);
    notify("Документ DOCX собран");
  };

  const importJson = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const incoming = JSON.parse(String(reader.result));
        setProject({ ...defaultProject, ...incoming });
        notify("Проект восстановлен");
      } catch { notify("Не удалось прочитать файл"); }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const resetProject = () => {
    if (!window.confirm("Очистить текущий проект? Скачайте JSON, если нужна копия.")) return;
    setProject(defaultProject);
    go("overview");
    notify("Создан чистый проект");
  };

  const copyConsent = async () => {
    await navigator.clipboard.writeText(project.consent);
    notify("Текст согласия скопирован");
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Открыть навигацию"><Menu /></button>
        <button className="brand" onClick={() => go("overview")} aria-label="На главную">
          <span className="brand__mark">КИ</span>
          <span><b>Конструктор</b><small>исследования</small></span>
        </button>
        <div className="topbar__project">
          <span className="status-dot" />
          <span>{hydrated ? "Сохраняется в браузере" : "Загрузка проекта"}</span>
        </div>
        <div className="topbar__actions">
          <button className="button button--ghost" onClick={exportJson}><FileJson size={17} /> JSON</button>
          <button className="button button--ink" onClick={exportDocx}><Download size={17} /> Скачать DOCX</button>
        </div>
      </header>

      <aside className={`sidebar ${mobileOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar__mobile-head"><span>Разделы проекта</span><button onClick={() => setMobileOpen(false)} aria-label="Закрыть"><X /></button></div>
        <div className="project-mini">
          <span className="project-mini__label">Текущий проект</span>
          <strong>{project.title || "Без названия"}</strong>
          <div className="progress-row"><span>готовность</span><b>{readiness}%</b></div>
          <div className="progress"><i style={{ width: `${readiness}%` }} /></div>
        </div>
        <nav aria-label="Разделы конструктора">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const complete = audit.filter((a) => a.step === step.id).every((a) => a.ok) && audit.some((a) => a.step === step.id);
            return (
              <button key={step.id} className={active === step.id ? "nav-item nav-item--active" : "nav-item"} onClick={() => go(step.id)}>
                <span className="nav-item__number">{complete ? <Check size={14} /> : String(index + 1).padStart(2, "0")}</span>
                <Icon size={18} /><span>{step.label}</span><ChevronRight className="nav-item__chevron" size={16} />
              </button>
            );
          })}
        </nav>
        <div className="sidebar__tools">
          <button onClick={() => importRef.current?.click()}><Upload size={16} /> Импорт JSON</button>
          <button onClick={resetProject}><RotateCcw size={16} /> Новый проект</button>
          <input ref={importRef} type="file" accept="application/json" onChange={importJson} hidden />
        </div>
      </aside>
      {mobileOpen && <button className="scrim" onClick={() => setMobileOpen(false)} aria-label="Закрыть меню" />}

      <main className="workspace">
        <div className="workspace__main">
          {active === "overview" && (
            <>
              <section className="hero">
                <div className="hero__copy">
                  <span className="eyebrow eyebrow--light">Рабочая среда · 01</span>
                  <h1>От идеи — к исследованию, которое выдержит вопросы.</h1>
                  <p>Соберите логику работы, дизайн, выборку, инструменты и план анализа в одном месте. Конструктор не пишет исследование за вас — он помогает не оставить в нём дыр.</p>
                  <button className="button button--amber" onClick={() => go("logic")}>Начать с логики <ArrowRight size={18} /></button>
                </div>
                <div className="hero__visual" aria-hidden="true">
                  <div className="orbit orbit--one" /><div className="orbit orbit--two" />
                  <div className="hero__score"><b>{readiness}</b><span>%</span><small>готовности</small></div>
                  <span className="hero__tag hero__tag--a">вопрос</span><span className="hero__tag hero__tag--b">метод</span><span className="hero__tag hero__tag--c">вывод</span>
                </div>
              </section>
              <section className="content-section">
                <SectionHead eyebrow="Паспорт" title="Сначала зафиксируйте рамку" text="Эти данные попадут в экспорт и помогут не потерять масштаб работы." />
                <div className="form-card form-grid">
                  <Field label="Рабочее название" wide><input value={project.title} onChange={(e) => update("title", e.target.value)} /></Field>
                  <Field label="Формат работы"><select value={project.level} onChange={(e) => update("level", e.target.value)}><option>Курсовая работа</option><option>ВКР бакалавра</option><option>Магистерская диссертация</option><option>Статья</option><option>Самостоятельный проект</option></select></Field>
                  <Field label="Срок"><input type="date" value={project.deadline} onChange={(e) => update("deadline", e.target.value)} /></Field>
                  <Field label="Научный руководитель" wide><input placeholder="Фамилия, имя, степень — если есть" value={project.supervisor} onChange={(e) => update("supervisor", e.target.value)} /></Field>
                </div>
              </section>
              <section className="content-section">
                <div className="section-head section-head--row"><div><span className="eyebrow">Маршрут</span><h2>Восемь рабочих блоков</h2></div><p>{done} из {audit.length} контрольных точек закрыто</p></div>
                <div className="route-grid">
                  {steps.slice(1).map((step, index) => { const Icon = step.icon; return <button key={step.id} className="route-card" onClick={() => go(step.id)}><span>0{index + 2}</span><Icon /><strong>{step.label}</strong><p>{routeDescription(step.id)}</p><ArrowRight size={18} /></button>; })}
                </div>
              </section>
              <section className="principles">
                <div><Sparkles /><span className="eyebrow">Три правила</span><h2>Хороший проект — это связная система решений</h2></div>
                <ol><li><b>01</b><span><strong>Сначала вопрос</strong>Метод и статистика выбираются под него, а не наоборот.</span></li><li><b>02</b><span><strong>Каждому выводу — основание</strong>Переменная должна иметь операционализацию и план анализа.</span></li><li><b>03</b><span><strong>Ограничения — часть качества</strong>Честная граница сильнее обещания, которое данные не поддерживают.</span></li></ol>
              </section>
              <section className="reference-shelf">
                <div className="section-head section-head--row"><div><span className="eyebrow">Опорные стандарты</span><h2>Не универсальный шаблон, а карта сверки</h2></div><p>Локальный регламент кафедры всегда имеет приоритет.</p></div>
                <div className="reference-grid">
                  <a href="https://www.hse.ru/ba/psy/theses" target="_blank" rel="noreferrer"><span>Университетская практика</span><strong>Курсовые и ВКР по психологии</strong><p>Регламенты, критерии и материалы образовательной программы НИУ ВШЭ.</p><ArrowRight /></a>
                  <a href="https://apastyle.apa.org/jars" target="_blank" rel="noreferrer"><span>Полнота отчёта</span><strong>APA JARS</strong><p>Стандарты описания количественных, качественных и смешанных исследований.</p><ArrowRight /></a>
                  <a href="https://help.osf.io/article/330-welcome-to-registrations" target="_blank" rel="noreferrer"><span>Открытая наука</span><strong>OSF Preregistration</strong><p>Шаблоны для фиксации гипотез, методов и анализа до начала исследования.</p><ArrowRight /></a>
                </div>
              </section>
            </>
          )}

          {active === "logic" && <LogicStep project={project} update={update} />}
          {active === "design" && <DesignStep project={project} update={update} />}
          {active === "sample" && <SampleStep project={project} update={update} estimated={estimated} />}
          {active === "methods" && <MethodsStep project={project} update={update} search={methodSearch} setSearch={setMethodSearch} totalMinutes={methodMinutes} />}
          {active === "analysis" && <AnalysisStep project={project} update={update} />}
          {active === "ethics" && <EthicsStep project={project} update={update} copyConsent={copyConsent} />}
          {active === "audit" && <AuditStep project={project} audit={audit} readiness={readiness} go={go} exportDocx={exportDocx} />}

          <div className="step-controls">
            <button className="button button--ghost" disabled={currentIndex === 0} onClick={() => go(steps[currentIndex - 1].id)}><ArrowLeft size={17} /> Назад</button>
            <span>{currentIndex + 1} / {steps.length}</span>
            {currentIndex < steps.length - 1 ? <button className="button button--ink" onClick={() => go(steps[currentIndex + 1].id)}>Дальше <ArrowRight size={17} /></button> : <button className="button button--amber" onClick={exportDocx}><Download size={17} /> DOCX</button>}
          </div>
        </div>

        <aside className="inspector">
          <div className="inspector__sticky">
            <span className="eyebrow">Контроль качества</span>
            <div className="inspector__score"><strong>{readiness}%</strong><div className="progress"><i style={{ width: `${readiness}%` }} /></div><span>{done} / {audit.length}</span></div>
            <h3>{readiness === 100 ? "Каркас готов к обсуждению" : "Следующая точка роста"}</h3>
            <p>{audit.find((item) => !item.ok)?.label || "Проверьте формулировки вместе с научным руководителем."}</p>
            {audit.find((item) => !item.ok) && <button className="text-button" onClick={() => go(audit.find((item) => !item.ok)!.step)}>Перейти к блоку <ArrowRight size={15} /></button>}
            <hr />
            <div className="privacy-note"><ShieldCheck size={20} /><p><b>Локальный режим</b>Проект хранится только в вашем браузере. Данные участников сюда не вводите.</p></div>
          </div>
        </aside>
      </main>

      <footer><span>Конструктор исследования · инструмент проектирования</span><span>Проверяйте требования своей кафедры и решения с научным руководителем</span></footer>
      {toast && <div className="toast" role="status"><CheckCircle2 size={18} />{toast}</div>}
    </div>
  );
}

function routeDescription(id: StepId) {
  return ({ logic: "Проблема, цель, вопрос и гипотезы", design: "Тип, время и условия исследования", sample: "Кого, сколько и как набирать", methods: "Операционализация и батарея", analysis: "Что проверять и каким способом", ethics: "Согласие, риски и хранение", audit: "Связность и готовность к обсуждению" } as Partial<Record<StepId, string>>)[id] || "";
}

type StepProps = { project: Project; update: <K extends keyof Project>(key: K, value: Project[K]) => void };

function LogicStep({ project, update }: StepProps) {
  const setHypothesis = (id: string, patch: Partial<Hypothesis>) => update("hypotheses", project.hypotheses.map((item) => item.id === id ? { ...item, ...patch } : item));
  return <section className="content-section step-page">
    <SectionHead eyebrow="Блок 02" title="Соберите логический позвоночник" text="Формулировки должны отвечать друг другу: проблема ведёт к вопросу, вопрос — к цели, гипотезы — к проверке." />
    <div className="logic-map" aria-label="Логика исследования"><span>Проблема</span><ChevronRight /><span>Вопрос</span><ChevronRight /><span>Цель</span><ChevronRight /><span>Гипотезы</span></div>
    <div className="form-card form-grid">
      <Field label="Тема" hint="Кто/что + какой феномен + в каком контексте" wide><textarea rows={2} placeholder="Например: связь стратегий регуляции эмоций с академическим стрессом у студентов первого курса" value={project.topic} onChange={(e) => update("topic", e.target.value)} /></Field>
      <Field label="Проблема" hint="Не «тема мало изучена», а конкретный пробел или противоречие" wide><textarea rows={3} placeholder="Что уже известно — и чего не хватает для ответа?" value={project.problem} onChange={(e) => update("problem", e.target.value)} /></Field>
      <Field label="Объект" hint="Более широкая область психической реальности"><textarea rows={2} value={project.object} onChange={(e) => update("object", e.target.value)} /></Field>
      <Field label="Предмет" hint="Конкретная связь, свойство или процесс в объекте"><textarea rows={2} value={project.subject} onChange={(e) => update("subject", e.target.value)} /></Field>
      <Field label="Исследовательский вопрос" hint="Один вопрос, на который действительно ответят данные" wide><textarea rows={2} placeholder="Как связаны X и Y у Z?" value={project.question} onChange={(e) => update("question", e.target.value)} /></Field>
      <Field label="Цель" hint="Начните с действия: выявить, проверить, описать, сравнить" wide><textarea rows={2} value={project.aim} onChange={(e) => update("aim", e.target.value)} /></Field>
    </div>
    <div className="subsection-head"><div><span className="eyebrow">Проверяемые ожидания</span><h3>Гипотезы</h3></div><button className="button button--soft" onClick={() => update("hypotheses", [...project.hypotheses, { id: uid(), text: "", type: "directional" }])}><Plus size={16} /> Добавить</button></div>
    <div className="hypothesis-list">{project.hypotheses.map((hypothesis, index) => <div className="hypothesis" key={hypothesis.id}><span className="hypothesis__index">H{index + 1}</span><textarea rows={2} aria-label={`Гипотеза ${index + 1}`} placeholder="Чем выше X, тем ниже Y…" value={hypothesis.text} onChange={(e) => setHypothesis(hypothesis.id, { text: e.target.value })} /><select aria-label="Тип гипотезы" value={hypothesis.type} onChange={(e) => setHypothesis(hypothesis.id, { type: e.target.value as Hypothesis["type"] })}><option value="directional">Направленная</option><option value="non-directional">Ненаправленная</option><option value="null">Нулевая</option></select><button className="icon-button" aria-label="Удалить гипотезу" disabled={project.hypotheses.length === 1} onClick={() => update("hypotheses", project.hypotheses.filter((h) => h.id !== hypothesis.id))}><Trash2 size={17} /></button></div>)}</div>
    <Tip>Быстрый тест: можно ли по вашей гипотезе однозначно назвать переменные, их ожидаемую связь и данные, которые способны её опровергнуть?</Tip>
  </section>;
}

function DesignStep({ project, update }: StepProps) {
  const options = [
    ["correlational", "Корреляционный", "Наблюдаем связи без вмешательства"],
    ["comparative", "Сравнительный", "Сопоставляем существующие группы"],
    ["experimental", "Экспериментальный", "Манипулируем фактором и контролируем условия"],
    ["qualitative", "Качественный", "Исследуем опыт, смыслы и процессы"],
    ["mixed", "Смешанный", "Соединяем количественные и качественные данные"],
  ];
  return <section className="content-section step-page"><SectionHead eyebrow="Блок 03" title="Выберите дизайн до сбора данных" text="Дизайн задаёт границы допустимых выводов. Связь не доказывает причинность, а удобная выборка ограничивает обобщение." />
    <div className="choice-grid">{options.map(([id, title, text]) => <button key={id} className={project.design === id ? "choice-card choice-card--active" : "choice-card"} onClick={() => update("design", id)}><span className="choice-card__radio">{project.design === id && <i />}</span><strong>{title}</strong><p>{text}</p></button>)}</div>
    <div className="form-card form-grid">
      <Field label="Временной план"><select value={project.time} onChange={(e) => update("time", e.target.value)}><option value="cross-sectional">Одномоментный срез</option><option value="longitudinal">Лонгитюдный</option><option value="pre-post">До и после воздействия</option><option value="retrospective">Ретроспективный</option></select></Field>
      <Field label="Среда сбора"><select value={project.setting} onChange={(e) => update("setting", e.target.value)}><option value="online">Онлайн</option><option value="offline">Очно</option><option value="lab">Лаборатория</option><option value="field">Полевые условия</option><option value="hybrid">Гибридно</option></select></Field>
    </div>
    <div className="warning-grid"><div><CircleHelp /><strong>Какой вывод разрешён?</strong><p>{project.design === "experimental" ? "При рандомизации и достаточном контроле можно осторожно обсуждать причинный эффект." : project.design === "qualitative" ? "Можно описывать темы, механизмы и субъективный опыт; статистическое обобщение не является целью." : "Можно говорить о связи или различиях, но не приписывать одному фактору причинное влияние."}</p></div><div><ShieldCheck /><strong>Что зафиксировать заранее?</strong><p>Условия, критерии остановки, исключения, основные переменные и анализ. Это снижает свободу подгонки решений после просмотра результатов.</p></div></div>
  </section>;
}

function SampleStep({ project, update, estimated }: StepProps & { estimated: number }) {
  return <section className="content-section step-page"><SectionHead eyebrow="Блок 04" title="Спроектируйте выборку, а не просто число" text="Опишите, на кого распространяется вопрос, кто реально попадёт в данные и почему такой объём достаточен." />
    <div className="sample-layout"><div className="form-card form-grid">
      <Field label="Генеральная совокупность" wide><textarea rows={2} placeholder="Например: студенты очной формы 18–24 лет российских вузов" value={project.population} onChange={(e) => update("population", e.target.value)} /></Field>
      <Field label="Критерии включения"><textarea rows={4} placeholder="Возраст, статус, язык, опыт…" value={project.inclusion} onChange={(e) => update("inclusion", e.target.value)} /></Field>
      <Field label="Критерии исключения"><textarea rows={4} placeholder="Дубли, незавершённые анкеты…" value={project.exclusion} onChange={(e) => update("exclusion", e.target.value)} /></Field>
      <Field label="Стратегия набора" wide><textarea rows={3} placeholder="Где искать участников, как приглашать, будет ли вознаграждение" value={project.recruitment} onChange={(e) => update("recruitment", e.target.value)} /></Field>
    </div><div className="calculator">
      <span className="eyebrow eyebrow--light">Оценка для планирования</span><h3>Размер выборки</h3><p>Ориентир, не замена расчёту мощности под конкретный статистический тест.</p>
      <Field label="Ожидаемый эффект"><select value={project.sampleEffect} onChange={(e) => update("sampleEffect", e.target.value)}><option value="small">Малый</option><option value="medium">Средний</option><option value="large">Большой</option></select></Field>
      <Field label="Желаемая мощность"><select value={project.samplePower} onChange={(e) => update("samplePower", Number(e.target.value))}><option value={0.8}>0,80</option><option value={0.9}>0,90</option></select></Field>
      <div className="estimate"><span>ориентир</span><strong>≈ {estimated}</strong><small>завершённых наблюдений</small></div>
      <Field label="Плановый объём"><input type="number" min={1} value={project.sampleSize} onChange={(e) => update("sampleSize", Number(e.target.value))} /></Field>
      <p className="calculator__note">Добавьте запас на отсев и не меняйте целевой объём после просмотра эффектов без прозрачного объяснения.</p>
    </div></div>
    <Tip>Для итогового обоснования укажите тест, ожидаемый эффект и его источник, α, мощность, число групп/предикторов и запас на потерю данных.</Tip>
  </section>;
}

function MethodsStep({ project, update, search, setSearch, totalMinutes }: StepProps & { search: string; setSearch: (v: string) => void; totalMinutes: number }) {
  const filtered = methodBank.filter((m) => `${m.name} ${m.role}`.toLowerCase().includes(search.toLowerCase()));
  const selected = new Set(project.methods.map((m) => m.id));
  const toggle = (method: MethodItem) => update("methods", selected.has(method.id) ? project.methods.filter((m) => m.id !== method.id) : [...project.methods, method]);
  return <section className="content-section step-page"><SectionHead eyebrow="Блок 05" title="Операционализируйте переменные" text="Методика — не украшение батареи. Для каждой переменной нужен показатель, процедура подсчёта и основание выбора версии." />
    <div className="method-summary"><div><strong>{project.methods.length}</strong><span>инструментов</span></div><div><strong>≈ {totalMinutes}</strong><span>минут без инструкции</span></div><div><strong>{totalMinutes <= 20 ? "комфортно" : totalMinutes <= 35 ? "на границе" : "перегруз"}</strong><span>нагрузка участника</span></div></div>
    <div className="search-box"><Search size={18} /><input aria-label="Поиск методик" placeholder="Найти по названию или конструкту" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
    <div className="method-grid">{filtered.map((method) => <article className={selected.has(method.id) ? "method-card method-card--selected" : "method-card"} key={method.id}><div className="method-card__top"><span>{method.role}</span><b>{method.minutes} мин</b></div><h3>{method.name}</h3><p>{method.source}</p><ul><li>Проверьте русскоязычную адаптацию</li><li>Зафиксируйте шкалы и ключ подсчёта</li><li>Уточните лицензию и условия использования</li></ul><button className={selected.has(method.id) ? "button button--soft" : "button button--ink"} onClick={() => toggle(method)}>{selected.has(method.id) ? <><Check size={16} /> В батарее</> : <><Plus size={16} /> Добавить</>}</button></article>)}</div>
    <div className="empty-method"><div><Plus /><div><strong>Не нашли инструмент?</strong><p>Добавьте запись вручную и затем проверьте источник, адаптацию, надёжность и право использования.</p></div></div><button className="button button--ghost" onClick={() => { const name = window.prompt("Название методики"); if (name) update("methods", [...project.methods, { id: uid(), name, minutes: 5, role: "Пользовательская", source: "Источник требуется уточнить" }]); }}>Добавить свою</button></div>
  </section>;
}

function AnalysisStep({ project, update }: StepProps) {
  return <section className="content-section step-page"><SectionHead eyebrow="Блок 06" title="Решите, как данные ответят на вопрос" text="Зафиксируйте основной исход и анализ до просмотра результатов. Один ясный первичный тест лучше десятка случайных проверок." />
    <div className="form-card form-grid"><Field label="Первичный исход" hint="Конкретный показатель, по которому проверяется главный вывод" wide><textarea rows={2} placeholder="Например: суммарный балл академического стресса" value={project.primaryOutcome} onChange={(e) => update("primaryOutcome", e.target.value)} /></Field><Field label="Уровень значимости"><select value={project.alpha} onChange={(e) => update("alpha", e.target.value)}><option>0,05</option><option>0,01</option><option>0,10</option></select></Field><Field label="Пропущенные значения" wide><textarea rows={3} value={project.missingData} onChange={(e) => update("missingData", e.target.value)} /></Field></div>
    <div className="subsection-head"><div><span className="eyebrow">Шпаргалка выбора</span><h3>Основной анализ</h3></div></div>
    <div className="analysis-grid">{analysisOptions.map((option) => <button key={option.id} className={project.analysis === option.id ? "analysis-card analysis-card--active" : "analysis-card"} onClick={() => update("analysis", option.id)}><span className="choice-card__radio">{project.analysis === option.id && <i />}</span><strong>{option.title}</strong><p>{option.when}</p><small>{option.checks}</small></button>)}</div>
    <div className="analysis-plan"><span className="eyebrow eyebrow--light">Минимальный отчёт</span><h3>Не ограничивайтесь p-значением</h3><div><span><b>1</b>Описательная статистика и качество данных</span><span><b>2</b>Эффект с доверительным интервалом</span><span><b>3</b>Проверка предпосылок и чувствительности</span><span><b>4</b>Ограничения и альтернативные объяснения</span></div></div>
    <Tip>Если проверяется много гипотез или исходов, заранее определите основной анализ и способ контроля множественных сравнений.</Tip>
  </section>;
}

function EthicsStep({ project, update, copyConsent }: StepProps & { copyConsent: () => void }) {
  const toggle = (item: string) => update("ethicsChecks", project.ethicsChecks.includes(item) ? project.ethicsChecks.filter((v) => v !== item) : [...project.ethicsChecks, item]);
  const generate = () => update("consent", `Вас приглашают принять участие в исследовании «${project.title}». Цель исследования: ${project.aim || "[укажите цель]"}. Участие добровольное и займёт около ${Math.max(5, project.methods.reduce((s, m) => s + m.minutes, 0))} минут. ${project.risk || "[опишите возможные неудобства и способы их минимизации]"} ${project.withdrawal} ${project.storage} Перед началом вы сможете задать вопросы исследователю. Нажимая «Согласен(на)», вы подтверждаете, что прочитали информацию, достигли необходимого возраста и добровольно соглашаетесь участвовать.`);
  return <section className="content-section step-page"><SectionHead eyebrow="Блок 07" title="Защитите участника и исследование" text="Этика — это не одна галочка. Участник должен понимать процедуру, риски, обращение с данными и право отказаться." />
    <div className="ethics-layout"><div className="checklist"><div className="subsection-head"><div><span className="eyebrow">Минимум до запуска</span><h3>{project.ethicsChecks.length} / {ethicsItems.length} пунктов</h3></div></div>{ethicsItems.map((item) => <label className="check-item" key={item}><input type="checkbox" checked={project.ethicsChecks.includes(item)} onChange={() => toggle(item)} /><span className="fake-check"><Check size={14} /></span><span>{item}</span></label>)}</div><div className="form-card form-grid"><Field label="Риски и дискомфорт" wide><textarea rows={4} placeholder="Эмоциональный дискомфорт, усталость, чувствительные вопросы; как снижаете риск?" value={project.risk} onChange={(e) => update("risk", e.target.value)} /></Field><Field label="Хранение и доступ" wide><textarea rows={4} value={project.storage} onChange={(e) => update("storage", e.target.value)} /></Field><Field label="Отказ и удаление данных" wide><textarea rows={3} value={project.withdrawal} onChange={(e) => update("withdrawal", e.target.value)} /></Field></div></div>
    <div className="consent-builder"><div className="subsection-head"><div><span className="eyebrow">Черновик документа</span><h3>Информированное согласие</h3></div><div className="button-row"><button className="button button--soft" onClick={generate}><Sparkles size={16} /> Собрать из проекта</button><button className="button button--ghost" disabled={!project.consent} onClick={copyConsent}><Copy size={16} /> Копировать</button></div></div><textarea rows={10} placeholder="Соберите черновик кнопкой или напишите свой текст…" value={project.consent} onChange={(e) => update("consent", e.target.value)} /></div>
    <Tip>Для несовершеннолетних, клинических групп, обмана в процедуре или чувствительных тем нужен отдельный разбор рисков и требований вашей организации.</Tip>
  </section>;
}

function AuditStep({ project, audit, readiness, go, exportDocx }: { project: Project; audit: { label: string; ok: boolean; step: StepId }[]; readiness: number; go: (id: StepId) => void; exportDocx: () => void }) {
  const critical = audit.filter((item) => !item.ok);
  return <section className="content-section step-page"><SectionHead eyebrow="Блок 08" title="Аудит связности проекта" text="Это не оценка научной истины, а проверка каркаса: каждый сильный вывод должен иметь вопрос, данные, метод и прозрачное ограничение." />
    <div className="audit-hero"><div className="audit-ring" style={{ "--score": `${readiness * 3.6}deg` } as React.CSSProperties}><span><b>{readiness}%</b><small>готовность</small></span></div><div><span className="eyebrow eyebrow--light">Диагностика</span><h3>{readiness >= 85 ? "Проект можно выносить на предметное обсуждение" : readiness >= 55 ? "Основа есть — закройте критические разрывы" : "Сначала соберите обязательный каркас"}</h3><p>{project.title}</p><button className="button button--amber" onClick={exportDocx}><FileText size={17} /> Скачать проект</button></div></div>
    <div className="audit-list">{audit.map((item) => <button key={item.label} className={item.ok ? "audit-item audit-item--ok" : "audit-item"} onClick={() => go(item.step)}><span>{item.ok ? <Check size={16} /> : <span>!</span>}</span><strong>{item.label}</strong><small>{item.ok ? "готово" : "доработать"}</small><ArrowRight size={17} /></button>)}</div>
    <div className="killer-questions"><span className="eyebrow">Вопросы перед встречей</span><h3>Проверьте себя как строгий рецензент</h3><div>{[
      "Какой именно факт заставит отказаться от главной гипотезы?",
      "Почему выбранный метод измеряет нужный конструкт, а не соседний?",
      "На кого нельзя переносить полученный вывод?",
      "Какое альтернативное объяснение результата наиболее вероятно?",
      "Какие решения были приняты до, а какие — после просмотра данных?",
      critical.length ? `Что мешает закрыть пункт: «${critical[0].label}»?` : "Что научный руководитель, вероятнее всего, попросит уточнить?",
    ].map((q, i) => <p key={q}><b>{String(i + 1).padStart(2, "0")}</b>{q}</p>)}</div></div>
    <div className="audit-disclaimer"><ShieldCheck /><p><b>Важно</b>Конструктор помогает проектировать и замечать разрывы, но не заменяет консультацию научного руководителя, локальные методические требования и решение этического комитета.</p></div>
  </section>;
}
