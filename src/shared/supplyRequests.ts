import { getResupplyLineItems } from '@/shared/catSupplies';
import {
  addTeamMessage,
  DEFAULT_MANAGER_CONTACT_ID,
  MANAGER_NAME,
  threadIdFor,
} from '@/shared/teamMessages';
import {
  assignSupplyRequestTask,
  addSupplyRequestTask,
  type SupplyLineItem,
  type SupplyRequestSource,
} from '@/shared/teamTasks';

export interface SubmitSupplyRequestInput {
  catId: string;
  catName: string;
  requestedById: string;
  requestedByName: string;
  source: SupplyRequestSource;
  items: SupplyLineItem[];
  notes?: string;
}

export function submitSupplyRequest(input: SubmitSupplyRequestInput) {
  const task = addSupplyRequestTask({
    catId: input.catId,
    catName: input.catName,
    requestedById: input.requestedById,
    requestedByName: input.requestedByName,
    source: input.source,
    items: input.items,
    notes: input.notes,
  });

  const itemSummary = input.items.map((item) => `${item.name} × ${item.quantity}`).join(', ');
  addTeamMessage(
    `📦 Supply request — ${input.catName}: ${itemSummary}`,
    input.requestedByName,
    'caregiver',
    threadIdFor(input.requestedById),
    input.requestedById,
  );

  return task;
}

export function submitFosterResupplyRequest(input: {
  catId: string;
  catName: string;
  requestedById: string;
  requestedByName: string;
  itemIds?: string[];
}) {
  const catalogItems = getResupplyLineItems(input.catId);
  const selected =
    input.itemIds && input.itemIds.length > 0
      ? catalogItems.filter((item) => input.itemIds!.includes(item.id))
      : catalogItems;

  return submitSupplyRequest({
    catId: input.catId,
    catName: input.catName,
    requestedById: input.requestedById,
    requestedByName: input.requestedByName,
    source: 'foster_resupply',
    items: selected,
  });
}

export function assignSupplyDelivery(taskId: string, assigneeId: string) {
  const task = assignSupplyRequestTask(taskId, assigneeId);
  if (!task) return null;

  const itemSummary =
    task.supplyRequest?.items.map((item) => `${item.name} × ${item.quantity}`).join(', ') ?? '';

  addTeamMessage(
    `📦 Supply delivery assigned — ${task.catName}: ${itemSummary}. Please pick up and deliver to foster home.`,
    MANAGER_NAME,
    'manager',
    threadIdFor(assigneeId),
    DEFAULT_MANAGER_CONTACT_ID,
  );

  return task;
}
