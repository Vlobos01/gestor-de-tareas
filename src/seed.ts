import { AVATAR_COLORS, BOARD_COLORS, DEFAULT_COLUMNS } from './constants';
import type { Board, Collaborator, Column, Priority, Task } from './types';
import { addDaysISO, uid } from './utils';

export function makeBoard(title: string, description = '', color = BOARD_COLORS[0]): Board {
  const now = new Date().toISOString();
  const columns: Column[] = DEFAULT_COLUMNS.map((columnTitle) => ({
    id: uid('col'),
    title: columnTitle,
    taskIds: [],
  }));

  return {
    id: uid('board'),
    title: title.trim(),
    description: description.trim(),
    color,
    createdAt: now,
    updatedAt: now,
    columns,
    tasks: {},
    collaborators: [],
  };
}

interface SeedTask {
  title: string;
  description: string;
  priority: Priority;
  dueIn: number | null;
  assignee: number | null;
}

interface SeedCollaborator {
  name: string;
  email: string;
}

interface SeedBoard {
  title: string;
  description: string;
  color: string;
  collaborators: SeedCollaborator[];
  columns: Array<{ title: string; tasks: SeedTask[] }>;
}

const SEED: SeedBoard[] = [
  {
    title: 'Lanzamiento · Nueva web',
    description: 'Diseño, contenido y puesta en marcha de la nueva landing.',
    color: '#6366f1',
    collaborators: [
      { name: 'Ana Torres', email: 'ana@flujo.app' },
      { name: 'Lucas Pérez', email: 'lucas@flujo.app' },
      { name: 'Marta Ruiz', email: 'marta@flujo.app' },
      { name: 'Diego Gil', email: 'diego@flujo.app' },
    ],
    columns: [
      {
        title: 'Ideas',
        tasks: [
          {
            title: 'Investigar la competencia',
            description: 'Relevar propuestas de valor y precios de cinco productos similares.',
            priority: 'low',
            dueIn: -4,
            assignee: 1,
          },
          {
            title: 'Definir propuesta de valor',
            description: 'Una frase clara que explique qué hacemos y para quién.',
            priority: 'medium',
            dueIn: -1,
            assignee: 0,
          },
          {
            title: 'Configurar analítica y eventos',
            description: 'Medir visitas, clics en CTA y envíos del formulario de contacto.',
            priority: 'low',
            dueIn: 9,
            assignee: 1,
          },
        ],
      },
      {
        title: 'En progreso',
        tasks: [
          {
            title: 'Wireframes de la landing',
            description: 'Estructura del hero, beneficios, precios y preguntas frecuentes.',
            priority: 'high',
            dueIn: 1,
            assignee: 1,
          },
          {
            title: 'Sistema de diseño: botones y formularios',
            description: 'Definir estados hover, focus, disabled y validaciones.',
            priority: 'medium',
            dueIn: 5,
            assignee: 2,
          },
          {
            title: 'Integrar formulario de contacto',
            description: 'Validación en cliente, mensajes de error y confirmación de envío.',
            priority: 'urgent',
            dueIn: 0,
            assignee: 3,
          },
        ],
      },
      {
        title: 'En revisión',
        tasks: [
          {
            title: 'Copy para la sección de precios',
            description: 'Tres planes con beneficios claros y una llamada a la acción por plan.',
            priority: 'high',
            dueIn: 2,
            assignee: 0,
          },
          {
            title: 'Revisión de accesibilidad (WCAG AA)',
            description: 'Contraste, navegación por teclado, foco visible y textos alternativos.',
            priority: 'medium',
            dueIn: 6,
            assignee: 2,
          },
        ],
      },
      {
        title: 'Listo',
        tasks: [
          {
            title: 'Hero y navegación responsive',
            description: 'Menú móvil, navegación con teclado y comportamiento en pantallas grandes.',
            priority: 'medium',
            dueIn: -3,
            assignee: 3,
          },
        ],
      },
    ],
  },
  {
    title: 'Roadmap de producto',
    description: 'Próximas funcionalidades y mejoras para el segundo semestre.',
    color: '#10b981',
    collaborators: [
      { name: 'Ana Torres', email: 'ana@flujo.app' },
      { name: 'Sofía Vidal', email: 'sofia@flujo.app' },
    ],
    columns: [
      {
        title: 'Explorando',
        tasks: [
          {
            title: 'Plantillas de tablero',
            description: 'Tableros prearmados para diseño, desarrollo y marketing.',
            priority: 'low',
            dueIn: 21,
            assignee: 1,
          },
          {
            title: 'Historial de actividad',
            description: 'Registro de cambios por tablero con fecha y responsable.',
            priority: 'medium',
            dueIn: 14,
            assignee: 0,
          },
        ],
      },
      {
        title: 'Próximo',
        tasks: [
          {
            title: 'Vista de calendario',
            description: 'Ver las tareas por fecha de entrega en una vista mensual.',
            priority: 'high',
            dueIn: 10,
            assignee: 0,
          },
        ],
      },
      {
        title: 'Completado',
        tasks: [
          {
            title: 'Filtros por prioridad y responsable',
            description: 'Combinar búsqueda, prioridad, responsable y fecha de entrega.',
            priority: 'medium',
            dueIn: -8,
            assignee: 1,
          },
        ],
      },
    ],
  },
];

