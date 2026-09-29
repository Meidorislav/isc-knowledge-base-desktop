import type { KbSection } from '../types/knowledgeBase'
import { securityPolicy } from './mockSecurityPolicy'

// Placeholder data standing in for the backend KB tree (Ф-08) until the API is wired up.
// Lines starting with "## " / "### " are section and subsection headings.
const lines = (...items: string[]): string => items.join('\n')

export const mockKnowledgeBase: KbSection[] = [
  {
    id: 'regulations',
    title: { ru: 'Регламенты', en: 'Regulations' },
    documents: [
      securityPolicy,
      {
        id: 'doc-incident-response',
        title: { ru: 'Регламент реагирования на инциденты', en: 'Incident response regulation' },
        owner: 'Кулаков В. А.',
        status: 'indexed',
        version: 3,
        updatedAt: '2026-08-14',
        content: {
          ru: lines(
            '## 1. Общие положения',
            'Регламент определяет порядок действий дежурного инженера при получении оповещения об инциденте: классификацию по критичности, сроки первичной реакции и эскалацию.',
            '## 2. Сроки первичной реакции',
            'Для критичных инцидентов срок первичной реакции составляет 15 минут, для инцидентов высокой критичности — 1 час, для средних и низких — 4 рабочих часа.',
            '## 3. Эскалация',
            'Если критичный инцидент не устранён в течение 2 часов, дежурный инженер эскалирует его руководителю группы по телефону и дублирует сообщение в канал #incidents.'
          ),
          en: lines(
            '## 1. General provisions',
            'This regulation defines what the on-duty engineer does after an incident alert: severity classification, first response times and escalation.',
            '## 2. First response times',
            'The first response time for a critical incident is 15 minutes, for a high-severity incident 1 hour, and for medium and low severity 4 working hours.',
            '## 3. Escalation',
            'If a critical incident is not resolved within 2 hours, the on-duty engineer escalates it to the team lead by phone and posts a message in the #incidents channel.'
          )
        }
      },
      {
        id: 'doc-document-flow',
        title: { ru: 'Регламент документооборота', en: 'Document management regulation' },
        owner: 'Смирнова Е. П.',
        status: 'indexed',
        version: 2,
        updatedAt: '2026-07-02',
        content: {
          ru: lines(
            '## 1. Общие положения',
            'Документ устанавливает порядок подготовки, согласования и хранения внутренних регламентов компании.',
            '## 2. Согласование',
            'Проект регламента согласуется с руководителем подразделения и главным программистом группы. Срок согласования — не более 5 рабочих дней.',
            '## 3. Ответственные',
            'За актуальность каждого раздела базы знаний отвечает назначенный контент-менеджер.'
          ),
          en: lines(
            '## 1. General provisions',
            'This document sets out how internal company regulations are drafted, approved and stored.',
            '## 2. Approval',
            'A draft regulation is approved by the head of the department and the lead programmer of the team. Approval takes no more than 5 working days.',
            '## 3. Owners',
            'An assigned content manager is responsible for keeping each knowledge base section up to date.'
          )
        }
      }
    ]
  },
  {
    id: 'workstation',
    title: { ru: 'Инструкции по АРМ', en: 'Workstation guides' },
    documents: [
      {
        id: 'doc-workstation-setup',
        title: { ru: 'Настройка рабочего места', en: 'Setting up a workstation' },
        owner: 'Орлов Д. С.',
        status: 'indexed',
        version: 1,
        updatedAt: '2026-05-20',
        content: {
          ru: lines(
            '## 1. Первичная настройка',
            'Для настройки нового рабочего места создайте заявку в Service Desk с категорией «Новый сотрудник». Инженер установит корпоративное ПО, подключит компьютер к домену и настроит почтовый клиент.',
            '## 2. Доступы',
            'Доступы к рабочим системам запрашивает руководитель сотрудника через ту же заявку. Средний срок выдачи — 1 рабочий день.'
          ),
          en: lines(
            '## 1. Initial setup',
            'To set up a new workstation, create a Service Desk ticket in the “New employee” category. An engineer will install corporate software, join the computer to the domain and configure the mail client.',
            '## 2. Access',
            'Access to work systems is requested by the employee’s manager in the same ticket. It is usually granted within 1 working day.'
          )
        }
      },
      {
        id: 'doc-vpn',
        title: { ru: 'Подключение к VPN', en: 'Connecting to the VPN' },
        owner: 'Орлов Д. С.',
        status: 'processing',
        version: 1,
        updatedAt: '2026-09-01',
        content: {
          ru: lines(
            '## 1. Установка клиента',
            'Инструкция находится в обработке и появится в поиске после завершения индексации.'
          )
        }
      }
    ]
  },
  {
    id: 'sql-kb',
    title: { ru: 'SQL база знаний', en: 'SQL knowledge base' },
    documents: [
      {
        id: 'doc-sql-naming',
        title: { ru: 'Соглашения по именованию', en: 'Naming conventions' },
        owner: 'Кулаков В. А.',
        status: 'indexed',
        version: 4,
        updatedAt: '2026-06-11',
        content: {
          ru: lines(
            '## 1. Таблицы и столбцы',
            'Имена таблиц задаются во множественном числе в snake_case. Внешние ключи именуются как <таблица>_id.',
            '## 2. Индексы',
            'Индексы называются по шаблону ix_<таблица>_<столбцы>, уникальные — ux_<таблица>_<столбцы>.'
          ),
          en: lines(
            '## 1. Tables and columns',
            'Table names are plural and written in snake_case. Foreign keys are named <table>_id.',
            '## 2. Indexes',
            'Indexes follow the ix_<table>_<columns> pattern, unique ones ux_<table>_<columns>.'
          )
        }
      },
      {
        id: 'doc-sql-queries',
        title: { ru: 'Часто используемые запросы', en: 'Frequently used queries' },
        owner: 'Кулаков В. А.',
        status: 'indexed',
        version: 2,
        updatedAt: '2026-08-29',
        content: {
          ru: lines(
            '## 1. Диагностика нагрузки',
            'Для поиска медленных запросов используйте представление pg_stat_statements, сортируя по total_exec_time. Активные сессии смотрите в pg_stat_activity.'
          ),
          en: lines(
            '## 1. Load diagnostics',
            'To find slow queries, use the pg_stat_statements view sorted by total_exec_time. Check active sessions in pg_stat_activity.'
          )
        }
      }
    ]
  },
  {
    id: 'git',
    title: { ru: 'Git-инструкции', en: 'Git guides' },
    documents: [
      {
        id: 'doc-git-branching',
        title: { ru: 'Ветвление и коммиты', en: 'Branches and commits' },
        owner: 'Бакин В. А.',
        status: 'indexed',
        version: 1,
        updatedAt: '2026-04-18',
        content: {
          ru: lines(
            '## 1. Именование веток',
            'Ветки называются по схеме <тип>/<краткое-описание>, где тип — feat, fix или chore. Например: feat/document-upload.',
            '## 2. Коммиты',
            'Сообщения коммитов оформляются в стиле Conventional Commits: feat(scope): описание изменения.'
          ),
          en: lines(
            '## 1. Branch naming',
            'Branches are named <type>/<short-description>, where the type is feat, fix or chore. For example: feat/document-upload.',
            '## 2. Commits',
            'Commit messages follow Conventional Commits: feat(scope): description of the change.'
          )
        }
      },
      {
        id: 'doc-code-review',
        title: { ru: 'Code review чеклист', en: 'Code review checklist' },
        owner: 'Бакин В. А.',
        status: 'error',
        version: 1,
        updatedAt: '2026-09-10',
        content: {
          ru: lines(
            '## Ошибка индексации',
            'Документ не удалось проиндексировать — после нормализации получен пустой текст. Загрузите исправленную версию файла.'
          ),
          en: lines(
            '## Indexing error',
            'The document could not be indexed: normalization produced empty text. Upload a corrected version of the file.'
          )
        }
      }
    ]
  }
]
