import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from 'react';
import {
  careTasks as initialTasks,
  companionCats as initialCats,
  CURRENT_USER,
  WORK_ENVIRONMENTS,
  getTasksForWorkRole,
} from '../data/mock';
import { useTeamMessages } from '@/hooks/useTeamMessages';
import {
  completeTeamTask,
  linkIntakeToTeamTask,
  loadTeamTasks,
  savePickupSubmissionPhotos,
  subscribeTeamTasks,
} from '@/shared/teamTasks';
import { markCatAdopted } from '@/shared/catAdoptionStatus';
import { isAdoptionPickupTask } from '../lib/taskDisplay';
import { loadAdoptionApplications, submitVolunteerReviewAssessment, subscribeAdoptionApplications } from '@/shared/adoptionApplications';
import { reconcileAllAdoptionTeamTasks } from '@/shared/adoptionAssignment';
import { normalizeReviewSubstage } from '@/shared/adoptionWorkflow';
import type { VolunteerRecommendation } from '@/shared/adoptionReviewActivities';
import { isAdoptionReviewTask } from '../lib/taskDisplay';
import type { CareTask, CatUpdate, CompanionCat, WorkRole, QuickIntakeCat, PointReward, VolunteerProgress } from '../types';
import {
  loadVolunteerProgress,
  recordCatRegistration,
  recordCatUpdate,
  recordDailyCompletionBonus,
  recordTaskCompletion,
  subscribeVolunteerProgress,
} from '@/shared/volunteerProgress';
import { submitFosterResupplyRequest } from '@/shared/supplyRequests';
import { submitEmergencyWorkflow } from '@/shared/emergencyWorkflow';
import {
  loadCatCareUpdates,
  submitCatCareUpdate,
  subscribeCatCareUpdates,
} from '@/shared/catCareUpdates';
import {
  loadCompanionLocalTasks,
  mergeCompanionLocalTasks,
  saveCompanionLocalTasks,
  subscribeCompanionLocalTasks,
} from '@/shared/companionLocalTasks';
import {
  loadCompanionWorkRole,
  saveCompanionWorkRole,
} from '@/shared/companionPreferences';
import {
  registerCompanionIntakeCat,
  subscribeCompanionIntakeCats,
  loadCompanionIntakeCats,
} from '@/shared/companionIntakeCats';
import {
  getOpenIncidentsForReporter,
  subscribeIncidentReports,
  type IncidentReport,
} from '@/shared/incidentReports';
import { getRecentUpdateSummaries } from '@/shared/catCareUpdates';
import {
  acceptFosterMatch as acceptFosterMatchRecord,
  acknowledgeFosterAdoptionInterest,
  declineFosterMatch as declineFosterMatchRecord,
  getFosterApplicationForCaregiver,
  getOpenFosterAdoptionInterests,
  getPendingFosterMatches,
  submitFosterApplication as submitFosterApplicationRecord,
  withdrawFosterApplication as withdrawFosterApplicationRecord,
  subscribeFosterWorkflow,
  type FosterAdoptionInterest,
  type FosterApplication,
  type FosterMatch,
} from '@/shared/fosterWorkflow';
import { getCatById } from '@/admin/data/mock';
import { getCaregiverById } from '@/shared/caregivers';
import { getCatImageUrl } from '@/shared/catImages';
import type { AdminCat } from '@/admin/types';

export interface EmergencyReportInput {
  catId: string;
  catName: string;
  description: string;
  photoUrl?: string;
  voiceNoteUrl?: string;
  voiceNoteDurationSec?: number;
}

