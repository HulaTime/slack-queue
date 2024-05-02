import { ActionBlock, InputBlock, SectionBlock } from '../lib/slack/blocks';
import { MarkdownTextObject, OptionObject, TextObject } from '../lib/slack/compositionObjects';
import { ITextObject } from '../lib/slack/compositionObjects/TextObject';
import { Button, PlainTextInput, RadioButton } from '../lib/slack/elements';
import MessagePayload, { SlackMessagePayload } from '../lib/slack/messagePayloads/MessagePayload';

import { CancelButton } from './buttons';
import {
  ActionIdentifiers, BlockIdentifiers, DefaultQueueTypes, MessageIdentifiers, SelectionIdentifiers,
} from './identifiers';

export const CreateQueueForm = (alert?: ITextObject): SlackMessagePayload => {
  const defaultQueueRadioButtons = new RadioButton(SelectionIdentifiers.defaultQueueRadioOption)
    .addOption(new OptionObject(
      new TextObject('Code Review'),
      DefaultQueueTypes.codeReview,
    ))
    .addOption(new OptionObject(
      new TextObject('Release'),
      DefaultQueueTypes.release,
    ));

  const defaultOptions = new InputBlock(defaultQueueRadioButtons, new TextObject('Default Queues:'), BlockIdentifiers.defaultQueueInput);

  const customInputField = new PlainTextInput(SelectionIdentifiers.customQueueInput);
  customInputField.setMaxLength(256);
  const customInput = new InputBlock(customInputField, new TextObject('Custom:'), BlockIdentifiers.customQueueInput);

  const headerSection = new SectionBlock(
    alert ?? new MarkdownTextObject('*What type of requests should be managed by this queue?*'),
  );

  const createButton = new Button(new TextObject('Create'), 'primary', ActionIdentifiers.submitNewQueue);

  const actionBlock = new ActionBlock([
    createButton,
    CancelButton,
  ]);

  const messageBlocks = [
    headerSection,
    defaultOptions,
    customInput,
    actionBlock,
  ];

  const msgPayload = new MessagePayload(MessageIdentifiers.selectQueueRequestType, messageBlocks)
    .setResponseType('ephemeral')
    .shouldReplaceOriginal('true');

  return msgPayload.render();
};
