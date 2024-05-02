export enum SupportedSlashCommands {
  createQueue = 'create',
  listQueues = 'list',
}

export enum DefaultQueueTypes {
  codeReview = 'code-review',
  release = 'release'
}

export enum BlockIdentifiers {
  submitQueueHeader = 'submit-queue-header',
  defaultQueueInput = 'default-queue-input',
  customQueueInput = 'custom-queue-input',
  submitQueueButtons = 'submit-queue-buttons',

  listedQueueSection = 'listed-queue-section',

  newRequestInput = 'new-request-input',
  newRequestButtons = 'new-request-buttons',

  queueListElement = 'queue-list-element', 
}

export enum SelectionIdentifiers {
  defaultQueueRadioOption = 'default-queue-selection',
  customQueueInput = 'custom-queue-input',
  requestInputField = 'request-input-field',
}

export enum ActionIdentifiers {
  cancel = 'cancel-interaction',
  submitNewQueue = 'submit-new-queue',
  deleteQueue = 'delete-queue',
  addRequest = 'add-request',
  submitRequest = 'submit-request',
  viewRequests = 'view-requests',
  deleteRequest = 'delete-request',
  editRequest = 'edit-request',
  acceptRequest = 'accept-request',
  rejectRequest = 'reject-request',
  completedRequest = 'completed-request',
  stopRequest = 'stop-request',
}

export enum MessageIdentifiers {
  cancelInteraction = 'cancel-interaction-message',

  selectQueueOwnershipType = 'select-queue-ownership-type-message',
  selectQueueRequestType = 'select-queue-request-type-message',

  listQueuesResponse = 'list-queues-response-message',
  selectQueueToView = 'view-queue-message',

  newRequestForm = 'new-request-form-message',
}