interface CompanionContextValue {
  user: typeof CURRENT_USER;
  workRole: WorkRole;
  setWorkRole: (role: WorkRole) => void;
  workEnvironment: (typeof WORK_ENVIRONMENTS)[WorkRole];
  tasks: CareTask[];
  cats: CompanionCat[];
  updates: CatUpdate[];
  openIncidents: IncidentReport[];
  registeredCatIds: string[];
  completeTask: (taskId: string) => PointReward | null;
  completeAdoptionReviewTask: (
    taskId: string,
    assessment: { notes: string; recommendation: VolunteerRecommendation },
  ) => PointReward | null;
  submitUpdate: (update: Omit<CatUpdate, 'id' | 'createdAt'>) => void;
  submitPickupPhotos: (taskId: string, photos: string[]) => void;
  registerCat: (intake: QuickIntakeCat, options?: { linkedTaskId?: string }) => string;
  removeCat: (catId: string) => void;
  removedCatIds: string[];
  unreadCount: number;
  progress: VolunteerProgress;
  lastReward: PointReward | null;
  clearLastReward: () => void;
  submitEmergencyReport: (input: EmergencyReportInput) => void;
  submitFosterResupply: (input: { catId: string; catName: string; itemIds?: string[] }) => void;
  fosterApplication: FosterApplication | undefined;
  fosterMatches: FosterMatch[];
  fosterAdoptionInterests: FosterAdoptionInterest[];
  submitFosterApplication: (input: {
    householdType: 'house' | 'apartment';
    hasOtherPets: boolean;
    experience: string;
    availability: string;
    notes?: string;
  }) => void;
  withdrawFosterApplication: () => void;
  acceptFosterMatch: (matchId: string) => void;
  declineFosterMatch: (matchId: string) => void;
  acknowledgeFosterAdoptionInterest: (interestId: string) => void;
}

const CompanionContext = createContext<CompanionContextValue | null>(null);

function enrichCatsWithUpdates(cats: CompanionCat[]) {
  return cats.map((cat) => ({
    ...cat,
    recentUpdates: getRecentUpdateSummaries(cat.id, 3).length > 0
      ? getRecentUpdateSummaries(cat.id, 3)
      : cat.recentUpdates,
  }));
}

function adminCatToCompanionCat(cat: AdminCat): CompanionCat {
  return {
    id: cat.id,
    name: cat.name,
    photo: getCatImageUrl(cat.id) ?? cat.photo,
    age: cat.age,
    personality: cat.personality,
    healthStatus:
      cat.health === 'medical'
        ? 'Medical care'
        : cat.health === 'pending_exam'
          ? 'Pending exam'
          : cat.health === 'monitoring'
            ? 'Monitoring'
            : 'Healthy',
    careInstructions: 'Follow shelter foster care plan and report changes promptly.',
    currentCaregiver: CURRENT_USER.id,
    story: cat.story,
    vaccinated: true,
    daysTogether: 0,
    recentUpdates: ['Foster assignment accepted'],
  };
}

function createFosterStarterTasks(catId: string, catName: string): CareTask[] {
  const base = {
    catId,
    catName,
    status: 'pending' as const,
    assigneeId: CURRENT_USER.id,
    workRole: 'foster_parent' as const,
  };

  return [
    {
      ...base,
      id: `ft-${catId}-checkin`,
      type: 'checkup',
      title: 'Foster weekly check-in',
      dueTime: 'This week',
      instructions: 'Confirm eating, litter box, and behavior. Submit a care update for the shelter team.',
      emoji: '📋',
    },
    {
      ...base,
      id: `ft-${catId}-feeding`,
      type: 'feeding',
      title: 'Morning feeding log',
      dueTime: '8:00 AM',
      instructions: 'Record food intake and note litter box habits.',
      emoji: '🍽️',
    },
  ];
}