export function createSeedState(): { boards: Board[]; activeBoardId: string; } {
  const boards = SEED.map((seed) => {
    const board = makeBoard(seed.title, seed.description, seed.color);
    const now = new Date().toISOString();

    const collaborators: Collaborator[] = seed.collaborators.map((collaborator, index) => ({
      id: uid('user'),
      name: collaborator.name,
      email: collaborator.email,
      color: AVATAR_COLORS[index % AVATAR_COLORS.length],
    }));

    const columns: Column[] = seed.columns.map((columnSeed) => {
      const taskIds: string[] = [];
      columnSeed.tasks.forEach((taskSeed) => {
        const id = uid('task');
        const task: Task = {
          id,
          title: taskSeed.title,
          description: taskSeed.description,
          priority: taskSeed.priority,
          dueDate: taskSeed.dueIn === null ? null : addDaysISO(taskSeed.dueIn),
          assigneeId:
            taskSeed.assignee === null ? null : collaborators[taskSeed.assignee]?.id ?? null,
          createdAt: now,
          updatedAt: now,
        };
        board.tasks[id] = task;
        taskIds.push(id);
      });

      return { id: uid('col'), title: columnSeed.title, taskIds };
    });

    board.collaborators = collaborators;
    board.columns = columns;
    return board;
  });

  return { boards, activeBoardId: boards[0].id };
}

/**
 * Clona un tablero importado regenerando todos los identificadores
 * para evitar colisiones con los tableros existentes.
 */
export function rehydrateBoard(raw: unknown): Board | null {
  if (!raw || typeof raw !== 'object') return null;
  const source = raw as Record<string, unknown>;

  if (typeof source.title !== 'string' || !source.title.trim()) return null;
  if (!Array.isArray(source.columns)) return null;

  const now = new Date().toISOString();
  const tasksSource =
    source.tasks && typeof source.tasks === 'object'
      ? (source.tasks as Record<string, Record<string, unknown>>)
      : {};

  const creatorMap = new Map<string, string>();
  const rawCollaborators = Array.isArray(source.collaborators) ? source.collaborators : [];
  const collaborators: Collaborator[] = rawCollaborators
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item, index) => {
      const previousId = typeof item.id === 'string' ? item.id : `user-${index}`;
      const newId = uid('user');
      creatorMap.set(previousId, newId);
      return {
        id: newId,
        name: typeof item.name === 'string' && item.name.trim() ? item.name : `Colaborador ${index + 1}`,
        email: typeof item.email === 'string' ? item.email : '',
        color:
          typeof item.color === 'string' && item.color ? item.color : AVATAR_COLORS[index % AVATAR_COLORS.length],
      };
    });

  const taskMap = new Map<string, string>();
  const tasks: Record<string, Task> = {};

  Object.entries(tasksSource).forEach(([previousId, value]) => {
    if (!value || typeof value !== 'object') return;
    const taskSource = value as Record<string, unknown>;
    if (typeof taskSource.title !== 'string' || !taskSource.title.trim()) return;

    const newId = uid('task');
    taskMap.set(previousId, newId);

    const priority = taskSource.priority;
    const normalizedPriority: Priority =
      priority === 'urgent' || priority === 'high' || priority === 'medium' || priority === 'low'
        ? priority
        : 'medium';

    const previousAssignee = typeof taskSource.assigneeId === 'string' ? taskSource.assigneeId : null;

    tasks[newId] = {
      id: newId,
      title: taskSource.title.trim(),
      description: typeof taskSource.description === 'string' ? taskSource.description : '',
      priority: normalizedPriority,
      dueDate:
        typeof taskSource.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(taskSource.dueDate)
          ? taskSource.dueDate
          : null,
      assigneeId: previousAssignee ? creatorMap.get(previousAssignee) ?? null : null,
      createdAt: typeof taskSource.createdAt === 'string' ? taskSource.createdAt : now,
      updatedAt: typeof taskSource.updatedAt === 'string' ? taskSource.updatedAt : now,
    };
  });

  const columns: Column[] = source.columns
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item, index) => {
      const rawIds = Array.isArray(item.taskIds) ? item.taskIds : [];
      const taskIds = rawIds
        .map((taskId) => (typeof taskId === 'string' ? taskMap.get(taskId) : undefined))
        .filter((taskId): taskId is string => !!taskId);

      return {
        id: uid('col'),
        title: typeof item.title === 'string' && item.title.trim() ? item.title : `Columna ${index + 1}`,
        taskIds,
      };
    });

  if (columns.length === 0) {
    DEFAULT_COLUMNS.forEach((title) => columns.push({ id: uid('col'), title, taskIds: [] }));
  }

  const referencedTasks = new Set(columns.flatMap((column) => column.taskIds));
  Object.keys(tasks).forEach((taskId) => {
    if (!referencedTasks.has(taskId)) delete tasks[taskId];
  });

  return {
    id: uid('board'),
    title: source.title.trim(),
    description: typeof source.description === 'string' ? source.description : '',
    color: typeof source.color === 'string' && source.color ? source.color : BOARD_COLORS[0],
    createdAt: now,
    updatedAt: now,
    columns,
    tasks,
    collaborators,
  };
}
