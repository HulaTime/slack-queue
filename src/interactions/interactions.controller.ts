import { Request } from 'express';
import { Logger } from 'pino';

import { ActionIdentifiers, BlockIdentifiers, MessageIdentifiers } from '../common/identifiers';
import QueueDataMapper, { Queue, QueueInsert } from '../datamappers/QueueDatamapper';
import { InteractionPayload, MessagePayload } from '../lib/slack/messagePayloads';
import HttpReq from '../lib/utils/HttpReq';
import { MarkdownTextObject, TextObject } from '../lib/slack/compositionObjects';
import { emojis } from '../common/emojis';
import { CreateQueueForm } from '../common/messages';
import { ActionBlock, InputBlock, SectionBlock } from '../lib/slack/blocks';
import { Button, PlainTextInput } from '../lib/slack/elements';
import RequestDataMapper from '../datamappers/RequestDatamapper';

export default class InteractionsController {
  private readonly interactionPayload: InteractionPayload;

  private readonly logger: Logger;

  private readonly queueDataMapper: QueueDataMapper;

  private readonly requestDataMapper: RequestDataMapper;

  constructor(req: Request, logger: Logger) {
    this.interactionPayload = new InteractionPayload(JSON.parse(req.body.payload), logger);
    this.logger = logger;
    this.queueDataMapper = new QueueDataMapper(logger);
    this.requestDataMapper = new RequestDataMapper(logger);
  }

  async execute(): Promise<void> {
    if (this.interactionPayload.hasMultipleActions) {
      this.logger.warn('Interaction payloads with multiple primary actions are not yet supported');
    }
    const actionId = this.interactionPayload.getActionId();
    switch (actionId) {
      case ActionIdentifiers.cancelInteraction: {
        return await this.handleCancelInteraction();
      }

      case ActionIdentifiers.queueTypeSelected: {
        return await this.handleQueueTypeSelected();
      }

      case ActionIdentifiers.deleteQueue: {
        return await this.handleDeleteQueueInteraction();
      }

      case ActionIdentifiers.addQueueRequest: {
        return await this.handleAddQueueRequest();
      }

      case ActionIdentifiers.submitQueueRequest: {
        return await this.handleSubmitQueueRequest();
      }

      case ActionIdentifiers.listRequests: {
        return await this.handleListRequests();
      }

      default: {
        this.logger.warn(
          { actionId },
          `Interaction payload with actionId "${actionId}" is not currently supported`,
        );
      }
    }
  }

  private async handleCancelInteraction(): Promise<void> {
    this.logger.info('Handling a cancel interaction action');

    const messagePayload = new MessagePayload(MessageIdentifiers.cancelInteraction, [])
      .shouldDeleteOriginal(true)
      .setNoContent();

    const httpReq = new HttpReq(this.interactionPayload.responseUrl, this.logger);
    httpReq.setBody(messagePayload.render());
    await httpReq.post();
  }

  private async handleQueueTypeSelected(): Promise<void> {
    this.logger.info('Handling submission of a select queue type action');

    const defaultQueueMenuValue = this.interactionPayload
      .getBlockActionValue(BlockIdentifiers.defaultQueueInput, ActionIdentifiers.defaultQueueSelected);
    const customQueueInputValue = this.interactionPayload
      .getBlockActionValue(BlockIdentifiers.customQueueInput, ActionIdentifiers.customInputSelected);

    if (!defaultQueueMenuValue && !customQueueInputValue) {
      this.logger.info({ state: this.interactionPayload.payload, defaultQueueMenuValue, customQueueInputValue }, 'No queue type has been selected');
      const alert = new MarkdownTextObject(
        `${emojis.exclamation} *You need to select a queue type to proceed*`,
      );
      const httpReq = new HttpReq(this.interactionPayload.responseUrl, this.logger);
      httpReq.setBody(CreateQueueForm(alert));
      await httpReq.post();
      return;
    } else if (defaultQueueMenuValue && customQueueInputValue) {
      this.logger.info({ state: this.interactionPayload.payload, defaultQueueMenuValue, customQueueInputValue }, 'Too many queue types selected');
      const alert = new MarkdownTextObject(
        `${emojis.exclamation} *You can only select one queue type*`,
      );
      const httpReq = new HttpReq(this.interactionPayload.responseUrl, this.logger);
      httpReq.setBody(CreateQueueForm(alert));
      await httpReq.post();
      return;
    }

    const queueName = defaultQueueMenuValue || customQueueInputValue;
    await this.createQueueForInteractingUser(queueName);

    const msgPayload = new MessagePayload(`Successfully created the new queue "${queueName}"`, [])
      .shouldReplaceOriginal('true')
      .setResponseType('ephemeral');

    const httpReq = new HttpReq(this.interactionPayload.responseUrl, this.logger);
    httpReq.setBody(msgPayload.render());
    await httpReq.post();
  }

  private async handleDeleteQueueInteraction(): Promise<void> {
    this.logger.info('Handling submission of a delete queue action');

    const action = this.interactionPayload.getActionById(ActionIdentifiers.deleteQueue);
    if (!action || !action?.value) {
      this.logger.error({ action }, 'Action does not have required data values to delete a queue');
      return;
    }

    await this.queueDataMapper.delete(action.value);
  }

  private async handleAddQueueRequest(): Promise<void> {
    this.logger.info('Handling submission of a create request action');

    const action = this.interactionPayload.getActionById(ActionIdentifiers.addQueueRequest);

    const inputElement = new PlainTextInput('input-request-action');
    inputElement.multiline = true;
    const inputBlock = new InputBlock('input-block-id', new TextObject('What is your request?'), inputElement);

    const submitButton = new Button(ActionIdentifiers.submitQueueRequest, new TextObject('Submit'), 'primary');
    submitButton.setValue(action!.value!);
    const cancelButton = new Button(ActionIdentifiers.cancelInteraction, new TextObject('Cancel'), 'danger');

    const actionBlock = new ActionBlock('sadfsa', [submitButton, cancelButton]);

    const messagePayload = new MessagePayload('add-request-message', [inputBlock, actionBlock]);

    const httpReq = new HttpReq(this.interactionPayload.responseUrl, this.logger);
    httpReq.setBody(messagePayload.render());
    await httpReq.post();

    return;
  }

  private async handleSubmitQueueRequest(): Promise<void> {
    this.logger.info('Handling submission of a submit queue request action');

    const action = this.interactionPayload.getActionById(ActionIdentifiers.submitQueueRequest);

    await this.requestDataMapper.create({
      description: '',
      queueId: action!.value!,
      type: '',
      userId: '',
      channelId: this.interactionPayload.channelId,
      createdById: this.interactionPayload.userId,
      createdByName: this.interactionPayload.userName,
    });

    const sectionBlock = new SectionBlock('sdfas', new TextObject('Successfully submitted your request to queue'));
    const messagePayload = new MessagePayload('submit-request-message', [sectionBlock]);

    const httpReq = new HttpReq(this.interactionPayload.responseUrl, this.logger);
    httpReq.setBody(messagePayload.render());
    await httpReq.post();

    return;
  }

  private async handleListRequests(): Promise<void> {
    this.logger.info('Handling submission of a create request action');

    const action = this.interactionPayload.getActionById(ActionIdentifiers.listRequests);

    // const requests = this.requestDataMapper.list({ queueId: 
  }

  private async createQueueForInteractingUser(name: string): Promise<Queue> {
    const queueData: QueueInsert = {
      name,
      userId: this.interactionPayload.userId,
      type: 'channel',
      channelId: this.interactionPayload.channelId,
    };
    return await this.queueDataMapper.create(queueData);
  }

} 