export function CompanionProvider({ children }: { children: ReactNode }) {
  const [workRole, setWorkRoleState] = useState<WorkRole>(() => loadCompanionWorkRole());
  const [localTasks, setLocalTasks] = useState(() => mergeCompanionLocalTasks(initialTasks));
  const [teamTasks, setTeamTasks] = useState(() => loadTeamTasks());
  const [cats, setCats] = useState(() => enrichCatsWithUpdates(initialCats));
  const [registeredCatIds, setRegisteredCatIds] = useState<string[]>(() =>
    loadCompanionIntakeCats().map((record) => record.id),
  );
  const [removedCatIds, setRemovedCatIds] = useState<string[]>([]);
  const [updates, setUpdates] = useState<CatUpdate[]>(() => loadCatCareUpdates());
  const [openIncidents, setOpenIncidents] = useState<IncidentReport[]>(() =>
    getOpenIncidentsForReporter(CURRENT_USER.id),
  );
  const [progress, setProgress] = useState(() => loadVolunteerProgress(CURRENT_USER.id));
  const [lastReward, setLastReward] = useState<PointReward | null>(null);
  const [fosterApplication, setFosterApplication] = useState(() =>
    getFosterApplicationForCaregiver(CURRENT_USER.id),
  );
  const [fosterMatches, setFosterMatches] = useState(() =>
    getPendingFosterMatches(CURRENT_USER.id),
  );
  const [fosterAdoptionInterests, setFosterAdoptionInterests] = useState(() =>
    getOpenFosterAdoptionInterests(CURRENT_USER.id),
  );
  const { unreadCount } = useTeamMessages('caregiver', {
    caregiverId: CURRENT_USER.id,
  });

  const workEnvironment = WORK_ENVIRONMENTS[workRole];

  const setWorkRole = useCallback((role: WorkRole) => {
    setWorkRoleState(role);
    saveCompanionWorkRole(role);
  }, []);

  useEffect(() => {
    const refresh = () => {
      setFosterApplication(getFosterApplicationForCaregiver(CURRENT_USER.id));
      setFosterMatches(getPendingFosterMatches(CURRENT_USER.id));
      setFosterAdoptionInterests(getOpenFosterAdoptionInterests(CURRENT_USER.id));
    };
    const unsubscribe = subscribeFosterWorkflow(refresh);
    return unsubscribe;
  }, []);

  useEffect(() => {
    reconcileAllAdoptionTeamTasks();
    setTeamTasks(loadTeamTasks());

    const unsubscribe = subscribeTeamTasks(setTeamTasks);
    const unsubscribeApps = subscribeAdoptionApplications(() => {
      setTeamTasks(loadTeamTasks());
    });
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'kitticare-team-tasks') setTeamTasks(loadTeamTasks());
      if (e.key === 'kitticare-adoption-applications-v2') {
        reconcileAllAdoptionTeamTasks();
        setTeamTasks(loadTeamTasks());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      unsubscribe();
      unsubscribeApps();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeVolunteerProgress(setProgress);
    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith('kitticare-volunteer-progress')) {
        setProgress(loadVolunteerProgress(CURRENT_USER.id));
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      unsubscribe();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    const refreshUpdates = () => {
      setUpdates(loadCatCareUpdates());
      setCats(enrichCatsWithUpdates(initialCats));
    };
    const unsubscribe = subscribeCatCareUpdates(refreshUpdates);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const refreshIncidents = () => {
      setOpenIncidents(getOpenIncidentsForReporter(CURRENT_USER.id));
    };
    const unsubscribe = subscribeIncidentReports(refreshIncidents);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const refreshIntake = () => {
      const records = loadCompanionIntakeCats();
      setRegisteredCatIds(records.map((record) => record.id));
      const intakeCats: CompanionCat[] = records.map((record) => ({
        id: record.id,
        name: record.name,
        photo: record.photo,
        age: 'Unknown',
        personality: [],
        healthStatus: record.healthStatus,
        careInstructions: `Intake from ${record.source.replace('_', ' ')}. Awaiting full assessment.`,
        currentCaregiver: CURRENT_USER.id,
        story: record.story,
        vaccinated: false,
        recentUpdates: ['Field intake registered'],
      }));
      setCats(enrichCatsWithUpdates([...intakeCats, ...initialCats]));
    };
    const unsubscribe = subscribeCompanionIntakeCats(refreshIntake);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeCompanionLocalTasks(setLocalTasks);
    return unsubscribe;
  }, []);

  const clearLastReward = useCallback(() => setLastReward(null), []);

  const maybeAwardDailyBonus = useCallback((nextTasks: CareTask[]) => {
    const roleTasks = getTasksForWorkRole(workRole, nextTasks, CURRENT_USER.id);
    if (roleTasks.length === 0) return;
    if (!roleTasks.every((task) => task.status === 'completed')) return;

    const bonus = recordDailyCompletionBonus(CURRENT_USER.id, workEnvironment.label.toLowerCase());
    if (bonus) {
      setProgress(loadVolunteerProgress(CURRENT_USER.id));
      setLastReward(bonus);
    }
  }, [workEnvironment.label, workRole]);

  const tasks = useMemo(() => {
    const teamIds = new Set(teamTasks.map((t) => t.id));
    const base = localTasks.filter((t) => !teamIds.has(t.id));
    return [...teamTasks, ...base];
  }, [localTasks, teamTasks]);

  const completeTask = useCallback((taskId: string): PointReward | null => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task || task.status === 'completed') return null;

    if (teamTasks.some((t) => t.id === taskId)) {
      completeTeamTask(taskId, { id: CURRENT_USER.id, name: CURRENT_USER.name });
      if (isAdoptionPickupTask(task) && task.catId) {
        markCatAdopted(task.catId);
      }
      const nextTeamTasks = loadTeamTasks();
      setTeamTasks(nextTeamTasks);
      const reward = recordTaskCompletion(
        CURRENT_USER.id,
        { ...task, status: 'completed' },
        { adoptionStory: isAdoptionPickupTask(task) },
      );
      if (reward) {
        setProgress(loadVolunteerProgress(CURRENT_USER.id));
        setLastReward(reward);
      }
      const nextTasks = [...nextTeamTasks, ...localTasks.filter((t) => !nextTeamTasks.some((nt) => nt.id === t.id))];
      maybeAwardDailyBonus(nextTasks.map((t) => (t.id === taskId ? { ...t, status: 'completed' as const } : t)));
      return reward;
    }

    const completedTask = { ...task, status: 'completed' as const };
    const nextLocal = localTasks.map((t) => (t.id === taskId ? completedTask : t));
    saveCompanionLocalTasks(nextLocal);
    setLocalTasks(nextLocal);

    const reward = recordTaskCompletion(CURRENT_USER.id, completedTask);
    if (reward) {
      setProgress(loadVolunteerProgress(CURRENT_USER.id));
      setLastReward(reward);
    }
    const teamIds = new Set(teamTasks.map((t) => t.id));
    const merged = [...teamTasks, ...nextLocal.filter((t) => !teamIds.has(t.id))];
    maybeAwardDailyBonus(merged);
    return reward;
  }, [tasks, teamTasks, localTasks, maybeAwardDailyBonus]);

  const completeAdoptionReviewTask = useCallback((
    taskId: string,
    assessment: { notes: string; recommendation: VolunteerRecommendation },
  ): PointReward | null => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task || task.status === 'completed' || !isAdoptionReviewTask(task) || !task.applicationId) {
      return null;
    }

    const application = loadAdoptionApplications().find((item) => item.id === task.applicationId);
    if (!application) return null;

    const substage =
      application.stage === 'reviewing'
        ? normalizeReviewSubstage(application) ?? 'contact'
        : 'contact';

    const updated = submitVolunteerReviewAssessment({
      applicationId: task.applicationId,
      assigneeId: CURRENT_USER.id,
      assigneeName: CURRENT_USER.name,
      type: substage,
      notes: assessment.notes,
      recommendation: assessment.recommendation,
    });
    if (!updated) return null;

    completeTeamTask(taskId, { id: CURRENT_USER.id, name: CURRENT_USER.name });
    const nextTeamTasks = loadTeamTasks();
    setTeamTasks(nextTeamTasks);
    const reward = recordTaskCompletion(CURRENT_USER.id, { ...task, status: 'completed' });
    if (reward) {
      setProgress(loadVolunteerProgress(CURRENT_USER.id));
      setLastReward(reward);
    }
    const nextTasks = [...nextTeamTasks, ...localTasks.filter((t) => !nextTeamTasks.some((nt) => nt.id === t.id))];
    maybeAwardDailyBonus(nextTasks.map((t) => (t.id === taskId ? { ...t, status: 'completed' as const } : t)));
    return reward;
  }, [tasks, localTasks, teamTasks, maybeAwardDailyBonus]);

  const submitUpdate = useCallback((update: Omit<CatUpdate, 'id' | 'createdAt'>) => {
    const catName = cats.find((cat) => cat.id === update.catId)?.name ?? 'a cat';
    submitCatCareUpdate({
      catId: update.catId,
      catName,
      mood: update.mood,
      eating: update.eating,
      behavior: update.behavior,
      note: update.note,
      photo: update.photo,
      reporterId: CURRENT_USER.id,
      reporterName: CURRENT_USER.name,
    });
    setUpdates(loadCatCareUpdates());
    setCats(enrichCatsWithUpdates(cats));

    const reward = recordCatUpdate(CURRENT_USER.id, catName);
    setProgress(loadVolunteerProgress(CURRENT_USER.id));
    setLastReward(reward);
  }, [cats]);

  const submitPickupPhotos = useCallback((taskId: string, photos: string[]) => {
    if (loadTeamTasks().some((task) => task.id === taskId)) {
      savePickupSubmissionPhotos(taskId, photos);
      setTeamTasks(loadTeamTasks());
      return;
    }
    const next = localTasks.map((task) =>
      task.id === taskId ? { ...task, submissionPhotos: photos } : task,
    );
    saveCompanionLocalTasks(next);
    setLocalTasks(next);
  }, [localTasks]);

  const registerCat = useCallback((intake: QuickIntakeCat, options?: { linkedTaskId?: string }) => {
    const id = `intake-${Date.now()}`;
    registerCompanionIntakeCat({
      id,
      name: intake.name.trim(),
      photo: intake.photoPreview ?? '🐱',
      healthStatus: intake.healthTags.join(', '),
      story: intake.notes ?? 'Recently registered in the field.',
      source: intake.source,
      registeredById: CURRENT_USER.id,
      registeredByName: CURRENT_USER.name,
    });

    const newCat: CompanionCat = {
      id,
      name: intake.name.trim(),
      photo: intake.photoPreview ?? '🐱',
      age: 'Unknown',
      personality: [],
      healthStatus: intake.healthTags.join(', '),
      careInstructions: `Intake from ${intake.source.replace('_', ' ')}. ${intake.notes ?? 'Awaiting full assessment.'}`,
      currentCaregiver: workEnvironment.assigneeId,
      story: intake.notes ?? 'Recently registered in the field.',
      vaccinated: false,
      recentUpdates: ['Field intake registered'],
    };

    setCats((prev) => enrichCatsWithUpdates([newCat, ...prev]));
    setRegisteredCatIds((prev) => [id, ...prev]);

    const reward = recordCatRegistration(CURRENT_USER.id, newCat.name);
    setProgress(loadVolunteerProgress(CURRENT_USER.id));
    setLastReward(reward);

    if (options?.linkedTaskId) {
      const linkedId = options.linkedTaskId;
      if (loadTeamTasks().some((t) => t.id === linkedId)) {
        linkIntakeToTeamTask(linkedId, {
          id,
          name: newCat.name,
          notes: intake.notes,
          referencePhotoUrl: intake.photoPreview ?? undefined,
        });
        setTeamTasks(loadTeamTasks());
      } else {
        const linkedTask = {
          id: linkedId,
          catId: id,
          catName: newCat.name,
          type: 'pickup' as const,
          title: 'Complete intake check',
          status: 'pending' as const,
          dueTime: 'Today',
          instructions: 'Verify health notes and transfer cat to shelter.',
          notes: intake.notes,
          assigneeId: workEnvironment.assigneeId,
          emoji: '🚗',
          workRole: 'volunteer' as const,
          referencePhotoUrl: intake.photoPreview ?? undefined,
        };
        saveCompanionLocalTasks([linkedTask, ...loadCompanionLocalTasks()]);
        setLocalTasks(loadCompanionLocalTasks());
      }
      return id;
    }

    if (workRole === 'volunteer') {
      const intakeTask: CareTask = {
        id: `ct-${Date.now()}`,
        catId: id,
        catName: newCat.name,
        type: 'pickup',
        title: 'Complete intake check',
        status: 'pending',
        dueTime: 'Today',
        instructions: 'Verify health notes and transfer cat to shelter.',
        notes: intake.notes,
        assigneeId: workEnvironment.assigneeId,
        emoji: '🚗',
        workRole: 'volunteer',
      };
      saveCompanionLocalTasks([intakeTask, ...loadCompanionLocalTasks()]);
      setLocalTasks(loadCompanionLocalTasks());
    }

    return id;
  }, [workEnvironment.assigneeId, workRole]);

  const removeCat = useCallback((catId: string) => {
    setRemovedCatIds((prev) => (prev.includes(catId) ? prev : [...prev, catId]));
    setRegisteredCatIds((prev) => prev.filter((id) => id !== catId));
    if (catId.startsWith('intake-')) {
      setCats((prev) => enrichCatsWithUpdates(prev.filter((c) => c.id !== catId)));
    }
    const next = loadCompanionLocalTasks().filter((t) => t.catId !== catId);
    saveCompanionLocalTasks(next);
    setLocalTasks(next);
  }, []);

  const submitEmergencyReport = useCallback((input: EmergencyReportInput) => {
    submitEmergencyWorkflow({
      catId: input.catId,
      catName: input.catName,
      reporterId: CURRENT_USER.id,
      reporterName: CURRENT_USER.name,
      description: input.description,
      photoUrl: input.photoUrl,
    });
    setOpenIncidents(getOpenIncidentsForReporter(CURRENT_USER.id));
  }, []);

  const submitFosterResupply = useCallback((input: {
    catId: string;
    catName: string;
    itemIds?: string[];
  }) => {
    submitFosterResupplyRequest({
      catId: input.catId,
      catName: input.catName,
      requestedById: CURRENT_USER.id,
      requestedByName: CURRENT_USER.name,
      itemIds: input.itemIds,
    });
  }, []);

  const submitFosterApplication = useCallback((input: {
    householdType: 'house' | 'apartment';
    hasOtherPets: boolean;
    experience: string;
    availability: string;
    notes?: string;
  }) => {
    const adminCaregiver = getCaregiverById(CURRENT_USER.id);
    const application = submitFosterApplicationRecord({
      caregiverId: CURRENT_USER.id,
      caregiverName: adminCaregiver?.name ?? CURRENT_USER.name,
      ...input,
    });
    setFosterApplication(application);
  }, []);

  const withdrawFosterApplication = useCallback(() => {
    const withdrawn = withdrawFosterApplicationRecord(CURRENT_USER.id);
    if (!withdrawn) return;
    setFosterApplication(undefined);
  }, []);

  const acceptFosterMatch = useCallback((matchId: string) => {
    const result = acceptFosterMatchRecord(matchId);
    if (!result) return;

    const adminCat = getCatById(result.match.catId);
    if (adminCat) {
      setCats((prev) => {
        if (prev.some((cat) => cat.id === adminCat.id)) {
          return enrichCatsWithUpdates(prev);
        }
        return enrichCatsWithUpdates([adminCatToCompanionCat(adminCat), ...prev]);
      });
    }

    const starterTasks = createFosterStarterTasks(result.match.catId, result.match.catName);
    const nextTasks = [
      ...starterTasks,
      ...loadCompanionLocalTasks().filter((task) => !starterTasks.some((item) => item.id === task.id)),
    ];
    saveCompanionLocalTasks(nextTasks);
    setLocalTasks(nextTasks);
    setFosterMatches(getPendingFosterMatches(CURRENT_USER.id));
  }, []);

  const declineFosterMatch = useCallback((matchId: string) => {
    declineFosterMatchRecord(matchId);
    setFosterMatches(getPendingFosterMatches(CURRENT_USER.id));
  }, []);

  const acknowledgeFosterAdoptionInterestHandler = useCallback((interestId: string) => {
    acknowledgeFosterAdoptionInterest(interestId);
    setFosterAdoptionInterests(getOpenFosterAdoptionInterests(CURRENT_USER.id));
  }, []);

  const value = useMemo(
    () => ({
      user: CURRENT_USER,
      workRole,
      setWorkRole,
      workEnvironment,
      tasks,
      cats,
      updates,
      openIncidents,
      registeredCatIds,
      completeTask,
      completeAdoptionReviewTask,
      submitUpdate,
      submitPickupPhotos,
      registerCat,
      removeCat,
      removedCatIds,
      unreadCount,
      progress,
      lastReward,
      clearLastReward,
      submitEmergencyReport,
      submitFosterResupply,
      fosterApplication,
      fosterMatches,
      fosterAdoptionInterests,
      submitFosterApplication,
      withdrawFosterApplication,
      acceptFosterMatch,
      declineFosterMatch,
      acknowledgeFosterAdoptionInterest: acknowledgeFosterAdoptionInterestHandler,
    }),
    [
      workRole,
      workEnvironment,
      tasks,
      cats,
      updates,
      openIncidents,
      registeredCatIds,
      removedCatIds,
      completeTask,
      completeAdoptionReviewTask,
      submitUpdate,
      submitPickupPhotos,
      registerCat,
      removeCat,
      unreadCount,
      progress,
      lastReward,
      clearLastReward,
      submitEmergencyReport,
      submitFosterResupply,
      fosterApplication,
      fosterMatches,
      fosterAdoptionInterests,
      submitFosterApplication,
      withdrawFosterApplication,
      acceptFosterMatch,
      declineFosterMatch,
      acknowledgeFosterAdoptionInterestHandler,
    ],
  );

  return (
    <CompanionContext.Provider value={value}>
      {children}
    </CompanionContext.Provider>
  );
}

export function useCompanion() {
  const ctx = useContext(CompanionContext);
  if (!ctx) throw new Error('useCompanion must be used within CompanionProvider');
  return ctx;
}
